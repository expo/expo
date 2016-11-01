/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <string.h>

#include "ABI11_0_0CSSLayout.h"
#include "ABI11_0_0CSSNodeList.h"

#ifdef _MSC_VER
#include <float.h>
#define isnan _isnan

/* define fmaxf if < VC12 */
#if _MSC_VER < 1800
__forceinline const float fmaxf(const float a, const float b) {
  return (a > b) ? a : b;
}
#endif
#endif

typedef struct ABI11_0_0CSSCachedMeasurement {
  float availableWidth;
  float availableHeight;
  ABI11_0_0CSSMeasureMode widthMeasureMode;
  ABI11_0_0CSSMeasureMode heightMeasureMode;

  float computedWidth;
  float computedHeight;
} ABI11_0_0CSSCachedMeasurement;

// This value was chosen based on empiracle data. Even the most complicated
// layouts should not require more than 16 entries to fit within the cache.
enum { ABI11_0_0CSS_MAX_CACHED_RESULT_COUNT = 16 };

typedef struct ABI11_0_0CSSLayout {
  float position[4];
  float dimensions[2];
  ABI11_0_0CSSDirection direction;

  float computedFlexBasis;

  // Instead of recomputing the entire layout every single time, we
  // cache some information to break early when nothing changed
  uint32_t generationCount;
  ABI11_0_0CSSDirection lastParentDirection;

  uint32_t nextCachedMeasurementsIndex;
  ABI11_0_0CSSCachedMeasurement cachedMeasurements[ABI11_0_0CSS_MAX_CACHED_RESULT_COUNT];
  float measuredDimensions[2];

  ABI11_0_0CSSCachedMeasurement cachedLayout;
} ABI11_0_0CSSLayout;

typedef struct ABI11_0_0CSSStyle {
  ABI11_0_0CSSDirection direction;
  ABI11_0_0CSSFlexDirection flexDirection;
  ABI11_0_0CSSJustify justifyContent;
  ABI11_0_0CSSAlign alignContent;
  ABI11_0_0CSSAlign alignItems;
  ABI11_0_0CSSAlign alignSelf;
  ABI11_0_0CSSPositionType positionType;
  ABI11_0_0CSSWrapType flexWrap;
  ABI11_0_0CSSOverflow overflow;
  float flexGrow;
  float flexShrink;
  float flexBasis;
  float margin[ABI11_0_0CSSEdgeCount];
  float position[ABI11_0_0CSSEdgeCount];
  float padding[ABI11_0_0CSSEdgeCount];
  float border[ABI11_0_0CSSEdgeCount];
  float dimensions[2];
  float minDimensions[2];
  float maxDimensions[2];
} ABI11_0_0CSSStyle;

typedef struct ABI11_0_0CSSNode {
  ABI11_0_0CSSStyle style;
  ABI11_0_0CSSLayout layout;
  uint32_t lineIndex;
  bool hasNewLayout;
  bool isTextNode;
  ABI11_0_0CSSNodeRef parent;
  ABI11_0_0CSSNodeListRef children;
  bool isDirty;

  struct ABI11_0_0CSSNode *nextChild;

  ABI11_0_0CSSSize (*measure)(void *context,
                     float width,
                     ABI11_0_0CSSMeasureMode widthMode,
                     float height,
                     ABI11_0_0CSSMeasureMode heightMode);
  void (*print)(void *context);
  void *context;
} ABI11_0_0CSSNode;

static float
computedEdgeValue(const float edges[ABI11_0_0CSSEdgeCount], const ABI11_0_0CSSEdge edge, const float defaultValue) {
  ABI11_0_0CSS_ASSERT(edge <= ABI11_0_0CSSEdgeEnd, "Cannot get computed value of multi-edge shorthands");

  if (!ABI11_0_0CSSValueIsUndefined(edges[edge])) {
    return edges[edge];
  }

  if ((edge == ABI11_0_0CSSEdgeTop || edge == ABI11_0_0CSSEdgeBottom) &&
      !ABI11_0_0CSSValueIsUndefined(edges[ABI11_0_0CSSEdgeVertical])) {
    return edges[ABI11_0_0CSSEdgeVertical];
  }

  if ((edge == ABI11_0_0CSSEdgeLeft || edge == ABI11_0_0CSSEdgeRight || edge == ABI11_0_0CSSEdgeStart || edge == ABI11_0_0CSSEdgeEnd) &&
      !ABI11_0_0CSSValueIsUndefined(edges[ABI11_0_0CSSEdgeHorizontal])) {
    return edges[ABI11_0_0CSSEdgeHorizontal];
  }

  if (!ABI11_0_0CSSValueIsUndefined(edges[ABI11_0_0CSSEdgeAll])) {
    return edges[ABI11_0_0CSSEdgeAll];
  }

  if (edge == ABI11_0_0CSSEdgeStart || edge == ABI11_0_0CSSEdgeEnd) {
    return ABI11_0_0CSSUndefined;
  }

  return defaultValue;
}

static int32_t gNodeInstanceCount = 0;

ABI11_0_0CSSNodeRef ABI11_0_0CSSNodeNew() {
  const ABI11_0_0CSSNodeRef node = calloc(1, sizeof(ABI11_0_0CSSNode));
  ABI11_0_0CSS_ASSERT(node, "Could not allocate memory for node");
  gNodeInstanceCount++;

  ABI11_0_0CSSNodeInit(node);
  return node;
}

void ABI11_0_0CSSNodeFree(const ABI11_0_0CSSNodeRef node) {
  ABI11_0_0CSSNodeListFree(node->children);
  free(node);
  gNodeInstanceCount--;
}

void ABI11_0_0CSSNodeFreeRecursive(const ABI11_0_0CSSNodeRef root) {
  while (ABI11_0_0CSSNodeChildCount(root) > 0) {
    const ABI11_0_0CSSNodeRef child = ABI11_0_0CSSNodeGetChild(root, 0);
    ABI11_0_0CSSNodeRemoveChild(root, child);
    ABI11_0_0CSSNodeFreeRecursive(child);
  }
  ABI11_0_0CSSNodeFree(root);
}

int32_t ABI11_0_0CSSNodeGetInstanceCount() {
  return gNodeInstanceCount;
}

void ABI11_0_0CSSNodeInit(const ABI11_0_0CSSNodeRef node) {
  node->parent = NULL;
  node->children = ABI11_0_0CSSNodeListNew(4);
  node->hasNewLayout = true;
  node->isDirty = false;

  node->style.flexGrow = 0;
  node->style.flexShrink = 0;
  node->style.flexBasis = ABI11_0_0CSSUndefined;

  node->style.alignItems = ABI11_0_0CSSAlignStretch;
  node->style.alignContent = ABI11_0_0CSSAlignFlexStart;

  node->style.direction = ABI11_0_0CSSDirectionInherit;
  node->style.flexDirection = ABI11_0_0CSSFlexDirectionColumn;

  node->style.overflow = ABI11_0_0CSSOverflowVisible;

  // Some of the fields default to undefined and not 0
  node->style.dimensions[ABI11_0_0CSSDimensionWidth] = ABI11_0_0CSSUndefined;
  node->style.dimensions[ABI11_0_0CSSDimensionHeight] = ABI11_0_0CSSUndefined;

  node->style.minDimensions[ABI11_0_0CSSDimensionWidth] = ABI11_0_0CSSUndefined;
  node->style.minDimensions[ABI11_0_0CSSDimensionHeight] = ABI11_0_0CSSUndefined;

  node->style.maxDimensions[ABI11_0_0CSSDimensionWidth] = ABI11_0_0CSSUndefined;
  node->style.maxDimensions[ABI11_0_0CSSDimensionHeight] = ABI11_0_0CSSUndefined;

  for (ABI11_0_0CSSEdge edge = ABI11_0_0CSSEdgeLeft; edge < ABI11_0_0CSSEdgeCount; edge++) {
    node->style.position[edge] = ABI11_0_0CSSUndefined;
    node->style.margin[edge] = ABI11_0_0CSSUndefined;
    node->style.padding[edge] = ABI11_0_0CSSUndefined;
    node->style.border[edge] = ABI11_0_0CSSUndefined;
  }

  node->layout.dimensions[ABI11_0_0CSSDimensionWidth] = ABI11_0_0CSSUndefined;
  node->layout.dimensions[ABI11_0_0CSSDimensionHeight] = ABI11_0_0CSSUndefined;

  // Such that the comparison is always going to be false
  node->layout.lastParentDirection = (ABI11_0_0CSSDirection) -1;
  node->layout.nextCachedMeasurementsIndex = 0;
  node->layout.computedFlexBasis = ABI11_0_0CSSUndefined;

  node->layout.measuredDimensions[ABI11_0_0CSSDimensionWidth] = ABI11_0_0CSSUndefined;
  node->layout.measuredDimensions[ABI11_0_0CSSDimensionHeight] = ABI11_0_0CSSUndefined;
  node->layout.cachedLayout.widthMeasureMode = (ABI11_0_0CSSMeasureMode) -1;
  node->layout.cachedLayout.heightMeasureMode = (ABI11_0_0CSSMeasureMode) -1;
}

void _ABI11_0_0CSSNodeMarkDirty(const ABI11_0_0CSSNodeRef node) {
  if (!node->isDirty) {
    node->isDirty = true;
    node->layout.computedFlexBasis = ABI11_0_0CSSUndefined;
    if (node->parent) {
      _ABI11_0_0CSSNodeMarkDirty(node->parent);
    }
  }
}

void ABI11_0_0CSSNodeInsertChild(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSNodeRef child, const uint32_t index) {
  ABI11_0_0CSS_ASSERT(child->parent == NULL, "Child already has a parent, it must be removed first.");
  ABI11_0_0CSSNodeListInsert(node->children, child, index);
  child->parent = node;
  _ABI11_0_0CSSNodeMarkDirty(node);
}

void ABI11_0_0CSSNodeRemoveChild(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSNodeRef child) {
  ABI11_0_0CSSNodeListDelete(node->children, child);
  child->parent = NULL;
  _ABI11_0_0CSSNodeMarkDirty(node);
}

ABI11_0_0CSSNodeRef ABI11_0_0CSSNodeGetChild(const ABI11_0_0CSSNodeRef node, const uint32_t index) {
  return ABI11_0_0CSSNodeListGet(node->children, index);
}

uint32_t ABI11_0_0CSSNodeChildCount(const ABI11_0_0CSSNodeRef node) {
  return ABI11_0_0CSSNodeListCount(node->children);
}

void ABI11_0_0CSSNodeMarkDirty(const ABI11_0_0CSSNodeRef node) {
  ABI11_0_0CSS_ASSERT(node->measure != NULL,
             "Nodes without custom measure functions "
             "should not manually mark themselves as "
             "dirty");
  _ABI11_0_0CSSNodeMarkDirty(node);
}

bool ABI11_0_0CSSNodeIsDirty(const ABI11_0_0CSSNodeRef node) {
  return node->isDirty;
}

void ABI11_0_0CSSNodeStyleSetFlex(const ABI11_0_0CSSNodeRef node, const float flex) {
  if (ABI11_0_0CSSValueIsUndefined(flex) || flex == 0) {
    ABI11_0_0CSSNodeStyleSetFlexGrow(node, 0);
    ABI11_0_0CSSNodeStyleSetFlexShrink(node, 0);
    ABI11_0_0CSSNodeStyleSetFlexBasis(node, ABI11_0_0CSSUndefined);
  } else if (flex > 0) {
    ABI11_0_0CSSNodeStyleSetFlexGrow(node, flex);
    ABI11_0_0CSSNodeStyleSetFlexShrink(node, 0);
    ABI11_0_0CSSNodeStyleSetFlexBasis(node, 0);
  } else {
    ABI11_0_0CSSNodeStyleSetFlexGrow(node, 0);
    ABI11_0_0CSSNodeStyleSetFlexShrink(node, -flex);
    ABI11_0_0CSSNodeStyleSetFlexBasis(node, ABI11_0_0CSSUndefined);
  }
}

float ABI11_0_0CSSNodeStyleGetFlex(const ABI11_0_0CSSNodeRef node) {
  if (node->style.flexGrow > 0) {
    return node->style.flexGrow;
  } else if (node->style.flexShrink > 0) {
    return -node->style.flexShrink;
  }

  return 0;
}

#define ABI11_0_0CSS_NODE_PROPERTY_IMPL(type, name, paramName, instanceName) \
  void ABI11_0_0CSSNodeSet##name(const ABI11_0_0CSSNodeRef node, type paramName) {    \
    node->instanceName = paramName;                                 \
  }                                                                 \
                                                                    \
  type ABI11_0_0CSSNodeGet##name(const ABI11_0_0CSSNodeRef node) {                    \
    return node->instanceName;                                      \
  }

#define ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(type, name, paramName, instanceName)   \
  void ABI11_0_0CSSNodeStyleSet##name(const ABI11_0_0CSSNodeRef node, const type paramName) { \
    if (node->style.instanceName != paramName) {                            \
      node->style.instanceName = paramName;                                 \
      _ABI11_0_0CSSNodeMarkDirty(node);                                              \
    }                                                                       \
  }                                                                         \
                                                                            \
  type ABI11_0_0CSSNodeStyleGet##name(const ABI11_0_0CSSNodeRef node) {                       \
    return node->style.instanceName;                                        \
  }

#define ABI11_0_0CSS_NODE_STYLE_EDGE_PROPERTY_IMPL(type, name, paramName, instanceName, defaultValue)    \
  void ABI11_0_0CSSNodeStyleSet##name(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSEdge edge, const type paramName) { \
    if (node->style.instanceName[edge] != paramName) {                                          \
      node->style.instanceName[edge] = paramName;                                               \
      _ABI11_0_0CSSNodeMarkDirty(node);                                                                  \
    }                                                                                           \
  }                                                                                             \
                                                                                                \
  type ABI11_0_0CSSNodeStyleGet##name(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSEdge edge) {                       \
    return computedEdgeValue(node->style.instanceName, edge, defaultValue);                     \
  }

#define ABI11_0_0CSS_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName) \
  type ABI11_0_0CSSNodeLayoutGet##name(const ABI11_0_0CSSNodeRef node) {          \
    return node->layout.instanceName;                           \
  }

ABI11_0_0CSS_NODE_PROPERTY_IMPL(void *, Context, context, context);
ABI11_0_0CSS_NODE_PROPERTY_IMPL(ABI11_0_0CSSMeasureFunc, MeasureFunc, measureFunc, measure);
ABI11_0_0CSS_NODE_PROPERTY_IMPL(ABI11_0_0CSSPrintFunc, PrintFunc, printFunc, print);
ABI11_0_0CSS_NODE_PROPERTY_IMPL(bool, IsTextnode, isTextNode, isTextNode);
ABI11_0_0CSS_NODE_PROPERTY_IMPL(bool, HasNewLayout, hasNewLayout, hasNewLayout);

ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI11_0_0CSSDirection, Direction, direction, direction);
ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI11_0_0CSSFlexDirection, FlexDirection, flexDirection, flexDirection);
ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI11_0_0CSSJustify, JustifyContent, justifyContent, justifyContent);
ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI11_0_0CSSAlign, AlignContent, alignContent, alignContent);
ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI11_0_0CSSAlign, AlignItems, alignItems, alignItems);
ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI11_0_0CSSAlign, AlignSelf, alignSelf, alignSelf);
ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI11_0_0CSSPositionType, PositionType, positionType, positionType);
ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI11_0_0CSSWrapType, FlexWrap, flexWrap, flexWrap);
ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI11_0_0CSSOverflow, Overflow, overflow, overflow);
ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, FlexGrow, flexGrow, flexGrow);
ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, FlexShrink, flexShrink, flexShrink);
ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, FlexBasis, flexBasis, flexBasis);

ABI11_0_0CSS_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Position, position, position, ABI11_0_0CSSUndefined);
ABI11_0_0CSS_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Margin, margin, margin, 0);
ABI11_0_0CSS_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Padding, padding, padding, 0);
ABI11_0_0CSS_NODE_STYLE_EDGE_PROPERTY_IMPL(float, Border, border, border, 0);

ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, Width, width, dimensions[ABI11_0_0CSSDimensionWidth]);
ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, Height, height, dimensions[ABI11_0_0CSSDimensionHeight]);
ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, MinWidth, minWidth, minDimensions[ABI11_0_0CSSDimensionWidth]);
ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, MinHeight, minHeight, minDimensions[ABI11_0_0CSSDimensionHeight]);
ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, MaxWidth, maxWidth, maxDimensions[ABI11_0_0CSSDimensionWidth]);
ABI11_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, MaxHeight, maxHeight, maxDimensions[ABI11_0_0CSSDimensionHeight]);

ABI11_0_0CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Left, position[ABI11_0_0CSSEdgeLeft]);
ABI11_0_0CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Top, position[ABI11_0_0CSSEdgeTop]);
ABI11_0_0CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Right, position[ABI11_0_0CSSEdgeRight]);
ABI11_0_0CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Bottom, position[ABI11_0_0CSSEdgeBottom]);
ABI11_0_0CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Width, dimensions[ABI11_0_0CSSDimensionWidth]);
ABI11_0_0CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Height, dimensions[ABI11_0_0CSSDimensionHeight]);
ABI11_0_0CSS_NODE_LAYOUT_PROPERTY_IMPL(ABI11_0_0CSSDirection, Direction, direction);

uint32_t gCurrentGenerationCount = 0;

bool layoutNodeInternal(const ABI11_0_0CSSNodeRef node,
                        const float availableWidth,
                        const float availableHeight,
                        const ABI11_0_0CSSDirection parentDirection,
                        const ABI11_0_0CSSMeasureMode widthMeasureMode,
                        const ABI11_0_0CSSMeasureMode heightMeasureMode,
                        const bool performLayout,
                        const char *reason);

bool ABI11_0_0CSSValueIsUndefined(const float value) {
  return isnan(value);
}

static bool eq(const float a, const float b) {
  if (ABI11_0_0CSSValueIsUndefined(a)) {
    return ABI11_0_0CSSValueIsUndefined(b);
  }
  return fabs(a - b) < 0.0001;
}

static void indent(const uint32_t n) {
  for (uint32_t i = 0; i < n; i++) {
    printf("  ");
  }
}

static void printNumberIfNotZero(const char *str, const float number) {
  if (!eq(number, 0)) {
    printf("%s: %g, ", str, number);
  }
}

static void printNumberIfNotUndefined(const char *str, const float number) {
  if (!ABI11_0_0CSSValueIsUndefined(number)) {
    printf("%s: %g, ", str, number);
  }
}

static bool eqFour(const float four[4]) {
  return eq(four[0], four[1]) && eq(four[0], four[2]) && eq(four[0], four[3]);
}

static void
_ABI11_0_0CSSNodePrint(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSPrintOptions options, const uint32_t level) {
  indent(level);
  printf("{");

  if (node->print) {
    node->print(node->context);
  }

  if (options & ABI11_0_0CSSPrintOptionsLayout) {
    printf("layout: {");
    printf("width: %g, ", node->layout.dimensions[ABI11_0_0CSSDimensionWidth]);
    printf("height: %g, ", node->layout.dimensions[ABI11_0_0CSSDimensionHeight]);
    printf("top: %g, ", node->layout.position[ABI11_0_0CSSEdgeTop]);
    printf("left: %g", node->layout.position[ABI11_0_0CSSEdgeLeft]);
    printf("}, ");
  }

  if (options & ABI11_0_0CSSPrintOptionsStyle) {
    if (node->style.flexDirection == ABI11_0_0CSSFlexDirectionColumn) {
      printf("flexDirection: 'column', ");
    } else if (node->style.flexDirection == ABI11_0_0CSSFlexDirectionColumnReverse) {
      printf("flexDirection: 'column-reverse', ");
    } else if (node->style.flexDirection == ABI11_0_0CSSFlexDirectionRow) {
      printf("flexDirection: 'row', ");
    } else if (node->style.flexDirection == ABI11_0_0CSSFlexDirectionRowReverse) {
      printf("flexDirection: 'row-reverse', ");
    }

    if (node->style.justifyContent == ABI11_0_0CSSJustifyCenter) {
      printf("justifyContent: 'center', ");
    } else if (node->style.justifyContent == ABI11_0_0CSSJustifyFlexEnd) {
      printf("justifyContent: 'flex-end', ");
    } else if (node->style.justifyContent == ABI11_0_0CSSJustifySpaceAround) {
      printf("justifyContent: 'space-around', ");
    } else if (node->style.justifyContent == ABI11_0_0CSSJustifySpaceBetween) {
      printf("justifyContent: 'space-between', ");
    }

    if (node->style.alignItems == ABI11_0_0CSSAlignCenter) {
      printf("alignItems: 'center', ");
    } else if (node->style.alignItems == ABI11_0_0CSSAlignFlexEnd) {
      printf("alignItems: 'flex-end', ");
    } else if (node->style.alignItems == ABI11_0_0CSSAlignStretch) {
      printf("alignItems: 'stretch', ");
    }

    if (node->style.alignContent == ABI11_0_0CSSAlignCenter) {
      printf("alignContent: 'center', ");
    } else if (node->style.alignContent == ABI11_0_0CSSAlignFlexEnd) {
      printf("alignContent: 'flex-end', ");
    } else if (node->style.alignContent == ABI11_0_0CSSAlignStretch) {
      printf("alignContent: 'stretch', ");
    }

    if (node->style.alignSelf == ABI11_0_0CSSAlignFlexStart) {
      printf("alignSelf: 'flex-start', ");
    } else if (node->style.alignSelf == ABI11_0_0CSSAlignCenter) {
      printf("alignSelf: 'center', ");
    } else if (node->style.alignSelf == ABI11_0_0CSSAlignFlexEnd) {
      printf("alignSelf: 'flex-end', ");
    } else if (node->style.alignSelf == ABI11_0_0CSSAlignStretch) {
      printf("alignSelf: 'stretch', ");
    }

    printNumberIfNotUndefined("flexGrow", node->style.flexGrow);
    printNumberIfNotUndefined("flexShrink", node->style.flexShrink);
    printNumberIfNotUndefined("flexBasis", node->style.flexBasis);

    if (node->style.overflow == ABI11_0_0CSSOverflowHidden) {
      printf("overflow: 'hidden', ");
    } else if (node->style.overflow == ABI11_0_0CSSOverflowVisible) {
      printf("overflow: 'visible', ");
    } else if (node->style.overflow == ABI11_0_0CSSOverflowScroll) {
      printf("overflow: 'scroll', ");
    }

    if (eqFour(node->style.margin)) {
      printNumberIfNotZero("margin", computedEdgeValue(node->style.margin, ABI11_0_0CSSEdgeLeft, 0));
    } else {
      printNumberIfNotZero("marginLeft", computedEdgeValue(node->style.margin, ABI11_0_0CSSEdgeLeft, 0));
      printNumberIfNotZero("marginRight", computedEdgeValue(node->style.margin, ABI11_0_0CSSEdgeRight, 0));
      printNumberIfNotZero("marginTop", computedEdgeValue(node->style.margin, ABI11_0_0CSSEdgeTop, 0));
      printNumberIfNotZero("marginBottom", computedEdgeValue(node->style.margin, ABI11_0_0CSSEdgeBottom, 0));
      printNumberIfNotZero("marginStart", computedEdgeValue(node->style.margin, ABI11_0_0CSSEdgeStart, 0));
      printNumberIfNotZero("marginEnd", computedEdgeValue(node->style.margin, ABI11_0_0CSSEdgeEnd, 0));
    }

    if (eqFour(node->style.padding)) {
      printNumberIfNotZero("padding", computedEdgeValue(node->style.padding, ABI11_0_0CSSEdgeLeft, 0));
    } else {
      printNumberIfNotZero("paddingLeft", computedEdgeValue(node->style.padding, ABI11_0_0CSSEdgeLeft, 0));
      printNumberIfNotZero("paddingRight", computedEdgeValue(node->style.padding, ABI11_0_0CSSEdgeRight, 0));
      printNumberIfNotZero("paddingTop", computedEdgeValue(node->style.padding, ABI11_0_0CSSEdgeTop, 0));
      printNumberIfNotZero("paddingBottom",
                           computedEdgeValue(node->style.padding, ABI11_0_0CSSEdgeBottom, 0));
      printNumberIfNotZero("paddingStart", computedEdgeValue(node->style.padding, ABI11_0_0CSSEdgeStart, 0));
      printNumberIfNotZero("paddingEnd", computedEdgeValue(node->style.padding, ABI11_0_0CSSEdgeEnd, 0));
    }

    if (eqFour(node->style.border)) {
      printNumberIfNotZero("borderWidth", computedEdgeValue(node->style.border, ABI11_0_0CSSEdgeLeft, 0));
    } else {
      printNumberIfNotZero("borderLeftWidth",
                           computedEdgeValue(node->style.border, ABI11_0_0CSSEdgeLeft, 0));
      printNumberIfNotZero("borderRightWidth",
                           computedEdgeValue(node->style.border, ABI11_0_0CSSEdgeRight, 0));
      printNumberIfNotZero("borderTopWidth", computedEdgeValue(node->style.border, ABI11_0_0CSSEdgeTop, 0));
      printNumberIfNotZero("borderBottomWidth",
                           computedEdgeValue(node->style.border, ABI11_0_0CSSEdgeBottom, 0));
      printNumberIfNotZero("borderStartWidth",
                           computedEdgeValue(node->style.border, ABI11_0_0CSSEdgeStart, 0));
      printNumberIfNotZero("borderEndWidth", computedEdgeValue(node->style.border, ABI11_0_0CSSEdgeEnd, 0));
    }

    printNumberIfNotUndefined("width", node->style.dimensions[ABI11_0_0CSSDimensionWidth]);
    printNumberIfNotUndefined("height", node->style.dimensions[ABI11_0_0CSSDimensionHeight]);
    printNumberIfNotUndefined("maxWidth", node->style.maxDimensions[ABI11_0_0CSSDimensionWidth]);
    printNumberIfNotUndefined("maxHeight", node->style.maxDimensions[ABI11_0_0CSSDimensionHeight]);
    printNumberIfNotUndefined("minWidth", node->style.minDimensions[ABI11_0_0CSSDimensionWidth]);
    printNumberIfNotUndefined("minHeight", node->style.minDimensions[ABI11_0_0CSSDimensionHeight]);

    if (node->style.positionType == ABI11_0_0CSSPositionTypeAbsolute) {
      printf("position: 'absolute', ");
    }

    printNumberIfNotUndefined("left",
                              computedEdgeValue(node->style.position, ABI11_0_0CSSEdgeLeft, ABI11_0_0CSSUndefined));
    printNumberIfNotUndefined("right",
                              computedEdgeValue(node->style.position, ABI11_0_0CSSEdgeRight, ABI11_0_0CSSUndefined));
    printNumberIfNotUndefined("top",
                              computedEdgeValue(node->style.position, ABI11_0_0CSSEdgeTop, ABI11_0_0CSSUndefined));
    printNumberIfNotUndefined("bottom",
                              computedEdgeValue(node->style.position, ABI11_0_0CSSEdgeBottom, ABI11_0_0CSSUndefined));
  }

  const uint32_t childCount = ABI11_0_0CSSNodeListCount(node->children);
  if (options & ABI11_0_0CSSPrintOptionsChildren && childCount > 0) {
    printf("children: [\n");
    for (uint32_t i = 0; i < childCount; i++) {
      _ABI11_0_0CSSNodePrint(ABI11_0_0CSSNodeGetChild(node, i), options, level + 1);
    }
    indent(level);
    printf("]},\n");
  } else {
    printf("},\n");
  }
}

void ABI11_0_0CSSNodePrint(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSPrintOptions options) {
  _ABI11_0_0CSSNodePrint(node, options, 0);
}

static const ABI11_0_0CSSEdge leading[4] = {
        [ABI11_0_0CSSFlexDirectionColumn] = ABI11_0_0CSSEdgeTop,
        [ABI11_0_0CSSFlexDirectionColumnReverse] = ABI11_0_0CSSEdgeBottom,
        [ABI11_0_0CSSFlexDirectionRow] = ABI11_0_0CSSEdgeLeft,
        [ABI11_0_0CSSFlexDirectionRowReverse] = ABI11_0_0CSSEdgeRight,
};
static const ABI11_0_0CSSEdge trailing[4] = {
        [ABI11_0_0CSSFlexDirectionColumn] = ABI11_0_0CSSEdgeBottom,
        [ABI11_0_0CSSFlexDirectionColumnReverse] = ABI11_0_0CSSEdgeTop,
        [ABI11_0_0CSSFlexDirectionRow] = ABI11_0_0CSSEdgeRight,
        [ABI11_0_0CSSFlexDirectionRowReverse] = ABI11_0_0CSSEdgeLeft,
};
static const ABI11_0_0CSSEdge pos[4] = {
        [ABI11_0_0CSSFlexDirectionColumn] = ABI11_0_0CSSEdgeTop,
        [ABI11_0_0CSSFlexDirectionColumnReverse] = ABI11_0_0CSSEdgeBottom,
        [ABI11_0_0CSSFlexDirectionRow] = ABI11_0_0CSSEdgeLeft,
        [ABI11_0_0CSSFlexDirectionRowReverse] = ABI11_0_0CSSEdgeRight,
};
static const ABI11_0_0CSSDimension dim[4] = {
        [ABI11_0_0CSSFlexDirectionColumn] = ABI11_0_0CSSDimensionHeight,
        [ABI11_0_0CSSFlexDirectionColumnReverse] = ABI11_0_0CSSDimensionHeight,
        [ABI11_0_0CSSFlexDirectionRow] = ABI11_0_0CSSDimensionWidth,
        [ABI11_0_0CSSFlexDirectionRowReverse] = ABI11_0_0CSSDimensionWidth,
};

static bool isRowDirection(const ABI11_0_0CSSFlexDirection flexDirection) {
  return flexDirection == ABI11_0_0CSSFlexDirectionRow || flexDirection == ABI11_0_0CSSFlexDirectionRowReverse;
}

static bool isColumnDirection(const ABI11_0_0CSSFlexDirection flexDirection) {
  return flexDirection == ABI11_0_0CSSFlexDirectionColumn || flexDirection == ABI11_0_0CSSFlexDirectionColumnReverse;
}

static float getLeadingMargin(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  if (isRowDirection(axis) && !ABI11_0_0CSSValueIsUndefined(node->style.margin[ABI11_0_0CSSEdgeStart])) {
    return node->style.margin[ABI11_0_0CSSEdgeStart];
  }

  return computedEdgeValue(node->style.margin, leading[axis], 0);
}

static float getTrailingMargin(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  if (isRowDirection(axis) && !ABI11_0_0CSSValueIsUndefined(node->style.margin[ABI11_0_0CSSEdgeEnd])) {
    return node->style.margin[ABI11_0_0CSSEdgeEnd];
  }

  return computedEdgeValue(node->style.margin, trailing[axis], 0);
}

static float getLeadingPadding(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  if (isRowDirection(axis) && !ABI11_0_0CSSValueIsUndefined(node->style.padding[ABI11_0_0CSSEdgeStart]) &&
      node->style.padding[ABI11_0_0CSSEdgeStart] >= 0) {
    return node->style.padding[ABI11_0_0CSSEdgeStart];
  }

  if (computedEdgeValue(node->style.padding, leading[axis], 0) >= 0) {
    return computedEdgeValue(node->style.padding, leading[axis], 0);
  }

  return 0;
}

static float getTrailingPadding(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  if (isRowDirection(axis) && !ABI11_0_0CSSValueIsUndefined(node->style.padding[ABI11_0_0CSSEdgeEnd]) &&
      node->style.padding[ABI11_0_0CSSEdgeEnd] >= 0) {
    return node->style.padding[ABI11_0_0CSSEdgeEnd];
  }

  if (computedEdgeValue(node->style.padding, trailing[axis], 0) >= 0) {
    return computedEdgeValue(node->style.padding, trailing[axis], 0);
  }

  return 0;
}

static float getLeadingBorder(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  if (isRowDirection(axis) && !ABI11_0_0CSSValueIsUndefined(node->style.border[ABI11_0_0CSSEdgeStart]) &&
      node->style.border[ABI11_0_0CSSEdgeStart] >= 0) {
    return node->style.border[ABI11_0_0CSSEdgeStart];
  }

  if (computedEdgeValue(node->style.border, leading[axis], 0) >= 0) {
    return computedEdgeValue(node->style.border, leading[axis], 0);
  }

  return 0;
}

static float getTrailingBorder(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  if (isRowDirection(axis) && !ABI11_0_0CSSValueIsUndefined(node->style.border[ABI11_0_0CSSEdgeEnd]) &&
      node->style.border[ABI11_0_0CSSEdgeEnd] >= 0) {
    return node->style.border[ABI11_0_0CSSEdgeEnd];
  }

  if (computedEdgeValue(node->style.border, trailing[axis], 0) >= 0) {
    return computedEdgeValue(node->style.border, trailing[axis], 0);
  }

  return 0;
}

static float getLeadingPaddingAndBorder(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  return getLeadingPadding(node, axis) + getLeadingBorder(node, axis);
}

static float getTrailingPaddingAndBorder(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  return getTrailingPadding(node, axis) + getTrailingBorder(node, axis);
}

static float getMarginAxis(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  return getLeadingMargin(node, axis) + getTrailingMargin(node, axis);
}

static float getPaddingAndBorderAxis(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  return getLeadingPaddingAndBorder(node, axis) + getTrailingPaddingAndBorder(node, axis);
}

static ABI11_0_0CSSAlign getAlignItem(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSNodeRef child) {
  if (child->style.alignSelf != ABI11_0_0CSSAlignAuto) {
    return child->style.alignSelf;
  }
  return node->style.alignItems;
}

static ABI11_0_0CSSDirection resolveDirection(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSDirection parentDirection) {
  if (node->style.direction == ABI11_0_0CSSDirectionInherit) {
    return parentDirection > ABI11_0_0CSSDirectionInherit ? parentDirection : ABI11_0_0CSSDirectionLTR;
  } else {
    return node->style.direction;
  }
}

static ABI11_0_0CSSFlexDirection resolveAxis(const ABI11_0_0CSSFlexDirection flexDirection,
                                    const ABI11_0_0CSSDirection direction) {
  if (direction == ABI11_0_0CSSDirectionRTL) {
    if (flexDirection == ABI11_0_0CSSFlexDirectionRow) {
      return ABI11_0_0CSSFlexDirectionRowReverse;
    } else if (flexDirection == ABI11_0_0CSSFlexDirectionRowReverse) {
      return ABI11_0_0CSSFlexDirectionRow;
    }
  }

  return flexDirection;
}

static ABI11_0_0CSSFlexDirection getCrossFlexDirection(const ABI11_0_0CSSFlexDirection flexDirection,
                                              const ABI11_0_0CSSDirection direction) {
  if (isColumnDirection(flexDirection)) {
    return resolveAxis(ABI11_0_0CSSFlexDirectionRow, direction);
  } else {
    return ABI11_0_0CSSFlexDirectionColumn;
  }
}

static bool isFlex(const ABI11_0_0CSSNodeRef node) {
  return (node->style.positionType == ABI11_0_0CSSPositionTypeRelative &&
          (node->style.flexGrow != 0 || node->style.flexShrink != 0));
}

static float getDimWithMargin(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  return node->layout.measuredDimensions[dim[axis]] + getLeadingMargin(node, axis) +
         getTrailingMargin(node, axis);
}

static bool isStyleDimDefined(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  const float value = node->style.dimensions[dim[axis]];
  return !ABI11_0_0CSSValueIsUndefined(value) && value >= 0.0;
}

static bool isLayoutDimDefined(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  const float value = node->layout.measuredDimensions[dim[axis]];
  return !ABI11_0_0CSSValueIsUndefined(value) && value >= 0.0;
}

static bool isLeadingPosDefined(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  return (isRowDirection(axis) &&
          !ABI11_0_0CSSValueIsUndefined(
              computedEdgeValue(node->style.position, ABI11_0_0CSSEdgeStart, ABI11_0_0CSSUndefined))) ||
         !ABI11_0_0CSSValueIsUndefined(computedEdgeValue(node->style.position, leading[axis], ABI11_0_0CSSUndefined));
}

static bool isTrailingPosDefined(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  return (isRowDirection(axis) &&
          !ABI11_0_0CSSValueIsUndefined(
              computedEdgeValue(node->style.position, ABI11_0_0CSSEdgeEnd, ABI11_0_0CSSUndefined))) ||
         !ABI11_0_0CSSValueIsUndefined(
             computedEdgeValue(node->style.position, trailing[axis], ABI11_0_0CSSUndefined));
}

static float getLeadingPosition(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  if (isRowDirection(axis) &&
      !ABI11_0_0CSSValueIsUndefined(computedEdgeValue(node->style.position, ABI11_0_0CSSEdgeStart, ABI11_0_0CSSUndefined))) {
    return computedEdgeValue(node->style.position, ABI11_0_0CSSEdgeStart, ABI11_0_0CSSUndefined);
  }
  if (!ABI11_0_0CSSValueIsUndefined(computedEdgeValue(node->style.position, leading[axis], ABI11_0_0CSSUndefined))) {
    return computedEdgeValue(node->style.position, leading[axis], ABI11_0_0CSSUndefined);
  }
  return 0;
}

static float getTrailingPosition(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  if (isRowDirection(axis) &&
      !ABI11_0_0CSSValueIsUndefined(computedEdgeValue(node->style.position, ABI11_0_0CSSEdgeEnd, ABI11_0_0CSSUndefined))) {
    return computedEdgeValue(node->style.position, ABI11_0_0CSSEdgeEnd, ABI11_0_0CSSUndefined);
  }
  if (!ABI11_0_0CSSValueIsUndefined(computedEdgeValue(node->style.position, trailing[axis], ABI11_0_0CSSUndefined))) {
    return computedEdgeValue(node->style.position, trailing[axis], ABI11_0_0CSSUndefined);
  }
  return 0;
}

static float
boundAxisWithinMinAndMax(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis, const float value) {
  float min = ABI11_0_0CSSUndefined;
  float max = ABI11_0_0CSSUndefined;

  if (isColumnDirection(axis)) {
    min = node->style.minDimensions[ABI11_0_0CSSDimensionHeight];
    max = node->style.maxDimensions[ABI11_0_0CSSDimensionHeight];
  } else if (isRowDirection(axis)) {
    min = node->style.minDimensions[ABI11_0_0CSSDimensionWidth];
    max = node->style.maxDimensions[ABI11_0_0CSSDimensionWidth];
  }

  float boundValue = value;

  if (!ABI11_0_0CSSValueIsUndefined(max) && max >= 0.0 && boundValue > max) {
    boundValue = max;
  }

  if (!ABI11_0_0CSSValueIsUndefined(min) && min >= 0.0 && boundValue < min) {
    boundValue = min;
  }

  return boundValue;
}

// Like boundAxisWithinMinAndMax but also ensures that the value doesn't go
// below the
// padding and border amount.
static float boundAxis(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis, const float value) {
  return fmaxf(boundAxisWithinMinAndMax(node, axis, value), getPaddingAndBorderAxis(node, axis));
}

static void
setTrailingPosition(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSNodeRef child, const ABI11_0_0CSSFlexDirection axis) {
  const float size = child->layout.measuredDimensions[dim[axis]];
  child->layout.position[trailing[axis]] =
      node->layout.measuredDimensions[dim[axis]] - size - child->layout.position[pos[axis]];
}

// If both left and right are defined, then use left. Otherwise return
// +left or -right depending on which is defined.
static float getRelativePosition(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSFlexDirection axis) {
  if (isLeadingPosDefined(node, axis)) {
    return getLeadingPosition(node, axis);
  }
  return -getTrailingPosition(node, axis);
}

static void setPosition(const ABI11_0_0CSSNodeRef node, const ABI11_0_0CSSDirection direction) {
  const ABI11_0_0CSSFlexDirection mainAxis = resolveAxis(node->style.flexDirection, direction);
  const ABI11_0_0CSSFlexDirection crossAxis = getCrossFlexDirection(mainAxis, direction);

  node->layout.position[leading[mainAxis]] =
      getLeadingMargin(node, mainAxis) + getRelativePosition(node, mainAxis);
  node->layout.position[trailing[mainAxis]] =
      getTrailingMargin(node, mainAxis) + getRelativePosition(node, mainAxis);
  node->layout.position[leading[crossAxis]] =
      getLeadingMargin(node, crossAxis) + getRelativePosition(node, crossAxis);
  node->layout.position[trailing[crossAxis]] =
      getTrailingMargin(node, crossAxis) + getRelativePosition(node, crossAxis);
}

//
// This is the main routine that implements a subset of the flexbox layout
// algorithm
// described in the W3C ABI11_0_0CSS documentation: https://www.w3.org/TR/css3-flexbox/.
//
// Limitations of this algorithm, compared to the full standard:
//  * Display property is always assumed to be 'flex' except for Text nodes,
//  which
//    are assumed to be 'inline-flex'.
//  * The 'zIndex' property (or any form of z ordering) is not supported. Nodes
//  are
//    stacked in document order.
//  * The 'order' property is not supported. The order of flex items is always
//  defined
//    by document order.
//  * The 'visibility' property is always assumed to be 'visible'. Values of
//  'collapse'
//    and 'hidden' are not supported.
//  * The 'wrap' property supports only 'nowrap' (which is the default) or
//  'wrap'. The
//    rarely-used 'wrap-reverse' is not supported.
//  * Rather than allowing arbitrary combinations of flexGrow, flexShrink and
//    flexBasis, this algorithm supports only the three most common
//    combinations:
//      flex: 0 is equiavlent to flex: 0 0 auto
//      flex: n (where n is a positive value) is equivalent to flex: n 1 auto
//          If POSITIVE_FLEX_IS_AUTO is 0, then it is equivalent to flex: n 0 0
//          This is faster because the content doesn't need to be measured, but
//          it's
//          less flexible because the basis is always 0 and can't be overriden
//          with
//          the width/height attributes.
//      flex: -1 (or any negative value) is equivalent to flex: 0 1 auto
//  * Margins cannot be specified as 'auto'. They must be specified in terms of
//  pixel
//    values, and the default value is 0.
//  * The 'baseline' value is not supported for alignItems and alignSelf
//  properties.
//  * Values of width, maxWidth, minWidth, height, maxHeight and minHeight must
//  be
//    specified as pixel values, not as percentages.
//  * There is no support for calculation of dimensions based on intrinsic
//  aspect ratios
//     (e.g. images).
//  * There is no support for forced breaks.
//  * It does not support vertical inline directions (top-to-bottom or
//  bottom-to-top text).
//
// Deviations from standard:
//  * Section 4.5 of the spec indicates that all flex items have a default
//  minimum
//    main size. For text blocks, for example, this is the width of the widest
//    word.
//    Calculating the minimum width is expensive, so we forego it and assume a
//    default
//    minimum main size of 0.
//  * Min/Max sizes in the main axis are not honored when resolving flexible
//  lengths.
//  * The spec indicates that the default value for 'flexDirection' is 'row',
//  but
//    the algorithm below assumes a default of 'column'.
//
// Input parameters:
//    - node: current node to be sized and layed out
//    - availableWidth & availableHeight: available size to be used for sizing
//    the node
//      or ABI11_0_0CSSUndefined if the size is not available; interpretation depends on
//      layout
//      flags
//    - parentDirection: the inline (text) direction within the parent
//    (left-to-right or
//      right-to-left)
//    - widthMeasureMode: indicates the sizing rules for the width (see below
//    for explanation)
//    - heightMeasureMode: indicates the sizing rules for the height (see below
//    for explanation)
//    - performLayout: specifies whether the caller is interested in just the
//    dimensions
//      of the node or it requires the entire node and its subtree to be layed
//      out
//      (with final positions)
//
// Details:
//    This routine is called recursively to lay out subtrees of flexbox
//    elements. It uses the
//    information in node.style, which is treated as a read-only input. It is
//    responsible for
//    setting the layout.direction and layout.measuredDimensions fields for the
//    input node as well
//    as the layout.position and layout.lineIndex fields for its child nodes.
//    The
//    layout.measuredDimensions field includes any border or padding for the
//    node but does
//    not include margins.
//
//    The spec describes four different layout modes: "fill available", "max
//    content", "min
//    content",
//    and "fit content". Of these, we don't use "min content" because we don't
//    support default
//    minimum main sizes (see above for details). Each of our measure modes maps
//    to a layout mode
//    from the spec (https://www.w3.org/TR/css3-sizing/#terms):
//      - ABI11_0_0CSSMeasureModeUndefined: max content
//      - ABI11_0_0CSSMeasureModeExactly: fill available
//      - ABI11_0_0CSSMeasureModeAtMost: fit content
//
//    When calling layoutNodeImpl and layoutNodeInternal, if the caller passes
//    an available size of
//    undefined then it must also pass a measure mode of ABI11_0_0CSSMeasureModeUndefined
//    in that dimension.
//
static void layoutNodeImpl(const ABI11_0_0CSSNodeRef node,
                           const float availableWidth,
                           const float availableHeight,
                           const ABI11_0_0CSSDirection parentDirection,
                           const ABI11_0_0CSSMeasureMode widthMeasureMode,
                           const ABI11_0_0CSSMeasureMode heightMeasureMode,
                           const bool performLayout) {
  ABI11_0_0CSS_ASSERT(ABI11_0_0CSSValueIsUndefined(availableWidth) ? widthMeasureMode == ABI11_0_0CSSMeasureModeUndefined
                                                 : true,
             "availableWidth is indefinite so widthMeasureMode must be "
             "ABI11_0_0CSSMeasureModeUndefined");
  ABI11_0_0CSS_ASSERT(ABI11_0_0CSSValueIsUndefined(availableHeight) ? heightMeasureMode == ABI11_0_0CSSMeasureModeUndefined
                                                  : true,
             "availableHeight is indefinite so heightMeasureMode must be "
             "ABI11_0_0CSSMeasureModeUndefined");

  const float paddingAndBorderAxisRow = getPaddingAndBorderAxis(node, ABI11_0_0CSSFlexDirectionRow);
  const float paddingAndBorderAxisColumn = getPaddingAndBorderAxis(node, ABI11_0_0CSSFlexDirectionColumn);
  const float marginAxisRow = getMarginAxis(node, ABI11_0_0CSSFlexDirectionRow);
  const float marginAxisColumn = getMarginAxis(node, ABI11_0_0CSSFlexDirectionColumn);

  // Set the resolved resolution in the node's layout.
  const ABI11_0_0CSSDirection direction = resolveDirection(node, parentDirection);
  node->layout.direction = direction;

  // For content (text) nodes, determine the dimensions based on the text
  // contents.
  if (node->measure) {
    const float innerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
    const float innerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;

    if (widthMeasureMode == ABI11_0_0CSSMeasureModeExactly && heightMeasureMode == ABI11_0_0CSSMeasureModeExactly) {
      // Don't bother sizing the text if both dimensions are already defined.
      node->layout.measuredDimensions[ABI11_0_0CSSDimensionWidth] =
          boundAxis(node, ABI11_0_0CSSFlexDirectionRow, availableWidth - marginAxisRow);
      node->layout.measuredDimensions[ABI11_0_0CSSDimensionHeight] =
          boundAxis(node, ABI11_0_0CSSFlexDirectionColumn, availableHeight - marginAxisColumn);
    } else if (innerWidth <= 0 || innerHeight <= 0) {
      // Don't bother sizing the text if there's no horizontal or vertical
      // space.
      node->layout.measuredDimensions[ABI11_0_0CSSDimensionWidth] = boundAxis(node, ABI11_0_0CSSFlexDirectionRow, 0);
      node->layout.measuredDimensions[ABI11_0_0CSSDimensionHeight] =
          boundAxis(node, ABI11_0_0CSSFlexDirectionColumn, 0);
    } else {
      // Measure the text under the current constraints.
      const ABI11_0_0CSSSize measuredSize =
          node->measure(node->context, innerWidth, widthMeasureMode, innerHeight, heightMeasureMode);

      node->layout.measuredDimensions[ABI11_0_0CSSDimensionWidth] =
          boundAxis(node,
                    ABI11_0_0CSSFlexDirectionRow,
                    (widthMeasureMode == ABI11_0_0CSSMeasureModeUndefined ||
                     widthMeasureMode == ABI11_0_0CSSMeasureModeAtMost)
                        ? measuredSize.width + paddingAndBorderAxisRow
                        : availableWidth - marginAxisRow);
      node->layout.measuredDimensions[ABI11_0_0CSSDimensionHeight] =
          boundAxis(node,
                    ABI11_0_0CSSFlexDirectionColumn,
                    (heightMeasureMode == ABI11_0_0CSSMeasureModeUndefined ||
                     heightMeasureMode == ABI11_0_0CSSMeasureModeAtMost)
                        ? measuredSize.height + paddingAndBorderAxisColumn
                        : availableHeight - marginAxisColumn);
    }

    return;
  }

  // For nodes with no children, use the available values if they were provided,
  // or
  // the minimum size as indicated by the padding and border sizes.
  const uint32_t childCount = ABI11_0_0CSSNodeListCount(node->children);
  if (childCount == 0) {
    node->layout.measuredDimensions[ABI11_0_0CSSDimensionWidth] =
        boundAxis(node,
                  ABI11_0_0CSSFlexDirectionRow,
                  (widthMeasureMode == ABI11_0_0CSSMeasureModeUndefined ||
                   widthMeasureMode == ABI11_0_0CSSMeasureModeAtMost)
                      ? paddingAndBorderAxisRow
                      : availableWidth - marginAxisRow);
    node->layout.measuredDimensions[ABI11_0_0CSSDimensionHeight] =
        boundAxis(node,
                  ABI11_0_0CSSFlexDirectionColumn,
                  (heightMeasureMode == ABI11_0_0CSSMeasureModeUndefined ||
                   heightMeasureMode == ABI11_0_0CSSMeasureModeAtMost)
                      ? paddingAndBorderAxisColumn
                      : availableHeight - marginAxisColumn);
    return;
  }

  // If we're not being asked to perform a full layout, we can handle a number
  // of common
  // cases here without incurring the cost of the remaining function.
  if (!performLayout) {
    // If we're being asked to size the content with an at most constraint but
    // there is no available
    // width,
    // the measurement will always be zero.
    if (widthMeasureMode == ABI11_0_0CSSMeasureModeAtMost && availableWidth <= 0 &&
        heightMeasureMode == ABI11_0_0CSSMeasureModeAtMost && availableHeight <= 0) {
      node->layout.measuredDimensions[ABI11_0_0CSSDimensionWidth] = boundAxis(node, ABI11_0_0CSSFlexDirectionRow, 0);
      node->layout.measuredDimensions[ABI11_0_0CSSDimensionHeight] =
          boundAxis(node, ABI11_0_0CSSFlexDirectionColumn, 0);
      return;
    }

    if (widthMeasureMode == ABI11_0_0CSSMeasureModeAtMost && availableWidth <= 0) {
      node->layout.measuredDimensions[ABI11_0_0CSSDimensionWidth] = boundAxis(node, ABI11_0_0CSSFlexDirectionRow, 0);
      node->layout.measuredDimensions[ABI11_0_0CSSDimensionHeight] =
          boundAxis(node,
                    ABI11_0_0CSSFlexDirectionColumn,
                    ABI11_0_0CSSValueIsUndefined(availableHeight) ? 0
                                                         : (availableHeight - marginAxisColumn));
      return;
    }

    if (heightMeasureMode == ABI11_0_0CSSMeasureModeAtMost && availableHeight <= 0) {
      node->layout.measuredDimensions[ABI11_0_0CSSDimensionWidth] =
          boundAxis(node,
                    ABI11_0_0CSSFlexDirectionRow,
                    ABI11_0_0CSSValueIsUndefined(availableWidth) ? 0 : (availableWidth - marginAxisRow));
      node->layout.measuredDimensions[ABI11_0_0CSSDimensionHeight] =
          boundAxis(node, ABI11_0_0CSSFlexDirectionColumn, 0);
      return;
    }

    // If we're being asked to use an exact width/height, there's no need to
    // measure the children.
    if (widthMeasureMode == ABI11_0_0CSSMeasureModeExactly && heightMeasureMode == ABI11_0_0CSSMeasureModeExactly) {
      node->layout.measuredDimensions[ABI11_0_0CSSDimensionWidth] =
          boundAxis(node, ABI11_0_0CSSFlexDirectionRow, availableWidth - marginAxisRow);
      node->layout.measuredDimensions[ABI11_0_0CSSDimensionHeight] =
          boundAxis(node, ABI11_0_0CSSFlexDirectionColumn, availableHeight - marginAxisColumn);
      return;
    }
  }

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  const ABI11_0_0CSSFlexDirection mainAxis = resolveAxis(node->style.flexDirection, direction);
  const ABI11_0_0CSSFlexDirection crossAxis = getCrossFlexDirection(mainAxis, direction);
  const bool isMainAxisRow = isRowDirection(mainAxis);
  const ABI11_0_0CSSJustify justifyContent = node->style.justifyContent;
  const bool isNodeFlexWrap = node->style.flexWrap == ABI11_0_0CSSWrapTypeWrap;

  ABI11_0_0CSSNodeRef firstAbsoluteChild = NULL;
  ABI11_0_0CSSNodeRef currentAbsoluteChild = NULL;

  const float leadingPaddingAndBorderMain = getLeadingPaddingAndBorder(node, mainAxis);
  const float trailingPaddingAndBorderMain = getTrailingPaddingAndBorder(node, mainAxis);
  const float leadingPaddingAndBorderCross = getLeadingPaddingAndBorder(node, crossAxis);
  const float paddingAndBorderAxisMain = getPaddingAndBorderAxis(node, mainAxis);
  const float paddingAndBorderAxisCross = getPaddingAndBorderAxis(node, crossAxis);

  const ABI11_0_0CSSMeasureMode measureModeMainDim = isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  const ABI11_0_0CSSMeasureMode measureModeCrossDim = isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS
  const float availableInnerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  const float availableInnerHeight =
      availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;
  const float availableInnerMainDim = isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  const float availableInnerCrossDim = isMainAxisRow ? availableInnerHeight : availableInnerWidth;

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM
  float childWidth;
  float childHeight;
  ABI11_0_0CSSMeasureMode childWidthMeasureMode;
  ABI11_0_0CSSMeasureMode childHeightMeasureMode;
  for (uint32_t i = 0; i < childCount; i++) {
    const ABI11_0_0CSSNodeRef child = ABI11_0_0CSSNodeListGet(node->children, i);

    if (performLayout) {
      // Set the initial position (relative to the parent).
      const ABI11_0_0CSSDirection childDirection = resolveDirection(child, direction);
      setPosition(child, childDirection);
    }

    // Absolute-positioned children don't participate in flex layout. Add them
    // to a list that we can process later.
    if (child->style.positionType == ABI11_0_0CSSPositionTypeAbsolute) {
      // Store a private linked list of absolutely positioned children
      // so that we can efficiently traverse them later.
      if (firstAbsoluteChild == NULL) {
        firstAbsoluteChild = child;
      }
      if (currentAbsoluteChild != NULL) {
        currentAbsoluteChild->nextChild = child;
      }
      currentAbsoluteChild = child;
      child->nextChild = NULL;
    } else {
      if (isMainAxisRow && isStyleDimDefined(child, ABI11_0_0CSSFlexDirectionRow)) {
        // The width is definite, so use that as the flex basis.
        child->layout.computedFlexBasis =
            fmaxf(child->style.dimensions[ABI11_0_0CSSDimensionWidth],
                  getPaddingAndBorderAxis(child, ABI11_0_0CSSFlexDirectionRow));
      } else if (!isMainAxisRow && isStyleDimDefined(child, ABI11_0_0CSSFlexDirectionColumn)) {
        // The height is definite, so use that as the flex basis.
        child->layout.computedFlexBasis =
            fmaxf(child->style.dimensions[ABI11_0_0CSSDimensionHeight],
                  getPaddingAndBorderAxis(child, ABI11_0_0CSSFlexDirectionColumn));
      } else if (!ABI11_0_0CSSValueIsUndefined(child->style.flexBasis) &&
                 !ABI11_0_0CSSValueIsUndefined(availableInnerMainDim)) {
        if (ABI11_0_0CSSValueIsUndefined(child->layout.computedFlexBasis)) {
          child->layout.computedFlexBasis =
              fmaxf(child->style.flexBasis, getPaddingAndBorderAxis(child, mainAxis));
        }
      } else {
        // Compute the flex basis and hypothetical main size (i.e. the clamped
        // flex basis).
        childWidth = ABI11_0_0CSSUndefined;
        childHeight = ABI11_0_0CSSUndefined;
        childWidthMeasureMode = ABI11_0_0CSSMeasureModeUndefined;
        childHeightMeasureMode = ABI11_0_0CSSMeasureModeUndefined;

        if (isStyleDimDefined(child, ABI11_0_0CSSFlexDirectionRow)) {
          childWidth = child->style.dimensions[ABI11_0_0CSSDimensionWidth] +
                       getMarginAxis(child, ABI11_0_0CSSFlexDirectionRow);
          childWidthMeasureMode = ABI11_0_0CSSMeasureModeExactly;
        }
        if (isStyleDimDefined(child, ABI11_0_0CSSFlexDirectionColumn)) {
          childHeight = child->style.dimensions[ABI11_0_0CSSDimensionHeight] +
                        getMarginAxis(child, ABI11_0_0CSSFlexDirectionColumn);
          childHeightMeasureMode = ABI11_0_0CSSMeasureModeExactly;
        }

        // The W3C spec doesn't say anything about the 'overflow' property,
        // but all major browsers appear to implement the following logic.
        if ((!isMainAxisRow && node->style.overflow == ABI11_0_0CSSOverflowScroll) ||
            node->style.overflow != ABI11_0_0CSSOverflowScroll) {
          if (ABI11_0_0CSSValueIsUndefined(childWidth) && !ABI11_0_0CSSValueIsUndefined(availableInnerWidth)) {
            childWidth = availableInnerWidth;
            childWidthMeasureMode = ABI11_0_0CSSMeasureModeAtMost;
          }
        }

        if ((isMainAxisRow && node->style.overflow == ABI11_0_0CSSOverflowScroll) ||
            node->style.overflow != ABI11_0_0CSSOverflowScroll) {
          if (ABI11_0_0CSSValueIsUndefined(childHeight) && !ABI11_0_0CSSValueIsUndefined(availableInnerHeight)) {
            childHeight = availableInnerHeight;
            childHeightMeasureMode = ABI11_0_0CSSMeasureModeAtMost;
          }
        }

        // If child has no defined size in the cross axis and is set to stretch,
        // set the cross
        // axis to be measured exactly with the available inner width
        if (!isMainAxisRow && !ABI11_0_0CSSValueIsUndefined(availableInnerWidth) &&
            !isStyleDimDefined(child, ABI11_0_0CSSFlexDirectionRow) &&
            widthMeasureMode == ABI11_0_0CSSMeasureModeExactly &&
            getAlignItem(node, child) == ABI11_0_0CSSAlignStretch) {
          childWidth = availableInnerWidth;
          childWidthMeasureMode = ABI11_0_0CSSMeasureModeExactly;
        }
        if (isMainAxisRow && !ABI11_0_0CSSValueIsUndefined(availableInnerHeight) &&
            !isStyleDimDefined(child, ABI11_0_0CSSFlexDirectionColumn) &&
            heightMeasureMode == ABI11_0_0CSSMeasureModeExactly &&
            getAlignItem(node, child) == ABI11_0_0CSSAlignStretch) {
          childHeight = availableInnerHeight;
          childHeightMeasureMode = ABI11_0_0CSSMeasureModeExactly;
        }

        // Measure the child
        layoutNodeInternal(child,
                           childWidth,
                           childHeight,
                           direction,
                           childWidthMeasureMode,
                           childHeightMeasureMode,
                           false,
                           "measure");

        child->layout.computedFlexBasis =
            fmaxf(isMainAxisRow ? child->layout.measuredDimensions[ABI11_0_0CSSDimensionWidth]
                                : child->layout.measuredDimensions[ABI11_0_0CSSDimensionHeight],
                  getPaddingAndBorderAxis(child, mainAxis));
      }
    }
  }

  // STEP 4: COLLECT FLEX ITEMS INTO FLEX LINES

  // Indexes of children that represent the first and last items in the line.
  uint32_t startOfLineIndex = 0;
  uint32_t endOfLineIndex = 0;

  // Number of lines.
  uint32_t lineCount = 0;

  // Accumulated cross dimensions of all lines so far.
  float totalLineCrossDim = 0;

  // Max main dimension of all the lines.
  float maxLineMainDim = 0;

  for (; endOfLineIndex < childCount; lineCount++, startOfLineIndex = endOfLineIndex) {
    // Number of items on the currently line. May be different than the
    // difference
    // between start and end indicates because we skip over absolute-positioned
    // items.
    uint32_t itemsOnLine = 0;

    // sizeConsumedOnCurrentLine is accumulation of the dimensions and margin
    // of all the children on the current line. This will be used in order to
    // either set the dimensions of the node if none already exist or to compute
    // the remaining space left for the flexible children.
    float sizeConsumedOnCurrentLine = 0;

    float totalFlexGrowFactors = 0;
    float totalFlexShrinkScaledFactors = 0;

    // Maintain a linked list of the child nodes that can shrink and/or grow.
    ABI11_0_0CSSNodeRef firstRelativeChild = NULL;
    ABI11_0_0CSSNodeRef currentRelativeChild = NULL;

    // Add items to the current line until it's full or we run out of items.
    for (uint32_t i = startOfLineIndex; i < childCount; i++, endOfLineIndex++) {
      const ABI11_0_0CSSNodeRef child = ABI11_0_0CSSNodeListGet(node->children, i);
      child->lineIndex = lineCount;

      if (child->style.positionType != ABI11_0_0CSSPositionTypeAbsolute) {
        const float outerFlexBasis =
            child->layout.computedFlexBasis + getMarginAxis(child, mainAxis);

        // If this is a multi-line flow and this item pushes us over the
        // available size, we've
        // hit the end of the current line. Break out of the loop and lay out
        // the current line.
        if (sizeConsumedOnCurrentLine + outerFlexBasis > availableInnerMainDim && isNodeFlexWrap &&
            itemsOnLine > 0) {
          break;
        }

        sizeConsumedOnCurrentLine += outerFlexBasis;
        itemsOnLine++;

        if (isFlex(child)) {
          totalFlexGrowFactors += child->style.flexGrow;

          // Unlike the grow factor, the shrink factor is scaled relative to the
          // child
          // dimension.
          totalFlexShrinkScaledFactors +=
              -child->style.flexShrink * child->layout.computedFlexBasis;
        }

        // Store a private linked list of children that need to be layed out.
        if (firstRelativeChild == NULL) {
          firstRelativeChild = child;
        }
        if (currentRelativeChild != NULL) {
          currentRelativeChild->nextChild = child;
        }
        currentRelativeChild = child;
        child->nextChild = NULL;
      }
    }

    // If we don't need to measure the cross axis, we can skip the entire flex
    // step.
    const bool canSkipFlex = !performLayout && measureModeCrossDim == ABI11_0_0CSSMeasureModeExactly;

    // In order to position the elements in the main axis, we have two
    // controls. The space between the beginning and the first element
    // and the space between each two elements.
    float leadingMainDim = 0;
    float betweenMainDim = 0;

    // STEP 5: RESOLVING FLEXIBLE LENGTHS ON MAIN AXIS
    // Calculate the remaining available space that needs to be allocated.
    // If the main dimension size isn't known, it is computed based on
    // the line length, so there's no more space left to distribute.
    float remainingFreeSpace = 0;
    if (!ABI11_0_0CSSValueIsUndefined(availableInnerMainDim)) {
      remainingFreeSpace = availableInnerMainDim - sizeConsumedOnCurrentLine;
    } else if (sizeConsumedOnCurrentLine < 0) {
      // availableInnerMainDim is indefinite which means the node is being sized
      // based on its
      // content.
      // sizeConsumedOnCurrentLine is negative which means the node will
      // allocate 0 pixels for
      // its content. Consequently, remainingFreeSpace is 0 -
      // sizeConsumedOnCurrentLine.
      remainingFreeSpace = -sizeConsumedOnCurrentLine;
    }

    const float originalRemainingFreeSpace = remainingFreeSpace;
    float deltaFreeSpace = 0;

    if (!canSkipFlex) {
      float childFlexBasis;
      float flexShrinkScaledFactor;
      float flexGrowFactor;
      float baseMainSize;
      float boundMainSize;

      // Do two passes over the flex items to figure out how to distribute the
      // remaining space.
      // The first pass finds the items whose min/max constraints trigger,
      // freezes them at those
      // sizes, and excludes those sizes from the remaining space. The second
      // pass sets the size
      // of each flexible item. It distributes the remaining space amongst the
      // items whose min/max
      // constraints didn't trigger in pass 1. For the other items, it sets
      // their sizes by forcing
      // their min/max constraints to trigger again.
      //
      // This two pass approach for resolving min/max constraints deviates from
      // the spec. The
      // spec (https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths)
      // describes a process
      // that needs to be repeated a variable number of times. The algorithm
      // implemented here
      // won't handle all cases but it was simpler to implement and it mitigates
      // performance
      // concerns because we know exactly how many passes it'll do.

      // First pass: detect the flex items whose min/max constraints trigger
      float deltaFlexShrinkScaledFactors = 0;
      float deltaFlexGrowFactors = 0;
      currentRelativeChild = firstRelativeChild;
      while (currentRelativeChild != NULL) {
        childFlexBasis = currentRelativeChild->layout.computedFlexBasis;

        if (remainingFreeSpace < 0) {
          flexShrinkScaledFactor = -currentRelativeChild->style.flexShrink * childFlexBasis;

          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            baseMainSize =
                childFlexBasis +
                remainingFreeSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor;
            boundMainSize = boundAxis(currentRelativeChild, mainAxis, baseMainSize);
            if (baseMainSize != boundMainSize) {
              // By excluding this item's size and flex factor from remaining,
              // this item's
              // min/max constraints should also trigger in the second pass
              // resulting in the
              // item's size calculation being identical in the first and second
              // passes.
              deltaFreeSpace -= boundMainSize - childFlexBasis;
              deltaFlexShrinkScaledFactors -= flexShrinkScaledFactor;
            }
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = currentRelativeChild->style.flexGrow;

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            baseMainSize =
                childFlexBasis + remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor;
            boundMainSize = boundAxis(currentRelativeChild, mainAxis, baseMainSize);
            if (baseMainSize != boundMainSize) {
              // By excluding this item's size and flex factor from remaining,
              // this item's
              // min/max constraints should also trigger in the second pass
              // resulting in the
              // item's size calculation being identical in the first and second
              // passes.
              deltaFreeSpace -= boundMainSize - childFlexBasis;
              deltaFlexGrowFactors -= flexGrowFactor;
            }
          }
        }

        currentRelativeChild = currentRelativeChild->nextChild;
      }

      totalFlexShrinkScaledFactors += deltaFlexShrinkScaledFactors;
      totalFlexGrowFactors += deltaFlexGrowFactors;
      remainingFreeSpace += deltaFreeSpace;

      // Second pass: resolve the sizes of the flexible items
      deltaFreeSpace = 0;
      currentRelativeChild = firstRelativeChild;
      while (currentRelativeChild != NULL) {
        childFlexBasis = currentRelativeChild->layout.computedFlexBasis;
        float updatedMainSize = childFlexBasis;

        if (remainingFreeSpace < 0) {
          flexShrinkScaledFactor = -currentRelativeChild->style.flexShrink * childFlexBasis;

          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            updatedMainSize = boundAxis(currentRelativeChild,
                                        mainAxis,
                                        childFlexBasis +
                                            remainingFreeSpace / totalFlexShrinkScaledFactors *
                                                flexShrinkScaledFactor);
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = currentRelativeChild->style.flexGrow;

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            updatedMainSize =
                boundAxis(currentRelativeChild,
                          mainAxis,
                          childFlexBasis +
                              remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor);
          }
        }

        deltaFreeSpace -= updatedMainSize - childFlexBasis;

        if (isMainAxisRow) {
          childWidth = updatedMainSize + getMarginAxis(currentRelativeChild, ABI11_0_0CSSFlexDirectionRow);
          childWidthMeasureMode = ABI11_0_0CSSMeasureModeExactly;

          if (!ABI11_0_0CSSValueIsUndefined(availableInnerCrossDim) &&
              !isStyleDimDefined(currentRelativeChild, ABI11_0_0CSSFlexDirectionColumn) &&
              heightMeasureMode == ABI11_0_0CSSMeasureModeExactly &&
              getAlignItem(node, currentRelativeChild) == ABI11_0_0CSSAlignStretch) {
            childHeight = availableInnerCrossDim;
            childHeightMeasureMode = ABI11_0_0CSSMeasureModeExactly;
          } else if (!isStyleDimDefined(currentRelativeChild, ABI11_0_0CSSFlexDirectionColumn)) {
            childHeight = availableInnerCrossDim;
            childHeightMeasureMode =
                ABI11_0_0CSSValueIsUndefined(childHeight) ? ABI11_0_0CSSMeasureModeUndefined : ABI11_0_0CSSMeasureModeAtMost;
          } else {
            childHeight = currentRelativeChild->style.dimensions[ABI11_0_0CSSDimensionHeight] +
                          getMarginAxis(currentRelativeChild, ABI11_0_0CSSFlexDirectionColumn);
            childHeightMeasureMode = ABI11_0_0CSSMeasureModeExactly;
          }
        } else {
          childHeight =
              updatedMainSize + getMarginAxis(currentRelativeChild, ABI11_0_0CSSFlexDirectionColumn);
          childHeightMeasureMode = ABI11_0_0CSSMeasureModeExactly;

          if (!ABI11_0_0CSSValueIsUndefined(availableInnerCrossDim) &&
              !isStyleDimDefined(currentRelativeChild, ABI11_0_0CSSFlexDirectionRow) &&
              widthMeasureMode == ABI11_0_0CSSMeasureModeExactly &&
              getAlignItem(node, currentRelativeChild) == ABI11_0_0CSSAlignStretch) {
            childWidth = availableInnerCrossDim;
            childWidthMeasureMode = ABI11_0_0CSSMeasureModeExactly;
          } else if (!isStyleDimDefined(currentRelativeChild, ABI11_0_0CSSFlexDirectionRow)) {
            childWidth = availableInnerCrossDim;
            childWidthMeasureMode =
                ABI11_0_0CSSValueIsUndefined(childWidth) ? ABI11_0_0CSSMeasureModeUndefined : ABI11_0_0CSSMeasureModeAtMost;
          } else {
            childWidth = currentRelativeChild->style.dimensions[ABI11_0_0CSSDimensionWidth] +
                         getMarginAxis(currentRelativeChild, ABI11_0_0CSSFlexDirectionRow);
            childWidthMeasureMode = ABI11_0_0CSSMeasureModeExactly;
          }
        }

        const bool requiresStretchLayout =
            !isStyleDimDefined(currentRelativeChild, crossAxis) &&
            getAlignItem(node, currentRelativeChild) == ABI11_0_0CSSAlignStretch;

        // Recursively call the layout algorithm for this child with the updated
        // main size.
        layoutNodeInternal(currentRelativeChild,
                           childWidth,
                           childHeight,
                           direction,
                           childWidthMeasureMode,
                           childHeightMeasureMode,
                           performLayout && !requiresStretchLayout,
                           "flex");

        currentRelativeChild = currentRelativeChild->nextChild;
      }
    }

    remainingFreeSpace = originalRemainingFreeSpace + deltaFreeSpace;

    // STEP 6: MAIN-AXIS JUSTIFICATION & CROSS-AXIS SIZE DETERMINATION

    // At this point, all the children have their dimensions set in the main
    // axis.
    // Their dimensions are also set in the cross axis with the exception of
    // items
    // that are aligned "stretch". We need to compute these stretch values and
    // set the final positions.

    // If we are using "at most" rules in the main axis, we won't distribute
    // any remaining space at this point.
    if (measureModeMainDim == ABI11_0_0CSSMeasureModeAtMost) {
      remainingFreeSpace = 0;
    }

    switch (justifyContent) {
      case ABI11_0_0CSSJustifyCenter:
        leadingMainDim = remainingFreeSpace / 2;
        break;
      case ABI11_0_0CSSJustifyFlexEnd:
        leadingMainDim = remainingFreeSpace;
        break;
      case ABI11_0_0CSSJustifySpaceBetween:
        if (itemsOnLine > 1) {
          betweenMainDim = fmaxf(remainingFreeSpace, 0) / (itemsOnLine - 1);
        } else {
          betweenMainDim = 0;
        }
        break;
      case ABI11_0_0CSSJustifySpaceAround:
        // Space on the edges is half of the space between elements
        betweenMainDim = remainingFreeSpace / itemsOnLine;
        leadingMainDim = betweenMainDim / 2;
        break;
      default:
        break;
    }

    float mainDim = leadingPaddingAndBorderMain + leadingMainDim;
    float crossDim = 0;

    for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
      const ABI11_0_0CSSNodeRef child = ABI11_0_0CSSNodeListGet(node->children, i);

      if (child->style.positionType == ABI11_0_0CSSPositionTypeAbsolute &&
          isLeadingPosDefined(child, mainAxis)) {
        if (performLayout) {
          // In case the child is position absolute and has left/top being
          // defined, we override the position to whatever the user said
          // (and margin/border).
          child->layout.position[pos[mainAxis]] = getLeadingPosition(child, mainAxis) +
                                                  getLeadingBorder(node, mainAxis) +
                                                  getLeadingMargin(child, mainAxis);
        }
      } else {
        if (performLayout) {
          // If the child is position absolute (without top/left) or relative,
          // we put it at the current accumulated offset.
          child->layout.position[pos[mainAxis]] += mainDim;
        }

        // Now that we placed the element, we need to update the variables.
        // We need to do that only for relative elements. Absolute elements
        // do not take part in that phase.
        if (child->style.positionType == ABI11_0_0CSSPositionTypeRelative) {
          if (canSkipFlex) {
            // If we skipped the flex step, then we can't rely on the
            // measuredDims because
            // they weren't computed. This means we can't call getDimWithMargin.
            mainDim +=
                betweenMainDim + getMarginAxis(child, mainAxis) + child->layout.computedFlexBasis;
            crossDim = availableInnerCrossDim;
          } else {
            // The main dimension is the sum of all the elements dimension plus
            // the spacing.
            mainDim += betweenMainDim + getDimWithMargin(child, mainAxis);

            // The cross dimension is the max of the elements dimension since
            // there
            // can only be one element in that cross dimension.
            crossDim = fmaxf(crossDim, getDimWithMargin(child, crossAxis));
          }
        }
      }
    }

    mainDim += trailingPaddingAndBorderMain;

    float containerCrossAxis = availableInnerCrossDim;
    if (measureModeCrossDim == ABI11_0_0CSSMeasureModeUndefined ||
        measureModeCrossDim == ABI11_0_0CSSMeasureModeAtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis = boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross) -
                           paddingAndBorderAxisCross;

      if (measureModeCrossDim == ABI11_0_0CSSMeasureModeAtMost) {
        containerCrossAxis = fminf(containerCrossAxis, availableInnerCrossDim);
      }
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == ABI11_0_0CSSMeasureModeExactly) {
      crossDim = availableInnerCrossDim;
    }

    // Clamp to the min/max size specified on the container.
    crossDim = boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross) -
               paddingAndBorderAxisCross;

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    if (performLayout) {
      for (uint32_t i = startOfLineIndex; i < endOfLineIndex; i++) {
        const ABI11_0_0CSSNodeRef child = ABI11_0_0CSSNodeListGet(node->children, i);

        if (child->style.positionType == ABI11_0_0CSSPositionTypeAbsolute) {
          // If the child is absolutely positioned and has a
          // top/left/bottom/right
          // set, override all the previously computed positions to set it
          // correctly.
          if (isLeadingPosDefined(child, crossAxis)) {
            child->layout.position[pos[crossAxis]] = getLeadingPosition(child, crossAxis) +
                                                     getLeadingBorder(node, crossAxis) +
                                                     getLeadingMargin(child, crossAxis);
          } else {
            child->layout.position[pos[crossAxis]] =
                leadingPaddingAndBorderCross + getLeadingMargin(child, crossAxis);
          }
        } else {
          float leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (parent) or
          // alignSelf (child) in order to determine the position in the cross
          // axis
          const ABI11_0_0CSSAlign alignItem = getAlignItem(node, child);

          // If the child uses align stretch, we need to lay it out one more
          // time, this time
          // forcing the cross-axis size to be the computed cross size for the
          // current line.
          if (alignItem == ABI11_0_0CSSAlignStretch) {
            const bool isCrossSizeDefinite =
                (isMainAxisRow && isStyleDimDefined(child, ABI11_0_0CSSFlexDirectionColumn)) ||
                (!isMainAxisRow && isStyleDimDefined(child, ABI11_0_0CSSFlexDirectionRow));

            if (isMainAxisRow) {
              childHeight = crossDim;
              childWidth = child->layout.measuredDimensions[ABI11_0_0CSSDimensionWidth] +
                           getMarginAxis(child, ABI11_0_0CSSFlexDirectionRow);
            } else {
              childWidth = crossDim;
              childHeight = child->layout.measuredDimensions[ABI11_0_0CSSDimensionHeight] +
                            getMarginAxis(child, ABI11_0_0CSSFlexDirectionColumn);
            }

            // If the child defines a definite size for its cross axis, there's
            // no need to stretch.
            if (!isCrossSizeDefinite) {
              childWidthMeasureMode =
                  ABI11_0_0CSSValueIsUndefined(childWidth) ? ABI11_0_0CSSMeasureModeUndefined : ABI11_0_0CSSMeasureModeExactly;
              childHeightMeasureMode = ABI11_0_0CSSValueIsUndefined(childHeight) ? ABI11_0_0CSSMeasureModeUndefined
                                                                        : ABI11_0_0CSSMeasureModeExactly;
              layoutNodeInternal(child,
                                 childWidth,
                                 childHeight,
                                 direction,
                                 childWidthMeasureMode,
                                 childHeightMeasureMode,
                                 true,
                                 "stretch");
            }
          } else if (alignItem != ABI11_0_0CSSAlignFlexStart) {
            const float remainingCrossDim = containerCrossAxis - getDimWithMargin(child, crossAxis);

            if (alignItem == ABI11_0_0CSSAlignCenter) {
              leadingCrossDim += remainingCrossDim / 2;
            } else { // ABI11_0_0CSSAlignFlexEnd
              leadingCrossDim += remainingCrossDim;
            }
          }

          // And we apply the position
          child->layout.position[pos[crossAxis]] += totalLineCrossDim + leadingCrossDim;
        }
      }
    }

    totalLineCrossDim += crossDim;
    maxLineMainDim = fmaxf(maxLineMainDim, mainDim);
  }

  // STEP 8: MULTI-LINE CONTENT ALIGNMENT
  if (lineCount > 1 && performLayout && !ABI11_0_0CSSValueIsUndefined(availableInnerCrossDim)) {
    const float remainingAlignContentDim = availableInnerCrossDim - totalLineCrossDim;

    float crossDimLead = 0;
    float currentLead = leadingPaddingAndBorderCross;

    const ABI11_0_0CSSAlign alignContent = node->style.alignContent;
    if (alignContent == ABI11_0_0CSSAlignFlexEnd) {
      currentLead += remainingAlignContentDim;
    } else if (alignContent == ABI11_0_0CSSAlignCenter) {
      currentLead += remainingAlignContentDim / 2;
    } else if (alignContent == ABI11_0_0CSSAlignStretch) {
      if (availableInnerCrossDim > totalLineCrossDim) {
        crossDimLead = (remainingAlignContentDim / lineCount);
      }
    }

    uint32_t endIndex = 0;
    for (uint32_t i = 0; i < lineCount; i++) {
      uint32_t startIndex = endIndex;
      uint32_t ii;

      // compute the line's height and find the endIndex
      float lineHeight = 0;
      for (ii = startIndex; ii < childCount; ii++) {
        const ABI11_0_0CSSNodeRef child = ABI11_0_0CSSNodeListGet(node->children, ii);

        if (child->style.positionType == ABI11_0_0CSSPositionTypeRelative) {
          if (child->lineIndex != i) {
            break;
          }

          if (isLayoutDimDefined(child, crossAxis)) {
            lineHeight = fmaxf(lineHeight,
                               child->layout.measuredDimensions[dim[crossAxis]] +
                                   getMarginAxis(child, crossAxis));
          }
        }
      }
      endIndex = ii;
      lineHeight += crossDimLead;

      if (performLayout) {
        for (ii = startIndex; ii < endIndex; ii++) {
          const ABI11_0_0CSSNodeRef child = ABI11_0_0CSSNodeListGet(node->children, ii);

          if (child->style.positionType == ABI11_0_0CSSPositionTypeRelative) {
            switch (getAlignItem(node, child)) {
              case ABI11_0_0CSSAlignFlexStart:
                child->layout.position[pos[crossAxis]] =
                    currentLead + getLeadingMargin(child, crossAxis);
                break;
              case ABI11_0_0CSSAlignFlexEnd:
                child->layout.position[pos[crossAxis]] =
                    currentLead + lineHeight - getTrailingMargin(child, crossAxis) -
                    child->layout.measuredDimensions[dim[crossAxis]];
                break;
              case ABI11_0_0CSSAlignCenter:
                childHeight = child->layout.measuredDimensions[dim[crossAxis]];
                child->layout.position[pos[crossAxis]] =
                    currentLead + (lineHeight - childHeight) / 2;
                break;
              case ABI11_0_0CSSAlignStretch:
                child->layout.position[pos[crossAxis]] =
                    currentLead + getLeadingMargin(child, crossAxis);
                // TODO(prenaux): Correctly set the height of items with indefinite
                //                (auto) crossAxis dimension.
                break;
              default:
                break;
            }
          }
        }
      }

      currentLead += lineHeight;
    }
  }

  // STEP 9: COMPUTING FINAL DIMENSIONS
  node->layout.measuredDimensions[ABI11_0_0CSSDimensionWidth] =
      boundAxis(node, ABI11_0_0CSSFlexDirectionRow, availableWidth - marginAxisRow);
  node->layout.measuredDimensions[ABI11_0_0CSSDimensionHeight] =
      boundAxis(node, ABI11_0_0CSSFlexDirectionColumn, availableHeight - marginAxisColumn);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == ABI11_0_0CSSMeasureModeUndefined) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[mainAxis]] = boundAxis(node, mainAxis, maxLineMainDim);
  } else if (measureModeMainDim == ABI11_0_0CSSMeasureModeAtMost) {
    node->layout.measuredDimensions[dim[mainAxis]] =
        fmaxf(fminf(availableInnerMainDim + paddingAndBorderAxisMain,
                    boundAxisWithinMinAndMax(node, mainAxis, maxLineMainDim)),
              paddingAndBorderAxisMain);
  }

  if (measureModeCrossDim == ABI11_0_0CSSMeasureModeUndefined) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[crossAxis]] =
        boundAxis(node, crossAxis, totalLineCrossDim + paddingAndBorderAxisCross);
  } else if (measureModeCrossDim == ABI11_0_0CSSMeasureModeAtMost) {
    node->layout.measuredDimensions[dim[crossAxis]] =
        fmaxf(fminf(availableInnerCrossDim + paddingAndBorderAxisCross,
                    boundAxisWithinMinAndMax(node,
                                             crossAxis,
                                             totalLineCrossDim + paddingAndBorderAxisCross)),
              paddingAndBorderAxisCross);
  }

  // STEP 10: SIZING AND POSITIONING ABSOLUTE CHILDREN
  currentAbsoluteChild = firstAbsoluteChild;
  while (currentAbsoluteChild != NULL) {
    // Now that we know the bounds of the container, perform layout again on the
    // absolutely-positioned children.
    if (performLayout) {
      childWidth = ABI11_0_0CSSUndefined;
      childHeight = ABI11_0_0CSSUndefined;

      if (isStyleDimDefined(currentAbsoluteChild, ABI11_0_0CSSFlexDirectionRow)) {
        childWidth = currentAbsoluteChild->style.dimensions[ABI11_0_0CSSDimensionWidth] +
                     getMarginAxis(currentAbsoluteChild, ABI11_0_0CSSFlexDirectionRow);
      } else {
        // If the child doesn't have a specified width, compute the width based
        // on the left/right
        // offsets if they're defined.
        if (isLeadingPosDefined(currentAbsoluteChild, ABI11_0_0CSSFlexDirectionRow) &&
            isTrailingPosDefined(currentAbsoluteChild, ABI11_0_0CSSFlexDirectionRow)) {
          childWidth = node->layout.measuredDimensions[ABI11_0_0CSSDimensionWidth] -
                       (getLeadingBorder(node, ABI11_0_0CSSFlexDirectionRow) +
                        getTrailingBorder(node, ABI11_0_0CSSFlexDirectionRow)) -
                       (getLeadingPosition(currentAbsoluteChild, ABI11_0_0CSSFlexDirectionRow) +
                        getTrailingPosition(currentAbsoluteChild, ABI11_0_0CSSFlexDirectionRow));
          childWidth = boundAxis(currentAbsoluteChild, ABI11_0_0CSSFlexDirectionRow, childWidth);
        }
      }

      if (isStyleDimDefined(currentAbsoluteChild, ABI11_0_0CSSFlexDirectionColumn)) {
        childHeight = currentAbsoluteChild->style.dimensions[ABI11_0_0CSSDimensionHeight] +
                      getMarginAxis(currentAbsoluteChild, ABI11_0_0CSSFlexDirectionColumn);
      } else {
        // If the child doesn't have a specified height, compute the height
        // based on the top/bottom
        // offsets if they're defined.
        if (isLeadingPosDefined(currentAbsoluteChild, ABI11_0_0CSSFlexDirectionColumn) &&
            isTrailingPosDefined(currentAbsoluteChild, ABI11_0_0CSSFlexDirectionColumn)) {
          childHeight = node->layout.measuredDimensions[ABI11_0_0CSSDimensionHeight] -
                        (getLeadingBorder(node, ABI11_0_0CSSFlexDirectionColumn) +
                         getTrailingBorder(node, ABI11_0_0CSSFlexDirectionColumn)) -
                        (getLeadingPosition(currentAbsoluteChild, ABI11_0_0CSSFlexDirectionColumn) +
                         getTrailingPosition(currentAbsoluteChild, ABI11_0_0CSSFlexDirectionColumn));
          childHeight = boundAxis(currentAbsoluteChild, ABI11_0_0CSSFlexDirectionColumn, childHeight);
        }
      }

      // If we're still missing one or the other dimension, measure the content.
      if (ABI11_0_0CSSValueIsUndefined(childWidth) || ABI11_0_0CSSValueIsUndefined(childHeight)) {
        childWidthMeasureMode =
            ABI11_0_0CSSValueIsUndefined(childWidth) ? ABI11_0_0CSSMeasureModeUndefined : ABI11_0_0CSSMeasureModeExactly;
        childHeightMeasureMode =
            ABI11_0_0CSSValueIsUndefined(childHeight) ? ABI11_0_0CSSMeasureModeUndefined : ABI11_0_0CSSMeasureModeExactly;

        // According to the spec, if the main size is not definite and the
        // child's inline axis is parallel to the main axis (i.e. it's
        // horizontal), the child should be sized using "UNDEFINED" in
        // the main size. Otherwise use "AT_MOST" in the cross axis.
        if (!isMainAxisRow && ABI11_0_0CSSValueIsUndefined(childWidth) &&
            !ABI11_0_0CSSValueIsUndefined(availableInnerWidth)) {
          childWidth = availableInnerWidth;
          childWidthMeasureMode = ABI11_0_0CSSMeasureModeAtMost;
        }

        layoutNodeInternal(currentAbsoluteChild,
                           childWidth,
                           childHeight,
                           direction,
                           childWidthMeasureMode,
                           childHeightMeasureMode,
                           false,
                           "abs-measure");
        childWidth = currentAbsoluteChild->layout.measuredDimensions[ABI11_0_0CSSDimensionWidth] +
                     getMarginAxis(currentAbsoluteChild, ABI11_0_0CSSFlexDirectionRow);
        childHeight = currentAbsoluteChild->layout.measuredDimensions[ABI11_0_0CSSDimensionHeight] +
                      getMarginAxis(currentAbsoluteChild, ABI11_0_0CSSFlexDirectionColumn);
      }

      layoutNodeInternal(currentAbsoluteChild,
                         childWidth,
                         childHeight,
                         direction,
                         ABI11_0_0CSSMeasureModeExactly,
                         ABI11_0_0CSSMeasureModeExactly,
                         true,
                         "abs-layout");

      if (isTrailingPosDefined(currentAbsoluteChild, mainAxis) &&
          !isLeadingPosDefined(currentAbsoluteChild, mainAxis)) {
        currentAbsoluteChild->layout.position[leading[mainAxis]] =
            node->layout.measuredDimensions[dim[mainAxis]] -
            currentAbsoluteChild->layout.measuredDimensions[dim[mainAxis]] -
            getTrailingPosition(currentAbsoluteChild, mainAxis);
      }

      if (isTrailingPosDefined(currentAbsoluteChild, crossAxis) &&
          !isLeadingPosDefined(currentAbsoluteChild, crossAxis)) {
        currentAbsoluteChild->layout.position[leading[crossAxis]] =
            node->layout.measuredDimensions[dim[crossAxis]] -
            currentAbsoluteChild->layout.measuredDimensions[dim[crossAxis]] -
            getTrailingPosition(currentAbsoluteChild, crossAxis);
      }
    }

    currentAbsoluteChild = currentAbsoluteChild->nextChild;
  }

  // STEP 11: SETTING TRAILING POSITIONS FOR CHILDREN
  if (performLayout) {
    const bool needsMainTrailingPos =
        mainAxis == ABI11_0_0CSSFlexDirectionRowReverse || mainAxis == ABI11_0_0CSSFlexDirectionColumnReverse;
    const bool needsCrossTrailingPos =
        ABI11_0_0CSSFlexDirectionRowReverse || crossAxis == ABI11_0_0CSSFlexDirectionColumnReverse;

    // Set trailing position if necessary.
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (uint32_t i = 0; i < childCount; i++) {
        const ABI11_0_0CSSNodeRef child = ABI11_0_0CSSNodeListGet(node->children, i);

        if (needsMainTrailingPos) {
          setTrailingPosition(node, child, mainAxis);
        }

        if (needsCrossTrailingPos) {
          setTrailingPosition(node, child, crossAxis);
        }
      }
    }
  }
}

uint32_t gDepth = 0;
bool gPrintTree = false;
bool gPrintChanges = false;
bool gPrintSkips = false;

static const char *spacer = "                                                            ";

static const char *getSpacer(const unsigned long level) {
  const unsigned long spacerLen = strlen(spacer);
  if (level > spacerLen) {
    return &spacer[0];
  } else {
    return &spacer[spacerLen - level];
  }
}

static const char *getModeName(const ABI11_0_0CSSMeasureMode mode, const bool performLayout) {
  const char *kMeasureModeNames[ABI11_0_0CSSMeasureModeCount] = {"UNDEFINED", "ABI11_0_0EXACTLY", "AT_MOST"};
  const char *kLayoutModeNames[ABI11_0_0CSSMeasureModeCount] = {"LAY_UNDEFINED",
                                                       "LAY_EXACTLY",
                                                       "LAY_AT_"
                                                       "MOST"};

  if (mode >= ABI11_0_0CSSMeasureModeCount) {
    return "";
  }

  return performLayout ? kLayoutModeNames[mode] : kMeasureModeNames[mode];
}

static bool canUseCachedMeasurement(const bool isTextNode,
                                    const float availableWidth,
                                    const float availableHeight,
                                    const float marginRow,
                                    const float marginColumn,
                                    const ABI11_0_0CSSMeasureMode widthMeasureMode,
                                    const ABI11_0_0CSSMeasureMode heightMeasureMode,
                                    ABI11_0_0CSSCachedMeasurement cachedLayout) {
  const bool isHeightSame = (cachedLayout.heightMeasureMode == ABI11_0_0CSSMeasureModeUndefined &&
                             heightMeasureMode == ABI11_0_0CSSMeasureModeUndefined) ||
                            (cachedLayout.heightMeasureMode == heightMeasureMode &&
                             eq(cachedLayout.availableHeight, availableHeight));

  const bool isWidthSame = (cachedLayout.widthMeasureMode == ABI11_0_0CSSMeasureModeUndefined &&
                            widthMeasureMode == ABI11_0_0CSSMeasureModeUndefined) ||
                           (cachedLayout.widthMeasureMode == widthMeasureMode &&
                            eq(cachedLayout.availableWidth, availableWidth));

  if (isHeightSame && isWidthSame) {
    return true;
  }

  const bool isHeightValid = (cachedLayout.heightMeasureMode == ABI11_0_0CSSMeasureModeUndefined &&
                              heightMeasureMode == ABI11_0_0CSSMeasureModeAtMost &&
                              cachedLayout.computedHeight <= (availableHeight - marginColumn)) ||
                             (heightMeasureMode == ABI11_0_0CSSMeasureModeExactly &&
                              eq(cachedLayout.computedHeight, availableHeight - marginColumn));

  if (isWidthSame && isHeightValid) {
    return true;
  }

  const bool isWidthValid = (cachedLayout.widthMeasureMode == ABI11_0_0CSSMeasureModeUndefined &&
                             widthMeasureMode == ABI11_0_0CSSMeasureModeAtMost &&
                             cachedLayout.computedWidth <= (availableWidth - marginRow)) ||
                            (widthMeasureMode == ABI11_0_0CSSMeasureModeExactly &&
                             eq(cachedLayout.computedWidth, availableWidth - marginRow));

  if (isHeightSame && isWidthValid) {
    return true;
  }

  if (isHeightValid && isWidthValid) {
    return true;
  }

  // We know this to be text so we can apply some more specialized heuristics.
  if (isTextNode) {
    if (isWidthSame) {
      if (heightMeasureMode == ABI11_0_0CSSMeasureModeUndefined) {
        // Width is the same and height is not restricted. Re-use cahced value.
        return true;
      }

      if (heightMeasureMode == ABI11_0_0CSSMeasureModeAtMost &&
          cachedLayout.computedHeight < (availableHeight - marginColumn)) {
        // Width is the same and height restriction is greater than the cached
        // height. Re-use cached
        // value.
        return true;
      }

      // Width is the same but height restriction imposes smaller height than
      // previously measured.
      // Update the cached value to respect the new height restriction.
      cachedLayout.computedHeight = availableHeight - marginColumn;
      return true;
    }

    if (cachedLayout.widthMeasureMode == ABI11_0_0CSSMeasureModeUndefined) {
      if (widthMeasureMode == ABI11_0_0CSSMeasureModeUndefined ||
          (widthMeasureMode == ABI11_0_0CSSMeasureModeAtMost &&
           cachedLayout.computedWidth <= (availableWidth - marginRow))) {
        // Previsouly this text was measured with no width restriction, if width
        // is now restricted
        // but to a larger value than the previsouly measured width we can
        // re-use the measurement
        // as we know it will fit.
        return true;
      }
    }
  }

  return false;
}

//
// This is a wrapper around the layoutNodeImpl function. It determines
// whether the layout request is redundant and can be skipped.
//
// Parameters:
//  Input parameters are the same as layoutNodeImpl (see above)
//  Return parameter is true if layout was performed, false if skipped
//
bool layoutNodeInternal(const ABI11_0_0CSSNodeRef node,
                        const float availableWidth,
                        const float availableHeight,
                        const ABI11_0_0CSSDirection parentDirection,
                        const ABI11_0_0CSSMeasureMode widthMeasureMode,
                        const ABI11_0_0CSSMeasureMode heightMeasureMode,
                        const bool performLayout,
                        const char *reason) {
  ABI11_0_0CSSLayout *layout = &node->layout;

  gDepth++;

  const bool needToVisitNode =
      (node->isDirty && layout->generationCount != gCurrentGenerationCount) ||
      layout->lastParentDirection != parentDirection;

  if (needToVisitNode) {
    // Invalidate the cached results.
    layout->nextCachedMeasurementsIndex = 0;
    layout->cachedLayout.widthMeasureMode = (ABI11_0_0CSSMeasureMode) -1;
    layout->cachedLayout.heightMeasureMode = (ABI11_0_0CSSMeasureMode) -1;
  }

  ABI11_0_0CSSCachedMeasurement *cachedResults = NULL;

  // Determine whether the results are already cached. We maintain a separate
  // cache for layouts and measurements. A layout operation modifies the
  // positions
  // and dimensions for nodes in the subtree. The algorithm assumes that each
  // node
  // gets layed out a maximum of one time per tree layout, but multiple
  // measurements
  // may be required to resolve all of the flex dimensions.
  // We handle nodes with measure functions specially here because they are the
  // most
  // expensive to measure, so it's worth avoiding redundant measurements if at
  // all possible.
  if (node->measure) {
    const float marginAxisRow = getMarginAxis(node, ABI11_0_0CSSFlexDirectionRow);
    const float marginAxisColumn = getMarginAxis(node, ABI11_0_0CSSFlexDirectionColumn);

    // First, try to use the layout cache.
    if (canUseCachedMeasurement(node->isTextNode,
                                availableWidth,
                                availableHeight,
                                marginAxisRow,
                                marginAxisColumn,
                                widthMeasureMode,
                                heightMeasureMode,
                                layout->cachedLayout)) {
      cachedResults = &layout->cachedLayout;
    } else {
      // Try to use the measurement cache.
      for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
        if (canUseCachedMeasurement(node->isTextNode,
                                    availableWidth,
                                    availableHeight,
                                    marginAxisRow,
                                    marginAxisColumn,
                                    widthMeasureMode,
                                    heightMeasureMode,
                                    layout->cachedMeasurements[i])) {
          cachedResults = &layout->cachedMeasurements[i];
          break;
        }
      }
    }
  } else if (performLayout) {
    if (eq(layout->cachedLayout.availableWidth, availableWidth) &&
        eq(layout->cachedLayout.availableHeight, availableHeight) &&
        layout->cachedLayout.widthMeasureMode == widthMeasureMode &&
        layout->cachedLayout.heightMeasureMode == heightMeasureMode) {
      cachedResults = &layout->cachedLayout;
    }
  } else {
    for (uint32_t i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
      if (eq(layout->cachedMeasurements[i].availableWidth, availableWidth) &&
          eq(layout->cachedMeasurements[i].availableHeight, availableHeight) &&
          layout->cachedMeasurements[i].widthMeasureMode == widthMeasureMode &&
          layout->cachedMeasurements[i].heightMeasureMode == heightMeasureMode) {
        cachedResults = &layout->cachedMeasurements[i];
        break;
      }
    }
  }

  if (!needToVisitNode && cachedResults != NULL) {
    layout->measuredDimensions[ABI11_0_0CSSDimensionWidth] = cachedResults->computedWidth;
    layout->measuredDimensions[ABI11_0_0CSSDimensionHeight] = cachedResults->computedHeight;

    if (gPrintChanges && gPrintSkips) {
      printf("%s%d.{[skipped] ", getSpacer(gDepth), gDepth);
      if (node->print) {
        node->print(node->context);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f => d: (%f, %f) %s\n",
             getModeName(widthMeasureMode, performLayout),
             getModeName(heightMeasureMode, performLayout),
             availableWidth,
             availableHeight,
             cachedResults->computedWidth,
             cachedResults->computedHeight,
             reason);
    }
  } else {
    if (gPrintChanges) {
      printf("%s%d.{%s", getSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node->context);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f %s\n",
             getModeName(widthMeasureMode, performLayout),
             getModeName(heightMeasureMode, performLayout),
             availableWidth,
             availableHeight,
             reason);
    }

    layoutNodeImpl(node,
                   availableWidth,
                   availableHeight,
                   parentDirection,
                   widthMeasureMode,
                   heightMeasureMode,
                   performLayout);

    if (gPrintChanges) {
      printf("%s%d.}%s", getSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node->context);
      }
      printf("wm: %s, hm: %s, d: (%f, %f) %s\n",
             getModeName(widthMeasureMode, performLayout),
             getModeName(heightMeasureMode, performLayout),
             layout->measuredDimensions[ABI11_0_0CSSDimensionWidth],
             layout->measuredDimensions[ABI11_0_0CSSDimensionHeight],
             reason);
    }

    layout->lastParentDirection = parentDirection;

    if (cachedResults == NULL) {
      if (layout->nextCachedMeasurementsIndex == ABI11_0_0CSS_MAX_CACHED_RESULT_COUNT) {
        if (gPrintChanges) {
          printf("Out of cache entries!\n");
        }
        layout->nextCachedMeasurementsIndex = 0;
      }

      ABI11_0_0CSSCachedMeasurement *newCacheEntry;
      if (performLayout) {
        // Use the single layout cache entry.
        newCacheEntry = &layout->cachedLayout;
      } else {
        // Allocate a new measurement cache entry.
        newCacheEntry = &layout->cachedMeasurements[layout->nextCachedMeasurementsIndex];
        layout->nextCachedMeasurementsIndex++;
      }

      newCacheEntry->availableWidth = availableWidth;
      newCacheEntry->availableHeight = availableHeight;
      newCacheEntry->widthMeasureMode = widthMeasureMode;
      newCacheEntry->heightMeasureMode = heightMeasureMode;
      newCacheEntry->computedWidth = layout->measuredDimensions[ABI11_0_0CSSDimensionWidth];
      newCacheEntry->computedHeight = layout->measuredDimensions[ABI11_0_0CSSDimensionHeight];
    }
  }

  if (performLayout) {
    node->layout.dimensions[ABI11_0_0CSSDimensionWidth] = node->layout.measuredDimensions[ABI11_0_0CSSDimensionWidth];
    node->layout.dimensions[ABI11_0_0CSSDimensionHeight] =
        node->layout.measuredDimensions[ABI11_0_0CSSDimensionHeight];
    node->hasNewLayout = true;
    node->isDirty = false;
  }

  gDepth--;
  layout->generationCount = gCurrentGenerationCount;
  return (needToVisitNode || cachedResults == NULL);
}

void ABI11_0_0CSSNodeCalculateLayout(const ABI11_0_0CSSNodeRef node,
                            const float availableWidth,
                            const float availableHeight,
                            const ABI11_0_0CSSDirection parentDirection) {
  // Increment the generation count. This will force the recursive routine to
  // visit
  // all dirty nodes at least once. Subsequent visits will be skipped if the
  // input
  // parameters don't change.
  gCurrentGenerationCount++;

  float width = availableWidth;
  float height = availableHeight;
  ABI11_0_0CSSMeasureMode widthMeasureMode = ABI11_0_0CSSMeasureModeUndefined;
  ABI11_0_0CSSMeasureMode heightMeasureMode = ABI11_0_0CSSMeasureModeUndefined;

  if (!ABI11_0_0CSSValueIsUndefined(width)) {
    widthMeasureMode = ABI11_0_0CSSMeasureModeExactly;
  } else if (isStyleDimDefined(node, ABI11_0_0CSSFlexDirectionRow)) {
    width =
        node->style.dimensions[dim[ABI11_0_0CSSFlexDirectionRow]] + getMarginAxis(node, ABI11_0_0CSSFlexDirectionRow);
    widthMeasureMode = ABI11_0_0CSSMeasureModeExactly;
  } else if (node->style.maxDimensions[ABI11_0_0CSSDimensionWidth] >= 0.0) {
    width = node->style.maxDimensions[ABI11_0_0CSSDimensionWidth];
    widthMeasureMode = ABI11_0_0CSSMeasureModeAtMost;
  }

  if (!ABI11_0_0CSSValueIsUndefined(height)) {
    heightMeasureMode = ABI11_0_0CSSMeasureModeExactly;
  } else if (isStyleDimDefined(node, ABI11_0_0CSSFlexDirectionColumn)) {
    height = node->style.dimensions[dim[ABI11_0_0CSSFlexDirectionColumn]] +
             getMarginAxis(node, ABI11_0_0CSSFlexDirectionColumn);
    heightMeasureMode = ABI11_0_0CSSMeasureModeExactly;
  } else if (node->style.maxDimensions[ABI11_0_0CSSDimensionHeight] >= 0.0) {
    height = node->style.maxDimensions[ABI11_0_0CSSDimensionHeight];
    heightMeasureMode = ABI11_0_0CSSMeasureModeAtMost;
  }

  if (layoutNodeInternal(node,
                         width,
                         height,
                         parentDirection,
                         widthMeasureMode,
                         heightMeasureMode,
                         true,
                         "initia"
                         "l")) {
    setPosition(node, node->layout.direction);

    if (gPrintTree) {
      ABI11_0_0CSSNodePrint(node, ABI11_0_0CSSPrintOptionsLayout | ABI11_0_0CSSPrintOptionsChildren | ABI11_0_0CSSPrintOptionsStyle);
    }
  }
}

#ifdef ABI11_0_0CSS_ASSERT_FAIL_ENABLED
static ABI11_0_0CSSAssertFailFunc gAssertFailFunc;

void ABI11_0_0CSSAssertSetFailFunc(ABI11_0_0CSSAssertFailFunc func) {
  gAssertFailFunc = func;
}

void ABI11_0_0CSSAssertFail(const char *message) {
  if (gAssertFailFunc) {
    (*gAssertFailFunc)(message);
  }
}
#endif
