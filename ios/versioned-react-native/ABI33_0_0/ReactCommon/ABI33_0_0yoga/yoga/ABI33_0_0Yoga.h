/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
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

#include "ABI33_0_0YGEnums.h"
#include "ABI33_0_0YGMacros.h"
#include "ABI33_0_0YGValue.h"

ABI33_0_0YG_EXTERN_C_BEGIN

typedef struct ABI33_0_0YGSize {
  float width;
  float height;
} ABI33_0_0YGSize;

typedef struct ABI33_0_0YGConfig* ABI33_0_0YGConfigRef;

typedef struct ABI33_0_0YGNode* ABI33_0_0YGNodeRef;

typedef ABI33_0_0YGSize (*ABI33_0_0YGMeasureFunc)(
    ABI33_0_0YGNodeRef node,
    float width,
    ABI33_0_0YGMeasureMode widthMode,
    float height,
    ABI33_0_0YGMeasureMode heightMode);
typedef float (
    *ABI33_0_0YGBaselineFunc)(ABI33_0_0YGNodeRef node, const float width, const float height);
typedef void (*ABI33_0_0YGDirtiedFunc)(ABI33_0_0YGNodeRef node);
typedef void (*ABI33_0_0YGPrintFunc)(ABI33_0_0YGNodeRef node);
typedef void (*ABI33_0_0YGNodeCleanupFunc)(ABI33_0_0YGNodeRef node);
typedef int (*ABI33_0_0YGLogger)(
    const ABI33_0_0YGConfigRef config,
    const ABI33_0_0YGNodeRef node,
    ABI33_0_0YGLogLevel level,
    const char* format,
    va_list args);
typedef ABI33_0_0YGNodeRef (
    *ABI33_0_0YGCloneNodeFunc)(ABI33_0_0YGNodeRef oldNode, ABI33_0_0YGNodeRef owner, int childIndex);

// ABI33_0_0YGNode
WIN_EXPORT ABI33_0_0YGNodeRef ABI33_0_0YGNodeNew(void);
WIN_EXPORT ABI33_0_0YGNodeRef ABI33_0_0YGNodeNewWithConfig(const ABI33_0_0YGConfigRef config);
WIN_EXPORT ABI33_0_0YGNodeRef ABI33_0_0YGNodeClone(const ABI33_0_0YGNodeRef node);
WIN_EXPORT void ABI33_0_0YGNodeFree(const ABI33_0_0YGNodeRef node);
WIN_EXPORT void ABI33_0_0YGNodeFreeRecursiveWithCleanupFunc(
    const ABI33_0_0YGNodeRef node,
    ABI33_0_0YGNodeCleanupFunc cleanup);
WIN_EXPORT void ABI33_0_0YGNodeFreeRecursive(const ABI33_0_0YGNodeRef node);
WIN_EXPORT void ABI33_0_0YGNodeReset(const ABI33_0_0YGNodeRef node);
WIN_EXPORT int32_t ABI33_0_0YGNodeGetInstanceCount(void);

WIN_EXPORT void ABI33_0_0YGNodeInsertChild(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGNodeRef child,
    const uint32_t index);

WIN_EXPORT void ABI33_0_0YGNodeRemoveChild(const ABI33_0_0YGNodeRef node, const ABI33_0_0YGNodeRef child);
WIN_EXPORT void ABI33_0_0YGNodeRemoveAllChildren(const ABI33_0_0YGNodeRef node);
WIN_EXPORT ABI33_0_0YGNodeRef ABI33_0_0YGNodeGetChild(const ABI33_0_0YGNodeRef node, const uint32_t index);
WIN_EXPORT ABI33_0_0YGNodeRef ABI33_0_0YGNodeGetOwner(const ABI33_0_0YGNodeRef node);
WIN_EXPORT ABI33_0_0YGNodeRef ABI33_0_0YGNodeGetParent(const ABI33_0_0YGNodeRef node);
WIN_EXPORT uint32_t ABI33_0_0YGNodeGetChildCount(const ABI33_0_0YGNodeRef node);
WIN_EXPORT void ABI33_0_0YGNodeSetChildren(
    ABI33_0_0YGNodeRef const owner,
    const ABI33_0_0YGNodeRef children[],
    const uint32_t count);

WIN_EXPORT void ABI33_0_0YGNodeSetIsReferenceBaseline(
    ABI33_0_0YGNodeRef node,
    bool isReferenceBaseline);

WIN_EXPORT bool ABI33_0_0YGNodeIsReferenceBaseline(ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeCalculateLayout(
    const ABI33_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI33_0_0YGDirection ownerDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
//
// Yoga knows when to mark all other nodes as dirty but because nodes with
// measure functions depend on information not known to Yoga they must perform
// this dirty marking manually.
WIN_EXPORT void ABI33_0_0YGNodeMarkDirty(const ABI33_0_0YGNodeRef node);

// Marks the current node and all its descendants as dirty.
//
// Intended to be used for Uoga benchmarks. Don't use in production, as calling
// `ABI33_0_0YGCalculateLayout` will cause the recalculation of each and every node.
WIN_EXPORT void ABI33_0_0YGNodeMarkDirtyAndPropogateToDescendants(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodePrint(const ABI33_0_0YGNodeRef node, const ABI33_0_0YGPrintOptions options);

WIN_EXPORT bool ABI33_0_0YGFloatIsUndefined(const float value);

WIN_EXPORT bool ABI33_0_0YGNodeCanUseCachedMeasurement(
    const ABI33_0_0YGMeasureMode widthMode,
    const float width,
    const ABI33_0_0YGMeasureMode heightMode,
    const float height,
    const ABI33_0_0YGMeasureMode lastWidthMode,
    const float lastWidth,
    const ABI33_0_0YGMeasureMode lastHeightMode,
    const float lastHeight,
    const float lastComputedWidth,
    const float lastComputedHeight,
    const float marginRow,
    const float marginColumn,
    const ABI33_0_0YGConfigRef config);

WIN_EXPORT void ABI33_0_0YGNodeCopyStyle(
    const ABI33_0_0YGNodeRef dstNode,
    const ABI33_0_0YGNodeRef srcNode);

WIN_EXPORT void* ABI33_0_0YGNodeGetContext(ABI33_0_0YGNodeRef node);
WIN_EXPORT void ABI33_0_0YGNodeSetContext(ABI33_0_0YGNodeRef node, void* context);
void ABI33_0_0YGConfigSetPrintTreeFlag(ABI33_0_0YGConfigRef config, bool enabled);
ABI33_0_0YGMeasureFunc ABI33_0_0YGNodeGetMeasureFunc(ABI33_0_0YGNodeRef node);
WIN_EXPORT void ABI33_0_0YGNodeSetMeasureFunc(ABI33_0_0YGNodeRef node, ABI33_0_0YGMeasureFunc measureFunc);
ABI33_0_0YGBaselineFunc ABI33_0_0YGNodeGetBaselineFunc(ABI33_0_0YGNodeRef node);
void ABI33_0_0YGNodeSetBaselineFunc(ABI33_0_0YGNodeRef node, ABI33_0_0YGBaselineFunc baselineFunc);
ABI33_0_0YGDirtiedFunc ABI33_0_0YGNodeGetDirtiedFunc(ABI33_0_0YGNodeRef node);
void ABI33_0_0YGNodeSetDirtiedFunc(ABI33_0_0YGNodeRef node, ABI33_0_0YGDirtiedFunc dirtiedFunc);
ABI33_0_0YGPrintFunc ABI33_0_0YGNodeGetPrintFunc(ABI33_0_0YGNodeRef node);
void ABI33_0_0YGNodeSetPrintFunc(ABI33_0_0YGNodeRef node, ABI33_0_0YGPrintFunc printFunc);
WIN_EXPORT bool ABI33_0_0YGNodeGetHasNewLayout(ABI33_0_0YGNodeRef node);
WIN_EXPORT void ABI33_0_0YGNodeSetHasNewLayout(ABI33_0_0YGNodeRef node, bool hasNewLayout);
ABI33_0_0YGNodeType ABI33_0_0YGNodeGetNodeType(ABI33_0_0YGNodeRef node);
void ABI33_0_0YGNodeSetNodeType(ABI33_0_0YGNodeRef node, ABI33_0_0YGNodeType nodeType);
WIN_EXPORT bool ABI33_0_0YGNodeIsDirty(ABI33_0_0YGNodeRef node);
bool ABI33_0_0YGNodeLayoutGetDidUseLegacyFlag(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetDirection(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGDirection direction);
WIN_EXPORT ABI33_0_0YGDirection ABI33_0_0YGNodeStyleGetDirection(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetFlexDirection(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGFlexDirection flexDirection);
WIN_EXPORT ABI33_0_0YGFlexDirection ABI33_0_0YGNodeStyleGetFlexDirection(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetJustifyContent(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGJustify justifyContent);
WIN_EXPORT ABI33_0_0YGJustify ABI33_0_0YGNodeStyleGetJustifyContent(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetAlignContent(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGAlign alignContent);
WIN_EXPORT ABI33_0_0YGAlign ABI33_0_0YGNodeStyleGetAlignContent(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetAlignItems(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGAlign alignItems);
WIN_EXPORT ABI33_0_0YGAlign ABI33_0_0YGNodeStyleGetAlignItems(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetAlignSelf(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGAlign alignSelf);
WIN_EXPORT ABI33_0_0YGAlign ABI33_0_0YGNodeStyleGetAlignSelf(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetPositionType(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGPositionType positionType);
WIN_EXPORT ABI33_0_0YGPositionType ABI33_0_0YGNodeStyleGetPositionType(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetFlexWrap(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGWrap flexWrap);
WIN_EXPORT ABI33_0_0YGWrap ABI33_0_0YGNodeStyleGetFlexWrap(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetOverflow(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGOverflow overflow);
WIN_EXPORT ABI33_0_0YGOverflow ABI33_0_0YGNodeStyleGetOverflow(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetDisplay(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGDisplay display);
WIN_EXPORT ABI33_0_0YGDisplay ABI33_0_0YGNodeStyleGetDisplay(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetFlex(const ABI33_0_0YGNodeRef node, const float flex);
WIN_EXPORT float ABI33_0_0YGNodeStyleGetFlex(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetFlexGrow(
    const ABI33_0_0YGNodeRef node,
    const float flexGrow);
WIN_EXPORT float ABI33_0_0YGNodeStyleGetFlexGrow(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetFlexShrink(
    const ABI33_0_0YGNodeRef node,
    const float flexShrink);
WIN_EXPORT float ABI33_0_0YGNodeStyleGetFlexShrink(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetFlexBasis(
    const ABI33_0_0YGNodeRef node,
    const float flexBasis);
WIN_EXPORT void ABI33_0_0YGNodeStyleSetFlexBasisPercent(
    const ABI33_0_0YGNodeRef node,
    const float flexBasis);
WIN_EXPORT void ABI33_0_0YGNodeStyleSetFlexBasisAuto(const ABI33_0_0YGNodeRef node);
WIN_EXPORT ABI33_0_0YGValue ABI33_0_0YGNodeStyleGetFlexBasis(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetPosition(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGEdge edge,
    const float position);
WIN_EXPORT void ABI33_0_0YGNodeStyleSetPositionPercent(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGEdge edge,
    const float position);
WIN_EXPORT ABI33_0_0YGValue
ABI33_0_0YGNodeStyleGetPosition(const ABI33_0_0YGNodeRef node, const ABI33_0_0YGEdge edge);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetMargin(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGEdge edge,
    const float margin);
WIN_EXPORT void ABI33_0_0YGNodeStyleSetMarginPercent(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGEdge edge,
    const float margin);
WIN_EXPORT void ABI33_0_0YGNodeStyleSetMarginAuto(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGEdge edge);
WIN_EXPORT ABI33_0_0YGValue
ABI33_0_0YGNodeStyleGetMargin(const ABI33_0_0YGNodeRef node, const ABI33_0_0YGEdge edge);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetPadding(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGEdge edge,
    const float padding);
WIN_EXPORT void ABI33_0_0YGNodeStyleSetPaddingPercent(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGEdge edge,
    const float padding);
WIN_EXPORT ABI33_0_0YGValue
ABI33_0_0YGNodeStyleGetPadding(const ABI33_0_0YGNodeRef node, const ABI33_0_0YGEdge edge);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetBorder(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGEdge edge,
    const float border);
WIN_EXPORT float ABI33_0_0YGNodeStyleGetBorder(const ABI33_0_0YGNodeRef node, const ABI33_0_0YGEdge edge);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetWidth(const ABI33_0_0YGNodeRef node, const float width);
WIN_EXPORT void ABI33_0_0YGNodeStyleSetWidthPercent(
    const ABI33_0_0YGNodeRef node,
    const float width);
WIN_EXPORT void ABI33_0_0YGNodeStyleSetWidthAuto(const ABI33_0_0YGNodeRef node);
WIN_EXPORT ABI33_0_0YGValue ABI33_0_0YGNodeStyleGetWidth(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetHeight(const ABI33_0_0YGNodeRef node, const float height);
WIN_EXPORT void ABI33_0_0YGNodeStyleSetHeightPercent(
    const ABI33_0_0YGNodeRef node,
    const float height);
WIN_EXPORT void ABI33_0_0YGNodeStyleSetHeightAuto(const ABI33_0_0YGNodeRef node);
WIN_EXPORT ABI33_0_0YGValue ABI33_0_0YGNodeStyleGetHeight(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetMinWidth(
    const ABI33_0_0YGNodeRef node,
    const float minWidth);
WIN_EXPORT void ABI33_0_0YGNodeStyleSetMinWidthPercent(
    const ABI33_0_0YGNodeRef node,
    const float minWidth);
WIN_EXPORT ABI33_0_0YGValue ABI33_0_0YGNodeStyleGetMinWidth(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetMinHeight(
    const ABI33_0_0YGNodeRef node,
    const float minHeight);
WIN_EXPORT void ABI33_0_0YGNodeStyleSetMinHeightPercent(
    const ABI33_0_0YGNodeRef node,
    const float minHeight);
WIN_EXPORT ABI33_0_0YGValue ABI33_0_0YGNodeStyleGetMinHeight(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetMaxWidth(
    const ABI33_0_0YGNodeRef node,
    const float maxWidth);
WIN_EXPORT void ABI33_0_0YGNodeStyleSetMaxWidthPercent(
    const ABI33_0_0YGNodeRef node,
    const float maxWidth);
WIN_EXPORT ABI33_0_0YGValue ABI33_0_0YGNodeStyleGetMaxWidth(const ABI33_0_0YGNodeRef node);

WIN_EXPORT void ABI33_0_0YGNodeStyleSetMaxHeight(
    const ABI33_0_0YGNodeRef node,
    const float maxHeight);
WIN_EXPORT void ABI33_0_0YGNodeStyleSetMaxHeightPercent(
    const ABI33_0_0YGNodeRef node,
    const float maxHeight);
WIN_EXPORT ABI33_0_0YGValue ABI33_0_0YGNodeStyleGetMaxHeight(const ABI33_0_0YGNodeRef node);

// Yoga specific properties, not compatible with flexbox specification Aspect
// ratio control the size of the undefined dimension of a node. Aspect ratio is
// encoded as a floating point value width/height. e.g. A value of 2 leads to a
// node with a width twice the size of its height while a value of 0.5 gives the
// opposite effect.
//
// - On a node with a set width/height aspect ratio control the size of the
//   unset dimension
// - On a node with a set flex basis aspect ratio controls the size of the node
//   in the cross axis if unset
// - On a node with a measure function aspect ratio works as though the measure
//   function measures the flex basis
// - On a node with flex grow/shrink aspect ratio controls the size of the node
//   in the cross axis if unset
// - Aspect ratio takes min/max dimensions into account
WIN_EXPORT void ABI33_0_0YGNodeStyleSetAspectRatio(
    const ABI33_0_0YGNodeRef node,
    const float aspectRatio);
WIN_EXPORT float ABI33_0_0YGNodeStyleGetAspectRatio(const ABI33_0_0YGNodeRef node);

WIN_EXPORT float ABI33_0_0YGNodeLayoutGetLeft(const ABI33_0_0YGNodeRef node);
WIN_EXPORT float ABI33_0_0YGNodeLayoutGetTop(const ABI33_0_0YGNodeRef node);
WIN_EXPORT float ABI33_0_0YGNodeLayoutGetRight(const ABI33_0_0YGNodeRef node);
WIN_EXPORT float ABI33_0_0YGNodeLayoutGetBottom(const ABI33_0_0YGNodeRef node);
WIN_EXPORT float ABI33_0_0YGNodeLayoutGetWidth(const ABI33_0_0YGNodeRef node);
WIN_EXPORT float ABI33_0_0YGNodeLayoutGetHeight(const ABI33_0_0YGNodeRef node);
WIN_EXPORT ABI33_0_0YGDirection ABI33_0_0YGNodeLayoutGetDirection(const ABI33_0_0YGNodeRef node);
WIN_EXPORT bool ABI33_0_0YGNodeLayoutGetHadOverflow(const ABI33_0_0YGNodeRef node);
bool ABI33_0_0YGNodeLayoutGetDidLegacyStretchFlagAffectLayout(const ABI33_0_0YGNodeRef node);

// Get the computed values for these nodes after performing layout. If they were
// set using point values then the returned value will be the same as
// ABI33_0_0YGNodeStyleGetXXX. However if they were set using a percentage value then the
// returned value is the computed value used during layout.
WIN_EXPORT float ABI33_0_0YGNodeLayoutGetMargin(const ABI33_0_0YGNodeRef node, const ABI33_0_0YGEdge edge);
WIN_EXPORT float ABI33_0_0YGNodeLayoutGetBorder(const ABI33_0_0YGNodeRef node, const ABI33_0_0YGEdge edge);
WIN_EXPORT float ABI33_0_0YGNodeLayoutGetPadding(
    const ABI33_0_0YGNodeRef node,
    const ABI33_0_0YGEdge edge);

WIN_EXPORT void ABI33_0_0YGConfigSetLogger(const ABI33_0_0YGConfigRef config, ABI33_0_0YGLogger logger);
WIN_EXPORT void ABI33_0_0YGLog(
    const ABI33_0_0YGNodeRef node,
    ABI33_0_0YGLogLevel level,
    const char* message,
    ...);
WIN_EXPORT void ABI33_0_0YGLogWithConfig(
    const ABI33_0_0YGConfigRef config,
    ABI33_0_0YGLogLevel level,
    const char* format,
    ...);
WIN_EXPORT void ABI33_0_0YGAssert(const bool condition, const char* message);
WIN_EXPORT void ABI33_0_0YGAssertWithNode(
    const ABI33_0_0YGNodeRef node,
    const bool condition,
    const char* message);
WIN_EXPORT void ABI33_0_0YGAssertWithConfig(
    const ABI33_0_0YGConfigRef config,
    const bool condition,
    const char* message);
// Set this to number of pixels in 1 point to round calculation results If you
// want to avoid rounding - set PointScaleFactor to 0
WIN_EXPORT void ABI33_0_0YGConfigSetPointScaleFactor(
    const ABI33_0_0YGConfigRef config,
    const float pixelsInPoint);
void ABI33_0_0YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
    const ABI33_0_0YGConfigRef config,
    const bool shouldDiffLayout);

// Yoga previously had an error where containers would take the maximum space
// possible instead of the minimum like they are supposed to. In practice this
// resulted in implicit behaviour similar to align-self: stretch; Because this
// was such a long-standing bug we must allow legacy users to switch back to
// this behaviour.
WIN_EXPORT void ABI33_0_0YGConfigSetUseLegacyStretchBehaviour(
    const ABI33_0_0YGConfigRef config,
    const bool useLegacyStretchBehaviour);

// ABI33_0_0YGConfig
WIN_EXPORT ABI33_0_0YGConfigRef ABI33_0_0YGConfigNew(void);
WIN_EXPORT void ABI33_0_0YGConfigFree(const ABI33_0_0YGConfigRef config);
WIN_EXPORT void ABI33_0_0YGConfigCopy(const ABI33_0_0YGConfigRef dest, const ABI33_0_0YGConfigRef src);
WIN_EXPORT int32_t ABI33_0_0YGConfigGetInstanceCount(void);

WIN_EXPORT void ABI33_0_0YGConfigSetExperimentalFeatureEnabled(
    const ABI33_0_0YGConfigRef config,
    const ABI33_0_0YGExperimentalFeature feature,
    const bool enabled);
WIN_EXPORT bool ABI33_0_0YGConfigIsExperimentalFeatureEnabled(
    const ABI33_0_0YGConfigRef config,
    const ABI33_0_0YGExperimentalFeature feature);

// Using the web defaults is the prefered configuration for new projects. Usage
// of non web defaults should be considered as legacy.
WIN_EXPORT void ABI33_0_0YGConfigSetUseWebDefaults(
    const ABI33_0_0YGConfigRef config,
    const bool enabled);
WIN_EXPORT bool ABI33_0_0YGConfigGetUseWebDefaults(const ABI33_0_0YGConfigRef config);

WIN_EXPORT void ABI33_0_0YGConfigSetCloneNodeFunc(
    const ABI33_0_0YGConfigRef config,
    const ABI33_0_0YGCloneNodeFunc callback);

// Export only for C#
WIN_EXPORT ABI33_0_0YGConfigRef ABI33_0_0YGConfigGetDefault(void);

WIN_EXPORT void ABI33_0_0YGConfigSetContext(const ABI33_0_0YGConfigRef config, void* context);
WIN_EXPORT void* ABI33_0_0YGConfigGetContext(const ABI33_0_0YGConfigRef config);

WIN_EXPORT float ABI33_0_0YGRoundValueToPixelGrid(
    const float value,
    const float pointScaleFactor,
    const bool forceCeil,
    const bool forceFloor);

ABI33_0_0YG_EXTERN_C_END

#ifdef __cplusplus

#include <functional>
#include <vector>

// Calls f on each node in the tree including the given node argument.
extern void ABI33_0_0YGTraversePreOrder(
    ABI33_0_0YGNodeRef const node,
    std::function<void(ABI33_0_0YGNodeRef node)>&& f);

extern void ABI33_0_0YGNodeSetChildren(
    ABI33_0_0YGNodeRef const owner,
    const std::vector<ABI33_0_0YGNodeRef>& children);

#endif
