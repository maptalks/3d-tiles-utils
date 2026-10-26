import { gunzipSync } from "fflate";
import type { Extension, StructureData, StructureNode } from "./types";

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

export function getStructureDataSync(ext: Extension): StructureData | null {
  if (ext.structure) {
    return ext.structure;
  }
  if (ext.structureUri) {
    if (ext.structureUri.startsWith("data:")) {
      const text = decodeGzipBase64DataUriSync(ext.structureUri);
      const data = JSON.parse(text) as StructureData;
      return data;
    }
    // TODO: container.structureUri is not data-uri
  }
  return null;
}

export function buildOidNodeMap(
  structureData: StructureData,
  outMap?: Map<number, StructureNode>,
): Map<number, StructureNode> {
  const map = outMap ?? new Map<number, StructureNode>();

  const treeIndex =
    structureData.defaultTree !== undefined ? structureData.defaultTree : 0;

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
