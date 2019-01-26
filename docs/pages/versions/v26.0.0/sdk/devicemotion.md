---
title: DeviceMotion
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

Access the device motion and orientation sensors. All data is presented in terms of three axes that run through a device. According to portrait orientation: X runs from left to right, Y from bottom to top and Z perpendicularly through the screen from back to front.

### `Expo.DangerZone.DeviceMotion.addListener(listener)`

Subscribe for updates to DeviceMotion.

#### Arguments

-   **listener : `function`** -- A callback that is invoked when a
    DeviceMotion update is available. When invoked, the listener is
    provided a single argument that is an object containing following fields:
    
    -   **acceleration : `object`** -- Device acceleration on the three axis as an object with x, y, z keys. Expressed in m/s<sup>2</sup>.
    
    -   **accelerationIncludingGravity : `object`** -- Device acceleration with the effect of gravity on the three axis as an object with x, y, z keys. Expressed in m/s<sup>2</sup>.
    
    -   **rotation : `object`** -- Device's orientation in space as an object with alpha, beta, gamma keys where alpha is for rotation around Z axis, beta for X axis rotation and gamma for Y axis rotation.
    
    -   **rotationRate : `object`** -- Rotation rates of the device around each of its axes as an object with alpha, beta, gamma keys where alpha is around Z axis, beta for X axis and gamma for Y axis.
    
    -   **orientation : `number`** -- Device orientation based on screen rotation. Value is on of `0` (portrait), `90` (right landscape), `180` (upside down), `-90` (left landscape).

#### Returns

-   An EventSubscription object that you can call remove() on when you
    would like to unsubscribe the listener.

### `Expo.DangerZone.DeviceMotion.removeAllListeners()`

Remove all listeners.

### `Expo.DangerZone.DeviceMotion.setUpdateInterval(intervalMs)`

Subscribe for updates to DeviceMotion.

#### Arguments

-   **intervalMs : `number`** Desired interval in milliseconds between
    DeviceMotion updates.
