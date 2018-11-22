import { NativeAR } from '../NativeAR';
/**
 * @only iOS
 *
 * Hit-Test Result Types
 * Possible types for specifying a hit-test search, or for the result of a hit-test search.
 * https://developer.apple.com/documentation/arkit/arhittestresulttype
 */
export var HitTestType;
(function (HitTestType) {
    /**
     * Result type from intersecting the nearest feature point.
     */
    HitTestType["FeaturePoint"] = "featurePoint";
    /**
     * Result type from intersecting a horizontal plane estimate, determined for the current frame.
     */
    HitTestType["HorizontalPlane"] = "horizontalPlane";
    /**
     * Result type from intersecting a vertical plane estimate, determined for the current frame.
     */
    HitTestType["VerticalPlane"] = "verticalPlane";
    /**
     * Result type from intersecting with an existing plane anchor.
     */
    HitTestType["ExistingPlane"] = "existingPlane";
    /**
     * Result type from intersecting with an existing plane anchor, taking into account the plane’s
     * extent.
     */
    HitTestType["ExistingPlaneUsingExtent"] = "existingPlaneUsingExtent";
    /**
     * Result type from intersecting with an existing plane anchor, taking into account the plane’s
     * geometry.
     */
    HitTestType["ExistingPlaneUsingGeometry"] = "existingPlaneUsingGeometry";
})(HitTestType || (HitTestType = {}));
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
export async function performHitTestAsync(point, types = []) {
    return NativeAR.performHitTestAsync(point.x, point.y, Array.isArray(types) ? types : [types]);
}
//# sourceMappingURL=hitTest.js.map