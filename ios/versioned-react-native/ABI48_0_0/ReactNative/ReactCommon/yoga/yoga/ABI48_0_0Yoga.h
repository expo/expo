/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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

#include "ABI48_0_0YGEnums.h"
#include "ABI48_0_0YGMacros.h"
#include "ABI48_0_0YGValue.h"

ABI48_0_0YG_EXTERN_C_BEGIN

typedef struct ABI48_0_0YGSize {
  float width;
  float height;
} ABI48_0_0YGSize;

typedef struct ABI48_0_0YGConfig* ABI48_0_0YGConfigRef;

typedef struct ABI48_0_0YGNode* ABI48_0_0YGNodeRef;
typedef const struct ABI48_0_0YGNode* ABI48_0_0YGNodeConstRef;

typedef ABI48_0_0YGSize (*ABI48_0_0YGMeasureFunc)(
    ABI48_0_0YGNodeRef node,
    float width,
    ABI48_0_0YGMeasureMode widthMode,
    float height,
    ABI48_0_0YGMeasureMode heightMode);
typedef float (*ABI48_0_0YGBaselineFunc)(ABI48_0_0YGNodeRef node, float width, float height);
typedef void (*ABI48_0_0YGDirtiedFunc)(ABI48_0_0YGNodeRef node);
typedef void (*ABI48_0_0YGPrintFunc)(ABI48_0_0YGNodeRef node);
typedef void (*ABI48_0_0YGNodeCleanupFunc)(ABI48_0_0YGNodeRef node);
typedef int (*ABI48_0_0YGLogger)(
    ABI48_0_0YGConfigRef config,
    ABI48_0_0YGNodeRef node,
    ABI48_0_0YGLogLevel level,
    const char* format,
    va_list args);
typedef ABI48_0_0YGNodeRef (
    *ABI48_0_0YGCloneNodeFunc)(ABI48_0_0YGNodeRef oldNode, ABI48_0_0YGNodeRef owner, int childIndex);

// ABI48_0_0YGNode
WIN_EXPORT ABI48_0_0YGNodeRef ABI48_0_0YGNodeNew(void);
WIN_EXPORT ABI48_0_0YGNodeRef ABI48_0_0YGNodeNewWithConfig(ABI48_0_0YGConfigRef config);
WIN_EXPORT ABI48_0_0YGNodeRef ABI48_0_0YGNodeClone(ABI48_0_0YGNodeRef node);
WIN_EXPORT void ABI48_0_0YGNodeFree(ABI48_0_0YGNodeRef node);
WIN_EXPORT void ABI48_0_0YGNodeFreeRecursiveWithCleanupFunc(
    ABI48_0_0YGNodeRef node,
    ABI48_0_0YGNodeCleanupFunc cleanup);
WIN_EXPORT void ABI48_0_0YGNodeFreeRecursive(ABI48_0_0YGNodeRef node);
WIN_EXPORT void ABI48_0_0YGNodeReset(ABI48_0_0YGNodeRef node);

WIN_EXPORT void ABI48_0_0YGNodeInsertChild(
    ABI48_0_0YGNodeRef node,
    ABI48_0_0YGNodeRef child,
    uint32_t index);

WIN_EXPORT void ABI48_0_0YGNodeSwapChild(
    ABI48_0_0YGNodeRef node,
    ABI48_0_0YGNodeRef child,
    uint32_t index);

WIN_EXPORT void ABI48_0_0YGNodeRemoveChild(ABI48_0_0YGNodeRef node, ABI48_0_0YGNodeRef child);
WIN_EXPORT void ABI48_0_0YGNodeRemoveAllChildren(ABI48_0_0YGNodeRef node);
WIN_EXPORT ABI48_0_0YGNodeRef ABI48_0_0YGNodeGetChild(ABI48_0_0YGNodeRef node, uint32_t index);
WIN_EXPORT ABI48_0_0YGNodeRef ABI48_0_0YGNodeGetOwner(ABI48_0_0YGNodeRef node);
WIN_EXPORT ABI48_0_0YGNodeRef ABI48_0_0YGNodeGetParent(ABI48_0_0YGNodeRef node);
WIN_EXPORT uint32_t ABI48_0_0YGNodeGetChildCount(ABI48_0_0YGNodeRef node);
WIN_EXPORT void ABI48_0_0YGNodeSetChildren(
    ABI48_0_0YGNodeRef owner,
    const ABI48_0_0YGNodeRef children[],
    uint32_t count);

WIN_EXPORT void ABI48_0_0YGNodeSetIsReferenceBaseline(
    ABI48_0_0YGNodeRef node,
    bool isReferenceBaseline);

WIN_EXPORT bool ABI48_0_0YGNodeIsReferenceBaseline(ABI48_0_0YGNodeRef node);

WIN_EXPORT void ABI48_0_0YGNodeCalculateLayout(
    ABI48_0_0YGNodeRef node,
    float availableWidth,
    float availableHeight,
    ABI48_0_0YGDirection ownerDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
//
// Yoga knows when to mark all other nodes as dirty but because nodes with
// measure functions depend on information not known to Yoga they must perform
// this dirty marking manually.
WIN_EXPORT void ABI48_0_0YGNodeMarkDirty(ABI48_0_0YGNodeRef node);

// Marks the current node and all its descendants as dirty.
//
// Intended to be used for Yoga benchmarks. Don't use in production, as calling
// `ABI48_0_0YGCalculateLayout` will cause the recalculation of each and every node.
WIN_EXPORT void ABI48_0_0YGNodeMarkDirtyAndPropogateToDescendants(ABI48_0_0YGNodeRef node);

WIN_EXPORT void ABI48_0_0YGNodePrint(ABI48_0_0YGNodeRef node, ABI48_0_0YGPrintOptions options);

WIN_EXPORT bool ABI48_0_0YGFloatIsUndefined(float value);

WIN_EXPORT bool ABI48_0_0YGNodeCanUseCachedMeasurement(
    ABI48_0_0YGMeasureMode widthMode,
    float width,
    ABI48_0_0YGMeasureMode heightMode,
    float height,
    ABI48_0_0YGMeasureMode lastWidthMode,
    float lastWidth,
    ABI48_0_0YGMeasureMode lastHeightMode,
    float lastHeight,
    float lastComputedWidth,
    float lastComputedHeight,
    float marginRow,
    float marginColumn,
    ABI48_0_0YGConfigRef config);

WIN_EXPORT void ABI48_0_0YGNodeCopyStyle(ABI48_0_0YGNodeRef dstNode, ABI48_0_0YGNodeRef srcNode);

WIN_EXPORT void* ABI48_0_0YGNodeGetContext(ABI48_0_0YGNodeRef node);
WIN_EXPORT void ABI48_0_0YGNodeSetContext(ABI48_0_0YGNodeRef node, void* context);
void ABI48_0_0YGConfigSetPrintTreeFlag(ABI48_0_0YGConfigRef config, bool enabled);
bool ABI48_0_0YGNodeHasMeasureFunc(ABI48_0_0YGNodeRef node);
WIN_EXPORT void ABI48_0_0YGNodeSetMeasureFunc(ABI48_0_0YGNodeRef node, ABI48_0_0YGMeasureFunc measureFunc);
bool ABI48_0_0YGNodeHasBaselineFunc(ABI48_0_0YGNodeRef node);
void ABI48_0_0YGNodeSetBaselineFunc(ABI48_0_0YGNodeRef node, ABI48_0_0YGBaselineFunc baselineFunc);
ABI48_0_0YGDirtiedFunc ABI48_0_0YGNodeGetDirtiedFunc(ABI48_0_0YGNodeRef node);
void ABI48_0_0YGNodeSetDirtiedFunc(ABI48_0_0YGNodeRef node, ABI48_0_0YGDirtiedFunc dirtiedFunc);
void ABI48_0_0YGNodeSetPrintFunc(ABI48_0_0YGNodeRef node, ABI48_0_0YGPrintFunc printFunc);
WIN_EXPORT bool ABI48_0_0YGNodeGetHasNewLayout(ABI48_0_0YGNodeRef node);
WIN_EXPORT void ABI48_0_0YGNodeSetHasNewLayout(ABI48_0_0YGNodeRef node, bool hasNewLayout);
ABI48_0_0YGNodeType ABI48_0_0YGNodeGetNodeType(ABI48_0_0YGNodeRef node);
void ABI48_0_0YGNodeSetNodeType(ABI48_0_0YGNodeRef node, ABI48_0_0YGNodeType nodeType);
WIN_EXPORT bool ABI48_0_0YGNodeIsDirty(ABI48_0_0YGNodeRef node);
bool ABI48_0_0YGNodeLayoutGetDidUseLegacyFlag(ABI48_0_0YGNodeRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetDirection(ABI48_0_0YGNodeRef node, ABI48_0_0YGDirection direction);
WIN_EXPORT ABI48_0_0YGDirection ABI48_0_0YGNodeStyleGetDirection(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetFlexDirection(
    ABI48_0_0YGNodeRef node,
    ABI48_0_0YGFlexDirection flexDirection);
WIN_EXPORT ABI48_0_0YGFlexDirection ABI48_0_0YGNodeStyleGetFlexDirection(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetJustifyContent(
    ABI48_0_0YGNodeRef node,
    ABI48_0_0YGJustify justifyContent);
WIN_EXPORT ABI48_0_0YGJustify ABI48_0_0YGNodeStyleGetJustifyContent(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetAlignContent(
    ABI48_0_0YGNodeRef node,
    ABI48_0_0YGAlign alignContent);
WIN_EXPORT ABI48_0_0YGAlign ABI48_0_0YGNodeStyleGetAlignContent(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetAlignItems(ABI48_0_0YGNodeRef node, ABI48_0_0YGAlign alignItems);
WIN_EXPORT ABI48_0_0YGAlign ABI48_0_0YGNodeStyleGetAlignItems(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetAlignSelf(ABI48_0_0YGNodeRef node, ABI48_0_0YGAlign alignSelf);
WIN_EXPORT ABI48_0_0YGAlign ABI48_0_0YGNodeStyleGetAlignSelf(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetPositionType(
    ABI48_0_0YGNodeRef node,
    ABI48_0_0YGPositionType positionType);
WIN_EXPORT ABI48_0_0YGPositionType ABI48_0_0YGNodeStyleGetPositionType(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetFlexWrap(ABI48_0_0YGNodeRef node, ABI48_0_0YGWrap flexWrap);
WIN_EXPORT ABI48_0_0YGWrap ABI48_0_0YGNodeStyleGetFlexWrap(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetOverflow(ABI48_0_0YGNodeRef node, ABI48_0_0YGOverflow overflow);
WIN_EXPORT ABI48_0_0YGOverflow ABI48_0_0YGNodeStyleGetOverflow(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetDisplay(ABI48_0_0YGNodeRef node, ABI48_0_0YGDisplay display);
WIN_EXPORT ABI48_0_0YGDisplay ABI48_0_0YGNodeStyleGetDisplay(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetFlex(ABI48_0_0YGNodeRef node, float flex);
WIN_EXPORT float ABI48_0_0YGNodeStyleGetFlex(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetFlexGrow(ABI48_0_0YGNodeRef node, float flexGrow);
WIN_EXPORT float ABI48_0_0YGNodeStyleGetFlexGrow(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetFlexShrink(ABI48_0_0YGNodeRef node, float flexShrink);
WIN_EXPORT float ABI48_0_0YGNodeStyleGetFlexShrink(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetFlexBasis(ABI48_0_0YGNodeRef node, float flexBasis);
WIN_EXPORT void ABI48_0_0YGNodeStyleSetFlexBasisPercent(ABI48_0_0YGNodeRef node, float flexBasis);
WIN_EXPORT void ABI48_0_0YGNodeStyleSetFlexBasisAuto(ABI48_0_0YGNodeRef node);
WIN_EXPORT ABI48_0_0YGValue ABI48_0_0YGNodeStyleGetFlexBasis(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetPosition(
    ABI48_0_0YGNodeRef node,
    ABI48_0_0YGEdge edge,
    float position);
WIN_EXPORT void ABI48_0_0YGNodeStyleSetPositionPercent(
    ABI48_0_0YGNodeRef node,
    ABI48_0_0YGEdge edge,
    float position);
WIN_EXPORT ABI48_0_0YGValue ABI48_0_0YGNodeStyleGetPosition(ABI48_0_0YGNodeConstRef node, ABI48_0_0YGEdge edge);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetMargin(ABI48_0_0YGNodeRef node, ABI48_0_0YGEdge edge, float margin);
WIN_EXPORT void ABI48_0_0YGNodeStyleSetMarginPercent(
    ABI48_0_0YGNodeRef node,
    ABI48_0_0YGEdge edge,
    float margin);
WIN_EXPORT void ABI48_0_0YGNodeStyleSetMarginAuto(ABI48_0_0YGNodeRef node, ABI48_0_0YGEdge edge);
WIN_EXPORT ABI48_0_0YGValue ABI48_0_0YGNodeStyleGetMargin(ABI48_0_0YGNodeConstRef node, ABI48_0_0YGEdge edge);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetPadding(
    ABI48_0_0YGNodeRef node,
    ABI48_0_0YGEdge edge,
    float padding);
WIN_EXPORT void ABI48_0_0YGNodeStyleSetPaddingPercent(
    ABI48_0_0YGNodeRef node,
    ABI48_0_0YGEdge edge,
    float padding);
WIN_EXPORT ABI48_0_0YGValue ABI48_0_0YGNodeStyleGetPadding(ABI48_0_0YGNodeConstRef node, ABI48_0_0YGEdge edge);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetBorder(ABI48_0_0YGNodeRef node, ABI48_0_0YGEdge edge, float border);
WIN_EXPORT float ABI48_0_0YGNodeStyleGetBorder(ABI48_0_0YGNodeConstRef node, ABI48_0_0YGEdge edge);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetGap(
    ABI48_0_0YGNodeRef node,
    ABI48_0_0YGGutter gutter,
    float gapLength);
WIN_EXPORT float ABI48_0_0YGNodeStyleGetGap(ABI48_0_0YGNodeConstRef node, ABI48_0_0YGGutter gutter);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetWidth(ABI48_0_0YGNodeRef node, float width);
WIN_EXPORT void ABI48_0_0YGNodeStyleSetWidthPercent(ABI48_0_0YGNodeRef node, float width);
WIN_EXPORT void ABI48_0_0YGNodeStyleSetWidthAuto(ABI48_0_0YGNodeRef node);
WIN_EXPORT ABI48_0_0YGValue ABI48_0_0YGNodeStyleGetWidth(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetHeight(ABI48_0_0YGNodeRef node, float height);
WIN_EXPORT void ABI48_0_0YGNodeStyleSetHeightPercent(ABI48_0_0YGNodeRef node, float height);
WIN_EXPORT void ABI48_0_0YGNodeStyleSetHeightAuto(ABI48_0_0YGNodeRef node);
WIN_EXPORT ABI48_0_0YGValue ABI48_0_0YGNodeStyleGetHeight(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetMinWidth(ABI48_0_0YGNodeRef node, float minWidth);
WIN_EXPORT void ABI48_0_0YGNodeStyleSetMinWidthPercent(ABI48_0_0YGNodeRef node, float minWidth);
WIN_EXPORT ABI48_0_0YGValue ABI48_0_0YGNodeStyleGetMinWidth(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetMinHeight(ABI48_0_0YGNodeRef node, float minHeight);
WIN_EXPORT void ABI48_0_0YGNodeStyleSetMinHeightPercent(ABI48_0_0YGNodeRef node, float minHeight);
WIN_EXPORT ABI48_0_0YGValue ABI48_0_0YGNodeStyleGetMinHeight(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetMaxWidth(ABI48_0_0YGNodeRef node, float maxWidth);
WIN_EXPORT void ABI48_0_0YGNodeStyleSetMaxWidthPercent(ABI48_0_0YGNodeRef node, float maxWidth);
WIN_EXPORT ABI48_0_0YGValue ABI48_0_0YGNodeStyleGetMaxWidth(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT void ABI48_0_0YGNodeStyleSetMaxHeight(ABI48_0_0YGNodeRef node, float maxHeight);
WIN_EXPORT void ABI48_0_0YGNodeStyleSetMaxHeightPercent(ABI48_0_0YGNodeRef node, float maxHeight);
WIN_EXPORT ABI48_0_0YGValue ABI48_0_0YGNodeStyleGetMaxHeight(ABI48_0_0YGNodeConstRef node);

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
WIN_EXPORT void ABI48_0_0YGNodeStyleSetAspectRatio(ABI48_0_0YGNodeRef node, float aspectRatio);
WIN_EXPORT float ABI48_0_0YGNodeStyleGetAspectRatio(ABI48_0_0YGNodeConstRef node);

WIN_EXPORT float ABI48_0_0YGNodeLayoutGetLeft(ABI48_0_0YGNodeRef node);
WIN_EXPORT float ABI48_0_0YGNodeLayoutGetTop(ABI48_0_0YGNodeRef node);
WIN_EXPORT float ABI48_0_0YGNodeLayoutGetRight(ABI48_0_0YGNodeRef node);
WIN_EXPORT float ABI48_0_0YGNodeLayoutGetBottom(ABI48_0_0YGNodeRef node);
WIN_EXPORT float ABI48_0_0YGNodeLayoutGetWidth(ABI48_0_0YGNodeRef node);
WIN_EXPORT float ABI48_0_0YGNodeLayoutGetHeight(ABI48_0_0YGNodeRef node);
WIN_EXPORT ABI48_0_0YGDirection ABI48_0_0YGNodeLayoutGetDirection(ABI48_0_0YGNodeRef node);
WIN_EXPORT bool ABI48_0_0YGNodeLayoutGetHadOverflow(ABI48_0_0YGNodeRef node);
bool ABI48_0_0YGNodeLayoutGetDidLegacyStretchFlagAffectLayout(ABI48_0_0YGNodeRef node);

// Get the computed values for these nodes after performing layout. If they were
// set using point values then the returned value will be the same as
// ABI48_0_0YGNodeStyleGetXXX. However if they were set using a percentage value then the
// returned value is the computed value used during layout.
WIN_EXPORT float ABI48_0_0YGNodeLayoutGetMargin(ABI48_0_0YGNodeRef node, ABI48_0_0YGEdge edge);
WIN_EXPORT float ABI48_0_0YGNodeLayoutGetBorder(ABI48_0_0YGNodeRef node, ABI48_0_0YGEdge edge);
WIN_EXPORT float ABI48_0_0YGNodeLayoutGetPadding(ABI48_0_0YGNodeRef node, ABI48_0_0YGEdge edge);

WIN_EXPORT void ABI48_0_0YGConfigSetLogger(ABI48_0_0YGConfigRef config, ABI48_0_0YGLogger logger);
WIN_EXPORT void ABI48_0_0YGAssert(bool condition, const char* message);
WIN_EXPORT void ABI48_0_0YGAssertWithNode(
    ABI48_0_0YGNodeRef node,
    bool condition,
    const char* message);
WIN_EXPORT void ABI48_0_0YGAssertWithConfig(
    ABI48_0_0YGConfigRef config,
    bool condition,
    const char* message);
// Set this to number of pixels in 1 point to round calculation results If you
// want to avoid rounding - set PointScaleFactor to 0
WIN_EXPORT void ABI48_0_0YGConfigSetPointScaleFactor(
    ABI48_0_0YGConfigRef config,
    float pixelsInPoint);
void ABI48_0_0YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
    ABI48_0_0YGConfigRef config,
    bool shouldDiffLayout);

// Yoga previously had an error where containers would take the maximum space
// possible instead of the minimum like they are supposed to. In practice this
// resulted in implicit behaviour similar to align-self: stretch; Because this
// was such a long-standing bug we must allow legacy users to switch back to
// this behaviour.
WIN_EXPORT bool ABI48_0_0YGConfigGetUseLegacyStretchBehaviour(ABI48_0_0YGConfigRef config);
WIN_EXPORT void ABI48_0_0YGConfigSetUseLegacyStretchBehaviour(
    ABI48_0_0YGConfigRef config,
    bool useLegacyStretchBehaviour);

// ABI48_0_0YGConfig
WIN_EXPORT ABI48_0_0YGConfigRef ABI48_0_0YGConfigNew(void);
WIN_EXPORT void ABI48_0_0YGConfigFree(ABI48_0_0YGConfigRef config);
WIN_EXPORT void ABI48_0_0YGConfigCopy(ABI48_0_0YGConfigRef dest, ABI48_0_0YGConfigRef src);
WIN_EXPORT int32_t ABI48_0_0YGConfigGetInstanceCount(void);

WIN_EXPORT void ABI48_0_0YGConfigSetExperimentalFeatureEnabled(
    ABI48_0_0YGConfigRef config,
    ABI48_0_0YGExperimentalFeature feature,
    bool enabled);
WIN_EXPORT bool ABI48_0_0YGConfigIsExperimentalFeatureEnabled(
    ABI48_0_0YGConfigRef config,
    ABI48_0_0YGExperimentalFeature feature);

// Using the web defaults is the preferred configuration for new projects. Usage
// of non web defaults should be considered as legacy.
WIN_EXPORT void ABI48_0_0YGConfigSetUseWebDefaults(ABI48_0_0YGConfigRef config, bool enabled);
WIN_EXPORT bool ABI48_0_0YGConfigGetUseWebDefaults(ABI48_0_0YGConfigRef config);

WIN_EXPORT void ABI48_0_0YGConfigSetCloneNodeFunc(
    ABI48_0_0YGConfigRef config,
    ABI48_0_0YGCloneNodeFunc callback);

// Export only for C#
WIN_EXPORT ABI48_0_0YGConfigRef ABI48_0_0YGConfigGetDefault(void);

WIN_EXPORT void ABI48_0_0YGConfigSetContext(ABI48_0_0YGConfigRef config, void* context);
WIN_EXPORT void* ABI48_0_0YGConfigGetContext(ABI48_0_0YGConfigRef config);

WIN_EXPORT float ABI48_0_0YGRoundValueToPixelGrid(
    double value,
    double pointScaleFactor,
    bool forceCeil,
    bool forceFloor);

ABI48_0_0YG_EXTERN_C_END

#ifdef __cplusplus

#include <functional>
#include <vector>

// Calls f on each node in the tree including the given node argument.
void ABI48_0_0YGTraversePreOrder(
    ABI48_0_0YGNodeRef node,
    std::function<void(ABI48_0_0YGNodeRef node)>&& f);

void ABI48_0_0YGNodeSetChildren(ABI48_0_0YGNodeRef owner, const std::vector<ABI48_0_0YGNodeRef>& children);

#endif
