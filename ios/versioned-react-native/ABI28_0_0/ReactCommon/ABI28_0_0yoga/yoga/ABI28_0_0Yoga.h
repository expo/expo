/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <assert.h>
#include <math.h>
#include <stdarg.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

/** Large positive number signifies that the property(float) is undefined.
 *Earlier we used to have ABI28_0_0YGundefined as NAN, but the downside of this is that
 *we can't use -ffast-math compiler flag as it assumes all floating-point
 *calculation involve and result into finite numbers. For more information
 *regarding -ffast-math compiler flag in clang, have a look at
 *https://clang.llvm.org/docs/UsersManual.html#cmdoption-ffast-math
 **/
#define ABI28_0_0YGUndefined 10E20F

#include "ABI28_0_0YGEnums.h"
#include "ABI28_0_0YGMacros.h"

ABI28_0_0YG_EXTERN_C_BEGIN

typedef struct ABI28_0_0YGSize {
  float width;
  float height;
} ABI28_0_0YGSize;

typedef struct ABI28_0_0YGValue {
  float value;
  ABI28_0_0YGUnit unit;
} ABI28_0_0YGValue;

extern const ABI28_0_0YGValue ABI28_0_0YGValueUndefined;
extern const ABI28_0_0YGValue ABI28_0_0YGValueAuto;

typedef struct ABI28_0_0YGConfig *ABI28_0_0YGConfigRef;

typedef struct ABI28_0_0YGNode* ABI28_0_0YGNodeRef;

typedef ABI28_0_0YGSize (*ABI28_0_0YGMeasureFunc)(ABI28_0_0YGNodeRef node,
                                float width,
                                ABI28_0_0YGMeasureMode widthMode,
                                float height,
                                ABI28_0_0YGMeasureMode heightMode);
typedef float (*ABI28_0_0YGBaselineFunc)(ABI28_0_0YGNodeRef node, const float width, const float height);
typedef void (*ABI28_0_0YGDirtiedFunc)(ABI28_0_0YGNodeRef node);
typedef void (*ABI28_0_0YGPrintFunc)(ABI28_0_0YGNodeRef node);
typedef int (*ABI28_0_0YGLogger)(const ABI28_0_0YGConfigRef config,
                        const ABI28_0_0YGNodeRef node,
                        ABI28_0_0YGLogLevel level,
                        const char *format,
                        va_list args);
typedef void (*ABI28_0_0YGNodeClonedFunc)(ABI28_0_0YGNodeRef oldNode,
                                 ABI28_0_0YGNodeRef newNode,
                                 ABI28_0_0YGNodeRef parent,
                                 int childIndex);

// ABI28_0_0YGNode
WIN_EXPORT ABI28_0_0YGNodeRef ABI28_0_0YGNodeNew(void);
WIN_EXPORT ABI28_0_0YGNodeRef ABI28_0_0YGNodeNewWithConfig(const ABI28_0_0YGConfigRef config);
WIN_EXPORT ABI28_0_0YGNodeRef ABI28_0_0YGNodeClone(const ABI28_0_0YGNodeRef node);
WIN_EXPORT void ABI28_0_0YGNodeFree(const ABI28_0_0YGNodeRef node);
WIN_EXPORT void ABI28_0_0YGNodeFreeRecursive(const ABI28_0_0YGNodeRef node);
WIN_EXPORT void ABI28_0_0YGNodeReset(const ABI28_0_0YGNodeRef node);
WIN_EXPORT int32_t ABI28_0_0YGNodeGetInstanceCount(void);

WIN_EXPORT void ABI28_0_0YGNodeInsertChild(const ABI28_0_0YGNodeRef node,
                                  const ABI28_0_0YGNodeRef child,
                                  const uint32_t index);
WIN_EXPORT void ABI28_0_0YGNodeRemoveChild(const ABI28_0_0YGNodeRef node, const ABI28_0_0YGNodeRef child);
WIN_EXPORT void ABI28_0_0YGNodeRemoveAllChildren(const ABI28_0_0YGNodeRef node);
WIN_EXPORT ABI28_0_0YGNodeRef ABI28_0_0YGNodeGetChild(const ABI28_0_0YGNodeRef node, const uint32_t index);
WIN_EXPORT ABI28_0_0YGNodeRef ABI28_0_0YGNodeGetParent(const ABI28_0_0YGNodeRef node);
WIN_EXPORT uint32_t ABI28_0_0YGNodeGetChildCount(const ABI28_0_0YGNodeRef node);

WIN_EXPORT void ABI28_0_0YGNodeCalculateLayout(const ABI28_0_0YGNodeRef node,
                                      const float availableWidth,
                                      const float availableHeight,
                                      const ABI28_0_0YGDirection parentDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
// ABI28_0_0YG knows when to mark all other nodes as dirty but because nodes with
// measure functions
// depends on information not known to ABI28_0_0YG they must perform this dirty
// marking manually.
WIN_EXPORT void ABI28_0_0YGNodeMarkDirty(const ABI28_0_0YGNodeRef node);

// This function marks the current node and all its descendants as dirty. This function is added to test yoga benchmarks.
// This function is not expected to be used in production as calling `ABI28_0_0YGCalculateLayout` will cause the recalculation of each and every node.
WIN_EXPORT void ABI28_0_0YGNodeMarkDirtyAndPropogateToDescendants(const ABI28_0_0YGNodeRef node);

WIN_EXPORT void ABI28_0_0YGNodePrint(const ABI28_0_0YGNodeRef node, const ABI28_0_0YGPrintOptions options);

WIN_EXPORT bool ABI28_0_0YGFloatIsUndefined(const float value);

WIN_EXPORT bool ABI28_0_0YGNodeCanUseCachedMeasurement(const ABI28_0_0YGMeasureMode widthMode,
                                              const float width,
                                              const ABI28_0_0YGMeasureMode heightMode,
                                              const float height,
                                              const ABI28_0_0YGMeasureMode lastWidthMode,
                                              const float lastWidth,
                                              const ABI28_0_0YGMeasureMode lastHeightMode,
                                              const float lastHeight,
                                              const float lastComputedWidth,
                                              const float lastComputedHeight,
                                              const float marginRow,
                                              const float marginColumn,
                                              const ABI28_0_0YGConfigRef config);

WIN_EXPORT void ABI28_0_0YGNodeCopyStyle(const ABI28_0_0YGNodeRef dstNode, const ABI28_0_0YGNodeRef srcNode);

#define ABI28_0_0YG_NODE_PROPERTY(type, name, paramName)                          \
  WIN_EXPORT void ABI28_0_0YGNodeSet##name(const ABI28_0_0YGNodeRef node, type paramName); \
  WIN_EXPORT type ABI28_0_0YGNodeGet##name(const ABI28_0_0YGNodeRef node);

#define ABI28_0_0YG_NODE_STYLE_PROPERTY(type, name, paramName)                               \
  WIN_EXPORT void ABI28_0_0YGNodeStyleSet##name(const ABI28_0_0YGNodeRef node, const type paramName); \
  WIN_EXPORT type ABI28_0_0YGNodeStyleGet##name(const ABI28_0_0YGNodeRef node);

#define ABI28_0_0YG_NODE_STYLE_PROPERTY_UNIT(type, name, paramName)                                    \
  WIN_EXPORT void ABI28_0_0YGNodeStyleSet##name(const ABI28_0_0YGNodeRef node, const float paramName);          \
  WIN_EXPORT void ABI28_0_0YGNodeStyleSet##name##Percent(const ABI28_0_0YGNodeRef node, const float paramName); \
  WIN_EXPORT type ABI28_0_0YGNodeStyleGet##name(const ABI28_0_0YGNodeRef node);

#define ABI28_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO(type, name, paramName) \
  ABI28_0_0YG_NODE_STYLE_PROPERTY_UNIT(type, name, paramName)            \
  WIN_EXPORT void ABI28_0_0YGNodeStyleSet##name##Auto(const ABI28_0_0YGNodeRef node);

#define ABI28_0_0YG_NODE_STYLE_EDGE_PROPERTY(type, name, paramName)    \
  WIN_EXPORT void ABI28_0_0YGNodeStyleSet##name(const ABI28_0_0YGNodeRef node,  \
                                       const ABI28_0_0YGEdge edge,     \
                                       const type paramName); \
  WIN_EXPORT type ABI28_0_0YGNodeStyleGet##name(const ABI28_0_0YGNodeRef node, const ABI28_0_0YGEdge edge);

#define ABI28_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(type, name, paramName)         \
  WIN_EXPORT void ABI28_0_0YGNodeStyleSet##name(const ABI28_0_0YGNodeRef node,            \
                                       const ABI28_0_0YGEdge edge,               \
                                       const float paramName);          \
  WIN_EXPORT void ABI28_0_0YGNodeStyleSet##name##Percent(const ABI28_0_0YGNodeRef node,   \
                                                const ABI28_0_0YGEdge edge,      \
                                                const float paramName); \
  WIN_EXPORT WIN_STRUCT(type) ABI28_0_0YGNodeStyleGet##name(const ABI28_0_0YGNodeRef node, const ABI28_0_0YGEdge edge);

#define ABI28_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO(type, name) \
  WIN_EXPORT void ABI28_0_0YGNodeStyleSet##name##Auto(const ABI28_0_0YGNodeRef node, const ABI28_0_0YGEdge edge);

#define ABI28_0_0YG_NODE_LAYOUT_PROPERTY(type, name) \
  WIN_EXPORT type ABI28_0_0YGNodeLayoutGet##name(const ABI28_0_0YGNodeRef node);

#define ABI28_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(type, name) \
  WIN_EXPORT type ABI28_0_0YGNodeLayoutGet##name(const ABI28_0_0YGNodeRef node, const ABI28_0_0YGEdge edge);

void* ABI28_0_0YGNodeGetContext(ABI28_0_0YGNodeRef node);
void ABI28_0_0YGNodeSetContext(ABI28_0_0YGNodeRef node, void* context);
ABI28_0_0YGMeasureFunc ABI28_0_0YGNodeGetMeasureFunc(ABI28_0_0YGNodeRef node);
void ABI28_0_0YGNodeSetMeasureFunc(ABI28_0_0YGNodeRef node, ABI28_0_0YGMeasureFunc measureFunc);
ABI28_0_0YGBaselineFunc ABI28_0_0YGNodeGetBaselineFunc(ABI28_0_0YGNodeRef node);
void ABI28_0_0YGNodeSetBaselineFunc(ABI28_0_0YGNodeRef node, ABI28_0_0YGBaselineFunc baselineFunc);
ABI28_0_0YGDirtiedFunc ABI28_0_0YGNodeGetDirtiedFunc(ABI28_0_0YGNodeRef node);
void ABI28_0_0YGNodeSetDirtiedFunc(ABI28_0_0YGNodeRef node, ABI28_0_0YGDirtiedFunc dirtiedFunc);
ABI28_0_0YGPrintFunc ABI28_0_0YGNodeGetPrintFunc(ABI28_0_0YGNodeRef node);
void ABI28_0_0YGNodeSetPrintFunc(ABI28_0_0YGNodeRef node, ABI28_0_0YGPrintFunc printFunc);
bool ABI28_0_0YGNodeGetHasNewLayout(ABI28_0_0YGNodeRef node);
void ABI28_0_0YGNodeSetHasNewLayout(ABI28_0_0YGNodeRef node, bool hasNewLayout);
ABI28_0_0YGNodeType ABI28_0_0YGNodeGetNodeType(ABI28_0_0YGNodeRef node);
void ABI28_0_0YGNodeSetNodeType(ABI28_0_0YGNodeRef node, ABI28_0_0YGNodeType nodeType);
bool ABI28_0_0YGNodeIsDirty(ABI28_0_0YGNodeRef node);
bool ABI28_0_0YGNodeLayoutGetDidUseLegacyFlag(const ABI28_0_0YGNodeRef node);

ABI28_0_0YG_NODE_STYLE_PROPERTY(ABI28_0_0YGDirection, Direction, direction);
ABI28_0_0YG_NODE_STYLE_PROPERTY(ABI28_0_0YGFlexDirection, FlexDirection, flexDirection);
ABI28_0_0YG_NODE_STYLE_PROPERTY(ABI28_0_0YGJustify, JustifyContent, justifyContent);
ABI28_0_0YG_NODE_STYLE_PROPERTY(ABI28_0_0YGAlign, AlignContent, alignContent);
ABI28_0_0YG_NODE_STYLE_PROPERTY(ABI28_0_0YGAlign, AlignItems, alignItems);
ABI28_0_0YG_NODE_STYLE_PROPERTY(ABI28_0_0YGAlign, AlignSelf, alignSelf);
ABI28_0_0YG_NODE_STYLE_PROPERTY(ABI28_0_0YGPositionType, PositionType, positionType);
ABI28_0_0YG_NODE_STYLE_PROPERTY(ABI28_0_0YGWrap, FlexWrap, flexWrap);
ABI28_0_0YG_NODE_STYLE_PROPERTY(ABI28_0_0YGOverflow, Overflow, overflow);
ABI28_0_0YG_NODE_STYLE_PROPERTY(ABI28_0_0YGDisplay, Display, display);

ABI28_0_0YG_NODE_STYLE_PROPERTY(float, Flex, flex);
ABI28_0_0YG_NODE_STYLE_PROPERTY(float, FlexGrow, flexGrow);
ABI28_0_0YG_NODE_STYLE_PROPERTY(float, FlexShrink, flexShrink);
ABI28_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO(ABI28_0_0YGValue, FlexBasis, flexBasis);

ABI28_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(ABI28_0_0YGValue, Position, position);
ABI28_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(ABI28_0_0YGValue, Margin, margin);
ABI28_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO(ABI28_0_0YGValue, Margin);
ABI28_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(ABI28_0_0YGValue, Padding, padding);
ABI28_0_0YG_NODE_STYLE_EDGE_PROPERTY(float, Border, border);

ABI28_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO(ABI28_0_0YGValue, Width, width);
ABI28_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO(ABI28_0_0YGValue, Height, height);
ABI28_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI28_0_0YGValue, MinWidth, minWidth);
ABI28_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI28_0_0YGValue, MinHeight, minHeight);
ABI28_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI28_0_0YGValue, MaxWidth, maxWidth);
ABI28_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI28_0_0YGValue, MaxHeight, maxHeight);

// Yoga specific properties, not compatible with flexbox specification
// Aspect ratio control the size of the undefined dimension of a node.
// Aspect ratio is encoded as a floating point value width/height. e.g. A value of 2 leads to a node
// with a width twice the size of its height while a value of 0.5 gives the opposite effect.
//
// - On a node with a set width/height aspect ratio control the size of the unset dimension
// - On a node with a set flex basis aspect ratio controls the size of the node in the cross axis if
// unset
// - On a node with a measure function aspect ratio works as though the measure function measures
// the flex basis
// - On a node with flex grow/shrink aspect ratio controls the size of the node in the cross axis if
// unset
// - Aspect ratio takes min/max dimensions into account
ABI28_0_0YG_NODE_STYLE_PROPERTY(float, AspectRatio, aspectRatio);

ABI28_0_0YG_NODE_LAYOUT_PROPERTY(float, Left);
ABI28_0_0YG_NODE_LAYOUT_PROPERTY(float, Top);
ABI28_0_0YG_NODE_LAYOUT_PROPERTY(float, Right);
ABI28_0_0YG_NODE_LAYOUT_PROPERTY(float, Bottom);
ABI28_0_0YG_NODE_LAYOUT_PROPERTY(float, Width);
ABI28_0_0YG_NODE_LAYOUT_PROPERTY(float, Height);
ABI28_0_0YG_NODE_LAYOUT_PROPERTY(ABI28_0_0YGDirection, Direction);
ABI28_0_0YG_NODE_LAYOUT_PROPERTY(bool, HadOverflow);

// Get the computed values for these nodes after performing layout. If they were set using
// point values then the returned value will be the same as ABI28_0_0YGNodeStyleGetXXX. However if
// they were set using a percentage value then the returned value is the computed value used
// during layout.
ABI28_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(float, Margin);
ABI28_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(float, Border);
ABI28_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(float, Padding);

WIN_EXPORT void ABI28_0_0YGConfigSetLogger(const ABI28_0_0YGConfigRef config, ABI28_0_0YGLogger logger);
WIN_EXPORT void ABI28_0_0YGLog(const ABI28_0_0YGNodeRef node, ABI28_0_0YGLogLevel level, const char *message, ...);
WIN_EXPORT void ABI28_0_0YGLogWithConfig(const ABI28_0_0YGConfigRef config, ABI28_0_0YGLogLevel level, const char *format, ...);
WIN_EXPORT void ABI28_0_0YGAssert(const bool condition, const char *message);
WIN_EXPORT void ABI28_0_0YGAssertWithNode(const ABI28_0_0YGNodeRef node, const bool condition, const char *message);
WIN_EXPORT void ABI28_0_0YGAssertWithConfig(const ABI28_0_0YGConfigRef config,
                                   const bool condition,
                                   const char *message);

// Set this to number of pixels in 1 point to round calculation results
// If you want to avoid rounding - set PointScaleFactor to 0
WIN_EXPORT void ABI28_0_0YGConfigSetPointScaleFactor(const ABI28_0_0YGConfigRef config, const float pixelsInPoint);

// Yoga previously had an error where containers would take the maximum space possible instead of
// the minimum
// like they are supposed to. In practice this resulted in implicit behaviour similar to align-self:
// stretch;
// Because this was such a long-standing bug we must allow legacy users to switch back to this
// behaviour.
WIN_EXPORT void ABI28_0_0YGConfigSetUseLegacyStretchBehaviour(const ABI28_0_0YGConfigRef config,
                                                     const bool useLegacyStretchBehaviour);

// ABI28_0_0YGConfig
WIN_EXPORT ABI28_0_0YGConfigRef ABI28_0_0YGConfigNew(void);
WIN_EXPORT void ABI28_0_0YGConfigFree(const ABI28_0_0YGConfigRef config);
WIN_EXPORT void ABI28_0_0YGConfigCopy(const ABI28_0_0YGConfigRef dest, const ABI28_0_0YGConfigRef src);
WIN_EXPORT int32_t ABI28_0_0YGConfigGetInstanceCount(void);

WIN_EXPORT void ABI28_0_0YGConfigSetExperimentalFeatureEnabled(const ABI28_0_0YGConfigRef config,
                                                      const ABI28_0_0YGExperimentalFeature feature,
                                                      const bool enabled);
WIN_EXPORT bool ABI28_0_0YGConfigIsExperimentalFeatureEnabled(const ABI28_0_0YGConfigRef config,
                                                     const ABI28_0_0YGExperimentalFeature feature);

// Using the web defaults is the prefered configuration for new projects.
// Usage of non web defaults should be considered as legacy.
WIN_EXPORT void ABI28_0_0YGConfigSetUseWebDefaults(const ABI28_0_0YGConfigRef config, const bool enabled);
WIN_EXPORT bool ABI28_0_0YGConfigGetUseWebDefaults(const ABI28_0_0YGConfigRef config);

WIN_EXPORT void ABI28_0_0YGConfigSetNodeClonedFunc(const ABI28_0_0YGConfigRef config,
                                          const ABI28_0_0YGNodeClonedFunc callback);

// Export only for C#
WIN_EXPORT ABI28_0_0YGConfigRef ABI28_0_0YGConfigGetDefault(void);

WIN_EXPORT void ABI28_0_0YGConfigSetContext(const ABI28_0_0YGConfigRef config, void *context);
WIN_EXPORT void *ABI28_0_0YGConfigGetContext(const ABI28_0_0YGConfigRef config);

WIN_EXPORT float ABI28_0_0YGRoundValueToPixelGrid(
    const float value,
    const float pointScaleFactor,
    const bool forceCeil,
    const bool forceFloor);

ABI28_0_0YG_EXTERN_C_END
