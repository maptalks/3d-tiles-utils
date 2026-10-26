/**
 * 根据模型包围盒（bbox）或包围球（bounding sphere）计算自适应视角所需的相机参数。
 *
 * 坐标系约定：所有函数都以 **Z-up** 世界坐标系为准，输入的 bbox / 球心 / 方向 /
 * 矩阵均为 Z-up、右手系坐标；角度单位为度，矩阵为 three.js `Matrix4.elements`
 * 的**列主序** 16 元数组。
 *
 * - `calculateCameraParamsFromBBox`：以包围盒中心为目标点，按相机 FOV / 宽高比 /
 *   边距系数计算观察距离，并给出相机位置与近远裁剪面。
 * - `calculateCameraParamsFromZUpBBox`：用模型矩阵求出世界包围盒，保持相机当前
 *   观察方向，返回世界包围盒、观察距离与相机位置。
 * - `calculateCameraParamsFromBoundingSphere`：以包围球半径和 FOV 计算观察距离，
 *   并给出相机位置与 controls 的距离范围。
 *
 * 这些函数都只做纯数学计算，不依赖 three.js，也不会修改传入的相机对象；
 * 调用方拿到结果后自行应用到 camera / controls。
 */

export interface CameraParamsFromBBoxOptions {
  /** 垂直视场角（度），默认 45 */
  fov?: number;
  /** 相机宽高比（width / height），默认 1 */
  aspect?: number;
  /**
   * 观察方向：从包围盒中心指向相机（Z-up 世界坐标），无需预先归一化。
   * 默认 [1, 1, 1]（右上前方）。
   */
  viewDirection?: readonly [number, number, number];
  /** 实际距离在刚好包住模型的距离之上再放大的系数，默认 1.5 */
  paddingFactor?: number;
  /** near = distance / nearRatio，默认 100 */
  nearRatio?: number;
  /** far = distance * farRatio，默认 50 */
  farRatio?: number;
  /** near 的下限，默认 0.01 */
  minNear?: number;
  /** far 的下限，默认 10000 */
  minFar?: number;
}

export interface CameraParamsFromBBox {
  /** 包围盒中心（Z-up 世界坐标） */
  center: [number, number, number];
  /** 包围盒尺寸 [width, height, depth]（世界坐标单位） */
  size: [number, number, number];
  /** 尺寸最大值，用于计算观察距离 */
  maxSize: number;
  /** 相机到中心点的观察距离 */
  distance: number;
  /** 相机位置（Z-up 世界坐标） */
  position: [number, number, number];
  /** 近裁剪面 */
  near: number;
  /** 远裁剪面 */
  far: number;
}

export type UpAxis = "+Z" | "-Z" | "Y";

export interface CameraParamsFromBoundingSphereOptions {
  /** 垂直视场角（度），默认 45 */
  fov?: number;
  /**
   * 世界坐标系的上轴（Z-up 右手系），用于选择默认观察方向，默认 "+Z"。
   * `"+Z"` → [1, 1, 0.5]、`"-Z"` → [1, 1, -0.5]、`"Y"` → [1, 0.5, 1]（归一化后）。
   */
  up?: UpAxis;
  /**
   * 显式指定观察方向：从球心指向相机（Z-up 世界坐标），无需预先归一化。
   * 优先级高于 `up`。
   */
  viewDirection?: readonly [number, number, number];
  /** 基础距离 `radius / sin(fov / 2)` 的放大系数，默认 2 */
  paddingFactor?: number;
  /** 距离下限系数：`distance >= radius * minRadiusFactor`，默认 3 */
  minRadiusFactor?: number;
  /** controls.minDistance = distance * minDistanceRatio，默认 0.05 */
  minDistanceRatio?: number;
  /** controls.maxDistance = distance * maxDistanceRatio，默认 20 */
  maxDistanceRatio?: number;
}

export interface CameraParamsFromBoundingSphere {
  /** 包围球中心（Z-up 世界坐标） */
  center: [number, number, number];
  /** 包围球半径（世界坐标单位） */
  radius: number;
  /** 相机到球心（观察目标点）的距离 */
  distance: number;
  /** 相机位置（Z-up 世界坐标） */
  position: [number, number, number];
  /** 轨道控制器的最小距离 */
  minDistance: number;
  /** 轨道控制器的最大距离 */
  maxDistance: number;
}

export interface CameraParamsFromZUpBBoxOptions {
  /**
   * 模型变换矩阵：把 Z-up 模型本地坐标变换到 Z-up 世界坐标。
   * 使用 three.js `Matrix4.elements` 的**列主序** 16 元数组，缺省时为单位阵。
   */
  modelMatrix?: readonly number[] | null;
  /** 垂直视场角（度），默认 45 */
  fov?: number;
  /** 相机宽高比（width / height），默认 1 */
  aspect?: number;
  /** 是否为透视相机；正交相机按 `orthoDistanceFactor` 计算距离，默认 true */
  isPerspective?: boolean;
  /** 透视相机的安全边距系数，默认 1.5 */
  paddingFactor?: number;
  /** 正交相机的距离系数，默认 2 */
  orthoDistanceFactor?: number;
  /**
   * 相机当前观察方向：从相机指向场景（Z-up 世界坐标），无需预先归一化，
   * 默认 [0, 0, -1]。函数会保持该方向不变，只把相机移到包围盒中心的反方向。
   */
  lookDirection?: readonly [number, number, number];
}

export interface CameraParamsFromZUpBBox {
  /** 8 个角点经模型矩阵变换后的 Z-up 世界坐标 */
  corners: [number, number, number][];
  /** 世界包围盒中心（Z-up） */
  center: [number, number, number];
  /** 世界包围盒尺寸 [width, height, depth]（世界坐标单位） */
  size: [number, number, number];
  /** 尺寸最大值 */
  maxSize: number;
  /** 相机到包围盒中心的观察距离 */
  distance: number;
  /** 相机位置（Z-up 世界坐标） */
  position: [number, number, number];
}

const DEFAULT_FOV = 45;
const DEFAULT_ASPECT = 1;
const DEFAULT_VIEW_DIRECTION: readonly [number, number, number] = [1, 1, 1];
const DEFAULT_PADDING_FACTOR = 1.5;
const DEFAULT_NEAR_RATIO = 100;
const DEFAULT_FAR_RATIO = 50;
const DEFAULT_MIN_NEAR = 0.01;
const DEFAULT_MIN_FAR = 10000;

const DEFAULT_SPHERE_PADDING_FACTOR = 2;
const DEFAULT_SPHERE_MIN_RADIUS_FACTOR = 3;
const DEFAULT_MIN_DISTANCE_RATIO = 0.05;
const DEFAULT_MAX_DISTANCE_RATIO = 20;

type Matrix4Elements = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

const IDENTITY_MATRIX: Matrix4Elements = [
  1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
];
const DEFAULT_LOOK_DIRECTION: readonly [number, number, number] = [0, 0, -1];
const DEFAULT_ORTHO_DISTANCE_FACTOR = 2;

function toFinitePositive(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : fallback;
}

function normalizeDirection(
  direction: readonly [number, number, number] | undefined,
  fallback: readonly [number, number, number] = DEFAULT_VIEW_DIRECTION,
): [number, number, number] {
  const dir = direction ?? fallback;
  const length = Math.hypot(dir[0], dir[1], dir[2]);
  if (!Number.isFinite(length) || length === 0) {
    return [fallback[0], fallback[1], fallback[2]];
  }
  return [dir[0] / length, dir[1] / length, dir[2] / length];
}

/**
 * 根据世界坐标（Z-up）包围盒计算相机参数。
 *
 * @param bbox 世界坐标（Z-up）下的包围盒 `[minX, minY, minZ, maxX, maxY, maxZ]`，
 *   函数不做坐标系转换；Y-up 数据请调用方先行转换。
 * @param options 相机与观察参数（角度单位为度）
 * @returns 相机参数；bbox 无效或尺寸为 0 时返回 `null`
 */
export function calculateCameraParamsFromBBox(
  bbox: readonly number[],
  options: CameraParamsFromBBoxOptions = {},
): CameraParamsFromBBox | null {
  if (!Array.isArray(bbox) || bbox.length !== 6) {
    return null;
  }
  if (bbox.some((value) => !Number.isFinite(value))) {
    return null;
  }

  const [minX, minY, minZ, maxX, maxY, maxZ] = bbox as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxSize = Math.max(sizeX, sizeY, sizeZ);

  if (!(maxSize > 0)) {
    return null;
  }

  const center: [number, number, number] = [
    (minX + maxX) / 2,
    (minY + maxY) / 2,
    (minZ + maxZ) / 2,
  ];

  const fov = toFinitePositive(options.fov, DEFAULT_FOV);
  const aspect = toFinitePositive(options.aspect, DEFAULT_ASPECT);
  const paddingFactor = toFinitePositive(
    options.paddingFactor,
    DEFAULT_PADDING_FACTOR,
  );
  const nearRatio = toFinitePositive(options.nearRatio, DEFAULT_NEAR_RATIO);
  const farRatio = toFinitePositive(options.farRatio, DEFAULT_FAR_RATIO);
  const minNear = toFinitePositive(options.minNear, DEFAULT_MIN_NEAR);
  const minFar = toFinitePositive(options.minFar, DEFAULT_MIN_FAR);

  // 分别按垂直、水平视场角计算刚好包住 maxSize 的距离，取较大值
  const halfFov = (fov * Math.PI) / 360;
  const halfFovHorizontal = Math.atan(Math.tan(halfFov) * aspect);
  const distanceVertical = maxSize / (2 * Math.tan(halfFov));
  const distanceHorizontal = maxSize / (2 * Math.tan(halfFovHorizontal));
  const distance =
    Math.max(distanceVertical, distanceHorizontal) * paddingFactor;

  const direction = normalizeDirection(options.viewDirection);
  const position: [number, number, number] = [
    center[0] + direction[0] * distance,
    center[1] + direction[1] * distance,
    center[2] + direction[2] * distance,
  ];

  return {
    center,
    size: [sizeX, sizeY, sizeZ],
    maxSize,
    distance,
    position,
    near: Math.max(minNear, distance / nearRatio),
    far: Math.max(minFar, distance * farRatio),
  };
}

function getDefaultViewDirection(up: UpAxis): [number, number, number] {
  switch (up) {
    case "-Z":
      return [1, 1, -0.5];
    case "Y":
      return [1, 0.5, 1];
    default:
      return [1, 1, 0.5];
  }
}

/**
 * 根据包围球计算相机参数。
 *
 * @param center 包围球中心，Z-up 世界坐标 `[x, y, z]`
 * @param radius 包围球半径，与世界坐标同一单位
 * @param options 相机与观察参数（角度单位为度）
 * @returns 相机参数；center 或 radius 无效时返回 `null`
 */
export function calculateCameraParamsFromBoundingSphere(
  center: readonly [number, number, number],
  radius: number,
  options: CameraParamsFromBoundingSphereOptions = {},
): CameraParamsFromBoundingSphere | null {
  if (
    !Array.isArray(center) ||
    center.length !== 3 ||
    center.some((value) => !Number.isFinite(value))
  ) {
    return null;
  }
  if (!Number.isFinite(radius) || !(radius > 0)) {
    return null;
  }

  const fov = toFinitePositive(options.fov, DEFAULT_FOV);
  const paddingFactor = toFinitePositive(
    options.paddingFactor,
    DEFAULT_SPHERE_PADDING_FACTOR,
  );
  const minRadiusFactor = toFinitePositive(
    options.minRadiusFactor,
    DEFAULT_SPHERE_MIN_RADIUS_FACTOR,
  );
  const minDistanceRatio = toFinitePositive(
    options.minDistanceRatio,
    DEFAULT_MIN_DISTANCE_RATIO,
  );
  const maxDistanceRatio = toFinitePositive(
    options.maxDistanceRatio,
    DEFAULT_MAX_DISTANCE_RATIO,
  );

  // 刚好包住包围球的距离，再叠加缓冲，避免模型填满视野
  const halfFov = (fov * Math.PI) / 360;
  const fitDistance = radius / Math.sin(halfFov);
  const distance = Math.max(
    fitDistance * paddingFactor,
    radius * minRadiusFactor,
  );

  const direction = options.viewDirection
    ? normalizeDirection(options.viewDirection)
    : normalizeDirection(getDefaultViewDirection(options.up ?? "+Z"));
  const sphereCenter: [number, number, number] = [
    center[0],
    center[1],
    center[2],
  ];
  const position: [number, number, number] = [
    sphereCenter[0] + direction[0] * distance,
    sphereCenter[1] + direction[1] * distance,
    sphereCenter[2] + direction[2] * distance,
  ];

  return {
    center: sphereCenter,
    radius,
    distance,
    position,
    minDistance: distance * minDistanceRatio,
    maxDistance: distance * maxDistanceRatio,
  };
}

/** 按 three.js Matrix4 的列主序约定变换点 */
function applyMatrix4(
  point: readonly [number, number, number],
  matrix: Matrix4Elements,
): [number, number, number] {
  const [x, y, z] = point;
  return [
    matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14],
  ];
}

/**
 * 根据 Z-up 模型包围盒与模型矩阵计算相机参数，保持相机当前观察方向。
 *
 * 与 `calculateCameraParamsFromBBox` 的区别：
 * - 输入 bbox 是模型本地 **Z-up** 坐标，函数不做坐标系转换；
 *   若原始数据是 Y-up，请调用方先按 `(x, y, z) -> (x, -z, y)` 转换；
 * - 通过 `modelMatrix`（列主序）把 8 个角点变换到 Z-up 世界坐标后再求包围盒；
 * - 相机保持 `lookDirection` 方向不变，只沿其反方向后退，因此不会改变视角角度；
 * - 不计算 near/far，需由调用方自行调整 controls / 相机裁剪面。
 *
 * @param bbox Z-up 模型包围盒 `[minX, minY, minZ, maxX, maxY, maxZ]`
 * @param options 模型矩阵与相机参数（角度单位为度）
 * @returns 相机参数；bbox / 矩阵无效或包围盒尺寸为 0 时返回 `null`
 */
export function calculateCameraParamsFromZUpBBox(
  bbox: readonly number[],
  options: CameraParamsFromZUpBBoxOptions = {},
): CameraParamsFromZUpBBox | null {
  if (!Array.isArray(bbox) || bbox.length !== 6) {
    return null;
  }
  if (bbox.some((value) => !Number.isFinite(value))) {
    return null;
  }

  const modelMatrixInput = options.modelMatrix ?? IDENTITY_MATRIX;
  if (
    !Array.isArray(modelMatrixInput) ||
    modelMatrixInput.length !== 16 ||
    modelMatrixInput.some((value) => !Number.isFinite(value))
  ) {
    return null;
  }
  const modelMatrix = modelMatrixInput as unknown as Matrix4Elements;

  const [minX, minY, minZ, maxX, maxY, maxZ] = bbox as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];

  const localCorners: [number, number, number][] = [
    [minX, minY, minZ],
    [maxX, minY, minZ],
    [minX, maxY, minZ],
    [maxX, maxY, minZ],
    [minX, minY, maxZ],
    [maxX, minY, maxZ],
    [minX, maxY, maxZ],
    [maxX, maxY, maxZ],
  ];

  const corners = localCorners.map((corner) =>
    applyMatrix4(corner, modelMatrix),
  );

  const worldMin: [number, number, number] = [
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  ];
  const worldMax: [number, number, number] = [
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ];
  for (const [x, y, z] of corners) {
    if (x < worldMin[0]) worldMin[0] = x;
    if (y < worldMin[1]) worldMin[1] = y;
    if (z < worldMin[2]) worldMin[2] = z;
    if (x > worldMax[0]) worldMax[0] = x;
    if (y > worldMax[1]) worldMax[1] = y;
    if (z > worldMax[2]) worldMax[2] = z;
  }

  const sizeX = worldMax[0] - worldMin[0];
  const sizeY = worldMax[1] - worldMin[1];
  const sizeZ = worldMax[2] - worldMin[2];
  const maxSize = Math.max(sizeX, sizeY, sizeZ);
  if (!(maxSize > 0)) {
    return null;
  }

  const center: [number, number, number] = [
    (worldMin[0] + worldMax[0]) / 2,
    (worldMin[1] + worldMax[1]) / 2,
    (worldMin[2] + worldMax[2]) / 2,
  ];

  const fov = toFinitePositive(options.fov, DEFAULT_FOV);
  const aspect = toFinitePositive(options.aspect, DEFAULT_ASPECT);
  const paddingFactor = toFinitePositive(
    options.paddingFactor,
    DEFAULT_PADDING_FACTOR,
  );
  const orthoDistanceFactor = toFinitePositive(
    options.orthoDistanceFactor,
    DEFAULT_ORTHO_DISTANCE_FACTOR,
  );

  let distance: number;
  if (options.isPerspective === false) {
    distance = maxSize * orthoDistanceFactor;
  } else {
    const halfFov = (fov * Math.PI) / 360;
    const halfFovHorizontal = Math.atan(Math.tan(halfFov) * aspect);
    const distanceVertical = maxSize / (2 * Math.tan(halfFov));
    const distanceHorizontal = maxSize / (2 * Math.tan(halfFovHorizontal));
    distance = Math.max(distanceVertical, distanceHorizontal) * paddingFactor;
  }

  const lookDirection = normalizeDirection(
    options.lookDirection,
    DEFAULT_LOOK_DIRECTION,
  );
  const position: [number, number, number] = [
    center[0] - lookDirection[0] * distance,
    center[1] - lookDirection[1] * distance,
    center[2] - lookDirection[2] * distance,
  ];

  return {
    corners,
    center,
    size: [sizeX, sizeY, sizeZ],
    maxSize,
    distance,
    position,
  };
}
