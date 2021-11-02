// JSC on Android and iOS 8 & 9 does not support proxies.
// The below workaround provides a proxy-like functionality for event data by
// creating an object which contains predefined fields for the most commonly
// used event attributes. If your app uses even attribute which is not listed
// here please submit a PR to add that and we will merge it right away
export default function createEventObjectProxyPolyfill() {
  const nodesMap = {
    // Gesture handlers-related event
    translationX: {},
    translationY: {},
    state: {},
    oldState: {},
    absoluteX: {},
    absoluteY: {},
    x: {},
    y: {},
    velocityX: {},
    velocityY: {},
    scale: {},
    focalX: {},
    focalY: {},
    rotation: {},
    anchorX: {},
    anchorY: {},
    velocity: {},
    numberOfPointers: {},
    // onLayour-related event
    layout: { x: {}, y: {}, width: {}, height: {} },
    // ScrollView event
    contentOffset: { y: {}, x: {} },
    layoutMeasurement: { width: {}, height: {} },
    contentSize: { width: {}, height: {} },
    zoomScale: {},
    contentInset: { right: {}, top: {}, left: {}, bottom: {} },
  };
  const traverse = (obj) => {
    for (const key in obj) {
      traverse(obj[key]);
      Object.assign(obj[key], { __isProxy: true });
    }
  };
  traverse(nodesMap);
  return nodesMap;
}
