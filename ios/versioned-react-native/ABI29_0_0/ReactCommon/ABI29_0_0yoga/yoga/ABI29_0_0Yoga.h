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
 *Earlier we used to have ABI29_0_0YGundefined as NAN, but the downside of this is that
 *we can't use -ffast-math compiler flag as it assumes all floating-point
 *calculation involve and result into finite numbers. For more information
 *regarding -ffast-math compiler flag in clang, have a look at
 *https://clang.llvm.org/docs/UsersManual.html#cmdoption-ffast-math
 **/
#define ABI29_0_0YGUndefined 10E20F

#include "ABI29_0_0YGEnums.h"
#include "ABI29_0_0YGMacros.h"

ABI29_0_0YG_EXTERN_C_BEGIN

typedef struct ABI29_0_0YGSize {
  float width;
  float height;
} ABI29_0_0YGSize;

typedef struct ABI29_0_0YGValue {
  float value;
  ABI29_0_0YGUnit unit;
} ABI29_0_0YGValue;

extern const ABI29_0_0YGValue ABI29_0_0YGValueUndefined;
extern const ABI29_0_0YGValue ABI29_0_0YGValueAuto;

typedef struct ABI29_0_0YGConfig *ABI29_0_0YGConfigRef;

typedef struct ABI29_0_0YGNode* ABI29_0_0YGNodeRef;

typedef ABI29_0_0YGSize (*ABI29_0_0YGMeasureFunc)(ABI29_0_0YGNodeRef node,
                                float width,
                                ABI29_0_0YGMeasureMode widthMode,
                                float height,
                                ABI29_0_0YGMeasureMode heightMode);
typedef float (*ABI29_0_0YGBaselineFunc)(ABI29_0_0YGNodeRef node, const float width, const float height);
typedef void (*ABI29_0_0YGDirtiedFunc)(ABI29_0_0YGNodeRef node);
typedef void (*ABI29_0_0YGPrintFunc)(ABI29_0_0YGNodeRef node);
typedef int (*ABI29_0_0YGLogger)(const ABI29_0_0YGConfigRef config,
                        const ABI29_0_0YGNodeRef node,
                        ABI29_0_0YGLogLevel level,
                        const char *format,
                        va_list args);
typedef void (*ABI29_0_0YGNodeClonedFunc)(ABI29_0_0YGNodeRef oldNode,
                                 ABI29_0_0YGNodeRef newNode,
                                 ABI29_0_0YGNodeRef parent,
                                 int childIndex);

// ABI29_0_0YGNode
WIN_EXPORT ABI29_0_0YGNodeRef ABI29_0_0YGNodeNew(void);
WIN_EXPORT ABI29_0_0YGNodeRef ABI29_0_0YGNodeNewWithConfig(const ABI29_0_0YGConfigRef config);
WIN_EXPORT ABI29_0_0YGNodeRef ABI29_0_0YGNodeClone(const ABI29_0_0YGNodeRef node);
WIN_EXPORT void ABI29_0_0YGNodeFree(const ABI29_0_0YGNodeRef node);
WIN_EXPORT void ABI29_0_0YGNodeFreeRecursive(const ABI29_0_0YGNodeRef node);
WIN_EXPORT void ABI29_0_0YGNodeReset(const ABI29_0_0YGNodeRef node);
WIN_EXPORT int32_t ABI29_0_0YGNodeGetInstanceCount(void);

WIN_EXPORT void ABI29_0_0YGNodeInsertChild(const ABI29_0_0YGNodeRef node,
                                  const ABI29_0_0YGNodeRef child,
                                  const uint32_t index);
WIN_EXPORT void ABI29_0_0YGNodeRemoveChild(const ABI29_0_0YGNodeRef node, const ABI29_0_0YGNodeRef child);
WIN_EXPORT void ABI29_0_0YGNodeRemoveAllChildren(const ABI29_0_0YGNodeRef node);
WIN_EXPORT ABI29_0_0YGNodeRef ABI29_0_0YGNodeGetChild(const ABI29_0_0YGNodeRef node, const uint32_t index);
WIN_EXPORT ABI29_0_0YGNodeRef ABI29_0_0YGNodeGetParent(const ABI29_0_0YGNodeRef node);
WIN_EXPORT uint32_t ABI29_0_0YGNodeGetChildCount(const ABI29_0_0YGNodeRef node);

WIN_EXPORT void ABI29_0_0YGNodeCalculateLayout(const ABI29_0_0YGNodeRef node,
                                      const float availableWidth,
                                      const float availableHeight,
                                      const ABI29_0_0YGDirection parentDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
// ABI29_0_0YG knows when to mark all other nodes as dirty but because nodes with
// measure functions
// depends on information not known to ABI29_0_0YG they must perform this dirty
// marking manually.
WIN_EXPORT void ABI29_0_0YGNodeMarkDirty(const ABI29_0_0YGNodeRef node);

// This function marks the current node and all its descendants as dirty. This function is added to test yoga benchmarks.
// This function is not expected to be used in production as calling `ABI29_0_0YGCalculateLayout` will cause the recalculation of each and every node.
WIN_EXPORT void ABI29_0_0YGNodeMarkDirtyAndPropogateToDescendants(const ABI29_0_0YGNodeRef node);

WIN_EXPORT void ABI29_0_0YGNodePrint(const ABI29_0_0YGNodeRef node, const ABI29_0_0YGPrintOptions options);

WIN_EXPORT bool ABI29_0_0YGFloatIsUndefined(const float value);

WIN_EXPORT bool ABI29_0_0YGNodeCanUseCachedMeasurement(const ABI29_0_0YGMeasureMode widthMode,
                                              const float width,
                                              const ABI29_0_0YGMeasureMode heightMode,
                                              const float height,
                                              const ABI29_0_0YGMeasureMode lastWidthMode,
                                              const float lastWidth,
                                              const ABI29_0_0YGMeasureMode lastHeightMode,
                                              const float lastHeight,
                                              const float lastComputedWidth,
                                              const float lastComputedHeight,
                                              const float marginRow,
                                              const float marginColumn,
                                              const ABI29_0_0YGConfigRef config);

WIN_EXPORT void ABI29_0_0YGNodeCopyStyle(const ABI29_0_0YGNodeRef dstNode, const ABI29_0_0YGNodeRef srcNode);

#define ABI29_0_0YG_NODE_PROPERTY(type, name, paramName)                          \
  WIN_EXPORT void ABI29_0_0YGNodeSet##name(const ABI29_0_0YGNodeRef node, type paramName); \
  WIN_EXPORT type ABI29_0_0YGNodeGet##name(const ABI29_0_0YGNodeRef node);

#define ABI29_0_0YG_NODE_STYLE_PROPERTY(type, name, paramName)                               \
  WIN_EXPORT void ABI29_0_0YGNodeStyleSet##name(const ABI29_0_0YGNodeRef node, const type paramName); \
  WIN_EXPORT type ABI29_0_0YGNodeStyleGet##name(const ABI29_0_0YGNodeRef node);

#define ABI29_0_0YG_NODE_STYLE_PROPERTY_UNIT(type, name, paramName)                                    \
  WIN_EXPORT void ABI29_0_0YGNodeStyleSet##name(const ABI29_0_0YGNodeRef node, const float paramName);          \
  WIN_EXPORT void ABI29_0_0YGNodeStyleSet##name##Percent(const ABI29_0_0YGNodeRef node, const float paramName); \
  WIN_EXPORT type ABI29_0_0YGNodeStyleGet##name(const ABI29_0_0YGNodeRef node);

#define ABI29_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO(type, name, paramName) \
  ABI29_0_0YG_NODE_STYLE_PROPERTY_UNIT(type, name, paramName)            \
  WIN_EXPORT void ABI29_0_0YGNodeStyleSet##name##Auto(const ABI29_0_0YGNodeRef node);

#define ABI29_0_0YG_NODE_STYLE_EDGE_PROPERTY(type, name, paramName)    \
  WIN_EXPORT void ABI29_0_0YGNodeStyleSet##name(const ABI29_0_0YGNodeRef node,  \
                                       const ABI29_0_0YGEdge edge,     \
                                       const type paramName); \
  WIN_EXPORT type ABI29_0_0YGNodeStyleGet##name(const ABI29_0_0YGNodeRef node, const ABI29_0_0YGEdge edge);

#define ABI29_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(type, name, paramName)         \
  WIN_EXPORT void ABI29_0_0YGNodeStyleSet##name(const ABI29_0_0YGNodeRef node,            \
                                       const ABI29_0_0YGEdge edge,               \
                                       const float paramName);          \
  WIN_EXPORT void ABI29_0_0YGNodeStyleSet##name##Percent(const ABI29_0_0YGNodeRef node,   \
                                                const ABI29_0_0YGEdge edge,      \
                                                const float paramName); \
  WIN_EXPORT WIN_STRUCT(type) ABI29_0_0YGNodeStyleGet##name(const ABI29_0_0YGNodeRef node, const ABI29_0_0YGEdge edge);

#define ABI29_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO(type, name) \
  WIN_EXPORT void ABI29_0_0YGNodeStyleSet##name##Auto(const ABI29_0_0YGNodeRef node, const ABI29_0_0YGEdge edge);

#define ABI29_0_0YG_NODE_LAYOUT_PROPERTY(type, name) \
  WIN_EXPORT type ABI29_0_0YGNodeLayoutGet##name(const ABI29_0_0YGNodeRef node);

#define ABI29_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(type, name) \
  WIN_EXPORT type ABI29_0_0YGNodeLayoutGet##name(const ABI29_0_0YGNodeRef node, const ABI29_0_0YGEdge edge);

void* ABI29_0_0YGNodeGetContext(ABI29_0_0YGNodeRef node);
void ABI29_0_0YGNodeSetContext(ABI29_0_0YGNodeRef node, void* context);
ABI29_0_0YGMeasureFunc ABI29_0_0YGNodeGetMeasureFunc(ABI29_0_0YGNodeRef node);
void ABI29_0_0YGNodeSetMeasureFunc(ABI29_0_0YGNodeRef node, ABI29_0_0YGMeasureFunc measureFunc);
ABI29_0_0YGBaselineFunc ABI29_0_0YGNodeGetBaselineFunc(ABI29_0_0YGNodeRef node);
void ABI29_0_0YGNodeSetBaselineFunc(ABI29_0_0YGNodeRef node, ABI29_0_0YGBaselineFunc baselineFunc);
ABI29_0_0YGDirtiedFunc ABI29_0_0YGNodeGetDirtiedFunc(ABI29_0_0YGNodeRef node);
void ABI29_0_0YGNodeSetDirtiedFunc(ABI29_0_0YGNodeRef node, ABI29_0_0YGDirtiedFunc dirtiedFunc);
ABI29_0_0YGPrintFunc ABI29_0_0YGNodeGetPrintFunc(ABI29_0_0YGNodeRef node);
void ABI29_0_0YGNodeSetPrintFunc(ABI29_0_0YGNodeRef node, ABI29_0_0YGPrintFunc printFunc);
bool ABI29_0_0YGNodeGetHasNewLayout(ABI29_0_0YGNodeRef node);
void ABI29_0_0YGNodeSetHasNewLayout(ABI29_0_0YGNodeRef node, bool hasNewLayout);
ABI29_0_0YGNodeType ABI29_0_0YGNodeGetNodeType(ABI29_0_0YGNodeRef node);
void ABI29_0_0YGNodeSetNodeType(ABI29_0_0YGNodeRef node, ABI29_0_0YGNodeType nodeType);
bool ABI29_0_0YGNodeIsDirty(ABI29_0_0YGNodeRef node);
bool ABI29_0_0YGNodeLayoutGetDidUseLegacyFlag(const ABI29_0_0YGNodeRef node);

ABI29_0_0YG_NODE_STYLE_PROPERTY(ABI29_0_0YGDirection, Direction, direction);
ABI29_0_0YG_NODE_STYLE_PROPERTY(ABI29_0_0YGFlexDirection, FlexDirection, flexDirection);
ABI29_0_0YG_NODE_STYLE_PROPERTY(ABI29_0_0YGJustify, JustifyContent, justifyContent);
ABI29_0_0YG_NODE_STYLE_PROPERTY(ABI29_0_0YGAlign, AlignContent, alignContent);
ABI29_0_0YG_NODE_STYLE_PROPERTY(ABI29_0_0YGAlign, AlignItems, alignItems);
ABI29_0_0YG_NODE_STYLE_PROPERTY(ABI29_0_0YGAlign, AlignSelf, alignSelf);
ABI29_0_0YG_NODE_STYLE_PROPERTY(ABI29_0_0YGPositionType, PositionType, positionType);
ABI29_0_0YG_NODE_STYLE_PROPERTY(ABI29_0_0YGWrap, FlexWrap, flexWrap);
ABI29_0_0YG_NODE_STYLE_PROPERTY(ABI29_0_0YGOverflow, Overflow, overflow);
ABI29_0_0YG_NODE_STYLE_PROPERTY(ABI29_0_0YGDisplay, Display, display);

ABI29_0_0YG_NODE_STYLE_PROPERTY(float, Flex, flex);
ABI29_0_0YG_NODE_STYLE_PROPERTY(float, FlexGrow, flexGrow);
ABI29_0_0YG_NODE_STYLE_PROPERTY(float, FlexShrink, flexShrink);
ABI29_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO(ABI29_0_0YGValue, FlexBasis, flexBasis);

ABI29_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(ABI29_0_0YGValue, Position, position);
ABI29_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(ABI29_0_0YGValue, Margin, margin);
ABI29_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO(ABI29_0_0YGValue, Margin);
ABI29_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(ABI29_0_0YGValue, Padding, padding);
ABI29_0_0YG_NODE_STYLE_EDGE_PROPERTY(float, Border, border);

ABI29_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO(ABI29_0_0YGValue, Width, width);
ABI29_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO(ABI29_0_0YGValue, Height, height);
ABI29_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI29_0_0YGValue, MinWidth, minWidth);
ABI29_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI29_0_0YGValue, MinHeight, minHeight);
ABI29_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI29_0_0YGValue, MaxWidth, maxWidth);
ABI29_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI29_0_0YGValue, MaxHeight, maxHeight);

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
ABI29_0_0YG_NODE_STYLE_PROPERTY(float, AspectRatio, aspectRatio);

ABI29_0_0YG_NODE_LAYOUT_PROPERTY(float, Left);
ABI29_0_0YG_NODE_LAYOUT_PROPERTY(float, Top);
ABI29_0_0YG_NODE_LAYOUT_PROPERTY(float, Right);
ABI29_0_0YG_NODE_LAYOUT_PROPERTY(float, Bottom);
ABI29_0_0YG_NODE_LAYOUT_PROPERTY(float, Width);
ABI29_0_0YG_NODE_LAYOUT_PROPERTY(float, Height);
ABI29_0_0YG_NODE_LAYOUT_PROPERTY(ABI29_0_0YGDirection, Direction);
ABI29_0_0YG_NODE_LAYOUT_PROPERTY(bool, HadOverflow);

// Get the computed values for these nodes after performing layout. If they were set using
// point values then the returned value will be the same as ABI29_0_0YGNodeStyleGetXXX. However if
// they were set using a percentage value then the returned value is the computed value used
// during layout.
ABI29_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(float, Margin);
ABI29_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(float, Border);
ABI29_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(float, Padding);

WIN_EXPORT void ABI29_0_0YGConfigSetLogger(const ABI29_0_0YGConfigRef config, ABI29_0_0YGLogger logger);
WIN_EXPORT void ABI29_0_0YGLog(const ABI29_0_0YGNodeRef node, ABI29_0_0YGLogLevel level, const char *message, ...);
WIN_EXPORT void ABI29_0_0YGLogWithConfig(const ABI29_0_0YGConfigRef config, ABI29_0_0YGLogLevel level, const char *format, ...);
WIN_EXPORT void ABI29_0_0YGAssert(const bool condition, const char *message);
WIN_EXPORT void ABI29_0_0YGAssertWithNode(const ABI29_0_0YGNodeRef node, const bool condition, const char *message);
WIN_EXPORT void ABI29_0_0YGAssertWithConfig(const ABI29_0_0YGConfigRef config,
                                   const bool condition,
                                   const char *message);

// Set this to number of pixels in 1 point to round calculation results
// If you want to avoid rounding - set PointScaleFactor to 0
WIN_EXPORT void ABI29_0_0YGConfigSetPointScaleFactor(const ABI29_0_0YGConfigRef config, const float pixelsInPoint);

// Yoga previously had an error where containers would take the maximum space possible instead of
// the minimum
// like they are supposed to. In practice this resulted in implicit behaviour similar to align-self:
// stretch;
// Because this was such a long-standing bug we must allow legacy users to switch back to this
// behaviour.
WIN_EXPORT void ABI29_0_0YGConfigSetUseLegacyStretchBehaviour(const ABI29_0_0YGConfigRef config,
                                                     const bool useLegacyStretchBehaviour);

// ABI29_0_0YGConfig
WIN_EXPORT ABI29_0_0YGConfigRef ABI29_0_0YGConfigNew(void);
WIN_EXPORT void ABI29_0_0YGConfigFree(const ABI29_0_0YGConfigRef config);
WIN_EXPORT void ABI29_0_0YGConfigCopy(const ABI29_0_0YGConfigRef dest, const ABI29_0_0YGConfigRef src);
WIN_EXPORT int32_t ABI29_0_0YGConfigGetInstanceCount(void);

WIN_EXPORT void ABI29_0_0YGConfigSetExperimentalFeatureEnabled(const ABI29_0_0YGConfigRef config,
                                                      const ABI29_0_0YGExperimentalFeature feature,
                                                      const bool enabled);
WIN_EXPORT bool ABI29_0_0YGConfigIsExperimentalFeatureEnabled(const ABI29_0_0YGConfigRef config,
                                                     const ABI29_0_0YGExperimentalFeature feature);

// Using the web defaults is the prefered configuration for new projects.
// Usage of non web defaults should be considered as legacy.
WIN_EXPORT void ABI29_0_0YGConfigSetUseWebDefaults(const ABI29_0_0YGConfigRef config, const bool enabled);
WIN_EXPORT bool ABI29_0_0YGConfigGetUseWebDefaults(const ABI29_0_0YGConfigRef config);

WIN_EXPORT void ABI29_0_0YGConfigSetNodeClonedFunc(const ABI29_0_0YGConfigRef config,
                                          const ABI29_0_0YGNodeClonedFunc callback);

// Export only for C#
WIN_EXPORT ABI29_0_0YGConfigRef ABI29_0_0YGConfigGetDefault(void);

WIN_EXPORT void ABI29_0_0YGConfigSetContext(const ABI29_0_0YGConfigRef config, void *context);
WIN_EXPORT void *ABI29_0_0YGConfigGetContext(const ABI29_0_0YGConfigRef config);

WIN_EXPORT float ABI29_0_0YGRoundValueToPixelGrid(
    const float value,
    const float pointScaleFactor,
    const bool forceCeil,
    const bool forceFloor);

ABI29_0_0YG_EXTERN_C_END
