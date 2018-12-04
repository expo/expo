import { Vector2, Anchor, Matrix4 } from '../commons';
export declare type HitTest = {
    /**
     * The position and orientation of the hit test result relative to the world coordinate system.
     */
    worldTransform: Matrix4;
    /**
     * Distance from the camera to the hit location, in meters.
     */
    distance: number;
    /**
     * The anchor representing the detected:
     * - iOS: surface
     * - Android: surface or point
     */
    anchor?: Anchor;
    /**
     * @only iOS
     * The kind of detected feature the search result represents.
     */
    type?: number;
    /**
     * @only iOS
     * The position and orientation of the hit test result relative to the nearest anchor or feature point.
     */
    localTransform?: Matrix4;
    /**
     * @only Android
     * Unique number assigned specifically to this point.
     */
    id?: number;
};
/**
 * @only iOS
 *
 * Hit-Test Result Types
 * Possible types for specifying a hit-test search, or for the result of a hit-test search.
 * https://developer.apple.com/documentation/arkit/arhittestresulttype
 */
export declare enum HitTestType {
    /**
     * Result type from intersecting the nearest feature point.
     */
    FeaturePoint = "featurePoint",
    /**
     * Result type from intersecting a horizontal plane estimate, determined for the current frame.
     */
    HorizontalPlane = "horizontalPlane",
    /**
     * Result type from intersecting a vertical plane estimate, determined for the current frame.
     */
    VerticalPlane = "verticalPlane",
    /**
     * Result type from intersecting with an existing plane anchor.
     */
    ExistingPlane = "existingPlane",
    /**
     * Result type from intersecting with an existing plane anchor, taking into account the plane’s
     * extent.
     */
    ExistingPlaneUsingExtent = "existingPlaneUsingExtent",
    /**
     * Result type from intersecting with an existing plane anchor, taking into account the plane’s
     * geometry.
     */
    ExistingPlaneUsingGeometry = "existingPlaneUsingGeometry"
}
/**
 * Performs a ray cast from the user's device in the direction of given location
 * https://developers.google.com/ar/reference/java/com/google/ar/core/Frame#hitTest(float,%20float)
 * https://developer.apple.com/documentation/arkit/arframe/2875718-hittest
 *
 * @param point {@link Vector2}. A point in normalized screen coordinate space. (The point (0,0) represents the top left corner of the screen, and the point (1,1) represents the bottom right corner.)
 * @param types {@only iOS} {@link HitTestType}. Types of hit-test result to search for.
 *
 * @returns a promise resolving to list of results, sorted from nearest to farthest
 */
export declare function performHitTestAsync(point: Vector2, types?: Array<HitTestType>): Promise<HitTest[]>;
