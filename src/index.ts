import { gunzipSync } from "fflate";

/**
 * modelInfo.json 的数据结构
 */
export interface ModelInfo {
  animatable: boolean;
  images: number;
  materials: number;
  pbr: boolean;
  textures: number;
  triangles: number;
  vertices: number;
}

/**
 * structure.json 中的树节点结构
 */
export interface StructureNode {
  id?: number;
  name?: string;
  bbox?: number[];
  children?: StructureNode[];
  [key: string]: unknown;
}

/**
 * structure.json 的完整数据结构
 */
export interface StructureData {
  defaultTree?: number;
  idField?: string;
  trees: StructureNode[];
}

export interface StructureDataContainer {
  structure?: StructureData;
  structureUri?: string;
}

function base64ToUint8Array(b64: string): Uint8Array {
  const clean = b64.replace(/\s/g, "");
  if (typeof globalThis.atob === "function") {
    const bin = globalThis.atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  }
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(clean, "base64"));
  }
  throw new Error("[tileset-structure-uri] No base64 decoder available");
}

/**
 * 同步解析 `data:application/x-gzip;base64,...`：base64 → 二进制 → gunzip → UTF-8 文本。
 */
function decodeGzipBase64DataUriSync(dataUri: string): string {
  const comma = dataUri.indexOf(",");
  if (comma < 0) {
    throw new Error("[tileset-structure-uri] Invalid data URI: missing comma");
  }
  const header = dataUri.slice(0, comma).toLowerCase();
  if (!header.includes("base64")) {
    throw new Error(
      "[tileset-structure-uri] Expected base64 data URI (e.g. data:application/x-gzip;base64,...)",
    );
  }
  const payload = dataUri.slice(comma + 1);
  const compressed = base64ToUint8Array(payload);
  const raw = gunzipSync(compressed);
  return new TextDecoder("utf-8").decode(raw);
}

export function getStructureDataSync(container: StructureDataContainer): StructureData | null {
  if (container.structure) {
    return container.structure;
  }
  if (container.structureUri) {
    if (container.structureUri.startsWith("data:")) {
      const text = decodeGzipBase64DataUriSync(container.structureUri);
      const data = JSON.parse(text) as StructureData;
      return data;
    }
    // TODO: container.structureUri is not data-uri
  }
  return null;
}

export function buildOidNodeMap(structureData: StructureData, outMap?: Map<number, StructureNode>): Map<number, StructureNode> {
  const map = outMap ?? new Map<number, StructureNode>();

  const treeIndex = structureData.defaultTree !== undefined ? structureData.defaultTree : 0;

  if (structureData.trees && structureData.trees.length > treeIndex) {
    const rootNode = structureData.trees[treeIndex]!;

    function build(node: StructureNode) {
      if (node.id != undefined) {
        map.set(node.id, node);
      }
      if (node.children) {
        for (const child of node.children) {
          build(child);
        }
      }
    }
    build(rootNode);
  }

  return map;
}

function getParentPath(input: string): string | undefined {
  if (!input) {
    return undefined;
  }

  let normalized = input.replace(/\/$/, '');

  const lastSlashIndex = normalized.lastIndexOf('/');

  if (lastSlashIndex === -1) {
    return undefined;
  }

  let parent = normalized.substring(0, lastSlashIndex);

  if (parent === '') {
    return '';
  }

  return parent;
}

export function getDetailURL(tilesetURL: string, oid: number): string {
  const dir = (oid % 1000).toString().padStart(3, '0');
  const relUri = `details/${dir}/${oid}.glb`;
  const parent = getParentPath(tilesetURL);
  if (parent === undefined) {
    return relUri;
  }
  return `${parent}/${relUri}`;
}

export async function getModelInfo(tilesetURL: string): Promise<ModelInfo> {
  const parent = getParentPath(tilesetURL);
  const url = `${parent}/modelInfo.json`;
  const res = await fetch(url);
  const data = await res.json();
  return data as ModelInfo;
}
