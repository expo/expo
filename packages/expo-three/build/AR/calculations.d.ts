import * as THREE from 'three';
import * as AR from 'expo-ar';
export declare class HitTestRay {
    origin: THREE.Vector3;
    direction: THREE.Vector3;
}
export declare class FeatureHitTestResult {
    position: any;
    distanceToRayOrigin: any;
    featureHit: any;
    featureDistanceToHitResult: any;
}
export declare function suppressWarnings(): void;
export declare function hitTestWithFeatures(camera: THREE.Camera, point: THREE.Vector2, coneOpeningAngleInDegrees: number, minDistance?: number, maxDistance?: number, maxResults?: number, rawFeaturePoints?: AR.RawFeaturePoint[]): Promise<FeatureHitTestResult[]>;
export declare function hitTestWithPoint(camera: THREE.Camera, point: THREE.Vector2): Promise<FeatureHitTestResult[]>;
export declare function unprojectPoint(camera: THREE.Camera, point: THREE.Vector3): THREE.Vector3;
export declare function hitTestRayFromScreenPos(camera: THREE.Camera, point: THREE.Vector2): HitTestRay;
export declare function hitTestFromOrigin(origin: THREE.Vector3, direction: THREE.Vector3, rawFeaturePoints?: AR.RawFeaturePoint[]): Promise<FeatureHitTestResult | null>;
export declare function hitTestWithInfiniteHorizontalPlane(camera: THREE.Camera, point: THREE.Vector2, pointOnPlane: THREE.Vector3): THREE.Vector3 | null;
export declare function rayIntersectionWithHorizontalPlane(rayOrigin: THREE.Vector3, direction: THREE.Vector3, planeY: number): THREE.Vector3 | null;
export declare function convertTransformArray(transform: AR.Matrix4x4): THREE.Matrix4;
export declare function positionFromTransform(transform: THREE.Matrix4): THREE.Vector3;
export declare function worldPositionFromScreenPosition(camera: THREE.Camera, position: THREE.Vector2, objectPos: THREE.Vector3, infinitePlane?: boolean, dragOnInfinitePlanesEnabled?: boolean, rawFeaturePoints?: AR.RawFeaturePoint[]): Promise<{
    worldPosition: THREE.Vector3;
    planeAnchor: AR.Anchor | undefined;
    hitAPlane: boolean;
} | {
    worldPosition: any;
    hitAPlane: boolean;
    planeAnchor?: undefined;
} | {
    worldPosition: null;
    planeAnchor: null;
    hitAPlane: null;
}>;
export declare function positionFromAnchor({ transformWorld }: AR.Anchor): THREE.Vector3;
export declare function improviseHitTest(point: any, camera: THREE.Camera): Promise<THREE.Vector3>;
