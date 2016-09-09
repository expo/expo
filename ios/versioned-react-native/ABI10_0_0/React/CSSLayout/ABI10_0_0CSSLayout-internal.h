/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include <CSSLayout/ABI10_0_0CSSLayout.h>
#include <CSSLayout/ABI10_0_0CSSNodeList.h>

ABI10_0_0CSS_EXTERN_C_BEGIN

typedef struct ABI10_0_0CSSCachedMeasurement {
  float availableWidth;
  float availableHeight;
  ABI10_0_0CSSMeasureMode widthMeasureMode;
  ABI10_0_0CSSMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;
} ABI10_0_0CSSCachedMeasurement;

// This value was chosen based on empiracle data. Even the most complicated
// layouts should not require more than 16 entries to fit within the cache.
enum { ABI10_0_0CSS_MAX_CACHED_RESULT_COUNT = 16 };

typedef struct ABI10_0_0CSSLayout {
  float position[4];
  float dimensions[2];
  ABI10_0_0CSSDirection direction;

  float computedFlexBasis;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  uint32_t generationCount;
  ABI10_0_0CSSDirection lastParentDirection;

  uint32_t nextCachedMeasurementsIndex;
  ABI10_0_0CSSCachedMeasurement cachedMeasurements[ABI10_0_0CSS_MAX_CACHED_RESULT_COUNT];
  float measuredDimensions[2];

  ABI10_0_0CSSCachedMeasurement cached_layout;
} ABI10_0_0CSSLayout;

typedef struct ABI10_0_0CSSStyle {
  ABI10_0_0CSSDirection direction;
  ABI10_0_0CSSFlexDirection flexDirection;
  ABI10_0_0CSSJustify justifyContent;
  ABI10_0_0CSSAlign alignContent;
  ABI10_0_0CSSAlign alignItems;
  ABI10_0_0CSSAlign alignSelf;
  ABI10_0_0CSSPositionType positionType;
  ABI10_0_0CSSWrapType flexWrap;
  ABI10_0_0CSSOverflow overflow;
  float flexGrow;
  float flexShrink;
  float flexBasis;
  float margin[ABI10_0_0CSSEdgeCount];
  float position[ABI10_0_0CSSEdgeCount];
  float padding[ABI10_0_0CSSEdgeCount];
  float border[ABI10_0_0CSSEdgeCount];
  float dimensions[2];
  float minDimensions[2];
  float maxDimensions[2];
} ABI10_0_0CSSStyle;

typedef struct ABI10_0_0CSSNode {
  ABI10_0_0CSSStyle style;
  ABI10_0_0CSSLayout layout;
  uint32_t lineIndex;
  bool hasNewLayout;
  bool isTextNode;
  ABI10_0_0CSSNodeRef parent;
  ABI10_0_0CSSNodeListRef children;
  bool isDirty;

  struct ABI10_0_0CSSNode *nextChild;

  ABI10_0_0CSSSize (*measure)(void *context,
                     float width,
                     ABI10_0_0CSSMeasureMode widthMode,
                     float height,
                     ABI10_0_0CSSMeasureMode heightMode);
  void (*print)(void *context);
  void *context;
} ABI10_0_0CSSNode;

ABI10_0_0CSS_EXTERN_C_END
