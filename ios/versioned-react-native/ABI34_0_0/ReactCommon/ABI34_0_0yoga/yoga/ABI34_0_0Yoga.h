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

#include "ABI34_0_0YGEnums.h"
#include "ABI34_0_0YGMacros.h"
#include "ABI34_0_0YGValue.h"

ABI34_0_0YG_EXTERN_C_BEGIN

typedef struct ABI34_0_0YGSize {
  float width;
  float height;
} ABI34_0_0YGSize;

typedef struct ABI34_0_0YGConfig* ABI34_0_0YGConfigRef;

typedef struct ABI34_0_0YGNode* ABI34_0_0YGNodeRef;

typedef ABI34_0_0YGSize (*ABI34_0_0YGMeasureFunc)(
    ABI34_0_0YGNodeRef node,
    float width,
    ABI34_0_0YGMeasureMode widthMode,
    float height,
    ABI34_0_0YGMeasureMode heightMode);
typedef float (
    *ABI34_0_0YGBaselineFunc)(ABI34_0_0YGNodeRef node, const float width, const float height);
typedef void (*ABI34_0_0YGDirtiedFunc)(ABI34_0_0YGNodeRef node);
typedef void (*ABI34_0_0YGPrintFunc)(ABI34_0_0YGNodeRef node);
typedef void (*ABI34_0_0YGNodeCleanupFunc)(ABI34_0_0YGNodeRef node);
typedef int (*ABI34_0_0YGLogger)(
    const ABI34_0_0YGConfigRef config,
    const ABI34_0_0YGNodeRef node,
    ABI34_0_0YGLogLevel level,
    const char* format,
    va_list args);
typedef ABI34_0_0YGNodeRef (
    *ABI34_0_0YGCloneNodeFunc)(ABI34_0_0YGNodeRef oldNode, ABI34_0_0YGNodeRef owner, int childIndex);

// ABI34_0_0YGNode
WIN_EXPORT ABI34_0_0YGNodeRef ABI34_0_0YGNodeNew(void);
WIN_EXPORT ABI34_0_0YGNodeRef ABI34_0_0YGNodeNewWithConfig(const ABI34_0_0YGConfigRef config);
WIN_EXPORT ABI34_0_0YGNodeRef ABI34_0_0YGNodeClone(const ABI34_0_0YGNodeRef node);
WIN_EXPORT void ABI34_0_0YGNodeFree(const ABI34_0_0YGNodeRef node);
WIN_EXPORT void ABI34_0_0YGNodeFreeRecursiveWithCleanupFunc(
    const ABI34_0_0YGNodeRef node,
    ABI34_0_0YGNodeCleanupFunc cleanup);
WIN_EXPORT void ABI34_0_0YGNodeFreeRecursive(const ABI34_0_0YGNodeRef node);
WIN_EXPORT void ABI34_0_0YGNodeReset(const ABI34_0_0YGNodeRef node);
WIN_EXPORT int32_t ABI34_0_0YGNodeGetInstanceCount(void);

WIN_EXPORT void ABI34_0_0YGNodeInsertChild(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGNodeRef child,
    const uint32_t index);

WIN_EXPORT void ABI34_0_0YGNodeRemoveChild(const ABI34_0_0YGNodeRef node, const ABI34_0_0YGNodeRef child);
WIN_EXPORT void ABI34_0_0YGNodeRemoveAllChildren(const ABI34_0_0YGNodeRef node);
WIN_EXPORT ABI34_0_0YGNodeRef ABI34_0_0YGNodeGetChild(const ABI34_0_0YGNodeRef node, const uint32_t index);
WIN_EXPORT ABI34_0_0YGNodeRef ABI34_0_0YGNodeGetOwner(const ABI34_0_0YGNodeRef node);
WIN_EXPORT ABI34_0_0YGNodeRef ABI34_0_0YGNodeGetParent(const ABI34_0_0YGNodeRef node);
WIN_EXPORT uint32_t ABI34_0_0YGNodeGetChildCount(const ABI34_0_0YGNodeRef node);
WIN_EXPORT void ABI34_0_0YGNodeSetChildren(
    ABI34_0_0YGNodeRef const owner,
    const ABI34_0_0YGNodeRef children[],
    const uint32_t count);

WIN_EXPORT void ABI34_0_0YGNodeSetIsReferenceBaseline(
    ABI34_0_0YGNodeRef node,
    bool isReferenceBaseline);

WIN_EXPORT bool ABI34_0_0YGNodeIsReferenceBaseline(ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeCalculateLayout(
    const ABI34_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI34_0_0YGDirection ownerDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
//
// Yoga knows when to mark all other nodes as dirty but because nodes with
// measure functions depend on information not known to Yoga they must perform
// this dirty marking manually.
WIN_EXPORT void ABI34_0_0YGNodeMarkDirty(const ABI34_0_0YGNodeRef node);

// Marks the current node and all its descendants as dirty.
//
// Intended to be used for Uoga benchmarks. Don't use in production, as calling
// `ABI34_0_0YGCalculateLayout` will cause the recalculation of each and every node.
WIN_EXPORT void ABI34_0_0YGNodeMarkDirtyAndPropogateToDescendants(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodePrint(const ABI34_0_0YGNodeRef node, const ABI34_0_0YGPrintOptions options);

WIN_EXPORT bool ABI34_0_0YGFloatIsUndefined(const float value);

WIN_EXPORT bool ABI34_0_0YGNodeCanUseCachedMeasurement(
    const ABI34_0_0YGMeasureMode widthMode,
    const float width,
    const ABI34_0_0YGMeasureMode heightMode,
    const float height,
    const ABI34_0_0YGMeasureMode lastWidthMode,
    const float lastWidth,
    const ABI34_0_0YGMeasureMode lastHeightMode,
    const float lastHeight,
    const float lastComputedWidth,
    const float lastComputedHeight,
    const float marginRow,
    const float marginColumn,
    const ABI34_0_0YGConfigRef config);

WIN_EXPORT void ABI34_0_0YGNodeCopyStyle(
    const ABI34_0_0YGNodeRef dstNode,
    const ABI34_0_0YGNodeRef srcNode);

WIN_EXPORT void* ABI34_0_0YGNodeGetContext(ABI34_0_0YGNodeRef node);
WIN_EXPORT void ABI34_0_0YGNodeSetContext(ABI34_0_0YGNodeRef node, void* context);
void ABI34_0_0YGConfigSetPrintTreeFlag(ABI34_0_0YGConfigRef config, bool enabled);
ABI34_0_0YGMeasureFunc ABI34_0_0YGNodeGetMeasureFunc(ABI34_0_0YGNodeRef node);
WIN_EXPORT void ABI34_0_0YGNodeSetMeasureFunc(ABI34_0_0YGNodeRef node, ABI34_0_0YGMeasureFunc measureFunc);
ABI34_0_0YGBaselineFunc ABI34_0_0YGNodeGetBaselineFunc(ABI34_0_0YGNodeRef node);
void ABI34_0_0YGNodeSetBaselineFunc(ABI34_0_0YGNodeRef node, ABI34_0_0YGBaselineFunc baselineFunc);
ABI34_0_0YGDirtiedFunc ABI34_0_0YGNodeGetDirtiedFunc(ABI34_0_0YGNodeRef node);
void ABI34_0_0YGNodeSetDirtiedFunc(ABI34_0_0YGNodeRef node, ABI34_0_0YGDirtiedFunc dirtiedFunc);
ABI34_0_0YGPrintFunc ABI34_0_0YGNodeGetPrintFunc(ABI34_0_0YGNodeRef node);
void ABI34_0_0YGNodeSetPrintFunc(ABI34_0_0YGNodeRef node, ABI34_0_0YGPrintFunc printFunc);
WIN_EXPORT bool ABI34_0_0YGNodeGetHasNewLayout(ABI34_0_0YGNodeRef node);
WIN_EXPORT void ABI34_0_0YGNodeSetHasNewLayout(ABI34_0_0YGNodeRef node, bool hasNewLayout);
ABI34_0_0YGNodeType ABI34_0_0YGNodeGetNodeType(ABI34_0_0YGNodeRef node);
void ABI34_0_0YGNodeSetNodeType(ABI34_0_0YGNodeRef node, ABI34_0_0YGNodeType nodeType);
WIN_EXPORT bool ABI34_0_0YGNodeIsDirty(ABI34_0_0YGNodeRef node);
bool ABI34_0_0YGNodeLayoutGetDidUseLegacyFlag(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetDirection(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGDirection direction);
WIN_EXPORT ABI34_0_0YGDirection ABI34_0_0YGNodeStyleGetDirection(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetFlexDirection(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGFlexDirection flexDirection);
WIN_EXPORT ABI34_0_0YGFlexDirection ABI34_0_0YGNodeStyleGetFlexDirection(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetJustifyContent(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGJustify justifyContent);
WIN_EXPORT ABI34_0_0YGJustify ABI34_0_0YGNodeStyleGetJustifyContent(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetAlignContent(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGAlign alignContent);
WIN_EXPORT ABI34_0_0YGAlign ABI34_0_0YGNodeStyleGetAlignContent(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetAlignItems(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGAlign alignItems);
WIN_EXPORT ABI34_0_0YGAlign ABI34_0_0YGNodeStyleGetAlignItems(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetAlignSelf(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGAlign alignSelf);
WIN_EXPORT ABI34_0_0YGAlign ABI34_0_0YGNodeStyleGetAlignSelf(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetPositionType(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGPositionType positionType);
WIN_EXPORT ABI34_0_0YGPositionType ABI34_0_0YGNodeStyleGetPositionType(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetFlexWrap(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGWrap flexWrap);
WIN_EXPORT ABI34_0_0YGWrap ABI34_0_0YGNodeStyleGetFlexWrap(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetOverflow(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGOverflow overflow);
WIN_EXPORT ABI34_0_0YGOverflow ABI34_0_0YGNodeStyleGetOverflow(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetDisplay(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGDisplay display);
WIN_EXPORT ABI34_0_0YGDisplay ABI34_0_0YGNodeStyleGetDisplay(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetFlex(const ABI34_0_0YGNodeRef node, const float flex);
WIN_EXPORT float ABI34_0_0YGNodeStyleGetFlex(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetFlexGrow(
    const ABI34_0_0YGNodeRef node,
    const float flexGrow);
WIN_EXPORT float ABI34_0_0YGNodeStyleGetFlexGrow(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetFlexShrink(
    const ABI34_0_0YGNodeRef node,
    const float flexShrink);
WIN_EXPORT float ABI34_0_0YGNodeStyleGetFlexShrink(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetFlexBasis(
    const ABI34_0_0YGNodeRef node,
    const float flexBasis);
WIN_EXPORT void ABI34_0_0YGNodeStyleSetFlexBasisPercent(
    const ABI34_0_0YGNodeRef node,
    const float flexBasis);
WIN_EXPORT void ABI34_0_0YGNodeStyleSetFlexBasisAuto(const ABI34_0_0YGNodeRef node);
WIN_EXPORT ABI34_0_0YGValue ABI34_0_0YGNodeStyleGetFlexBasis(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetPosition(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGEdge edge,
    const float position);
WIN_EXPORT void ABI34_0_0YGNodeStyleSetPositionPercent(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGEdge edge,
    const float position);
WIN_EXPORT ABI34_0_0YGValue
ABI34_0_0YGNodeStyleGetPosition(const ABI34_0_0YGNodeRef node, const ABI34_0_0YGEdge edge);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetMargin(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGEdge edge,
    const float margin);
WIN_EXPORT void ABI34_0_0YGNodeStyleSetMarginPercent(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGEdge edge,
    const float margin);
WIN_EXPORT void ABI34_0_0YGNodeStyleSetMarginAuto(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGEdge edge);
WIN_EXPORT ABI34_0_0YGValue
ABI34_0_0YGNodeStyleGetMargin(const ABI34_0_0YGNodeRef node, const ABI34_0_0YGEdge edge);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetPadding(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGEdge edge,
    const float padding);
WIN_EXPORT void ABI34_0_0YGNodeStyleSetPaddingPercent(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGEdge edge,
    const float padding);
WIN_EXPORT ABI34_0_0YGValue
ABI34_0_0YGNodeStyleGetPadding(const ABI34_0_0YGNodeRef node, const ABI34_0_0YGEdge edge);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetBorder(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGEdge edge,
    const float border);
WIN_EXPORT float ABI34_0_0YGNodeStyleGetBorder(const ABI34_0_0YGNodeRef node, const ABI34_0_0YGEdge edge);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetWidth(const ABI34_0_0YGNodeRef node, const float width);
WIN_EXPORT void ABI34_0_0YGNodeStyleSetWidthPercent(
    const ABI34_0_0YGNodeRef node,
    const float width);
WIN_EXPORT void ABI34_0_0YGNodeStyleSetWidthAuto(const ABI34_0_0YGNodeRef node);
WIN_EXPORT ABI34_0_0YGValue ABI34_0_0YGNodeStyleGetWidth(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetHeight(const ABI34_0_0YGNodeRef node, const float height);
WIN_EXPORT void ABI34_0_0YGNodeStyleSetHeightPercent(
    const ABI34_0_0YGNodeRef node,
    const float height);
WIN_EXPORT void ABI34_0_0YGNodeStyleSetHeightAuto(const ABI34_0_0YGNodeRef node);
WIN_EXPORT ABI34_0_0YGValue ABI34_0_0YGNodeStyleGetHeight(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetMinWidth(
    const ABI34_0_0YGNodeRef node,
    const float minWidth);
WIN_EXPORT void ABI34_0_0YGNodeStyleSetMinWidthPercent(
    const ABI34_0_0YGNodeRef node,
    const float minWidth);
WIN_EXPORT ABI34_0_0YGValue ABI34_0_0YGNodeStyleGetMinWidth(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetMinHeight(
    const ABI34_0_0YGNodeRef node,
    const float minHeight);
WIN_EXPORT void ABI34_0_0YGNodeStyleSetMinHeightPercent(
    const ABI34_0_0YGNodeRef node,
    const float minHeight);
WIN_EXPORT ABI34_0_0YGValue ABI34_0_0YGNodeStyleGetMinHeight(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetMaxWidth(
    const ABI34_0_0YGNodeRef node,
    const float maxWidth);
WIN_EXPORT void ABI34_0_0YGNodeStyleSetMaxWidthPercent(
    const ABI34_0_0YGNodeRef node,
    const float maxWidth);
WIN_EXPORT ABI34_0_0YGValue ABI34_0_0YGNodeStyleGetMaxWidth(const ABI34_0_0YGNodeRef node);

WIN_EXPORT void ABI34_0_0YGNodeStyleSetMaxHeight(
    const ABI34_0_0YGNodeRef node,
    const float maxHeight);
WIN_EXPORT void ABI34_0_0YGNodeStyleSetMaxHeightPercent(
    const ABI34_0_0YGNodeRef node,
    const float maxHeight);
WIN_EXPORT ABI34_0_0YGValue ABI34_0_0YGNodeStyleGetMaxHeight(const ABI34_0_0YGNodeRef node);

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
WIN_EXPORT void ABI34_0_0YGNodeStyleSetAspectRatio(
    const ABI34_0_0YGNodeRef node,
    const float aspectRatio);
WIN_EXPORT float ABI34_0_0YGNodeStyleGetAspectRatio(const ABI34_0_0YGNodeRef node);

WIN_EXPORT float ABI34_0_0YGNodeLayoutGetLeft(const ABI34_0_0YGNodeRef node);
WIN_EXPORT float ABI34_0_0YGNodeLayoutGetTop(const ABI34_0_0YGNodeRef node);
WIN_EXPORT float ABI34_0_0YGNodeLayoutGetRight(const ABI34_0_0YGNodeRef node);
WIN_EXPORT float ABI34_0_0YGNodeLayoutGetBottom(const ABI34_0_0YGNodeRef node);
WIN_EXPORT float ABI34_0_0YGNodeLayoutGetWidth(const ABI34_0_0YGNodeRef node);
WIN_EXPORT float ABI34_0_0YGNodeLayoutGetHeight(const ABI34_0_0YGNodeRef node);
WIN_EXPORT ABI34_0_0YGDirection ABI34_0_0YGNodeLayoutGetDirection(const ABI34_0_0YGNodeRef node);
WIN_EXPORT bool ABI34_0_0YGNodeLayoutGetHadOverflow(const ABI34_0_0YGNodeRef node);
bool ABI34_0_0YGNodeLayoutGetDidLegacyStretchFlagAffectLayout(const ABI34_0_0YGNodeRef node);

// Get the computed values for these nodes after performing layout. If they were
// set using point values then the returned value will be the same as
// ABI34_0_0YGNodeStyleGetXXX. However if they were set using a percentage value then the
// returned value is the computed value used during layout.
WIN_EXPORT float ABI34_0_0YGNodeLayoutGetMargin(const ABI34_0_0YGNodeRef node, const ABI34_0_0YGEdge edge);
WIN_EXPORT float ABI34_0_0YGNodeLayoutGetBorder(const ABI34_0_0YGNodeRef node, const ABI34_0_0YGEdge edge);
WIN_EXPORT float ABI34_0_0YGNodeLayoutGetPadding(
    const ABI34_0_0YGNodeRef node,
    const ABI34_0_0YGEdge edge);

WIN_EXPORT void ABI34_0_0YGConfigSetLogger(const ABI34_0_0YGConfigRef config, ABI34_0_0YGLogger logger);
WIN_EXPORT void ABI34_0_0YGLog(
    const ABI34_0_0YGNodeRef node,
    ABI34_0_0YGLogLevel level,
    const char* message,
    ...);
WIN_EXPORT void ABI34_0_0YGLogWithConfig(
    const ABI34_0_0YGConfigRef config,
    ABI34_0_0YGLogLevel level,
    const char* format,
    ...);
WIN_EXPORT void ABI34_0_0YGAssert(const bool condition, const char* message);
WIN_EXPORT void ABI34_0_0YGAssertWithNode(
    const ABI34_0_0YGNodeRef node,
    const bool condition,
    const char* message);
WIN_EXPORT void ABI34_0_0YGAssertWithConfig(
    const ABI34_0_0YGConfigRef config,
    const bool condition,
    const char* message);
// Set this to number of pixels in 1 point to round calculation results If you
// want to avoid rounding - set PointScaleFactor to 0
WIN_EXPORT void ABI34_0_0YGConfigSetPointScaleFactor(
    const ABI34_0_0YGConfigRef config,
    const float pixelsInPoint);
void ABI34_0_0YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
    const ABI34_0_0YGConfigRef config,
    const bool shouldDiffLayout);

// Yoga previously had an error where containers would take the maximum space
// possible instead of the minimum like they are supposed to. In practice this
// resulted in implicit behaviour similar to align-self: stretch; Because this
// was such a long-standing bug we must allow legacy users to switch back to
// this behaviour.
WIN_EXPORT void ABI34_0_0YGConfigSetUseLegacyStretchBehaviour(
    const ABI34_0_0YGConfigRef config,
    const bool useLegacyStretchBehaviour);

// ABI34_0_0YGConfig
WIN_EXPORT ABI34_0_0YGConfigRef ABI34_0_0YGConfigNew(void);
WIN_EXPORT void ABI34_0_0YGConfigFree(const ABI34_0_0YGConfigRef config);
WIN_EXPORT void ABI34_0_0YGConfigCopy(const ABI34_0_0YGConfigRef dest, const ABI34_0_0YGConfigRef src);
WIN_EXPORT int32_t ABI34_0_0YGConfigGetInstanceCount(void);

WIN_EXPORT void ABI34_0_0YGConfigSetExperimentalFeatureEnabled(
    const ABI34_0_0YGConfigRef config,
    const ABI34_0_0YGExperimentalFeature feature,
    const bool enabled);
WIN_EXPORT bool ABI34_0_0YGConfigIsExperimentalFeatureEnabled(
    const ABI34_0_0YGConfigRef config,
    const ABI34_0_0YGExperimentalFeature feature);

// Using the web defaults is the prefered configuration for new projects. Usage
// of non web defaults should be considered as legacy.
WIN_EXPORT void ABI34_0_0YGConfigSetUseWebDefaults(
    const ABI34_0_0YGConfigRef config,
    const bool enabled);
WIN_EXPORT bool ABI34_0_0YGConfigGetUseWebDefaults(const ABI34_0_0YGConfigRef config);

WIN_EXPORT void ABI34_0_0YGConfigSetCloneNodeFunc(
    const ABI34_0_0YGConfigRef config,
    const ABI34_0_0YGCloneNodeFunc callback);

// Export only for C#
WIN_EXPORT ABI34_0_0YGConfigRef ABI34_0_0YGConfigGetDefault(void);

WIN_EXPORT void ABI34_0_0YGConfigSetContext(const ABI34_0_0YGConfigRef config, void* context);
WIN_EXPORT void* ABI34_0_0YGConfigGetContext(const ABI34_0_0YGConfigRef config);

WIN_EXPORT float ABI34_0_0YGRoundValueToPixelGrid(
    const float value,
    const float pointScaleFactor,
    const bool forceCeil,
    const bool forceFloor);

ABI34_0_0YG_EXTERN_C_END

#ifdef __cplusplus

#include <functional>
#include <vector>

// Calls f on each node in the tree including the given node argument.
extern void ABI34_0_0YGTraversePreOrder(
    ABI34_0_0YGNodeRef const node,
    std::function<void(ABI34_0_0YGNodeRef node)>&& f);

extern void ABI34_0_0YGNodeSetChildren(
    ABI34_0_0YGNodeRef const owner,
    const std::vector<ABI34_0_0YGNodeRef>& children);

#endif
