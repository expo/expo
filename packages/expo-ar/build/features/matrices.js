import { NativeAR } from '../NativeAR';
/**
 * Queires matrices describing virtual world rendered on top of teh camera preview.
 *
 * @param near specifies the near clip plane for projection matrix, in meters
 * @param far specifies the far clip plane for projection matrix, in meters
 *
 * @returns A promise resolving to {@link ARMatrices} (matrices describing device perspective)
 */
export async function getMatricesAsync(near, far) {
    return NativeAR.getMatricesAsync(near, far);
}
//# sourceMappingURL=matrices.js.map