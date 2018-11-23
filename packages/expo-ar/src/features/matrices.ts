import { NativeAR } from '../NativeAR';
import { Matrix4x4 } from '../commons';

export type ARMatrices = {
  viewMatrix: Matrix4x4,
  projectionMatrix: Matrix4x4,

  /**
   * @only iOS
   */
  transform?: Matrix4x4,
};

/**
 * Queires matrices describing virtual world rendered on top of teh camera preview.
 * 
 * @param near specifies the near clip plane for projection matrix, in meters
 * @param far specifies the far clip plane for projection matrix, in meters
 * 
 * @returns A promise resolving to {@link ARMatrices} (matrices describing device perspective)
 */
export async function getMatricesAsync(near: number, far: number): Promise<ARMatrices> {
  return NativeAR.getMatricesAsync(near, far);
}
