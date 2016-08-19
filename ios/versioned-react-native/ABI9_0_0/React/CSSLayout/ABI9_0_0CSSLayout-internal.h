/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#ifndef __ABI9_0_0CSS_LAYOUT_INTERNAL_H
#define __ABI9_0_0CSS_LAYOUT_INTERNAL_H

#include <stdio.h>
#include <stdlib.h>

#include "ABI9_0_0CSSLayout.h"
#include "ABI9_0_0CSSNodeList.h"

ABI9_0_0CSS_EXTERN_C_BEGIN

typedef struct ABI9_0_0CSSCachedMeasurement {
  float availableWidth;
  float availableHeight;
  ABI9_0_0CSSMeasureMode widthMeasureMode;
  ABI9_0_0CSSMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;
} ABI9_0_0CSSCachedMeasurement;

// This value was chosen based on empiracle data. Even the most complicated
// layouts should not require more than 16 entries to fit within the cache.
enum {
  ABI9_0_0CSS_MAX_CACHED_RESULT_COUNT = 16
};

typedef struct ABI9_0_0CSSLayout {
  float position[4];
  float dimensions[2];
  ABI9_0_0CSSDirection direction;

  float flexBasis;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  int generationCount;
  ABI9_0_0CSSDirection lastParentDirection;

  int nextCachedMeasurementsIndex;
  ABI9_0_0CSSCachedMeasurement cachedMeasurements[ABI9_0_0CSS_MAX_CACHED_RESULT_COUNT];
  float measuredDimensions[2];

  ABI9_0_0CSSCachedMeasurement cached_layout;
} ABI9_0_0CSSLayout;

typedef struct ABI9_0_0CSSStyle {
  ABI9_0_0CSSDirection direction;
  ABI9_0_0CSSFlexDirection flexDirection;
  ABI9_0_0CSSJustify justifyContent;
  ABI9_0_0CSSAlign alignContent;
  ABI9_0_0CSSAlign alignItems;
  ABI9_0_0CSSAlign alignSelf;
  ABI9_0_0CSSPositionType positionType;
  ABI9_0_0CSSWrapType flexWrap;
  ABI9_0_0CSSOverflow overflow;
  float flex;
  float margin[6];
  float position[4];
  /**
   * You should skip all the rules that contain negative values for the
   * following attributes. For example:
   *   {padding: 10, paddingLeft: -5}
   * should output:
   *   {left: 10 ...}
   * the following two are incorrect:
   *   {left: -5 ...}
   *   {left: 0 ...}
   */
  float padding[6];
  float border[6];
  float dimensions[2];
  float minDimensions[2];
  float maxDimensions[2];
} ABI9_0_0CSSStyle;

typedef struct ABI9_0_0CSSNode {
  ABI9_0_0CSSStyle style;
  ABI9_0_0CSSLayout layout;
  int lineIndex;
  bool shouldUpdate;
  bool isTextNode;
  ABI9_0_0CSSNodeListRef children;

  struct ABI9_0_0CSSNode* nextChild;

  ABI9_0_0CSSSize (*measure)(void *context, float width, ABI9_0_0CSSMeasureMode widthMode, float height, ABI9_0_0CSSMeasureMode heightMode);
  bool (*isDirty)(void *context);
  void (*print)(void *context);
  void *context;
} ABI9_0_0CSSNode;

ABI9_0_0CSS_EXTERN_C_END

#endif
