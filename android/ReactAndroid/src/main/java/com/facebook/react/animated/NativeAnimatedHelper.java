/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.animated;


/* package */ class NativeAnimatedHelper {

  private static double degreesToRadians(double degrees) {
    return degrees * Math.PI / 180;
  }

  public static double parseAngle(String angle) {
    if (angle.endsWith("deg")) {
      return degreesToRadians(
        Double.parseDouble(angle.substring(0, angle.length() - 3)));
    } else {
      // Assume radians.
      return Double.parseDouble(angle);
    }
  }
}
