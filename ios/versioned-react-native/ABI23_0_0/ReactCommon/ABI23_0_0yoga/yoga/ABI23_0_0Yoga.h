/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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

// Not defined in MSVC++
#ifndef NAN
static const unsigned long __nan[2] = {0xffffffff, 0x7fffffff};
#define NAN (*(const float *) __nan)
#endif

#define ABI23_0_0YGUndefined NAN

#include "ABI23_0_0YGEnums.h"
#include "ABI23_0_0YGMacros.h"

ABI23_0_0YG_EXTERN_C_BEGIN

typedef struct ABI23_0_0YGSize {
  float width;
  float height;
} ABI23_0_0YGSize;

typedef struct ABI23_0_0YGValue {
  float value;
  ABI23_0_0YGUnit unit;
} ABI23_0_0YGValue;

static const ABI23_0_0YGValue ABI23_0_0YGValueUndefined = {ABI23_0_0YGUndefined, ABI23_0_0YGUnitUndefined};
static const ABI23_0_0YGValue ABI23_0_0YGValueAuto = {ABI23_0_0YGUndefined, ABI23_0_0YGUnitAuto};

typedef struct ABI23_0_0YGConfig *ABI23_0_0YGConfigRef;
typedef struct ABI23_0_0YGNode *ABI23_0_0YGNodeRef;
typedef ABI23_0_0YGSize (*ABI23_0_0YGMeasureFunc)(ABI23_0_0YGNodeRef node,
                                float width,
                                ABI23_0_0YGMeasureMode widthMode,
                                float height,
                                ABI23_0_0YGMeasureMode heightMode);
typedef float (*ABI23_0_0YGBaselineFunc)(ABI23_0_0YGNodeRef node, const float width, const float height);
typedef void (*ABI23_0_0YGPrintFunc)(ABI23_0_0YGNodeRef node);
typedef int (*ABI23_0_0YGLogger)(const ABI23_0_0YGConfigRef config,
                        const ABI23_0_0YGNodeRef node,
                        ABI23_0_0YGLogLevel level,
                        const char *format,
                        va_list args);

typedef void *(*ABI23_0_0YGMalloc)(size_t size);
typedef void *(*ABI23_0_0YGCalloc)(size_t count, size_t size);
typedef void *(*ABI23_0_0YGRealloc)(void *ptr, size_t size);
typedef void (*ABI23_0_0YGFree)(void *ptr);

// ABI23_0_0YGNode
WIN_EXPORT ABI23_0_0YGNodeRef ABI23_0_0YGNodeNew(void);
WIN_EXPORT ABI23_0_0YGNodeRef ABI23_0_0YGNodeNewWithConfig(const ABI23_0_0YGConfigRef config);
WIN_EXPORT void ABI23_0_0YGNodeFree(const ABI23_0_0YGNodeRef node);
WIN_EXPORT void ABI23_0_0YGNodeFreeRecursive(const ABI23_0_0YGNodeRef node);
WIN_EXPORT void ABI23_0_0YGNodeReset(const ABI23_0_0YGNodeRef node);
WIN_EXPORT int32_t ABI23_0_0YGNodeGetInstanceCount(void);

WIN_EXPORT void ABI23_0_0YGNodeInsertChild(const ABI23_0_0YGNodeRef node,
                                  const ABI23_0_0YGNodeRef child,
                                  const uint32_t index);
WIN_EXPORT void ABI23_0_0YGNodeRemoveChild(const ABI23_0_0YGNodeRef node, const ABI23_0_0YGNodeRef child);
WIN_EXPORT ABI23_0_0YGNodeRef ABI23_0_0YGNodeGetChild(const ABI23_0_0YGNodeRef node, const uint32_t index);
WIN_EXPORT ABI23_0_0YGNodeRef ABI23_0_0YGNodeGetParent(const ABI23_0_0YGNodeRef node);
WIN_EXPORT uint32_t ABI23_0_0YGNodeGetChildCount(const ABI23_0_0YGNodeRef node);

WIN_EXPORT void ABI23_0_0YGNodeCalculateLayout(const ABI23_0_0YGNodeRef node,
                                      const float availableWidth,
                                      const float availableHeight,
                                      const ABI23_0_0YGDirection parentDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
// ABI23_0_0YG knows when to mark all other nodes as dirty but because nodes with
// measure functions
// depends on information not known to ABI23_0_0YG they must perform this dirty
// marking manually.
WIN_EXPORT void ABI23_0_0YGNodeMarkDirty(const ABI23_0_0YGNodeRef node);
WIN_EXPORT bool ABI23_0_0YGNodeIsDirty(const ABI23_0_0YGNodeRef node);

WIN_EXPORT void ABI23_0_0YGNodePrint(const ABI23_0_0YGNodeRef node, const ABI23_0_0YGPrintOptions options);

WIN_EXPORT bool ABI23_0_0YGFloatIsUndefined(const float value);

WIN_EXPORT bool ABI23_0_0YGNodeCanUseCachedMeasurement(const ABI23_0_0YGMeasureMode widthMode,
                                              const float width,
                                              const ABI23_0_0YGMeasureMode heightMode,
                                              const float height,
                                              const ABI23_0_0YGMeasureMode lastWidthMode,
                                              const float lastWidth,
                                              const ABI23_0_0YGMeasureMode lastHeightMode,
                                              const float lastHeight,
                                              const float lastComputedWidth,
                                              const float lastComputedHeight,
                                              const float marginRow,
                                              const float marginColumn,
                                              const ABI23_0_0YGConfigRef config);

WIN_EXPORT void ABI23_0_0YGNodeCopyStyle(const ABI23_0_0YGNodeRef dstNode, const ABI23_0_0YGNodeRef srcNode);

#define ABI23_0_0YG_NODE_PROPERTY(type, name, paramName)                          \
  WIN_EXPORT void ABI23_0_0YGNodeSet##name(const ABI23_0_0YGNodeRef node, type paramName); \
  WIN_EXPORT type ABI23_0_0YGNodeGet##name(const ABI23_0_0YGNodeRef node);

#define ABI23_0_0YG_NODE_STYLE_PROPERTY(type, name, paramName)                               \
  WIN_EXPORT void ABI23_0_0YGNodeStyleSet##name(const ABI23_0_0YGNodeRef node, const type paramName); \
  WIN_EXPORT type ABI23_0_0YGNodeStyleGet##name(const ABI23_0_0YGNodeRef node);

#define ABI23_0_0YG_NODE_STYLE_PROPERTY_UNIT(type, name, paramName)                                    \
  WIN_EXPORT void ABI23_0_0YGNodeStyleSet##name(const ABI23_0_0YGNodeRef node, const float paramName);          \
  WIN_EXPORT void ABI23_0_0YGNodeStyleSet##name##Percent(const ABI23_0_0YGNodeRef node, const float paramName); \
  WIN_EXPORT type ABI23_0_0YGNodeStyleGet##name(const ABI23_0_0YGNodeRef node);

#define ABI23_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO(type, name, paramName) \
  ABI23_0_0YG_NODE_STYLE_PROPERTY_UNIT(type, name, paramName)            \
  WIN_EXPORT void ABI23_0_0YGNodeStyleSet##name##Auto(const ABI23_0_0YGNodeRef node);

#define ABI23_0_0YG_NODE_STYLE_EDGE_PROPERTY(type, name, paramName)    \
  WIN_EXPORT void ABI23_0_0YGNodeStyleSet##name(const ABI23_0_0YGNodeRef node,  \
                                       const ABI23_0_0YGEdge edge,     \
                                       const type paramName); \
  WIN_EXPORT type ABI23_0_0YGNodeStyleGet##name(const ABI23_0_0YGNodeRef node, const ABI23_0_0YGEdge edge);

#define ABI23_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(type, name, paramName)         \
  WIN_EXPORT void ABI23_0_0YGNodeStyleSet##name(const ABI23_0_0YGNodeRef node,            \
                                       const ABI23_0_0YGEdge edge,               \
                                       const float paramName);          \
  WIN_EXPORT void ABI23_0_0YGNodeStyleSet##name##Percent(const ABI23_0_0YGNodeRef node,   \
                                                const ABI23_0_0YGEdge edge,      \
                                                const float paramName); \
  WIN_EXPORT WIN_STRUCT(type) ABI23_0_0YGNodeStyleGet##name(const ABI23_0_0YGNodeRef node, const ABI23_0_0YGEdge edge);

#define ABI23_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO(type, name) \
  WIN_EXPORT void ABI23_0_0YGNodeStyleSet##name##Auto(const ABI23_0_0YGNodeRef node, const ABI23_0_0YGEdge edge);

#define ABI23_0_0YG_NODE_LAYOUT_PROPERTY(type, name) \
  WIN_EXPORT type ABI23_0_0YGNodeLayoutGet##name(const ABI23_0_0YGNodeRef node);

#define ABI23_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(type, name) \
  WIN_EXPORT type ABI23_0_0YGNodeLayoutGet##name(const ABI23_0_0YGNodeRef node, const ABI23_0_0YGEdge edge);

ABI23_0_0YG_NODE_PROPERTY(void *, Context, context);
ABI23_0_0YG_NODE_PROPERTY(ABI23_0_0YGMeasureFunc, MeasureFunc, measureFunc);
ABI23_0_0YG_NODE_PROPERTY(ABI23_0_0YGBaselineFunc, BaselineFunc, baselineFunc)
ABI23_0_0YG_NODE_PROPERTY(ABI23_0_0YGPrintFunc, PrintFunc, printFunc);
ABI23_0_0YG_NODE_PROPERTY(bool, HasNewLayout, hasNewLayout);
ABI23_0_0YG_NODE_PROPERTY(ABI23_0_0YGNodeType, NodeType, nodeType);

ABI23_0_0YG_NODE_STYLE_PROPERTY(ABI23_0_0YGDirection, Direction, direction);
ABI23_0_0YG_NODE_STYLE_PROPERTY(ABI23_0_0YGFlexDirection, FlexDirection, flexDirection);
ABI23_0_0YG_NODE_STYLE_PROPERTY(ABI23_0_0YGJustify, JustifyContent, justifyContent);
ABI23_0_0YG_NODE_STYLE_PROPERTY(ABI23_0_0YGAlign, AlignContent, alignContent);
ABI23_0_0YG_NODE_STYLE_PROPERTY(ABI23_0_0YGAlign, AlignItems, alignItems);
ABI23_0_0YG_NODE_STYLE_PROPERTY(ABI23_0_0YGAlign, AlignSelf, alignSelf);
ABI23_0_0YG_NODE_STYLE_PROPERTY(ABI23_0_0YGPositionType, PositionType, positionType);
ABI23_0_0YG_NODE_STYLE_PROPERTY(ABI23_0_0YGWrap, FlexWrap, flexWrap);
ABI23_0_0YG_NODE_STYLE_PROPERTY(ABI23_0_0YGOverflow, Overflow, overflow);
ABI23_0_0YG_NODE_STYLE_PROPERTY(ABI23_0_0YGDisplay, Display, display);

ABI23_0_0YG_NODE_STYLE_PROPERTY(float, Flex, flex);
ABI23_0_0YG_NODE_STYLE_PROPERTY(float, FlexGrow, flexGrow);
ABI23_0_0YG_NODE_STYLE_PROPERTY(float, FlexShrink, flexShrink);
ABI23_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO(ABI23_0_0YGValue, FlexBasis, flexBasis);

ABI23_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(ABI23_0_0YGValue, Position, position);
ABI23_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(ABI23_0_0YGValue, Margin, margin);
ABI23_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT_AUTO(ABI23_0_0YGValue, Margin);
ABI23_0_0YG_NODE_STYLE_EDGE_PROPERTY_UNIT(ABI23_0_0YGValue, Padding, padding);
ABI23_0_0YG_NODE_STYLE_EDGE_PROPERTY(float, Border, border);

ABI23_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO(ABI23_0_0YGValue, Width, width);
ABI23_0_0YG_NODE_STYLE_PROPERTY_UNIT_AUTO(ABI23_0_0YGValue, Height, height);
ABI23_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI23_0_0YGValue, MinWidth, minWidth);
ABI23_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI23_0_0YGValue, MinHeight, minHeight);
ABI23_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI23_0_0YGValue, MaxWidth, maxWidth);
ABI23_0_0YG_NODE_STYLE_PROPERTY_UNIT(ABI23_0_0YGValue, MaxHeight, maxHeight);

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
ABI23_0_0YG_NODE_STYLE_PROPERTY(float, AspectRatio, aspectRatio);

ABI23_0_0YG_NODE_LAYOUT_PROPERTY(float, Left);
ABI23_0_0YG_NODE_LAYOUT_PROPERTY(float, Top);
ABI23_0_0YG_NODE_LAYOUT_PROPERTY(float, Right);
ABI23_0_0YG_NODE_LAYOUT_PROPERTY(float, Bottom);
ABI23_0_0YG_NODE_LAYOUT_PROPERTY(float, Width);
ABI23_0_0YG_NODE_LAYOUT_PROPERTY(float, Height);
ABI23_0_0YG_NODE_LAYOUT_PROPERTY(ABI23_0_0YGDirection, Direction);
ABI23_0_0YG_NODE_LAYOUT_PROPERTY(bool, HadOverflow);

// Get the computed values for these nodes after performing layout. If they were set using
// point values then the returned value will be the same as ABI23_0_0YGNodeStyleGetXXX. However if
// they were set using a percentage value then the returned value is the computed value used
// during layout.
ABI23_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(float, Margin);
ABI23_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(float, Border);
ABI23_0_0YG_NODE_LAYOUT_EDGE_PROPERTY(float, Padding);

WIN_EXPORT void ABI23_0_0YGConfigSetLogger(const ABI23_0_0YGConfigRef config, ABI23_0_0YGLogger logger);
WIN_EXPORT void ABI23_0_0YGLog(const ABI23_0_0YGNodeRef node, ABI23_0_0YGLogLevel level, const char *message, ...);
WIN_EXPORT void ABI23_0_0YGLogWithConfig(const ABI23_0_0YGConfigRef config, ABI23_0_0YGLogLevel level, const char *format, ...);
WIN_EXPORT void ABI23_0_0YGAssert(const bool condition, const char *message);
WIN_EXPORT void ABI23_0_0YGAssertWithNode(const ABI23_0_0YGNodeRef node, const bool condition, const char *message);
WIN_EXPORT void ABI23_0_0YGAssertWithConfig(const ABI23_0_0YGConfigRef config,
                                   const bool condition,
                                   const char *message);

// Set this to number of pixels in 1 point to round calculation results
// If you want to avoid rounding - set PointScaleFactor to 0
WIN_EXPORT void ABI23_0_0YGConfigSetPointScaleFactor(const ABI23_0_0YGConfigRef config, const float pixelsInPoint);

// Yoga previously had an error where containers would take the maximum space possible instead of
// the minimum
// like they are supposed to. In practice this resulted in implicit behaviour similar to align-self:
// stretch;
// Because this was such a long-standing bug we must allow legacy users to switch back to this
// behaviour.
WIN_EXPORT void ABI23_0_0YGConfigSetUseLegacyStretchBehaviour(const ABI23_0_0YGConfigRef config,
                                                     const bool useLegacyStretchBehaviour);

// ABI23_0_0YGConfig
WIN_EXPORT ABI23_0_0YGConfigRef ABI23_0_0YGConfigNew(void);
WIN_EXPORT void ABI23_0_0YGConfigFree(const ABI23_0_0YGConfigRef config);
WIN_EXPORT void ABI23_0_0YGConfigCopy(const ABI23_0_0YGConfigRef dest, const ABI23_0_0YGConfigRef src);
WIN_EXPORT int32_t ABI23_0_0YGConfigGetInstanceCount(void);

WIN_EXPORT void ABI23_0_0YGConfigSetExperimentalFeatureEnabled(const ABI23_0_0YGConfigRef config,
                                                      const ABI23_0_0YGExperimentalFeature feature,
                                                      const bool enabled);
WIN_EXPORT bool ABI23_0_0YGConfigIsExperimentalFeatureEnabled(const ABI23_0_0YGConfigRef config,
                                                     const ABI23_0_0YGExperimentalFeature feature);

// Using the web defaults is the prefered configuration for new projects.
// Usage of non web defaults should be considered as legacy.
WIN_EXPORT void ABI23_0_0YGConfigSetUseWebDefaults(const ABI23_0_0YGConfigRef config, const bool enabled);
WIN_EXPORT bool ABI23_0_0YGConfigGetUseWebDefaults(const ABI23_0_0YGConfigRef config);

// Export only for C#
WIN_EXPORT ABI23_0_0YGConfigRef ABI23_0_0YGConfigGetDefault(void);

WIN_EXPORT void ABI23_0_0YGConfigSetContext(const ABI23_0_0YGConfigRef config, void *context);
WIN_EXPORT void *ABI23_0_0YGConfigGetContext(const ABI23_0_0YGConfigRef config);

WIN_EXPORT void
ABI23_0_0YGSetMemoryFuncs(ABI23_0_0YGMalloc ygmalloc, ABI23_0_0YGCalloc yccalloc, ABI23_0_0YGRealloc ygrealloc, ABI23_0_0YGFree ygfree);

ABI23_0_0YG_EXTERN_C_END
