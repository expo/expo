import * as THREE from 'three';
import * as AR from 'expo-ar';

export class HitTestRay {
  origin = new THREE.Vector3();
  direction = new THREE.Vector3();
}

export class FeatureHitTestResult {
  position; //Vector3
  distanceToRayOrigin;
  featureHit; //Vector3
  featureDistanceToHitResult;
}

/*
  ExpoTHREE.AR.suppressWarnings()
  */
export function suppressWarnings() {
  console.log("Warning: ExpoTHREE.AR.suppressWarnings() is deprecated, use: THREE.suppressExpoWarnings()")
}

//-> [FeatureHitTestResult]
export async function hitTestWithFeatures(
  camera: THREE.Camera,
  point: THREE.Vector2,
  coneOpeningAngleInDegrees: number,
  minDistance: number = 0,
  maxDistance: number = 99999999999999,
  maxResults: number = 1,
  rawFeaturePoints?: AR.RawFeaturePoint[]
): Promise<FeatureHitTestResult[]> {
  let results: FeatureHitTestResult[] = [];

  const featurePoints = await getRawFeaturePoints(rawFeaturePoints);
  if (featurePoints.length === 0) {
    return results;
  }

  const ray = hitTestRayFromScreenPos(camera, point);
  if (!ray) {
    return results;
  }

  const maxAngleInDeg = Math.min(coneOpeningAngleInDegrees, 360) / 2;
  const maxAngle = (maxAngleInDeg / 180) * Math.PI;

  for (let feature of featurePoints) {
    const { x, y, z } = feature;

    let featurePos = new THREE.Vector3(x, y, z);

    let originToFeature = featurePos.clone().sub(ray.origin);

    let crossProduct = originToFeature.clone().cross(ray.direction);
    let featureDistanceFromResult = crossProduct.length();

    const hitTestResult = ray.origin
      .clone()
      .add(
        ray.direction
          .clone()
          // @ts-ignore
          .multiply(ray.direction.clone().dot(originToFeature))
      );

    const hitTestResultDistance = hitTestResult
      .clone()
      .sub(ray.origin)
      .length();

    if (
      hitTestResultDistance < minDistance ||
      hitTestResultDistance > maxDistance
    ) {
      // Skip this feature - it is too close or too far away.
      continue;
    }

    const originToFeatureNormalized = originToFeature.clone().normalize();
    const angleBetweenRayAndFeature = Math.acos(
      ray.direction.clone().dot(originToFeatureNormalized)
    );

    if (angleBetweenRayAndFeature > maxAngle) {
      // Skip this feature - is is outside of the hit test cone.
      continue;
    }

    // All tests passed: Add the hit against this feature to the results.
    let featureHitTestResult = new FeatureHitTestResult();
    featureHitTestResult.position = hitTestResult;
    featureHitTestResult.distanceToRayOrigin = hitTestResultDistance;
    featureHitTestResult.featureHit = featurePos;
    featureHitTestResult.featureDistanceToHitResult = featureDistanceFromResult;

    results.push(featureHitTestResult);
  }

  // Sort the results by feature distance to the ray.
  results = results.sort(
    (first, second) => first.distanceToRayOrigin < second.distanceToRayOrigin ? -1 : +1
  );

  // Cap the list to maxResults.
  var cappedResults: FeatureHitTestResult[] = [];
  let i = 0;
  while (i < maxResults && i < results.length) {
    cappedResults.push(results[i]);
    i += 1;
  }

  return cappedResults;
}

//-> [FeatureHitTestResult]
export async function hitTestWithPoint(
  camera: THREE.Camera,
  point: THREE.Vector2
): Promise<FeatureHitTestResult[]> {
  var results: FeatureHitTestResult[] = [];
  const ray = hitTestRayFromScreenPos(camera, point);

  const result = await hitTestFromOrigin(ray.origin, ray.direction);
  if (result !== null) {
    results.push(result);
  }

  return results;
}

export function unprojectPoint(
  camera: THREE.Camera,
  point: THREE.Vector3
): THREE.Vector3 {
  let vector = point.clone();
  // @ts-ignore
  const widthHalf = camera.width / 2;
  // @ts-ignore
  const heightHalf = camera.height / 2;

  vector.project(camera);

  vector.x = vector.x * widthHalf + widthHalf;
  vector.y = -(vector.y * heightHalf) + heightHalf;
  vector.z = 0;

  return vector;
}

export function hitTestRayFromScreenPos(camera: THREE.Camera, point: THREE.Vector2): HitTestRay {
  const cameraPos = positionFromTransform(camera.matrix);

  // Note: z: 1.0 will unproject() the screen position to the far clipping plane.
  let positionVec = new THREE.Vector3(point.x, point.y, 1.0);
  let screenPosOnFarClippingPlane = unprojectPoint(camera, positionVec);
  screenPosOnFarClippingPlane.sub(cameraPos);
  screenPosOnFarClippingPlane.normalize();
  const hitTest = new HitTestRay();
  hitTest.origin = cameraPos;
  hitTest.direction = screenPosOnFarClippingPlane;
  return hitTest;
}

async function getRawFeaturePoints(rawFeaturePoints?: AR.RawFeaturePoint[]): Promise<AR.RawFeaturePoint[]> {
  if (rawFeaturePoints) {
    return rawFeaturePoints;
  }
  const currentFrame = await AR.getCurrentFrameAsync({ [AR.FrameAttribute.RawFeaturePoints]: true });
  return currentFrame[AR.FrameAttribute.RawFeaturePoints] || [];
}

//-> FeatureHitTestResult?
export async function hitTestFromOrigin(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  rawFeaturePoints?: AR.RawFeaturePoint[]
): Promise<FeatureHitTestResult | null> {
  let featurePoints = await getRawFeaturePoints(rawFeaturePoints);
  if (featurePoints.length === 0) {
    return null;
  }

  // Determine the point from the whole point cloud which is closest to the hit test ray.
  var closestFeaturePoint = origin;
  var minDistance = 99999999999;

  for (let feature of featurePoints) {
    const { x, y, z, id } = feature;
    let featurePos = new THREE.Vector3(x, y, z);

    let originVector = origin.clone().sub(featurePos);
    let crossProduct = originVector.clone().cross(direction);
    let featureDistanceFromResult = crossProduct.length();

    if (featureDistanceFromResult < minDistance) {
      closestFeaturePoint = featurePos;
      minDistance = featureDistanceFromResult;
    }
  }

  // Compute the point along the ray that is closest to the selected feature.
  let originToFeature = closestFeaturePoint.clone().sub(origin);
  let hitTestResult = origin
    .clone()
    // @ts-ignore
    .add(direction.clone().multiply(direction.clone().dot(originToFeature)));
  let hitTestResultDistance = hitTestResult
    .clone()
    .sub(origin)
    .length();

  let featureHitTestResult = new FeatureHitTestResult();

  featureHitTestResult.position = hitTestResult;
  featureHitTestResult.distanceToRayOrigin = hitTestResultDistance;
  featureHitTestResult.featureHit = closestFeaturePoint;
  featureHitTestResult.featureDistanceToHitResult = minDistance;
  return featureHitTestResult;
}

export function hitTestWithInfiniteHorizontalPlane(
  camera: THREE.Camera,
  point: THREE.Vector2,
  pointOnPlane: THREE.Vector3
) {
  const ray = hitTestRayFromScreenPos(camera, point);
  if (!ray) {
    return null;
  }

  // Do not intersect with planes above the camera or if the ray is almost parallel to the plane.
  if (ray.direction.y > -0.03) {
    return null;
  }

  // Return the intersection of a ray from the camera through the screen position with a horizontal plane
  // at height (Y axis).
  return rayIntersectionWithHorizontalPlane(
    ray.origin,
    ray.direction,
    pointOnPlane.y
  );
}

export function rayIntersectionWithHorizontalPlane(
  rayOrigin: THREE.Vector3,
  direction: THREE.Vector3,
  planeY: number
): THREE.Vector3 | null {
  direction = direction.normalize();

  // Special case handling: Check if the ray is horizontal as well.
  if (direction.y == 0) {
    if (rayOrigin.y == planeY) {
      // The ray is horizontal and on the plane, thus all points on the ray intersect with the plane.
      // Therefore we simply return the ray origin.
      return rayOrigin;
    } else {
      // The ray is parallel to the plane and never intersects.
      return null;
    }
  }

  // The distance from the ray's origin to the intersection point on the plane is:
  //   (pointOnPlane - rayOrigin) dot planeNormal
  //  --------------------------------------------
  //          direction dot planeNormal

  // Since we know that horizontal planes have normal (0, 1, 0), we can simplify this to:
  let dist = (planeY - rayOrigin.y) / direction.y;

  // Do not return intersections behind the ray's origin.
  if (dist < 0) {
    return null;
  }
  // Return the intersection point.
  // @ts-ignore
  direction.multiply(dist);
  return rayOrigin.clone().add(direction);
}

export function convertTransformArray(transform: AR.Matrix4x4): THREE.Matrix4 {
  const matrix = new THREE.Matrix4();
  matrix.fromArray(transform);
  return matrix;
}

export function positionFromTransform(transform: THREE.Matrix4): THREE.Vector3 {
  const position = new THREE.Vector3();
  position.setFromMatrixPosition(transform);
  return position;
}

//-> (position: SCNVector3?, planeAnchor: ARPlaneAnchor?, hitAPlane: Bool)
// Code from Apple PlacingObjects demo: https://developer.apple.com/sample-code/wwdc/2017/PlacingObjects.zip
export async function worldPositionFromScreenPosition(
  camera: THREE.Camera,
  position: THREE.Vector2,
  objectPos: THREE.Vector3,
  infinitePlane = false,
  dragOnInfinitePlanesEnabled = false,
  rawFeaturePoints?: AR.RawFeaturePoint[]
) {
  // -------------------------------------------------------------------------------
  // 1. Always do a hit test against exisiting plane anchors first.
  //    (If any such anchors exist & only within their extents.)

  const hitTestResults = await AR.performHitTestAsync(
    {
      x: position.x,
      y: position.y,
    },
    [AR.HitTestType.ExistingPlaneUsingExtent]
  );
  if (hitTestResults.length > 0) {
    const { worldTransform, anchor } = hitTestResults[0];
    const transform = convertTransformArray(worldTransform);
    const worldPosition = positionFromTransform(transform);
    // Return immediately - this is the best possible outcome.
    return {
      worldPosition,
      planeAnchor: anchor,
      hitAPlane: true,
    };
  }

  // -------------------------------------------------------------------------------
  // 2. Collect more information about the environment by hit testing against
  //    the feature point cloud, but do not return the result yet.
  let featureHitTestPosition = new THREE.Vector3();
  let highQualityFeatureHitTestResult = false;

  const highQualityfeatureHitTestResults = await hitTestWithFeatures(
    camera,
    position,
    18,
    0.2,
    2.0,
    1,
    rawFeaturePoints
  );

  if (highQualityfeatureHitTestResults.length > 0) {
    const result = highQualityfeatureHitTestResults[0];
    featureHitTestPosition = result.position;
    highQualityFeatureHitTestResult = true;
  }

  // -------------------------------------------------------------------------------
  // 3. If desired or necessary (no good feature hit test result): Hit test
  //    against an infinite, horizontal plane (ignoring the real world).
  if (
    (infinitePlane && dragOnInfinitePlanesEnabled) ||
    !highQualityFeatureHitTestResult
  ) {
    let pointOnPlane = objectPos || new THREE.Vector3();

    let pointOnInfinitePlane = hitTestWithInfiniteHorizontalPlane(
      camera,
      position,
      pointOnPlane
    );
    if (pointOnInfinitePlane) {
      return { worldPosition: pointOnInfinitePlane, hitAPlane: true };
    }
  }

  // -------------------------------------------------------------------------------
  // 4. If available, return the result of the hit test against high quality
  //    features if the hit tests against infinite planes were skipped or no
  //    infinite plane was hit.
  if (highQualityFeatureHitTestResult) {
    return { worldPosition: featureHitTestPosition, hitAPlane: false };
  }

  // -------------------------------------------------------------------------------
  // 5. As a last resort, perform a second, unfiltered hit test against features.
  //    If there are no features in the scene, the result returned here will be nil.

  const unfilteredFeatureHitTestResults = await hitTestWithPoint(camera, position);
  if (unfilteredFeatureHitTestResults.length > 0) {
    let result = unfilteredFeatureHitTestResults[0];
    return { worldPosition: result.position, hitAPlane: false };
  }

  return { worldPosition: null, planeAnchor: null, hitAPlane: null };
}

export function positionFromAnchor({ transformWorld }: AR.Anchor): THREE.Vector3 {
  const transform = convertTransformArray(transformWorld);
  const position = positionFromTransform(transform);
  return position;
}

export async function improviseHitTest(point, camera: THREE.Camera): Promise<THREE.Vector3> {
  const hitTestResults = await AR.performHitTestAsync(
    point,
    [AR.HitTestType.HorizontalPlane]
  );

  if (hitTestResults.length > 0) {
    const { worldTransform } = hitTestResults[0];
    return positionFromTransform(convertTransformArray(worldTransform));
  } else {
    // Create a transform with a translation of 0.1 meters (10 cm) in front of the camera
    const dist = 0.1;
    const translation = new THREE.Vector3(0, 0, -dist);
    translation.applyQuaternion(camera.quaternion);
    return translation;
  }
}
