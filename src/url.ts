import type { Extension, ModelInfo } from "./types";

function isAbsoluteURI(uri: string): boolean {
  return uri.indexOf("://") > 0;
}

function getParentPath(input: string): string | undefined {
  if (!input) {
    return undefined;
  }

  const normalized = input.replace(/\/$/, "");

  const lastSlashIndex = normalized.lastIndexOf("/");

  if (lastSlashIndex === -1) {
    return undefined;
  }

  const parent = normalized.substring(0, lastSlashIndex);

  if (parent === "") {
    return "";
  }

  return parent;
}

export function getDetailURL(baseAbsURL: string, oid: number): string {
  const dir = (oid % 1000).toString().padStart(3, "0");
  const uri = `${baseAbsURL}/${dir}/${oid}.glb`;
  return uri;
}

export async function getModelInfo(tilesetURL: string): Promise<ModelInfo> {
  const parent = getParentPath(tilesetURL);
  const url = `${parent}/modelInfo.json`;
  const res = await fetch(url);
  const data = await res.json();
  return data as ModelInfo;
}

export function getPmiURL(tilesetURL: string, ext: Extension): string | null {
  if (!ext.pmiUri) {
    return null;
  }
  if (isAbsoluteURI(ext.pmiUri)) {
    return ext.pmiUri;
  }
  const relUri = ext.pmiUri;
  const parent = getParentPath(tilesetURL);
  if (parent === undefined) {
    return relUri;
  }
  return `${parent}/${relUri}`;
}
