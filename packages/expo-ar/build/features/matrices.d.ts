import { Matrix4 } from '../commons';
export declare type ARMatrices = {
    viewMatrix: Matrix4;
    projectionMatrix: Matrix4;
    /**
     * @only iOS
     */
    transform?: Matrix4;
};
/**
 * Queires matrices describing virtual world rendered on top of teh camera preview.
 *
 * @param near specifies the near clip plane for projection matrix, in meters
 * @param far specifies the far clip plane for projection matrix, in meters
 *
 * @returns A promise resolving to {@link ARMatrices} (matrices describing device perspective)
 */
export declare function getMatricesAsync(near: number, far: number): Promise<ARMatrices>;
