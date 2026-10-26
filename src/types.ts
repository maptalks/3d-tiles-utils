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

export interface Extension {
  pmiUri?: string;
  structure?: StructureData;
  structureUri?: string;
  tileinfoUri?: string;
  modelName?: string;
}
