/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <assert.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "ABI8_0_0CSSLayout-internal.h"

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

#define POSITIVE_FLEX_IS_AUTO 0

ABI8_0_0CSSNodeRef ABI8_0_0CSSNodeNew() {
  ABI8_0_0CSSNodeRef node = calloc(1, sizeof(ABI8_0_0CSSNode));
  assert(node != NULL);

  node->children = ABI8_0_0CSSNodeListNew(4);
  ABI8_0_0CSSNodeInit(node);
  return node;
}

void ABI8_0_0CSSNodeFree(ABI8_0_0CSSNodeRef node) {
  ABI8_0_0CSSNodeListFree(node->children);
  free(node);
}

void ABI8_0_0CSSNodeInit(ABI8_0_0CSSNodeRef node) {
  node->style.alignItems = ABI8_0_0CSSAlignStretch;
  node->style.alignContent = ABI8_0_0CSSAlignFlexStart;

  node->style.direction = ABI8_0_0CSSDirectionInherit;
  node->style.flexDirection = ABI8_0_0CSSFlexDirectionColumn;

  node->style.overflow = ABI8_0_0CSSOverflowVisible;

  // Some of the fields default to undefined and not 0
  node->style.dimensions[ABI8_0_0CSSDimensionWidth] = ABI8_0_0CSSUndefined;
  node->style.dimensions[ABI8_0_0CSSDimensionHeight] = ABI8_0_0CSSUndefined;

  node->style.minDimensions[ABI8_0_0CSSDimensionWidth] = ABI8_0_0CSSUndefined;
  node->style.minDimensions[ABI8_0_0CSSDimensionHeight] = ABI8_0_0CSSUndefined;

  node->style.maxDimensions[ABI8_0_0CSSDimensionWidth] = ABI8_0_0CSSUndefined;
  node->style.maxDimensions[ABI8_0_0CSSDimensionHeight] = ABI8_0_0CSSUndefined;

  node->style.position[ABI8_0_0CSSPositionLeft] = ABI8_0_0CSSUndefined;
  node->style.position[ABI8_0_0CSSPositionTop] = ABI8_0_0CSSUndefined;
  node->style.position[ABI8_0_0CSSPositionRight] = ABI8_0_0CSSUndefined;
  node->style.position[ABI8_0_0CSSPositionBottom] = ABI8_0_0CSSUndefined;

  node->style.margin[ABI8_0_0CSSPositionStart] = ABI8_0_0CSSUndefined;
  node->style.margin[ABI8_0_0CSSPositionEnd] = ABI8_0_0CSSUndefined;
  node->style.padding[ABI8_0_0CSSPositionStart] = ABI8_0_0CSSUndefined;
  node->style.padding[ABI8_0_0CSSPositionEnd] = ABI8_0_0CSSUndefined;
  node->style.border[ABI8_0_0CSSPositionStart] = ABI8_0_0CSSUndefined;
  node->style.border[ABI8_0_0CSSPositionEnd] = ABI8_0_0CSSUndefined;

  node->layout.dimensions[ABI8_0_0CSSDimensionWidth] = ABI8_0_0CSSUndefined;
  node->layout.dimensions[ABI8_0_0CSSDimensionHeight] = ABI8_0_0CSSUndefined;

  // Such that the comparison is always going to be false
  node->layout.lastParentDirection = (ABI8_0_0CSSDirection)-1;
  node->shouldUpdate = true;
  node->layout.nextCachedMeasurementsIndex = 0;

  node->layout.measuredDimensions[ABI8_0_0CSSDimensionWidth] = ABI8_0_0CSSUndefined;
  node->layout.measuredDimensions[ABI8_0_0CSSDimensionHeight] = ABI8_0_0CSSUndefined;
  node->layout.cached_layout.widthMeasureMode = (ABI8_0_0CSSMeasureMode)-1;
  node->layout.cached_layout.heightMeasureMode = (ABI8_0_0CSSMeasureMode)-1;
}

void ABI8_0_0CSSNodeInsertChild(ABI8_0_0CSSNodeRef node, ABI8_0_0CSSNodeRef child, unsigned int index) {
  ABI8_0_0CSSNodeListInsert(node->children, child, index);
}

void ABI8_0_0CSSNodeRemoveChild(ABI8_0_0CSSNodeRef node, ABI8_0_0CSSNodeRef child) {
  ABI8_0_0CSSNodeListDelete(node->children, child);
}

ABI8_0_0CSSNodeRef ABI8_0_0CSSNodeGetChild(ABI8_0_0CSSNodeRef node, unsigned int index) {
  return ABI8_0_0CSSNodeListGet(node->children, index);
}

unsigned int ABI8_0_0CSSNodeChildCount(ABI8_0_0CSSNodeRef node) {
  return ABI8_0_0CSSNodeListCount(node->children);
}

#define ABI8_0_0CSS_NODE_PROPERTY_IMPL(type, name, paramName, instanceName) \
void ABI8_0_0CSSNodeSet##name(ABI8_0_0CSSNodeRef node, type paramName) { \
  node->instanceName = paramName;\
} \
\
type ABI8_0_0CSSNodeGet##name(ABI8_0_0CSSNodeRef node) { \
  return node->instanceName;\
} \

#define ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(type, name, paramName, instanceName) \
void ABI8_0_0CSSNodeStyleSet##name(ABI8_0_0CSSNodeRef node, type paramName) { \
  node->style.instanceName = paramName;\
} \
\
type ABI8_0_0CSSNodeStyleGet##name(ABI8_0_0CSSNodeRef node) { \
  return node->style.instanceName;\
} \

#define ABI8_0_0CSS_NODE_LAYOUT_PROPERTY_IMPL(type, name, instanceName) \
type ABI8_0_0CSSNodeLayoutGet##name(ABI8_0_0CSSNodeRef node) { \
  return node->layout.instanceName;\
} \

ABI8_0_0CSS_NODE_PROPERTY_IMPL(void*, Context, context, context);
ABI8_0_0CSS_NODE_PROPERTY_IMPL(ABI8_0_0CSSMeasureFunc, MeasureFunc, measureFunc, measure);
ABI8_0_0CSS_NODE_PROPERTY_IMPL(ABI8_0_0CSSIsDirtyFunc, IsDirtyFunc, isDirtyFunc, isDirty);
ABI8_0_0CSS_NODE_PROPERTY_IMPL(ABI8_0_0CSSPrintFunc, PrintFunc, printFunc, print);
ABI8_0_0CSS_NODE_PROPERTY_IMPL(bool, IsTextnode, isTextNode, isTextNode);
ABI8_0_0CSS_NODE_PROPERTY_IMPL(bool, ShouldUpdate, shouldUpdate, shouldUpdate);

ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI8_0_0CSSDirection, Direction, direction, direction);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI8_0_0CSSFlexDirection, FlexDirection, flexDirection, flexDirection);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI8_0_0CSSJustify, JustifyContent, justifyContent, justifyContent);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI8_0_0CSSAlign, AlignContent, alignContent, alignContent);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI8_0_0CSSAlign, AlignItems, alignItems, alignItems);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI8_0_0CSSAlign, AlignSelf, alignSelf, alignSelf);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI8_0_0CSSPositionType, PositionType, positionType, positionType);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI8_0_0CSSWrapType, FlexWrap, flexWrap, flexWrap);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(ABI8_0_0CSSOverflow, Overflow, overflow, overflow);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, Flex, flex, flex);

ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, PositionLeft, positionLeft, position[ABI8_0_0CSSPositionLeft]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, PositionTop, positionTop, position[ABI8_0_0CSSPositionTop]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, PositionRight, positionRight, position[ABI8_0_0CSSPositionRight]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, PositionBottom, positionBottom, position[ABI8_0_0CSSPositionBottom]);

ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, MarginLeft, marginLeft, margin[ABI8_0_0CSSPositionLeft]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, MarginTop, marginTop, margin[ABI8_0_0CSSPositionTop]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, MarginRight, marginRight, margin[ABI8_0_0CSSPositionRight]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, MarginBottom, marginBottom, margin[ABI8_0_0CSSPositionBottom]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, MarginStart, marginStart, margin[ABI8_0_0CSSPositionStart]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, MarginEnd, marginEnd, margin[ABI8_0_0CSSPositionEnd]);

ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, PaddingLeft, paddingLeft, padding[ABI8_0_0CSSPositionLeft]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, PaddingTop, paddingTop, padding[ABI8_0_0CSSPositionTop]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, PaddingRight, paddingRight, padding[ABI8_0_0CSSPositionRight]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, PaddingBottom, paddingBottom, padding[ABI8_0_0CSSPositionBottom]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, PaddingStart, paddingStart, padding[ABI8_0_0CSSPositionStart]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, PaddingEnd, paddingEnd, padding[ABI8_0_0CSSPositionEnd]);

ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, BorderLeft, borderLeft, border[ABI8_0_0CSSPositionLeft]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, BorderTop, borderTop, border[ABI8_0_0CSSPositionTop]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, BorderRight, borderRight, border[ABI8_0_0CSSPositionRight]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, BorderBottom, borderBottom, border[ABI8_0_0CSSPositionBottom]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, BorderStart, borderStart, border[ABI8_0_0CSSPositionStart]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, BorderEnd, BorderEnd, border[ABI8_0_0CSSPositionEnd]);

ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, Width, width, dimensions[ABI8_0_0CSSDimensionWidth]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, Height, height, dimensions[ABI8_0_0CSSDimensionHeight]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, MinWidth, minWidth, minDimensions[ABI8_0_0CSSDimensionWidth]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, MinHeight, minHeight, minDimensions[ABI8_0_0CSSDimensionHeight]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, MaxWidth, maxWidth, maxDimensions[ABI8_0_0CSSDimensionWidth]);
ABI8_0_0CSS_NODE_STYLE_PROPERTY_IMPL(float, MaxHeight, maxHeight, maxDimensions[ABI8_0_0CSSDimensionHeight]);

ABI8_0_0CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Left, position[ABI8_0_0CSSPositionLeft]);
ABI8_0_0CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Top, position[ABI8_0_0CSSPositionTop]);
ABI8_0_0CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Right, position[ABI8_0_0CSSPositionRight]);
ABI8_0_0CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Bottom, position[ABI8_0_0CSSPositionBottom]);
ABI8_0_0CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Width, dimensions[ABI8_0_0CSSDimensionWidth]);
ABI8_0_0CSS_NODE_LAYOUT_PROPERTY_IMPL(float, Height, dimensions[ABI8_0_0CSSDimensionHeight]);

int gCurrentGenerationCount = 0;

bool layoutNodeInternal(ABI8_0_0CSSNode* node, float availableWidth, float availableHeight, ABI8_0_0CSSDirection parentDirection,
  ABI8_0_0CSSMeasureMode widthMeasureMode, ABI8_0_0CSSMeasureMode heightMeasureMode, bool performLayout, char* reason);

bool isUndefined(float value) {
  return isnan(value);
}

static bool eq(float a, float b) {
  if (isUndefined(a)) {
    return isUndefined(b);
  }
  return fabs(a - b) < 0.0001;
}

static void indent(int n) {
  for (int i = 0; i < n; ++i) {
    printf("  ");
  }
}

static void print_number_0(const char* str, float number) {
  if (!eq(number, 0)) {
    printf("%s: %g, ", str, number);
  }
}

static void print_number_nan(const char* str, float number) {
  if (!isnan(number)) {
    printf("%s: %g, ", str, number);
  }
}

static bool four_equal(float four[4]) {
  return
    eq(four[0], four[1]) &&
    eq(four[0], four[2]) &&
    eq(four[0], four[3]);
}


static void print_css_node_rec(
  ABI8_0_0CSSNode* node,
  ABI8_0_0CSSPrintOptions options,
  int level
) {
  indent(level);
  printf("{");

  if (node->print) {
    node->print(node->context);
  }

  if (options & ABI8_0_0CSSPrintOptionsLayout) {
    printf("layout: {");
    printf("width: %g, ", node->layout.dimensions[ABI8_0_0CSSDimensionWidth]);
    printf("height: %g, ", node->layout.dimensions[ABI8_0_0CSSDimensionHeight]);
    printf("top: %g, ", node->layout.position[ABI8_0_0CSSPositionTop]);
    printf("left: %g", node->layout.position[ABI8_0_0CSSPositionLeft]);
    printf("}, ");
  }

  if (options & ABI8_0_0CSSPrintOptionsStyle) {
    if (node->style.flexDirection == ABI8_0_0CSSFlexDirectionColumn) {
      printf("flexDirection: 'column', ");
    } else if (node->style.flexDirection == ABI8_0_0CSSFlexDirectionColumnReverse) {
      printf("flexDirection: 'column-reverse', ");
    } else if (node->style.flexDirection == ABI8_0_0CSSFlexDirectionRow) {
      printf("flexDirection: 'row', ");
    } else if (node->style.flexDirection == ABI8_0_0CSSFlexDirectionRowReverse) {
      printf("flexDirection: 'row-reverse', ");
    }

    if (node->style.justifyContent == ABI8_0_0CSSJustifyCenter) {
      printf("justifyContent: 'center', ");
    } else if (node->style.justifyContent == ABI8_0_0CSSJustifyFlexEnd) {
      printf("justifyContent: 'flex-end', ");
    } else if (node->style.justifyContent == ABI8_0_0CSSJustifySpaceAround) {
      printf("justifyContent: 'space-around', ");
    } else if (node->style.justifyContent == ABI8_0_0CSSJustifySpaceBetween) {
      printf("justifyContent: 'space-between', ");
    }

    if (node->style.alignItems == ABI8_0_0CSSAlignCenter) {
      printf("alignItems: 'center', ");
    } else if (node->style.alignItems == ABI8_0_0CSSAlignFlexEnd) {
      printf("alignItems: 'flex-end', ");
    } else if (node->style.alignItems == ABI8_0_0CSSAlignStretch) {
      printf("alignItems: 'stretch', ");
    }

    if (node->style.alignContent == ABI8_0_0CSSAlignCenter) {
      printf("alignContent: 'center', ");
    } else if (node->style.alignContent == ABI8_0_0CSSAlignFlexEnd) {
      printf("alignContent: 'flex-end', ");
    } else if (node->style.alignContent == ABI8_0_0CSSAlignStretch) {
      printf("alignContent: 'stretch', ");
    }

    if (node->style.alignSelf == ABI8_0_0CSSAlignFlexStart) {
      printf("alignSelf: 'flex-start', ");
    } else if (node->style.alignSelf == ABI8_0_0CSSAlignCenter) {
      printf("alignSelf: 'center', ");
    } else if (node->style.alignSelf == ABI8_0_0CSSAlignFlexEnd) {
      printf("alignSelf: 'flex-end', ");
    } else if (node->style.alignSelf == ABI8_0_0CSSAlignStretch) {
      printf("alignSelf: 'stretch', ");
    }

    print_number_nan("flex", node->style.flex);

    if (node->style.overflow == ABI8_0_0CSSOverflowHidden) {
      printf("overflow: 'hidden', ");
    } else if (node->style.overflow == ABI8_0_0CSSOverflowVisible) {
      printf("overflow: 'visible', ");
    }

    if (four_equal(node->style.margin)) {
      print_number_0("margin", node->style.margin[ABI8_0_0CSSPositionLeft]);
    } else {
      print_number_0("marginLeft", node->style.margin[ABI8_0_0CSSPositionLeft]);
      print_number_0("marginRight", node->style.margin[ABI8_0_0CSSPositionRight]);
      print_number_0("marginTop", node->style.margin[ABI8_0_0CSSPositionTop]);
      print_number_0("marginBottom", node->style.margin[ABI8_0_0CSSPositionBottom]);
      print_number_0("marginStart", node->style.margin[ABI8_0_0CSSPositionStart]);
      print_number_0("marginEnd", node->style.margin[ABI8_0_0CSSPositionEnd]);
    }

    if (four_equal(node->style.padding)) {
      print_number_0("padding", node->style.padding[ABI8_0_0CSSPositionLeft]);
    } else {
      print_number_0("paddingLeft", node->style.padding[ABI8_0_0CSSPositionLeft]);
      print_number_0("paddingRight", node->style.padding[ABI8_0_0CSSPositionRight]);
      print_number_0("paddingTop", node->style.padding[ABI8_0_0CSSPositionTop]);
      print_number_0("paddingBottom", node->style.padding[ABI8_0_0CSSPositionBottom]);
      print_number_0("paddingStart", node->style.padding[ABI8_0_0CSSPositionStart]);
      print_number_0("paddingEnd", node->style.padding[ABI8_0_0CSSPositionEnd]);
    }

    if (four_equal(node->style.border)) {
      print_number_0("borderWidth", node->style.border[ABI8_0_0CSSPositionLeft]);
    } else {
      print_number_0("borderLeftWidth", node->style.border[ABI8_0_0CSSPositionLeft]);
      print_number_0("borderRightWidth", node->style.border[ABI8_0_0CSSPositionRight]);
      print_number_0("borderTopWidth", node->style.border[ABI8_0_0CSSPositionTop]);
      print_number_0("borderBottomWidth", node->style.border[ABI8_0_0CSSPositionBottom]);
      print_number_0("borderStartWidth", node->style.border[ABI8_0_0CSSPositionStart]);
      print_number_0("borderEndWidth", node->style.border[ABI8_0_0CSSPositionEnd]);
    }

    print_number_nan("width", node->style.dimensions[ABI8_0_0CSSDimensionWidth]);
    print_number_nan("height", node->style.dimensions[ABI8_0_0CSSDimensionHeight]);
    print_number_nan("maxWidth", node->style.maxDimensions[ABI8_0_0CSSDimensionWidth]);
    print_number_nan("maxHeight", node->style.maxDimensions[ABI8_0_0CSSDimensionHeight]);
    print_number_nan("minWidth", node->style.minDimensions[ABI8_0_0CSSDimensionWidth]);
    print_number_nan("minHeight", node->style.minDimensions[ABI8_0_0CSSDimensionHeight]);

    if (node->style.positionType == ABI8_0_0CSSPositionTypeAbsolute) {
      printf("position: 'absolute', ");
    }

    print_number_nan("left", node->style.position[ABI8_0_0CSSPositionLeft]);
    print_number_nan("right", node->style.position[ABI8_0_0CSSPositionRight]);
    print_number_nan("top", node->style.position[ABI8_0_0CSSPositionTop]);
    print_number_nan("bottom", node->style.position[ABI8_0_0CSSPositionBottom]);
  }

  unsigned int childCount = ABI8_0_0CSSNodeListCount(node->children);
  if (options & ABI8_0_0CSSPrintOptionsChildren && childCount > 0) {
    printf("children: [\n");
    for (unsigned int i = 0; i < childCount; ++i) {
      print_css_node_rec(ABI8_0_0CSSNodeGetChild(node, i), options, level + 1);
    }
    indent(level);
    printf("]},\n");
  } else {
    printf("},\n");
  }
}

void ABI8_0_0CSSNodePrint(ABI8_0_0CSSNode* node, ABI8_0_0CSSPrintOptions options) {
  print_css_node_rec(node, options, 0);
}

static ABI8_0_0CSSPosition leading[4] = {
  /* ABI8_0_0CSSFlexDirectionColumn = */ ABI8_0_0CSSPositionTop,
  /* ABI8_0_0CSSFlexDirectionColumnReverse = */ ABI8_0_0CSSPositionBottom,
  /* ABI8_0_0CSSFlexDirectionRow = */ ABI8_0_0CSSPositionLeft,
  /* ABI8_0_0CSSFlexDirectionRowReverse = */ ABI8_0_0CSSPositionRight
};
static ABI8_0_0CSSPosition trailing[4] = {
  /* ABI8_0_0CSSFlexDirectionColumn = */ ABI8_0_0CSSPositionBottom,
  /* ABI8_0_0CSSFlexDirectionColumnReverse = */ ABI8_0_0CSSPositionTop,
  /* ABI8_0_0CSSFlexDirectionRow = */ ABI8_0_0CSSPositionRight,
  /* ABI8_0_0CSSFlexDirectionRowReverse = */ ABI8_0_0CSSPositionLeft
};
static ABI8_0_0CSSPosition pos[4] = {
  /* ABI8_0_0CSSFlexDirectionColumn = */ ABI8_0_0CSSPositionTop,
  /* ABI8_0_0CSSFlexDirectionColumnReverse = */ ABI8_0_0CSSPositionBottom,
  /* ABI8_0_0CSSFlexDirectionRow = */ ABI8_0_0CSSPositionLeft,
  /* ABI8_0_0CSSFlexDirectionRowReverse = */ ABI8_0_0CSSPositionRight
};
static ABI8_0_0CSSDimension dim[4] = {
  /* ABI8_0_0CSSFlexDirectionColumn = */ ABI8_0_0CSSDimensionHeight,
  /* ABI8_0_0CSSFlexDirectionColumnReverse = */ ABI8_0_0CSSDimensionHeight,
  /* ABI8_0_0CSSFlexDirectionRow = */ ABI8_0_0CSSDimensionWidth,
  /* ABI8_0_0CSSFlexDirectionRowReverse = */ ABI8_0_0CSSDimensionWidth
};

static bool isRowDirection(ABI8_0_0CSSFlexDirection flexDirection) {
  return flexDirection == ABI8_0_0CSSFlexDirectionRow ||
         flexDirection == ABI8_0_0CSSFlexDirectionRowReverse;
}

static bool isColumnDirection(ABI8_0_0CSSFlexDirection flexDirection) {
  return flexDirection == ABI8_0_0CSSFlexDirectionColumn ||
         flexDirection == ABI8_0_0CSSFlexDirectionColumnReverse;
}

static bool isFlexBasisAuto(ABI8_0_0CSSNode* node) {
#if POSITIVE_FLEX_IS_AUTO
  // All flex values are auto.
  (void) node;
  return true;
#else
  // A flex value > 0 implies a basis of zero.
  return node->style.flex <= 0;
#endif
}

static float getFlexGrowFactor(ABI8_0_0CSSNode* node) {
  // Flex grow is implied by positive values for flex.
  if (node->style.flex > 0) {
    return node->style.flex;
  }
  return 0;
}

static float getFlexShrinkFactor(ABI8_0_0CSSNode* node) {
#if POSITIVE_FLEX_IS_AUTO
  // A flex shrink factor of 1 is implied by non-zero values for flex.
  if (node->style.flex != 0) {
    return 1;
  }
#else
  // A flex shrink factor of 1 is implied by negative values for flex.
  if (node->style.flex < 0) {
    return 1;
  }
#endif
  return 0;
}

static float getLeadingMargin(ABI8_0_0CSSNode* node, ABI8_0_0CSSFlexDirection axis) {
  if (isRowDirection(axis) && !isUndefined(node->style.margin[ABI8_0_0CSSPositionStart])) {
    return node->style.margin[ABI8_0_0CSSPositionStart];
  }

  return node->style.margin[leading[axis]];
}

static float getTrailingMargin(ABI8_0_0CSSNode* node, ABI8_0_0CSSFlexDirection axis) {
  if (isRowDirection(axis) && !isUndefined(node->style.margin[ABI8_0_0CSSPositionEnd])) {
    return node->style.margin[ABI8_0_0CSSPositionEnd];
  }

  return node->style.margin[trailing[axis]];
}

static float getLeadingPadding(ABI8_0_0CSSNode* node, ABI8_0_0CSSFlexDirection axis) {
  if (isRowDirection(axis) &&
      !isUndefined(node->style.padding[ABI8_0_0CSSPositionStart]) &&
      node->style.padding[ABI8_0_0CSSPositionStart] >= 0) {
    return node->style.padding[ABI8_0_0CSSPositionStart];
  }

  if (node->style.padding[leading[axis]] >= 0) {
    return node->style.padding[leading[axis]];
  }

  return 0;
}

static float getTrailingPadding(ABI8_0_0CSSNode* node, ABI8_0_0CSSFlexDirection axis) {
  if (isRowDirection(axis) &&
      !isUndefined(node->style.padding[ABI8_0_0CSSPositionEnd]) &&
      node->style.padding[ABI8_0_0CSSPositionEnd] >= 0) {
    return node->style.padding[ABI8_0_0CSSPositionEnd];
  }

  if (node->style.padding[trailing[axis]] >= 0) {
    return node->style.padding[trailing[axis]];
  }

  return 0;
}

static float getLeadingBorder(ABI8_0_0CSSNode* node, ABI8_0_0CSSFlexDirection axis) {
  if (isRowDirection(axis) &&
      !isUndefined(node->style.border[ABI8_0_0CSSPositionStart]) &&
      node->style.border[ABI8_0_0CSSPositionStart] >= 0) {
    return node->style.border[ABI8_0_0CSSPositionStart];
  }

  if (node->style.border[leading[axis]] >= 0) {
    return node->style.border[leading[axis]];
  }

  return 0;
}

static float getTrailingBorder(ABI8_0_0CSSNode* node, ABI8_0_0CSSFlexDirection axis) {
  if (isRowDirection(axis) &&
      !isUndefined(node->style.border[ABI8_0_0CSSPositionEnd]) &&
      node->style.border[ABI8_0_0CSSPositionEnd] >= 0) {
    return node->style.border[ABI8_0_0CSSPositionEnd];
  }

  if (node->style.border[trailing[axis]] >= 0) {
    return node->style.border[trailing[axis]];
  }

  return 0;
}

static float getLeadingPaddingAndBorder(ABI8_0_0CSSNode* node, ABI8_0_0CSSFlexDirection axis) {
  return getLeadingPadding(node, axis) + getLeadingBorder(node, axis);
}

static float getTrailingPaddingAndBorder(ABI8_0_0CSSNode* node, ABI8_0_0CSSFlexDirection axis) {
  return getTrailingPadding(node, axis) + getTrailingBorder(node, axis);
}

static float getMarginAxis(ABI8_0_0CSSNode* node, ABI8_0_0CSSFlexDirection axis) {
  return getLeadingMargin(node, axis) + getTrailingMargin(node, axis);
}

static float getPaddingAndBorderAxis(ABI8_0_0CSSNode* node, ABI8_0_0CSSFlexDirection axis) {
  return getLeadingPaddingAndBorder(node, axis) + getTrailingPaddingAndBorder(node, axis);
}

static ABI8_0_0CSSAlign getAlignItem(ABI8_0_0CSSNode* node, ABI8_0_0CSSNode* child) {
  if (child->style.alignSelf != ABI8_0_0CSSAlignAuto) {
    return child->style.alignSelf;
  }
  return node->style.alignItems;
}

static ABI8_0_0CSSDirection resolveDirection(ABI8_0_0CSSNode* node, ABI8_0_0CSSDirection parentDirection) {
  ABI8_0_0CSSDirection direction = node->style.direction;

  if (direction == ABI8_0_0CSSDirectionInherit) {
    direction = parentDirection > ABI8_0_0CSSDirectionInherit ? parentDirection : ABI8_0_0CSSDirectionLTR;
  }

  return direction;
}

static ABI8_0_0CSSFlexDirection getFlexDirection(ABI8_0_0CSSNode* node) {
  return node->style.flexDirection;
}

static ABI8_0_0CSSFlexDirection resolveAxis(ABI8_0_0CSSFlexDirection flexDirection, ABI8_0_0CSSDirection direction) {
  if (direction == ABI8_0_0CSSDirectionRTL) {
    if (flexDirection == ABI8_0_0CSSFlexDirectionRow) {
      return ABI8_0_0CSSFlexDirectionRowReverse;
    } else if (flexDirection == ABI8_0_0CSSFlexDirectionRowReverse) {
      return ABI8_0_0CSSFlexDirectionRow;
    }
  }

  return flexDirection;
}

static ABI8_0_0CSSFlexDirection getCrossFlexDirection(ABI8_0_0CSSFlexDirection flexDirection, ABI8_0_0CSSDirection direction) {
  if (isColumnDirection(flexDirection)) {
    return resolveAxis(ABI8_0_0CSSFlexDirectionRow, direction);
  } else {
    return ABI8_0_0CSSFlexDirectionColumn;
  }
}

static float getFlex(ABI8_0_0CSSNode* node) {
  return node->style.flex;
}

static bool isFlex(ABI8_0_0CSSNode* node) {
  return (
    node->style.positionType == ABI8_0_0CSSPositionTypeRelative &&
    getFlex(node) != 0
  );
}

static bool isFlexWrap(ABI8_0_0CSSNode* node) {
  return node->style.flexWrap == ABI8_0_0CSSWrapTypeWrap;
}

static float getDimWithMargin(ABI8_0_0CSSNode* node, ABI8_0_0CSSFlexDirection axis) {
  return node->layout.measuredDimensions[dim[axis]] +
    getLeadingMargin(node, axis) +
    getTrailingMargin(node, axis);
}

static bool isStyleDimDefined(ABI8_0_0CSSNode* node, ABI8_0_0CSSFlexDirection axis) {
  float value = node->style.dimensions[dim[axis]];
  return !isUndefined(value) && value >= 0.0;
}

static bool isLayoutDimDefined(ABI8_0_0CSSNode* node, ABI8_0_0CSSFlexDirection axis) {
  float value = node->layout.measuredDimensions[dim[axis]];
  return !isUndefined(value) && value >= 0.0;
}

static bool isPosDefined(ABI8_0_0CSSNode* node, ABI8_0_0CSSPosition position) {
  return !isUndefined(node->style.position[position]);
}

static bool isMeasureDefined(ABI8_0_0CSSNode* node) {
  return node->measure;
}

static float getPosition(ABI8_0_0CSSNode* node, ABI8_0_0CSSPosition position) {
  float result = node->style.position[position];
  if (!isUndefined(result)) {
    return result;
  }
  return 0;
}

static float boundAxisWithinMinAndMax(ABI8_0_0CSSNode* node, ABI8_0_0CSSFlexDirection axis, float value) {
  float min = ABI8_0_0CSSUndefined;
  float max = ABI8_0_0CSSUndefined;

  if (isColumnDirection(axis)) {
    min = node->style.minDimensions[ABI8_0_0CSSDimensionHeight];
    max = node->style.maxDimensions[ABI8_0_0CSSDimensionHeight];
  } else if (isRowDirection(axis)) {
    min = node->style.minDimensions[ABI8_0_0CSSDimensionWidth];
    max = node->style.maxDimensions[ABI8_0_0CSSDimensionWidth];
  }

  float boundValue = value;

  if (!isUndefined(max) && max >= 0.0 && boundValue > max) {
    boundValue = max;
  }
  if (!isUndefined(min) && min >= 0.0 && boundValue < min) {
    boundValue = min;
  }

  return boundValue;
}

// Like boundAxisWithinMinAndMax but also ensures that the value doesn't go below the
// padding and border amount.
static float boundAxis(ABI8_0_0CSSNode* node, ABI8_0_0CSSFlexDirection axis, float value) {
  return fmaxf(boundAxisWithinMinAndMax(node, axis, value), getPaddingAndBorderAxis(node, axis));
}

static void setTrailingPosition(ABI8_0_0CSSNode* node, ABI8_0_0CSSNode* child, ABI8_0_0CSSFlexDirection axis) {
  float size = child->style.positionType == ABI8_0_0CSSPositionTypeAbsolute ?
    0 :
    child->layout.measuredDimensions[dim[axis]];
  child->layout.position[trailing[axis]] = node->layout.measuredDimensions[dim[axis]] - size - child->layout.position[pos[axis]];
}

// If both left and right are defined, then use left. Otherwise return
// +left or -right depending on which is defined.
static float getRelativePosition(ABI8_0_0CSSNode* node, ABI8_0_0CSSFlexDirection axis) {
  float lead = node->style.position[leading[axis]];
  if (!isUndefined(lead)) {
    return lead;
  }
  return -getPosition(node, trailing[axis]);
}

static void setPosition(ABI8_0_0CSSNode* node, ABI8_0_0CSSDirection direction) {
  ABI8_0_0CSSFlexDirection mainAxis = resolveAxis(getFlexDirection(node), direction);
  ABI8_0_0CSSFlexDirection crossAxis = getCrossFlexDirection(mainAxis, direction);

  node->layout.position[leading[mainAxis]] = getLeadingMargin(node, mainAxis) +
    getRelativePosition(node, mainAxis);
  node->layout.position[trailing[mainAxis]] = getTrailingMargin(node, mainAxis) +
    getRelativePosition(node, mainAxis);
  node->layout.position[leading[crossAxis]] = getLeadingMargin(node, crossAxis) +
    getRelativePosition(node, crossAxis);
  node->layout.position[trailing[crossAxis]] = getTrailingMargin(node, crossAxis) +
    getRelativePosition(node, crossAxis);
}

//
// This is the main routine that implements a subset of the flexbox layout algorithm
// described in the W3C ABI8_0_0CSS documentation: https://www.w3.org/TR/css3-flexbox/.
//
// Limitations of this algorithm, compared to the full standard:
//  * Display property is always assumed to be 'flex' except for Text nodes, which
//    are assumed to be 'inline-flex'.
//  * The 'zIndex' property (or any form of z ordering) is not supported. Nodes are
//    stacked in document order.
//  * The 'order' property is not supported. The order of flex items is always defined
//    by document order.
//  * The 'visibility' property is always assumed to be 'visible'. Values of 'collapse'
//    and 'hidden' are not supported.
//  * The 'wrap' property supports only 'nowrap' (which is the default) or 'wrap'. The
//    rarely-used 'wrap-reverse' is not supported.
//  * Rather than allowing arbitrary combinations of flexGrow, flexShrink and
//    flexBasis, this algorithm supports only the three most common combinations:
//      flex: 0 is equiavlent to flex: 0 0 auto
//      flex: n (where n is a positive value) is equivalent to flex: n 1 auto
//          If POSITIVE_FLEX_IS_AUTO is 0, then it is equivalent to flex: n 0 0
//          This is faster because the content doesn't need to be measured, but it's
//          less flexible because the basis is always 0 and can't be overriden with
//          the width/height attributes.
//      flex: -1 (or any negative value) is equivalent to flex: 0 1 auto
//  * Margins cannot be specified as 'auto'. They must be specified in terms of pixel
//    values, and the default value is 0.
//  * The 'baseline' value is not supported for alignItems and alignSelf properties.
//  * Values of width, maxWidth, minWidth, height, maxHeight and minHeight must be
//    specified as pixel values, not as percentages.
//  * There is no support for calculation of dimensions based on intrinsic aspect ratios
//     (e.g. images).
//  * There is no support for forced breaks.
//  * It does not support vertical inline directions (top-to-bottom or bottom-to-top text).
//
// Deviations from standard:
//  * Section 4.5 of the spec indicates that all flex items have a default minimum
//    main size. For text blocks, for example, this is the width of the widest word.
//    Calculating the minimum width is expensive, so we forego it and assume a default
//    minimum main size of 0.
//  * Min/Max sizes in the main axis are not honored when resolving flexible lengths.
//  * The spec indicates that the default value for 'flexDirection' is 'row', but
//    the algorithm below assumes a default of 'column'.
//
// Input parameters:
//    - node: current node to be sized and layed out
//    - availableWidth & availableHeight: available size to be used for sizing the node
//      or ABI8_0_0CSSUndefined if the size is not available; interpretation depends on layout
//      flags
//    - parentDirection: the inline (text) direction within the parent (left-to-right or
//      right-to-left)
//    - widthMeasureMode: indicates the sizing rules for the width (see below for explanation)
//    - heightMeasureMode: indicates the sizing rules for the height (see below for explanation)
//    - performLayout: specifies whether the caller is interested in just the dimensions
//      of the node or it requires the entire node and its subtree to be layed out
//      (with final positions)
//
// Details:
//    This routine is called recursively to lay out subtrees of flexbox elements. It uses the
//    information in node.style, which is treated as a read-only input. It is responsible for
//    setting the layout.direction and layout.measuredDimensions fields for the input node as well
//    as the layout.position and layout.lineIndex fields for its child nodes. The
//    layout.measuredDimensions field includes any border or padding for the node but does
//    not include margins.
//
//    The spec describes four different layout modes: "fill available", "max content", "min content",
//    and "fit content". Of these, we don't use "min content" because we don't support default
//    minimum main sizes (see above for details). Each of our measure modes maps to a layout mode
//    from the spec (https://www.w3.org/TR/css3-sizing/#terms):
//      - ABI8_0_0CSSMeasureModeUndefined: max content
//      - ABI8_0_0CSSMeasureModeExactly: fill available
//      - ABI8_0_0CSSMeasureModeAtMost: fit content
//
//    When calling layoutNodeImpl and layoutNodeInternal, if the caller passes an available size of
//    undefined then it must also pass a measure mode of ABI8_0_0CSSMeasureModeUndefined in that dimension.
//
static void layoutNodeImpl(ABI8_0_0CSSNode* node, float availableWidth, float availableHeight,
    ABI8_0_0CSSDirection parentDirection, ABI8_0_0CSSMeasureMode widthMeasureMode, ABI8_0_0CSSMeasureMode heightMeasureMode, bool performLayout) {

  assert(isUndefined(availableWidth) ? widthMeasureMode == ABI8_0_0CSSMeasureModeUndefined : true); // availableWidth is indefinite so widthMeasureMode must be ABI8_0_0CSSMeasureModeUndefined
  assert(isUndefined(availableHeight) ? heightMeasureMode == ABI8_0_0CSSMeasureModeUndefined : true); // availableHeight is indefinite so heightMeasureMode must be ABI8_0_0CSSMeasureModeUndefined

  float paddingAndBorderAxisRow = getPaddingAndBorderAxis(node, ABI8_0_0CSSFlexDirectionRow);
  float paddingAndBorderAxisColumn = getPaddingAndBorderAxis(node, ABI8_0_0CSSFlexDirectionColumn);
  float marginAxisRow = getMarginAxis(node, ABI8_0_0CSSFlexDirectionRow);
  float marginAxisColumn = getMarginAxis(node, ABI8_0_0CSSFlexDirectionColumn);

  // Set the resolved resolution in the node's layout.
  ABI8_0_0CSSDirection direction = resolveDirection(node, parentDirection);
  node->layout.direction = direction;

  // For content (text) nodes, determine the dimensions based on the text contents.
  if (isMeasureDefined(node)) {
    float innerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
    float innerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;

    if (widthMeasureMode == ABI8_0_0CSSMeasureModeExactly && heightMeasureMode == ABI8_0_0CSSMeasureModeExactly) {

      // Don't bother sizing the text if both dimensions are already defined.
      node->layout.measuredDimensions[ABI8_0_0CSSDimensionWidth] = boundAxis(node, ABI8_0_0CSSFlexDirectionRow, availableWidth - marginAxisRow);
      node->layout.measuredDimensions[ABI8_0_0CSSDimensionHeight] = boundAxis(node, ABI8_0_0CSSFlexDirectionColumn, availableHeight - marginAxisColumn);
    } else if (innerWidth <= 0 || innerHeight <= 0) {

      // Don't bother sizing the text if there's no horizontal or vertical space.
      node->layout.measuredDimensions[ABI8_0_0CSSDimensionWidth] = boundAxis(node, ABI8_0_0CSSFlexDirectionRow, 0);
      node->layout.measuredDimensions[ABI8_0_0CSSDimensionHeight] = boundAxis(node, ABI8_0_0CSSFlexDirectionColumn, 0);
    } else {

      // Measure the text under the current constraints.
      ABI8_0_0CSSSize measuredSize = node->measure(
        node->context,

        innerWidth,
        widthMeasureMode,
        innerHeight,
        heightMeasureMode
      );

      node->layout.measuredDimensions[ABI8_0_0CSSDimensionWidth] = boundAxis(node, ABI8_0_0CSSFlexDirectionRow,
        (widthMeasureMode == ABI8_0_0CSSMeasureModeUndefined || widthMeasureMode == ABI8_0_0CSSMeasureModeAtMost) ?
          measuredSize.width + paddingAndBorderAxisRow :
          availableWidth - marginAxisRow);
      node->layout.measuredDimensions[ABI8_0_0CSSDimensionHeight] = boundAxis(node, ABI8_0_0CSSFlexDirectionColumn,
        (heightMeasureMode == ABI8_0_0CSSMeasureModeUndefined || heightMeasureMode == ABI8_0_0CSSMeasureModeAtMost) ?
          measuredSize.height + paddingAndBorderAxisColumn :
          availableHeight - marginAxisColumn);
    }

    return;
  }

  // For nodes with no children, use the available values if they were provided, or
  // the minimum size as indicated by the padding and border sizes.
  unsigned int childCount = ABI8_0_0CSSNodeListCount(node->children);
  if (childCount == 0) {
    node->layout.measuredDimensions[ABI8_0_0CSSDimensionWidth] = boundAxis(node, ABI8_0_0CSSFlexDirectionRow,
      (widthMeasureMode == ABI8_0_0CSSMeasureModeUndefined || widthMeasureMode == ABI8_0_0CSSMeasureModeAtMost) ?
        paddingAndBorderAxisRow :
        availableWidth - marginAxisRow);
    node->layout.measuredDimensions[ABI8_0_0CSSDimensionHeight] = boundAxis(node, ABI8_0_0CSSFlexDirectionColumn,
      (heightMeasureMode == ABI8_0_0CSSMeasureModeUndefined || heightMeasureMode == ABI8_0_0CSSMeasureModeAtMost) ?
        paddingAndBorderAxisColumn :
        availableHeight - marginAxisColumn);
    return;
  }

  // If we're not being asked to perform a full layout, we can handle a number of common
  // cases here without incurring the cost of the remaining function.
  if (!performLayout) {
    // If we're being asked to size the content with an at most constraint but there is no available width,
    // the measurement will always be zero.
    if (widthMeasureMode == ABI8_0_0CSSMeasureModeAtMost && availableWidth <= 0 &&
        heightMeasureMode == ABI8_0_0CSSMeasureModeAtMost && availableHeight <= 0) {
      node->layout.measuredDimensions[ABI8_0_0CSSDimensionWidth] = boundAxis(node, ABI8_0_0CSSFlexDirectionRow, 0);
      node->layout.measuredDimensions[ABI8_0_0CSSDimensionHeight] = boundAxis(node, ABI8_0_0CSSFlexDirectionColumn, 0);
      return;
    }

    if (widthMeasureMode == ABI8_0_0CSSMeasureModeAtMost && availableWidth <= 0) {
      node->layout.measuredDimensions[ABI8_0_0CSSDimensionWidth] = boundAxis(node, ABI8_0_0CSSFlexDirectionRow, 0);
      node->layout.measuredDimensions[ABI8_0_0CSSDimensionHeight] = boundAxis(node, ABI8_0_0CSSFlexDirectionColumn, isUndefined(availableHeight) ? 0 : (availableHeight - marginAxisColumn));
      return;
    }

    if (heightMeasureMode == ABI8_0_0CSSMeasureModeAtMost && availableHeight <= 0) {
      node->layout.measuredDimensions[ABI8_0_0CSSDimensionWidth] = boundAxis(node, ABI8_0_0CSSFlexDirectionRow, isUndefined(availableWidth) ? 0 : (availableWidth - marginAxisRow));
      node->layout.measuredDimensions[ABI8_0_0CSSDimensionHeight] = boundAxis(node, ABI8_0_0CSSFlexDirectionColumn, 0);
      return;
    }

    // If we're being asked to use an exact width/height, there's no need to measure the children.
    if (widthMeasureMode == ABI8_0_0CSSMeasureModeExactly && heightMeasureMode == ABI8_0_0CSSMeasureModeExactly) {
      node->layout.measuredDimensions[ABI8_0_0CSSDimensionWidth] = boundAxis(node, ABI8_0_0CSSFlexDirectionRow, availableWidth - marginAxisRow);
      node->layout.measuredDimensions[ABI8_0_0CSSDimensionHeight] = boundAxis(node, ABI8_0_0CSSFlexDirectionColumn, availableHeight - marginAxisColumn);
      return;
    }
  }

  // STEP 1: CALCULATE VALUES FOR REMAINDER OF ALGORITHM
  ABI8_0_0CSSFlexDirection mainAxis = resolveAxis(getFlexDirection(node), direction);
  ABI8_0_0CSSFlexDirection crossAxis = getCrossFlexDirection(mainAxis, direction);
  bool isMainAxisRow = isRowDirection(mainAxis);
  ABI8_0_0CSSJustify justifyContent = node->style.justifyContent;
  bool isNodeFlexWrap = isFlexWrap(node);

  ABI8_0_0CSSNode* firstAbsoluteChild = NULL;
  ABI8_0_0CSSNode* currentAbsoluteChild = NULL;

  float leadingPaddingAndBorderMain = getLeadingPaddingAndBorder(node, mainAxis);
  float trailingPaddingAndBorderMain = getTrailingPaddingAndBorder(node, mainAxis);
  float leadingPaddingAndBorderCross = getLeadingPaddingAndBorder(node, crossAxis);
  float paddingAndBorderAxisMain = getPaddingAndBorderAxis(node, mainAxis);
  float paddingAndBorderAxisCross = getPaddingAndBorderAxis(node, crossAxis);

  ABI8_0_0CSSMeasureMode measureModeMainDim = isMainAxisRow ? widthMeasureMode : heightMeasureMode;
  ABI8_0_0CSSMeasureMode measureModeCrossDim = isMainAxisRow ? heightMeasureMode : widthMeasureMode;

  // STEP 2: DETERMINE AVAILABLE SIZE IN MAIN AND CROSS DIRECTIONS
  float availableInnerWidth = availableWidth - marginAxisRow - paddingAndBorderAxisRow;
  float availableInnerHeight = availableHeight - marginAxisColumn - paddingAndBorderAxisColumn;
  float availableInnerMainDim = isMainAxisRow ? availableInnerWidth : availableInnerHeight;
  float availableInnerCrossDim = isMainAxisRow ? availableInnerHeight : availableInnerWidth;

  // STEP 3: DETERMINE FLEX BASIS FOR EACH ITEM
  ABI8_0_0CSSNode* child;
  unsigned int i;
  float childWidth;
  float childHeight;
  ABI8_0_0CSSMeasureMode childWidthMeasureMode;
  ABI8_0_0CSSMeasureMode childHeightMeasureMode;
  for (i = 0; i < childCount; i++) {
    child = ABI8_0_0CSSNodeListGet(node->children, i);

    if (performLayout) {
      // Set the initial position (relative to the parent).
      ABI8_0_0CSSDirection childDirection = resolveDirection(child, direction);
      setPosition(child, childDirection);
    }

    // Absolute-positioned children don't participate in flex layout. Add them
    // to a list that we can process later.
    if (child->style.positionType == ABI8_0_0CSSPositionTypeAbsolute) {

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

      if (isMainAxisRow && isStyleDimDefined(child, ABI8_0_0CSSFlexDirectionRow)) {

        // The width is definite, so use that as the flex basis.
        child->layout.flexBasis = fmaxf(child->style.dimensions[ABI8_0_0CSSDimensionWidth], getPaddingAndBorderAxis(child, ABI8_0_0CSSFlexDirectionRow));
      } else if (!isMainAxisRow && isStyleDimDefined(child, ABI8_0_0CSSFlexDirectionColumn)) {

        // The height is definite, so use that as the flex basis.
        child->layout.flexBasis = fmaxf(child->style.dimensions[ABI8_0_0CSSDimensionHeight], getPaddingAndBorderAxis(child, ABI8_0_0CSSFlexDirectionColumn));
      } else if (!isFlexBasisAuto(child) && !isUndefined(availableInnerMainDim)) {

        // If the basis isn't 'auto', it is assumed to be zero.
        child->layout.flexBasis = fmaxf(0, getPaddingAndBorderAxis(child, mainAxis));
      } else {

        // Compute the flex basis and hypothetical main size (i.e. the clamped flex basis).
        childWidth = ABI8_0_0CSSUndefined;
        childHeight = ABI8_0_0CSSUndefined;
        childWidthMeasureMode = ABI8_0_0CSSMeasureModeUndefined;
        childHeightMeasureMode = ABI8_0_0CSSMeasureModeUndefined;

        if (isStyleDimDefined(child, ABI8_0_0CSSFlexDirectionRow)) {
          childWidth = child->style.dimensions[ABI8_0_0CSSDimensionWidth] + getMarginAxis(child, ABI8_0_0CSSFlexDirectionRow);
          childWidthMeasureMode = ABI8_0_0CSSMeasureModeExactly;
        }
        if (isStyleDimDefined(child, ABI8_0_0CSSFlexDirectionColumn)) {
          childHeight = child->style.dimensions[ABI8_0_0CSSDimensionHeight] + getMarginAxis(child, ABI8_0_0CSSFlexDirectionColumn);
          childHeightMeasureMode = ABI8_0_0CSSMeasureModeExactly;
        }

        // According to the spec, if the main size is not definite and the
        // child's inline axis is parallel to the main axis (i.e. it's
        // horizontal), the child should be sized using "UNDEFINED" in
        // the main size. Otherwise use "AT_MOST" in the cross axis.
        if (!isMainAxisRow && isUndefined(childWidth) && !isUndefined(availableInnerWidth)) {
          childWidth = availableInnerWidth;
          childWidthMeasureMode = ABI8_0_0CSSMeasureModeAtMost;
        }

        // The W3C spec doesn't say anything about the 'overflow' property,
        // but all major browsers appear to implement the following logic.
        if (node->style.overflow == ABI8_0_0CSSOverflowHidden) {
          if (isMainAxisRow && isUndefined(childHeight) && !isUndefined(availableInnerHeight)) {
            childHeight = availableInnerHeight;
            childHeightMeasureMode = ABI8_0_0CSSMeasureModeAtMost;
          }
        }

        // If child has no defined size in the cross axis and is set to stretch, set the cross
        // axis to be measured exactly with the available inner width
        if (!isMainAxisRow &&
            !isUndefined(availableInnerWidth) &&
            !isStyleDimDefined(child, ABI8_0_0CSSFlexDirectionRow) &&
            widthMeasureMode == ABI8_0_0CSSMeasureModeExactly &&
            getAlignItem(node, child) == ABI8_0_0CSSAlignStretch) {
          childWidth = availableInnerWidth;
          childWidthMeasureMode = ABI8_0_0CSSMeasureModeExactly;
        }
        if (isMainAxisRow &&
            !isUndefined(availableInnerHeight) &&
            !isStyleDimDefined(child, ABI8_0_0CSSFlexDirectionColumn) &&
            heightMeasureMode == ABI8_0_0CSSMeasureModeExactly &&
            getAlignItem(node, child) == ABI8_0_0CSSAlignStretch) {
          childHeight = availableInnerHeight;
          childHeightMeasureMode = ABI8_0_0CSSMeasureModeExactly;
        }

        // Measure the child
        layoutNodeInternal(child, childWidth, childHeight, direction, childWidthMeasureMode, childHeightMeasureMode, false, "measure");

        child->layout.flexBasis = fmaxf(isMainAxisRow ? child->layout.measuredDimensions[ABI8_0_0CSSDimensionWidth] : child->layout.measuredDimensions[ABI8_0_0CSSDimensionHeight], getPaddingAndBorderAxis(child, mainAxis));
      }
    }
  }

  // STEP 4: COLLECT FLEX ITEMS INTO FLEX LINES

  // Indexes of children that represent the first and last items in the line.
  int startOfLineIndex = 0;
  int endOfLineIndex = 0;

  // Number of lines.
  int lineCount = 0;

  // Accumulated cross dimensions of all lines so far.
  float totalLineCrossDim = 0;

  // Max main dimension of all the lines.
  float maxLineMainDim = 0;

  while (endOfLineIndex < childCount) {

    // Number of items on the currently line. May be different than the difference
    // between start and end indicates because we skip over absolute-positioned items.
    int itemsOnLine = 0;

    // sizeConsumedOnCurrentLine is accumulation of the dimensions and margin
    // of all the children on the current line. This will be used in order to
    // either set the dimensions of the node if none already exist or to compute
    // the remaining space left for the flexible children.
    float sizeConsumedOnCurrentLine = 0;

    float totalFlexGrowFactors = 0;
    float totalFlexShrinkScaledFactors = 0;

    i = startOfLineIndex;

    // Maintain a linked list of the child nodes that can shrink and/or grow.
    ABI8_0_0CSSNode* firstRelativeChild = NULL;
    ABI8_0_0CSSNode* currentRelativeChild = NULL;

    // Add items to the current line until it's full or we run out of items.
    while (i < childCount) {
      child = ABI8_0_0CSSNodeListGet(node->children, i);
      child->lineIndex = lineCount;

      if (child->style.positionType != ABI8_0_0CSSPositionTypeAbsolute) {
        float outerFlexBasis = child->layout.flexBasis + getMarginAxis(child, mainAxis);

        // If this is a multi-line flow and this item pushes us over the available size, we've
        // hit the end of the current line. Break out of the loop and lay out the current line.
        if (sizeConsumedOnCurrentLine + outerFlexBasis > availableInnerMainDim && isNodeFlexWrap && itemsOnLine > 0) {
          break;
        }

        sizeConsumedOnCurrentLine += outerFlexBasis;
        itemsOnLine++;

        if (isFlex(child)) {
          totalFlexGrowFactors += getFlexGrowFactor(child);

          // Unlike the grow factor, the shrink factor is scaled relative to the child
          // dimension.
          totalFlexShrinkScaledFactors += getFlexShrinkFactor(child) * child->layout.flexBasis;
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

      i++;
      endOfLineIndex++;
    }

    // If we don't need to measure the cross axis, we can skip the entire flex step.
    bool canSkipFlex = !performLayout && measureModeCrossDim == ABI8_0_0CSSMeasureModeExactly;

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
    if (!isUndefined(availableInnerMainDim)) {
      remainingFreeSpace = availableInnerMainDim - sizeConsumedOnCurrentLine;
    } else if (sizeConsumedOnCurrentLine < 0) {
      // availableInnerMainDim is indefinite which means the node is being sized based on its content.
      // sizeConsumedOnCurrentLine is negative which means the node will allocate 0 pixels for
      // its content. Consequently, remainingFreeSpace is 0 - sizeConsumedOnCurrentLine.
      remainingFreeSpace = -sizeConsumedOnCurrentLine;
    }

    float originalRemainingFreeSpace = remainingFreeSpace;
    float deltaFreeSpace = 0;

    if (!canSkipFlex) {
      float childFlexBasis;
      float flexShrinkScaledFactor;
      float flexGrowFactor;
      float baseMainSize;
      float boundMainSize;

      // Do two passes over the flex items to figure out how to distribute the remaining space.
      // The first pass finds the items whose min/max constraints trigger, freezes them at those
      // sizes, and excludes those sizes from the remaining space. The second pass sets the size
      // of each flexible item. It distributes the remaining space amongst the items whose min/max
      // constraints didn't trigger in pass 1. For the other items, it sets their sizes by forcing
      // their min/max constraints to trigger again.
      //
      // This two pass approach for resolving min/max constraints deviates from the spec. The
      // spec (https://www.w3.org/TR/css-flexbox-1/#resolve-flexible-lengths) describes a process
      // that needs to be repeated a variable number of times. The algorithm implemented here
      // won't handle all cases but it was simpler to implement and it mitigates performance
      // concerns because we know exactly how many passes it'll do.

      // First pass: detect the flex items whose min/max constraints trigger
      float deltaFlexShrinkScaledFactors = 0;
      float deltaFlexGrowFactors = 0;
      currentRelativeChild = firstRelativeChild;
      while (currentRelativeChild != NULL) {
        childFlexBasis = currentRelativeChild->layout.flexBasis;

        if (remainingFreeSpace < 0) {
          flexShrinkScaledFactor = getFlexShrinkFactor(currentRelativeChild) * childFlexBasis;

          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            baseMainSize = childFlexBasis +
              remainingFreeSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor;
            boundMainSize = boundAxis(currentRelativeChild, mainAxis, baseMainSize);
            if (baseMainSize != boundMainSize) {
              // By excluding this item's size and flex factor from remaining, this item's
              // min/max constraints should also trigger in the second pass resulting in the
              // item's size calculation being identical in the first and second passes.
              deltaFreeSpace -= boundMainSize - childFlexBasis;
              deltaFlexShrinkScaledFactors -= flexShrinkScaledFactor;
            }
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = getFlexGrowFactor(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            baseMainSize = childFlexBasis +
              remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor;
            boundMainSize = boundAxis(currentRelativeChild, mainAxis, baseMainSize);
            if (baseMainSize != boundMainSize) {
              // By excluding this item's size and flex factor from remaining, this item's
              // min/max constraints should also trigger in the second pass resulting in the
              // item's size calculation being identical in the first and second passes.
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
        childFlexBasis = currentRelativeChild->layout.flexBasis;
        float updatedMainSize = childFlexBasis;

        if (remainingFreeSpace < 0) {
          flexShrinkScaledFactor = getFlexShrinkFactor(currentRelativeChild) * childFlexBasis;

          // Is this child able to shrink?
          if (flexShrinkScaledFactor != 0) {
            updatedMainSize = boundAxis(currentRelativeChild, mainAxis, childFlexBasis +
              remainingFreeSpace / totalFlexShrinkScaledFactors * flexShrinkScaledFactor);
          }
        } else if (remainingFreeSpace > 0) {
          flexGrowFactor = getFlexGrowFactor(currentRelativeChild);

          // Is this child able to grow?
          if (flexGrowFactor != 0) {
            updatedMainSize = boundAxis(currentRelativeChild, mainAxis, childFlexBasis +
              remainingFreeSpace / totalFlexGrowFactors * flexGrowFactor);
          }
        }

        deltaFreeSpace -= updatedMainSize - childFlexBasis;

        if (isMainAxisRow) {
          childWidth = updatedMainSize + getMarginAxis(currentRelativeChild, ABI8_0_0CSSFlexDirectionRow);
          childWidthMeasureMode = ABI8_0_0CSSMeasureModeExactly;

          if (!isUndefined(availableInnerCrossDim) &&
              !isStyleDimDefined(currentRelativeChild, ABI8_0_0CSSFlexDirectionColumn) &&
              heightMeasureMode == ABI8_0_0CSSMeasureModeExactly &&
              getAlignItem(node, currentRelativeChild) == ABI8_0_0CSSAlignStretch) {
            childHeight = availableInnerCrossDim;
            childHeightMeasureMode = ABI8_0_0CSSMeasureModeExactly;
          } else if (!isStyleDimDefined(currentRelativeChild, ABI8_0_0CSSFlexDirectionColumn)) {
            childHeight = availableInnerCrossDim;
            childHeightMeasureMode = isUndefined(childHeight) ? ABI8_0_0CSSMeasureModeUndefined : ABI8_0_0CSSMeasureModeAtMost;
          } else {
            childHeight = currentRelativeChild->style.dimensions[ABI8_0_0CSSDimensionHeight] + getMarginAxis(currentRelativeChild, ABI8_0_0CSSFlexDirectionColumn);
            childHeightMeasureMode = ABI8_0_0CSSMeasureModeExactly;
          }
        } else {
          childHeight = updatedMainSize + getMarginAxis(currentRelativeChild, ABI8_0_0CSSFlexDirectionColumn);
          childHeightMeasureMode = ABI8_0_0CSSMeasureModeExactly;

          if (!isUndefined(availableInnerCrossDim) &&
              !isStyleDimDefined(currentRelativeChild, ABI8_0_0CSSFlexDirectionRow) &&
              widthMeasureMode == ABI8_0_0CSSMeasureModeExactly &&
              getAlignItem(node, currentRelativeChild) == ABI8_0_0CSSAlignStretch) {
            childWidth = availableInnerCrossDim;
            childWidthMeasureMode = ABI8_0_0CSSMeasureModeExactly;
          } else if (!isStyleDimDefined(currentRelativeChild, ABI8_0_0CSSFlexDirectionRow)) {
            childWidth = availableInnerCrossDim;
            childWidthMeasureMode = isUndefined(childWidth) ? ABI8_0_0CSSMeasureModeUndefined : ABI8_0_0CSSMeasureModeAtMost;
          } else {
            childWidth = currentRelativeChild->style.dimensions[ABI8_0_0CSSDimensionWidth] + getMarginAxis(currentRelativeChild, ABI8_0_0CSSFlexDirectionRow);
            childWidthMeasureMode = ABI8_0_0CSSMeasureModeExactly;
          }
        }

        bool requiresStretchLayout = !isStyleDimDefined(currentRelativeChild, crossAxis) &&
          getAlignItem(node, currentRelativeChild) == ABI8_0_0CSSAlignStretch;

        // Recursively call the layout algorithm for this child with the updated main size.
        layoutNodeInternal(currentRelativeChild, childWidth, childHeight, direction, childWidthMeasureMode, childHeightMeasureMode, performLayout && !requiresStretchLayout, "flex");

        currentRelativeChild = currentRelativeChild->nextChild;
      }
    }

    remainingFreeSpace = originalRemainingFreeSpace + deltaFreeSpace;

    // STEP 6: MAIN-AXIS JUSTIFICATION & CROSS-AXIS SIZE DETERMINATION

    // At this point, all the children have their dimensions set in the main axis.
    // Their dimensions are also set in the cross axis with the exception of items
    // that are aligned "stretch". We need to compute these stretch values and
    // set the final positions.

    // If we are using "at most" rules in the main axis, we won't distribute
    // any remaining space at this point.
    if (measureModeMainDim == ABI8_0_0CSSMeasureModeAtMost) {
      remainingFreeSpace = 0;
    }

    // Use justifyContent to figure out how to allocate the remaining space
    // available in the main axis.
    if (justifyContent != ABI8_0_0CSSJustifyFlexStart) {
      if (justifyContent == ABI8_0_0CSSJustifyCenter) {
        leadingMainDim = remainingFreeSpace / 2;
      } else if (justifyContent == ABI8_0_0CSSJustifyFlexEnd) {
        leadingMainDim = remainingFreeSpace;
      } else if (justifyContent == ABI8_0_0CSSJustifySpaceBetween) {
        remainingFreeSpace = fmaxf(remainingFreeSpace, 0);
        if (itemsOnLine > 1) {
          betweenMainDim = remainingFreeSpace / (itemsOnLine - 1);
        } else {
          betweenMainDim = 0;
        }
      } else if (justifyContent == ABI8_0_0CSSJustifySpaceAround) {
        // Space on the edges is half of the space between elements
        betweenMainDim = remainingFreeSpace / itemsOnLine;
        leadingMainDim = betweenMainDim / 2;
      }
    }

    float mainDim = leadingPaddingAndBorderMain + leadingMainDim;
    float crossDim = 0;

    for (i = startOfLineIndex; i < endOfLineIndex; ++i) {
      child = ABI8_0_0CSSNodeListGet(node->children, i);

      if (child->style.positionType == ABI8_0_0CSSPositionTypeAbsolute &&
          isPosDefined(child, leading[mainAxis])) {
        if (performLayout) {
          // In case the child is position absolute and has left/top being
          // defined, we override the position to whatever the user said
          // (and margin/border).
          child->layout.position[pos[mainAxis]] = getPosition(child, leading[mainAxis]) +
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
        if (child->style.positionType == ABI8_0_0CSSPositionTypeRelative) {
          if (canSkipFlex) {
            // If we skipped the flex step, then we can't rely on the measuredDims because
            // they weren't computed. This means we can't call getDimWithMargin.
            mainDim += betweenMainDim + getMarginAxis(child, mainAxis) + child->layout.flexBasis;
            crossDim = availableInnerCrossDim;
          } else {
            // The main dimension is the sum of all the elements dimension plus
            // the spacing.
            mainDim += betweenMainDim + getDimWithMargin(child, mainAxis);

            // The cross dimension is the max of the elements dimension since there
            // can only be one element in that cross dimension.
            crossDim = fmaxf(crossDim, getDimWithMargin(child, crossAxis));
          }
        }
      }
    }

    mainDim += trailingPaddingAndBorderMain;

    float containerCrossAxis = availableInnerCrossDim;
    if (measureModeCrossDim == ABI8_0_0CSSMeasureModeUndefined || measureModeCrossDim == ABI8_0_0CSSMeasureModeAtMost) {
      // Compute the cross axis from the max cross dimension of the children.
      containerCrossAxis = boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross) - paddingAndBorderAxisCross;

      if (measureModeCrossDim == ABI8_0_0CSSMeasureModeAtMost) {
        containerCrossAxis = fminf(containerCrossAxis, availableInnerCrossDim);
      }
    }

    // If there's no flex wrap, the cross dimension is defined by the container.
    if (!isNodeFlexWrap && measureModeCrossDim == ABI8_0_0CSSMeasureModeExactly) {
      crossDim = availableInnerCrossDim;
    }

    // Clamp to the min/max size specified on the container.
    crossDim = boundAxis(node, crossAxis, crossDim + paddingAndBorderAxisCross) - paddingAndBorderAxisCross;

    // STEP 7: CROSS-AXIS ALIGNMENT
    // We can skip child alignment if we're just measuring the container.
    if (performLayout) {
      for (i = startOfLineIndex; i < endOfLineIndex; ++i) {
        child = ABI8_0_0CSSNodeListGet(node->children, i);

        if (child->style.positionType == ABI8_0_0CSSPositionTypeAbsolute) {
          // If the child is absolutely positioned and has a top/left/bottom/right
          // set, override all the previously computed positions to set it correctly.
          if (isPosDefined(child, leading[crossAxis])) {
            child->layout.position[pos[crossAxis]] = getPosition(child, leading[crossAxis]) +
              getLeadingBorder(node, crossAxis) +
              getLeadingMargin(child, crossAxis);
          } else {
            child->layout.position[pos[crossAxis]] = leadingPaddingAndBorderCross +
              getLeadingMargin(child, crossAxis);
          }
        } else {
          float leadingCrossDim = leadingPaddingAndBorderCross;

          // For a relative children, we're either using alignItems (parent) or
          // alignSelf (child) in order to determine the position in the cross axis
          ABI8_0_0CSSAlign alignItem = getAlignItem(node, child);

          // If the child uses align stretch, we need to lay it out one more time, this time
          // forcing the cross-axis size to be the computed cross size for the current line.
          if (alignItem == ABI8_0_0CSSAlignStretch) {
            childWidth = child->layout.measuredDimensions[ABI8_0_0CSSDimensionWidth] + getMarginAxis(child, ABI8_0_0CSSFlexDirectionRow);
            childHeight = child->layout.measuredDimensions[ABI8_0_0CSSDimensionHeight] + getMarginAxis(child, ABI8_0_0CSSFlexDirectionColumn);
            bool isCrossSizeDefinite = false;

            if (isMainAxisRow) {
              isCrossSizeDefinite = isStyleDimDefined(child, ABI8_0_0CSSFlexDirectionColumn);
              childHeight = crossDim;
            } else {
              isCrossSizeDefinite = isStyleDimDefined(child, ABI8_0_0CSSFlexDirectionRow);
              childWidth = crossDim;
            }

            // If the child defines a definite size for its cross axis, there's no need to stretch.
            if (!isCrossSizeDefinite) {
              childWidthMeasureMode = isUndefined(childWidth) ? ABI8_0_0CSSMeasureModeUndefined : ABI8_0_0CSSMeasureModeExactly;
              childHeightMeasureMode = isUndefined(childHeight) ? ABI8_0_0CSSMeasureModeUndefined : ABI8_0_0CSSMeasureModeExactly;
              layoutNodeInternal(child, childWidth, childHeight, direction, childWidthMeasureMode, childHeightMeasureMode, true, "stretch");
            }
          } else if (alignItem != ABI8_0_0CSSAlignFlexStart) {
            float remainingCrossDim = containerCrossAxis - getDimWithMargin(child, crossAxis);

            if (alignItem == ABI8_0_0CSSAlignCenter) {
              leadingCrossDim += remainingCrossDim / 2;
            } else { // ABI8_0_0CSSAlignFlexEnd
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

    // Reset variables for new line.
    lineCount++;
    startOfLineIndex = endOfLineIndex;
    endOfLineIndex = startOfLineIndex;
  }

  // STEP 8: MULTI-LINE CONTENT ALIGNMENT
  if (lineCount > 1 && performLayout && !isUndefined(availableInnerCrossDim)) {
    float remainingAlignContentDim = availableInnerCrossDim - totalLineCrossDim;

    float crossDimLead = 0;
    float currentLead = leadingPaddingAndBorderCross;

    ABI8_0_0CSSAlign alignContent = node->style.alignContent;
    if (alignContent == ABI8_0_0CSSAlignFlexEnd) {
      currentLead += remainingAlignContentDim;
    } else if (alignContent == ABI8_0_0CSSAlignCenter) {
      currentLead += remainingAlignContentDim / 2;
    } else if (alignContent == ABI8_0_0CSSAlignStretch) {
      if (availableInnerCrossDim > totalLineCrossDim) {
        crossDimLead = (remainingAlignContentDim / lineCount);
      }
    }

    int endIndex = 0;
    for (i = 0; i < lineCount; ++i) {
      int startIndex = endIndex;
      int j;

      // compute the line's height and find the endIndex
      float lineHeight = 0;
      for (j = startIndex; j < childCount; ++j) {
        child = ABI8_0_0CSSNodeListGet(node->children, j);
        if (child->style.positionType != ABI8_0_0CSSPositionTypeRelative) {
          continue;
        }
        if (child->lineIndex != i) {
          break;
        }
        if (isLayoutDimDefined(child, crossAxis)) {
          lineHeight = fmaxf(lineHeight,
            child->layout.measuredDimensions[dim[crossAxis]] + getMarginAxis(child, crossAxis));
        }
      }
      endIndex = j;
      lineHeight += crossDimLead;

      if (performLayout) {
        for (j = startIndex; j < endIndex; ++j) {
          child = ABI8_0_0CSSNodeListGet(node->children, j);
          if (child->style.positionType != ABI8_0_0CSSPositionTypeRelative) {
            continue;
          }

          ABI8_0_0CSSAlign alignContentAlignItem = getAlignItem(node, child);
          if (alignContentAlignItem == ABI8_0_0CSSAlignFlexStart) {
            child->layout.position[pos[crossAxis]] = currentLead + getLeadingMargin(child, crossAxis);
          } else if (alignContentAlignItem == ABI8_0_0CSSAlignFlexEnd) {
            child->layout.position[pos[crossAxis]] = currentLead + lineHeight - getTrailingMargin(child, crossAxis) - child->layout.measuredDimensions[dim[crossAxis]];
          } else if (alignContentAlignItem == ABI8_0_0CSSAlignCenter) {
            childHeight = child->layout.measuredDimensions[dim[crossAxis]];
            child->layout.position[pos[crossAxis]] = currentLead + (lineHeight - childHeight) / 2;
          } else if (alignContentAlignItem == ABI8_0_0CSSAlignStretch) {
            child->layout.position[pos[crossAxis]] = currentLead + getLeadingMargin(child, crossAxis);
            // TODO(prenaux): Correctly set the height of items with indefinite
            //                (auto) crossAxis dimension.
          }
        }
      }

      currentLead += lineHeight;
    }
  }

  // STEP 9: COMPUTING FINAL DIMENSIONS
  node->layout.measuredDimensions[ABI8_0_0CSSDimensionWidth] = boundAxis(node, ABI8_0_0CSSFlexDirectionRow, availableWidth - marginAxisRow);
  node->layout.measuredDimensions[ABI8_0_0CSSDimensionHeight] = boundAxis(node, ABI8_0_0CSSFlexDirectionColumn, availableHeight - marginAxisColumn);

  // If the user didn't specify a width or height for the node, set the
  // dimensions based on the children.
  if (measureModeMainDim == ABI8_0_0CSSMeasureModeUndefined) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[mainAxis]] = boundAxis(node, mainAxis, maxLineMainDim);
  } else if (measureModeMainDim == ABI8_0_0CSSMeasureModeAtMost) {
    node->layout.measuredDimensions[dim[mainAxis]] = fmaxf(
      fminf(availableInnerMainDim + paddingAndBorderAxisMain,
        boundAxisWithinMinAndMax(node, mainAxis, maxLineMainDim)),
      paddingAndBorderAxisMain);
  }

  if (measureModeCrossDim == ABI8_0_0CSSMeasureModeUndefined) {
    // Clamp the size to the min/max size, if specified, and make sure it
    // doesn't go below the padding and border amount.
    node->layout.measuredDimensions[dim[crossAxis]] = boundAxis(node, crossAxis, totalLineCrossDim + paddingAndBorderAxisCross);
  } else if (measureModeCrossDim == ABI8_0_0CSSMeasureModeAtMost) {
    node->layout.measuredDimensions[dim[crossAxis]] = fmaxf(
      fminf(availableInnerCrossDim + paddingAndBorderAxisCross,
        boundAxisWithinMinAndMax(node, crossAxis, totalLineCrossDim + paddingAndBorderAxisCross)),
      paddingAndBorderAxisCross);
  }

  // STEP 10: SETTING TRAILING POSITIONS FOR CHILDREN
  if (performLayout) {
    bool needsMainTrailingPos = false;
    bool needsCrossTrailingPos = false;

    if (mainAxis == ABI8_0_0CSSFlexDirectionRowReverse ||
        mainAxis == ABI8_0_0CSSFlexDirectionColumnReverse) {
      needsMainTrailingPos = true;
    }

    if (crossAxis == ABI8_0_0CSSFlexDirectionRowReverse ||
        crossAxis == ABI8_0_0CSSFlexDirectionColumnReverse) {
      needsCrossTrailingPos = true;
    }

    // Set trailing position if necessary.
    if (needsMainTrailingPos || needsCrossTrailingPos) {
      for (i = 0; i < childCount; ++i) {
        child = ABI8_0_0CSSNodeListGet(node->children, i);

        if (needsMainTrailingPos) {
          setTrailingPosition(node, child, mainAxis);
        }

        if (needsCrossTrailingPos) {
          setTrailingPosition(node, child, crossAxis);
        }
      }
    }
  }

  // STEP 11: SIZING AND POSITIONING ABSOLUTE CHILDREN
  currentAbsoluteChild = firstAbsoluteChild;
  while (currentAbsoluteChild != NULL) {
    // Now that we know the bounds of the container, perform layout again on the
    // absolutely-positioned children.
    if (performLayout) {

      childWidth = ABI8_0_0CSSUndefined;
      childHeight = ABI8_0_0CSSUndefined;

      if (isStyleDimDefined(currentAbsoluteChild, ABI8_0_0CSSFlexDirectionRow)) {
        childWidth = currentAbsoluteChild->style.dimensions[ABI8_0_0CSSDimensionWidth] + getMarginAxis(currentAbsoluteChild, ABI8_0_0CSSFlexDirectionRow);
      } else {
        // If the child doesn't have a specified width, compute the width based on the left/right offsets if they're defined.
        if (isPosDefined(currentAbsoluteChild, ABI8_0_0CSSPositionLeft) && isPosDefined(currentAbsoluteChild, ABI8_0_0CSSPositionRight)) {
          childWidth = node->layout.measuredDimensions[ABI8_0_0CSSDimensionWidth] -
            (getLeadingBorder(node, ABI8_0_0CSSFlexDirectionRow) + getTrailingBorder(node, ABI8_0_0CSSFlexDirectionRow)) -
            (currentAbsoluteChild->style.position[ABI8_0_0CSSPositionLeft] + currentAbsoluteChild->style.position[ABI8_0_0CSSPositionRight]);
          childWidth = boundAxis(currentAbsoluteChild, ABI8_0_0CSSFlexDirectionRow, childWidth);
        }
      }

      if (isStyleDimDefined(currentAbsoluteChild, ABI8_0_0CSSFlexDirectionColumn)) {
        childHeight = currentAbsoluteChild->style.dimensions[ABI8_0_0CSSDimensionHeight] + getMarginAxis(currentAbsoluteChild, ABI8_0_0CSSFlexDirectionColumn);
      } else {
        // If the child doesn't have a specified height, compute the height based on the top/bottom offsets if they're defined.
        if (isPosDefined(currentAbsoluteChild, ABI8_0_0CSSPositionTop) && isPosDefined(currentAbsoluteChild, ABI8_0_0CSSPositionBottom)) {
          childHeight = node->layout.measuredDimensions[ABI8_0_0CSSDimensionHeight] -
            (getLeadingBorder(node, ABI8_0_0CSSFlexDirectionColumn) + getTrailingBorder(node, ABI8_0_0CSSFlexDirectionColumn)) -
            (currentAbsoluteChild->style.position[ABI8_0_0CSSPositionTop] + currentAbsoluteChild->style.position[ABI8_0_0CSSPositionBottom]);
          childHeight = boundAxis(currentAbsoluteChild, ABI8_0_0CSSFlexDirectionColumn, childHeight);
        }
      }

      // If we're still missing one or the other dimension, measure the content.
      if (isUndefined(childWidth) || isUndefined(childHeight)) {
        childWidthMeasureMode = isUndefined(childWidth) ? ABI8_0_0CSSMeasureModeUndefined : ABI8_0_0CSSMeasureModeExactly;
        childHeightMeasureMode = isUndefined(childHeight) ? ABI8_0_0CSSMeasureModeUndefined : ABI8_0_0CSSMeasureModeExactly;

        // According to the spec, if the main size is not definite and the
        // child's inline axis is parallel to the main axis (i.e. it's
        // horizontal), the child should be sized using "UNDEFINED" in
        // the main size. Otherwise use "AT_MOST" in the cross axis.
        if (!isMainAxisRow && isUndefined(childWidth) && !isUndefined(availableInnerWidth)) {
          childWidth = availableInnerWidth;
          childWidthMeasureMode = ABI8_0_0CSSMeasureModeAtMost;
        }

        // The W3C spec doesn't say anything about the 'overflow' property,
        // but all major browsers appear to implement the following logic.
        if (node->style.overflow == ABI8_0_0CSSOverflowHidden) {
          if (isMainAxisRow && isUndefined(childHeight) && !isUndefined(availableInnerHeight)) {
            childHeight = availableInnerHeight;
            childHeightMeasureMode = ABI8_0_0CSSMeasureModeAtMost;
          }
        }

        layoutNodeInternal(currentAbsoluteChild, childWidth, childHeight, direction, childWidthMeasureMode, childHeightMeasureMode, false, "abs-measure");
        childWidth = currentAbsoluteChild->layout.measuredDimensions[ABI8_0_0CSSDimensionWidth] + getMarginAxis(currentAbsoluteChild, ABI8_0_0CSSFlexDirectionRow);
        childHeight = currentAbsoluteChild->layout.measuredDimensions[ABI8_0_0CSSDimensionHeight] + getMarginAxis(currentAbsoluteChild, ABI8_0_0CSSFlexDirectionColumn);
      }

      layoutNodeInternal(currentAbsoluteChild, childWidth, childHeight, direction, ABI8_0_0CSSMeasureModeExactly, ABI8_0_0CSSMeasureModeExactly, true, "abs-layout");

      if (isPosDefined(currentAbsoluteChild, trailing[ABI8_0_0CSSFlexDirectionRow]) &&
          !isPosDefined(currentAbsoluteChild, leading[ABI8_0_0CSSFlexDirectionRow])) {
        currentAbsoluteChild->layout.position[leading[ABI8_0_0CSSFlexDirectionRow]] =
          node->layout.measuredDimensions[dim[ABI8_0_0CSSFlexDirectionRow]] -
          currentAbsoluteChild->layout.measuredDimensions[dim[ABI8_0_0CSSFlexDirectionRow]] -
          getPosition(currentAbsoluteChild, trailing[ABI8_0_0CSSFlexDirectionRow]);
      }

      if (isPosDefined(currentAbsoluteChild, trailing[ABI8_0_0CSSFlexDirectionColumn]) &&
          !isPosDefined(currentAbsoluteChild, leading[ABI8_0_0CSSFlexDirectionColumn])) {
        currentAbsoluteChild->layout.position[leading[ABI8_0_0CSSFlexDirectionColumn]] =
          node->layout.measuredDimensions[dim[ABI8_0_0CSSFlexDirectionColumn]] -
          currentAbsoluteChild->layout.measuredDimensions[dim[ABI8_0_0CSSFlexDirectionColumn]] -
          getPosition(currentAbsoluteChild, trailing[ABI8_0_0CSSFlexDirectionColumn]);
      }
    }

    currentAbsoluteChild = currentAbsoluteChild->nextChild;
  }
}

int gDepth = 0;
bool gPrintTree = false;
bool gPrintChanges = false;
bool gPrintSkips = false;

static const char* spacer = "                                                            ";

static const char* getSpacer(unsigned long level) {
  unsigned long spacerLen = strlen(spacer);
  if (level > spacerLen) {
    level = spacerLen;
  }
  return &spacer[spacerLen - level];
}

static const char* getModeName(ABI8_0_0CSSMeasureMode mode, bool performLayout) {
  const char* kMeasureModeNames[ABI8_0_0CSSMeasureModeCount] = {
    "UNDEFINED",
    "ABI8_0_0EXACTLY",
    "AT_MOST"
  };
  const char* kLayoutModeNames[ABI8_0_0CSSMeasureModeCount] = {
    "LAY_UNDEFINED",
    "LAY_EXACTLY",
    "LAY_AT_MOST"
  };

  if (mode >= ABI8_0_0CSSMeasureModeCount) {
    return "";
  }

  return performLayout? kLayoutModeNames[mode] : kMeasureModeNames[mode];
}

static bool canUseCachedMeasurement(
    bool isTextNode,
    float availableWidth,
    float availableHeight,
    float margin_row,
    float margin_column,
    ABI8_0_0CSSMeasureMode widthMeasureMode,
    ABI8_0_0CSSMeasureMode heightMeasureMode,
    ABI8_0_0CSSCachedMeasurement cached_layout) {

  bool is_height_same =
    (cached_layout.heightMeasureMode == ABI8_0_0CSSMeasureModeUndefined && heightMeasureMode == ABI8_0_0CSSMeasureModeUndefined) ||
      (cached_layout.heightMeasureMode == heightMeasureMode && eq(cached_layout.availableHeight, availableHeight));

  bool is_width_same =
    (cached_layout.widthMeasureMode == ABI8_0_0CSSMeasureModeUndefined && widthMeasureMode == ABI8_0_0CSSMeasureModeUndefined) ||
      (cached_layout.widthMeasureMode == widthMeasureMode && eq(cached_layout.availableWidth, availableWidth));

  if (is_height_same && is_width_same) {
    return true;
  }

  bool is_height_valid =
    (cached_layout.heightMeasureMode == ABI8_0_0CSSMeasureModeUndefined && heightMeasureMode == ABI8_0_0CSSMeasureModeAtMost && cached_layout.computedHeight <= (availableHeight - margin_column)) ||
      (heightMeasureMode == ABI8_0_0CSSMeasureModeExactly && eq(cached_layout.computedHeight, availableHeight - margin_column));

  if (is_width_same && is_height_valid) {
    return true;
  }

  bool is_width_valid =
    (cached_layout.widthMeasureMode == ABI8_0_0CSSMeasureModeUndefined && widthMeasureMode == ABI8_0_0CSSMeasureModeAtMost && cached_layout.computedWidth <= (availableWidth - margin_row)) ||
      (widthMeasureMode == ABI8_0_0CSSMeasureModeExactly && eq(cached_layout.computedWidth, availableWidth - margin_row));

  if (is_height_same && is_width_valid) {
    return true;
  }

  if (is_height_valid && is_width_valid) {
    return true;
  }

  // We know this to be text so we can apply some more specialized heuristics.
  if (isTextNode) {
    if (is_width_same) {
      if (heightMeasureMode == ABI8_0_0CSSMeasureModeUndefined) {
        // Width is the same and height is not restricted. Re-use cahced value.
        return true;
      }

      if (heightMeasureMode == ABI8_0_0CSSMeasureModeAtMost &&
          cached_layout.computedHeight < (availableHeight - margin_column)) {
        // Width is the same and height restriction is greater than the cached height. Re-use cached value.
        return true;
      }

      // Width is the same but height restriction imposes smaller height than previously measured.
      // Update the cached value to respect the new height restriction.
      cached_layout.computedHeight = availableHeight - margin_column;
      return true;
    }

    if (cached_layout.widthMeasureMode == ABI8_0_0CSSMeasureModeUndefined) {
      if (widthMeasureMode == ABI8_0_0CSSMeasureModeUndefined ||
           (widthMeasureMode == ABI8_0_0CSSMeasureModeAtMost &&
            cached_layout.computedWidth <= (availableWidth - margin_row))) {
        // Previsouly this text was measured with no width restriction, if width is now restricted
        // but to a larger value than the previsouly measured width we can re-use the measurement
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
bool layoutNodeInternal(ABI8_0_0CSSNode* node, float availableWidth, float availableHeight,
    ABI8_0_0CSSDirection parentDirection, ABI8_0_0CSSMeasureMode widthMeasureMode, ABI8_0_0CSSMeasureMode heightMeasureMode, bool performLayout, char* reason) {
  ABI8_0_0CSSLayout* layout = &node->layout;

  gDepth++;

  bool needToVisitNode = (node->isDirty(node->context) && layout->generationCount != gCurrentGenerationCount) ||
    layout->lastParentDirection != parentDirection;

  if (needToVisitNode) {
    // Invalidate the cached results.
    layout->nextCachedMeasurementsIndex = 0;
    layout->cached_layout.widthMeasureMode = (ABI8_0_0CSSMeasureMode)-1;
    layout->cached_layout.heightMeasureMode = (ABI8_0_0CSSMeasureMode)-1;
  }

  ABI8_0_0CSSCachedMeasurement* cachedResults = NULL;

  // Determine whether the results are already cached. We maintain a separate
  // cache for layouts and measurements. A layout operation modifies the positions
  // and dimensions for nodes in the subtree. The algorithm assumes that each node
  // gets layed out a maximum of one time per tree layout, but multiple measurements
  // may be required to resolve all of the flex dimensions.
  // We handle nodes with measure functions specially here because they are the most
  // expensive to measure, so it's worth avoiding redundant measurements if at all possible.
  if (isMeasureDefined(node)) {
    float marginAxisRow = getMarginAxis(node, ABI8_0_0CSSFlexDirectionRow);
    float marginAxisColumn = getMarginAxis(node, ABI8_0_0CSSFlexDirectionColumn);

    // First, try to use the layout cache.
    if (canUseCachedMeasurement(node->isTextNode, availableWidth, availableHeight, marginAxisRow, marginAxisColumn,
        widthMeasureMode, heightMeasureMode, layout->cached_layout)) {
      cachedResults = &layout->cached_layout;
    } else {
      // Try to use the measurement cache.
      for (int i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
        if (canUseCachedMeasurement(node->isTextNode, availableWidth, availableHeight, marginAxisRow, marginAxisColumn,
            widthMeasureMode, heightMeasureMode, layout->cachedMeasurements[i])) {
          cachedResults = &layout->cachedMeasurements[i];
          break;
        }
      }
    }
  } else if (performLayout) {
    if (eq(layout->cached_layout.availableWidth, availableWidth) &&
        eq(layout->cached_layout.availableHeight, availableHeight) &&
        layout->cached_layout.widthMeasureMode == widthMeasureMode &&
        layout->cached_layout.heightMeasureMode == heightMeasureMode) {

      cachedResults = &layout->cached_layout;
    }
  } else {
    for (int i = 0; i < layout->nextCachedMeasurementsIndex; i++) {
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
    layout->measuredDimensions[ABI8_0_0CSSDimensionWidth] = cachedResults->computedWidth;
    layout->measuredDimensions[ABI8_0_0CSSDimensionHeight] = cachedResults->computedHeight;

    if (gPrintChanges && gPrintSkips) {
      printf("%s%d.{[skipped] ", getSpacer(gDepth), gDepth);
      if (node->print) {
        node->print(node->context);
      }
      printf("wm: %s, hm: %s, aw: %f ah: %f => d: (%f, %f) %s\n",
        getModeName(widthMeasureMode, performLayout),
        getModeName(heightMeasureMode, performLayout),
        availableWidth, availableHeight,
        cachedResults->computedWidth, cachedResults->computedHeight, reason);
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
        availableWidth, availableHeight, reason);
    }

    layoutNodeImpl(node, availableWidth, availableHeight, parentDirection, widthMeasureMode, heightMeasureMode, performLayout);

    if (gPrintChanges) {
      printf("%s%d.}%s", getSpacer(gDepth), gDepth, needToVisitNode ? "*" : "");
      if (node->print) {
        node->print(node->context);
      }
      printf("wm: %s, hm: %s, d: (%f, %f) %s\n",
        getModeName(widthMeasureMode, performLayout),
        getModeName(heightMeasureMode, performLayout),
        layout->measuredDimensions[ABI8_0_0CSSDimensionWidth], layout->measuredDimensions[ABI8_0_0CSSDimensionHeight], reason);
    }

    layout->lastParentDirection = parentDirection;

    if (cachedResults == NULL) {
      if (layout->nextCachedMeasurementsIndex == ABI8_0_0CSS_MAX_CACHED_RESULT_COUNT) {
        if (gPrintChanges) {
          printf("Out of cache entries!\n");
        }
        layout->nextCachedMeasurementsIndex = 0;
      }

      ABI8_0_0CSSCachedMeasurement* newCacheEntry;
      if (performLayout) {
        // Use the single layout cache entry.
        newCacheEntry = &layout->cached_layout;
      } else {
        // Allocate a new measurement cache entry.
        newCacheEntry = &layout->cachedMeasurements[layout->nextCachedMeasurementsIndex];
        layout->nextCachedMeasurementsIndex++;
      }

      newCacheEntry->availableWidth = availableWidth;
      newCacheEntry->availableHeight = availableHeight;
      newCacheEntry->widthMeasureMode = widthMeasureMode;
      newCacheEntry->heightMeasureMode = heightMeasureMode;
      newCacheEntry->computedWidth = layout->measuredDimensions[ABI8_0_0CSSDimensionWidth];
      newCacheEntry->computedHeight = layout->measuredDimensions[ABI8_0_0CSSDimensionHeight];
    }
  }

  if (performLayout) {
    node->layout.dimensions[ABI8_0_0CSSDimensionWidth] = node->layout.measuredDimensions[ABI8_0_0CSSDimensionWidth];
    node->layout.dimensions[ABI8_0_0CSSDimensionHeight] = node->layout.measuredDimensions[ABI8_0_0CSSDimensionHeight];
    node->shouldUpdate = true;
  }

  gDepth--;
  layout->generationCount = gCurrentGenerationCount;
  return (needToVisitNode || cachedResults == NULL);
}

void ABI8_0_0CSSNodeCalculateLayout(ABI8_0_0CSSNode* node, float availableWidth, float availableHeight, ABI8_0_0CSSDirection parentDirection) {
  // Increment the generation count. This will force the recursive routine to visit
  // all dirty nodes at least once. Subsequent visits will be skipped if the input
  // parameters don't change.
  gCurrentGenerationCount++;

  ABI8_0_0CSSMeasureMode widthMeasureMode = ABI8_0_0CSSMeasureModeUndefined;
  ABI8_0_0CSSMeasureMode heightMeasureMode = ABI8_0_0CSSMeasureModeUndefined;

  if (!isUndefined(availableWidth)) {
    widthMeasureMode = ABI8_0_0CSSMeasureModeExactly;
  } else if (isStyleDimDefined(node, ABI8_0_0CSSFlexDirectionRow)) {
    availableWidth = node->style.dimensions[dim[ABI8_0_0CSSFlexDirectionRow]] + getMarginAxis(node, ABI8_0_0CSSFlexDirectionRow);
    widthMeasureMode = ABI8_0_0CSSMeasureModeExactly;
  } else if (node->style.maxDimensions[ABI8_0_0CSSDimensionWidth] >= 0.0) {
    availableWidth = node->style.maxDimensions[ABI8_0_0CSSDimensionWidth];
    widthMeasureMode = ABI8_0_0CSSMeasureModeAtMost;
  }

  if (!isUndefined(availableHeight)) {
    heightMeasureMode = ABI8_0_0CSSMeasureModeExactly;
  } else if (isStyleDimDefined(node, ABI8_0_0CSSFlexDirectionColumn)) {
    availableHeight = node->style.dimensions[dim[ABI8_0_0CSSFlexDirectionColumn]] + getMarginAxis(node, ABI8_0_0CSSFlexDirectionColumn);
    heightMeasureMode = ABI8_0_0CSSMeasureModeExactly;
  } else if (node->style.maxDimensions[ABI8_0_0CSSDimensionHeight] >= 0.0) {
    availableHeight = node->style.maxDimensions[ABI8_0_0CSSDimensionHeight];
    heightMeasureMode = ABI8_0_0CSSMeasureModeAtMost;
  }

  if (layoutNodeInternal(node, availableWidth, availableHeight, parentDirection, widthMeasureMode, heightMeasureMode, true, "initial")) {

    setPosition(node, node->layout.direction);

    if (gPrintTree) {
      ABI8_0_0CSSNodePrint(node, ABI8_0_0CSSPrintOptionsLayout | ABI8_0_0CSSPrintOptionsChildren | ABI8_0_0CSSPrintOptionsStyle);
    }
  }
}
