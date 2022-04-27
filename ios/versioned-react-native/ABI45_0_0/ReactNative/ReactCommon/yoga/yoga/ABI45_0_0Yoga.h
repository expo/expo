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

#include "ABI45_0_0YGEnums.h"
#include "ABI45_0_0YGMacros.h"
#include "ABI45_0_0YGValue.h"

ABI45_0_0YG_EXTERN_C_BEGIN

typedef struct ABI45_0_0YGSize {
  float width;
  float height;
} ABI45_0_0YGSize;

typedef struct ABI45_0_0YGConfig* ABI45_0_0YGConfigRef;

typedef struct ABI45_0_0YGNode* ABI45_0_0YGNodeRef;
typedef const struct ABI45_0_0YGNode* ABI45_0_0YGNodeConstRef;

typedef ABI45_0_0YGSize (*ABI45_0_0YGMeasureFunc)(
    ABI45_0_0YGNodeRef node,
    float width,
    ABI45_0_0YGMeasureMode widthMode,
    float height,
    ABI45_0_0YGMeasureMode heightMode);
typedef float (*ABI45_0_0YGBaselineFunc)(ABI45_0_0YGNodeRef node, float width, float height);
typedef void (*ABI45_0_0YGDirtiedFunc)(ABI45_0_0YGNodeRef node);
typedef void (*ABI45_0_0YGPrintFunc)(ABI45_0_0YGNodeRef node);
typedef void (*ABI45_0_0YGNodeCleanupFunc)(ABI45_0_0YGNodeRef node);
typedef int (*ABI45_0_0YGLogger)(
    ABI45_0_0YGConfigRef config,
    ABI45_0_0YGNodeRef node,
    ABI45_0_0YGLogLevel level,
    const char* format,
    va_list args);
typedef ABI45_0_0YGNodeRef (
    *ABI45_0_0YGCloneNodeFunc)(ABI45_0_0YGNodeRef oldNode, ABI45_0_0YGNodeRef owner, int childIndex);

// ABI45_0_0YGNode
WIN_EXPORT ABI45_0_0YGNodeRef ABI45_0_0YGNodeNew(void);
WIN_EXPORT ABI45_0_0YGNodeRef ABI45_0_0YGNodeNewWithConfig(ABI45_0_0YGConfigRef config);
WIN_EXPORT ABI45_0_0YGNodeRef ABI45_0_0YGNodeClone(ABI45_0_0YGNodeRef node);
WIN_EXPORT void ABI45_0_0YGNodeFree(ABI45_0_0YGNodeRef node);
WIN_EXPORT void ABI45_0_0YGNodeFreeRecursiveWithCleanupFunc(
    ABI45_0_0YGNodeRef node,
    ABI45_0_0YGNodeCleanupFunc cleanup);
WIN_EXPORT void ABI45_0_0YGNodeFreeRecursive(ABI45_0_0YGNodeRef node);
WIN_EXPORT void ABI45_0_0YGNodeReset(ABI45_0_0YGNodeRef node);

WIN_EXPORT void ABI45_0_0YGNodeInsertChild(
    ABI45_0_0YGNodeRef node,
    ABI45_0_0YGNodeRef child,
    uint32_t index);

WIN_EXPORT void ABI45_0_0YGNodeSwapChild(
    ABI45_0_0YGNodeRef node,
    ABI45_0_0YGNodeRef child,
    uint32_t index);

WIN_EXPORT void ABI45_0_0YGNodeRemoveChild(ABI45_0_0YGNodeRef node, ABI45_0_0YGNodeRef child);
WIN_EXPORT void ABI45_0_0YGNodeRemoveAllChildren(ABI45_0_0YGNodeRef node);
WIN_EXPORT ABI45_0_0YGNodeRef ABI45_0_0YGNodeGetChild(ABI45_0_0YGNodeRef node, uint32_t index);
WIN_EXPORT ABI45_0_0YGNodeRef ABI45_0_0YGNodeGetOwner(ABI45_0_0YGNodeRef node);
WIN_EXPORT ABI45_0_0YGNodeRef ABI45_0_0YGNodeGetParent(ABI45_0_0YGNodeRef node);
WIN_EXPORT uint32_t ABI45_0_0YGNodeGetChildCount(ABI45_0_0YGNodeRef node);
WIN_EXPORT void ABI45_0_0YGNodeSetChildren(
    ABI45_0_0YGNodeRef owner,
    const ABI45_0_0YGNodeRef children[],
    uint32_t count);

WIN_EXPORT void ABI45_0_0YGNodeSetIsReferenceBaseline(
    ABI45_0_0YGNodeRef node,
    bool isReferenceBaseline);

WIN_EXPORT bool ABI45_0_0YGNodeIsReferenceBaseline(ABI45_0_0YGNodeRef node);

WIN_EXPORT void ABI45_0_0YGNodeCalculateLayout(
    ABI45_0_0YGNodeRef node,
    float availableWidth,
    float availableHeight,
    ABI45_0_0YGDirection ownerDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
//
// Yoga knows when to mark all other nodes as dirty but because nodes with
// measure functions depend on information not known to Yoga they must perform
// this dirty marking manually.
WIN_EXPORT void ABI45_0_0YGNodeMarkDirty(ABI45_0_0YGNodeRef node);

// Marks the current node and all its descendants as dirty.
//
// Intended to be used for Yoga benchmarks. Don't use in production, as calling
// `ABI45_0_0YGCalculateLayout` will cause the recalculation of each and every node.
WIN_EXPORT void ABI45_0_0YGNodeMarkDirtyAndPropogateToDescendants(ABI45_0_0YGNodeRef node);

WIN_EXPORT void ABI45_0_0YGNodePrint(ABI45_0_0YGNodeRef node, ABI45_0_0YGPrintOptions options);

WIN_EXPORT bool ABI45_0_0YGFloatIsUndefined(float value);

WIN_EXPORT bool ABI45_0_0YGNodeCanUseCachedMeasurement(
    ABI45_0_0YGMeasureMode widthMode,
    float width,
    ABI45_0_0YGMeasureMode heightMode,
    float height,
    ABI45_0_0YGMeasureMode lastWidthMode,
    float lastWidth,
    ABI45_0_0YGMeasureMode lastHeightMode,
    float lastHeight,
    float lastComputedWidth,
    float lastComputedHeight,
    float marginRow,
    float marginColumn,
    ABI45_0_0YGConfigRef config);

WIN_EXPORT void ABI45_0_0YGNodeCopyStyle(ABI45_0_0YGNodeRef dstNode, ABI45_0_0YGNodeRef srcNode);

WIN_EXPORT void* ABI45_0_0YGNodeGetContext(ABI45_0_0YGNodeRef node);
WIN_EXPORT void ABI45_0_0YGNodeSetContext(ABI45_0_0YGNodeRef node, void* context);
void ABI45_0_0YGConfigSetPrintTreeFlag(ABI45_0_0YGConfigRef config, bool enabled);
bool ABI45_0_0YGNodeHasMeasureFunc(ABI45_0_0YGNodeRef node);
WIN_EXPORT void ABI45_0_0YGNodeSetMeasureFunc(ABI45_0_0YGNodeRef node, ABI45_0_0YGMeasureFunc measureFunc);
bool ABI45_0_0YGNodeHasBaselineFunc(ABI45_0_0YGNodeRef node);
void ABI45_0_0YGNodeSetBaselineFunc(ABI45_0_0YGNodeRef node, ABI45_0_0YGBaselineFunc baselineFunc);
ABI45_0_0YGDirtiedFunc ABI45_0_0YGNodeGetDirtiedFunc(ABI45_0_0YGNodeRef node);
void ABI45_0_0YGNodeSetDirtiedFunc(ABI45_0_0YGNodeRef node, ABI45_0_0YGDirtiedFunc dirtiedFunc);
void ABI45_0_0YGNodeSetPrintFunc(ABI45_0_0YGNodeRef node, ABI45_0_0YGPrintFunc printFunc);
WIN_EXPORT bool ABI45_0_0YGNodeGetHasNewLayout(ABI45_0_0YGNodeRef node);
WIN_EXPORT void ABI45_0_0YGNodeSetHasNewLayout(ABI45_0_0YGNodeRef node, bool hasNewLayout);
ABI45_0_0YGNodeType ABI45_0_0YGNodeGetNodeType(ABI45_0_0YGNodeRef node);
void ABI45_0_0YGNodeSetNodeType(ABI45_0_0YGNodeRef node, ABI45_0_0YGNodeType nodeType);
WIN_EXPORT bool ABI45_0_0YGNodeIsDirty(ABI45_0_0YGNodeRef node);
bool ABI45_0_0YGNodeLayoutGetDidUseLegacyFlag(ABI45_0_0YGNodeRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetDirection(ABI45_0_0YGNodeRef node, ABI45_0_0YGDirection direction);
WIN_EXPORT ABI45_0_0YGDirection ABI45_0_0YGNodeStyleGetDirection(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetFlexDirection(
    ABI45_0_0YGNodeRef node,
    ABI45_0_0YGFlexDirection flexDirection);
WIN_EXPORT ABI45_0_0YGFlexDirection ABI45_0_0YGNodeStyleGetFlexDirection(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetJustifyContent(
    ABI45_0_0YGNodeRef node,
    ABI45_0_0YGJustify justifyContent);
WIN_EXPORT ABI45_0_0YGJustify ABI45_0_0YGNodeStyleGetJustifyContent(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetAlignContent(
    ABI45_0_0YGNodeRef node,
    ABI45_0_0YGAlign alignContent);
WIN_EXPORT ABI45_0_0YGAlign ABI45_0_0YGNodeStyleGetAlignContent(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetAlignItems(ABI45_0_0YGNodeRef node, ABI45_0_0YGAlign alignItems);
WIN_EXPORT ABI45_0_0YGAlign ABI45_0_0YGNodeStyleGetAlignItems(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetAlignSelf(ABI45_0_0YGNodeRef node, ABI45_0_0YGAlign alignSelf);
WIN_EXPORT ABI45_0_0YGAlign ABI45_0_0YGNodeStyleGetAlignSelf(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetPositionType(
    ABI45_0_0YGNodeRef node,
    ABI45_0_0YGPositionType positionType);
WIN_EXPORT ABI45_0_0YGPositionType ABI45_0_0YGNodeStyleGetPositionType(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetFlexWrap(ABI45_0_0YGNodeRef node, ABI45_0_0YGWrap flexWrap);
WIN_EXPORT ABI45_0_0YGWrap ABI45_0_0YGNodeStyleGetFlexWrap(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetOverflow(ABI45_0_0YGNodeRef node, ABI45_0_0YGOverflow overflow);
WIN_EXPORT ABI45_0_0YGOverflow ABI45_0_0YGNodeStyleGetOverflow(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetDisplay(ABI45_0_0YGNodeRef node, ABI45_0_0YGDisplay display);
WIN_EXPORT ABI45_0_0YGDisplay ABI45_0_0YGNodeStyleGetDisplay(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetFlex(ABI45_0_0YGNodeRef node, float flex);
WIN_EXPORT float ABI45_0_0YGNodeStyleGetFlex(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetFlexGrow(ABI45_0_0YGNodeRef node, float flexGrow);
WIN_EXPORT float ABI45_0_0YGNodeStyleGetFlexGrow(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetFlexShrink(ABI45_0_0YGNodeRef node, float flexShrink);
WIN_EXPORT float ABI45_0_0YGNodeStyleGetFlexShrink(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetFlexBasis(ABI45_0_0YGNodeRef node, float flexBasis);
WIN_EXPORT void ABI45_0_0YGNodeStyleSetFlexBasisPercent(ABI45_0_0YGNodeRef node, float flexBasis);
WIN_EXPORT void ABI45_0_0YGNodeStyleSetFlexBasisAuto(ABI45_0_0YGNodeRef node);
WIN_EXPORT ABI45_0_0YGValue ABI45_0_0YGNodeStyleGetFlexBasis(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetPosition(
    ABI45_0_0YGNodeRef node,
    ABI45_0_0YGEdge edge,
    float position);
WIN_EXPORT void ABI45_0_0YGNodeStyleSetPositionPercent(
    ABI45_0_0YGNodeRef node,
    ABI45_0_0YGEdge edge,
    float position);
WIN_EXPORT ABI45_0_0YGValue ABI45_0_0YGNodeStyleGetPosition(ABI45_0_0YGNodeConstRef node, ABI45_0_0YGEdge edge);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetMargin(ABI45_0_0YGNodeRef node, ABI45_0_0YGEdge edge, float margin);
WIN_EXPORT void ABI45_0_0YGNodeStyleSetMarginPercent(
    ABI45_0_0YGNodeRef node,
    ABI45_0_0YGEdge edge,
    float margin);
WIN_EXPORT void ABI45_0_0YGNodeStyleSetMarginAuto(ABI45_0_0YGNodeRef node, ABI45_0_0YGEdge edge);
WIN_EXPORT ABI45_0_0YGValue ABI45_0_0YGNodeStyleGetMargin(ABI45_0_0YGNodeConstRef node, ABI45_0_0YGEdge edge);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetPadding(
    ABI45_0_0YGNodeRef node,
    ABI45_0_0YGEdge edge,
    float padding);
WIN_EXPORT void ABI45_0_0YGNodeStyleSetPaddingPercent(
    ABI45_0_0YGNodeRef node,
    ABI45_0_0YGEdge edge,
    float padding);
WIN_EXPORT ABI45_0_0YGValue ABI45_0_0YGNodeStyleGetPadding(ABI45_0_0YGNodeConstRef node, ABI45_0_0YGEdge edge);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetBorder(ABI45_0_0YGNodeRef node, ABI45_0_0YGEdge edge, float border);
WIN_EXPORT float ABI45_0_0YGNodeStyleGetBorder(ABI45_0_0YGNodeConstRef node, ABI45_0_0YGEdge edge);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetWidth(ABI45_0_0YGNodeRef node, float width);
WIN_EXPORT void ABI45_0_0YGNodeStyleSetWidthPercent(ABI45_0_0YGNodeRef node, float width);
WIN_EXPORT void ABI45_0_0YGNodeStyleSetWidthAuto(ABI45_0_0YGNodeRef node);
WIN_EXPORT ABI45_0_0YGValue ABI45_0_0YGNodeStyleGetWidth(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetHeight(ABI45_0_0YGNodeRef node, float height);
WIN_EXPORT void ABI45_0_0YGNodeStyleSetHeightPercent(ABI45_0_0YGNodeRef node, float height);
WIN_EXPORT void ABI45_0_0YGNodeStyleSetHeightAuto(ABI45_0_0YGNodeRef node);
WIN_EXPORT ABI45_0_0YGValue ABI45_0_0YGNodeStyleGetHeight(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetMinWidth(ABI45_0_0YGNodeRef node, float minWidth);
WIN_EXPORT void ABI45_0_0YGNodeStyleSetMinWidthPercent(ABI45_0_0YGNodeRef node, float minWidth);
WIN_EXPORT ABI45_0_0YGValue ABI45_0_0YGNodeStyleGetMinWidth(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetMinHeight(ABI45_0_0YGNodeRef node, float minHeight);
WIN_EXPORT void ABI45_0_0YGNodeStyleSetMinHeightPercent(ABI45_0_0YGNodeRef node, float minHeight);
WIN_EXPORT ABI45_0_0YGValue ABI45_0_0YGNodeStyleGetMinHeight(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetMaxWidth(ABI45_0_0YGNodeRef node, float maxWidth);
WIN_EXPORT void ABI45_0_0YGNodeStyleSetMaxWidthPercent(ABI45_0_0YGNodeRef node, float maxWidth);
WIN_EXPORT ABI45_0_0YGValue ABI45_0_0YGNodeStyleGetMaxWidth(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT void ABI45_0_0YGNodeStyleSetMaxHeight(ABI45_0_0YGNodeRef node, float maxHeight);
WIN_EXPORT void ABI45_0_0YGNodeStyleSetMaxHeightPercent(ABI45_0_0YGNodeRef node, float maxHeight);
WIN_EXPORT ABI45_0_0YGValue ABI45_0_0YGNodeStyleGetMaxHeight(ABI45_0_0YGNodeConstRef node);

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
WIN_EXPORT void ABI45_0_0YGNodeStyleSetAspectRatio(ABI45_0_0YGNodeRef node, float aspectRatio);
WIN_EXPORT float ABI45_0_0YGNodeStyleGetAspectRatio(ABI45_0_0YGNodeConstRef node);

WIN_EXPORT float ABI45_0_0YGNodeLayoutGetLeft(ABI45_0_0YGNodeRef node);
WIN_EXPORT float ABI45_0_0YGNodeLayoutGetTop(ABI45_0_0YGNodeRef node);
WIN_EXPORT float ABI45_0_0YGNodeLayoutGetRight(ABI45_0_0YGNodeRef node);
WIN_EXPORT float ABI45_0_0YGNodeLayoutGetBottom(ABI45_0_0YGNodeRef node);
WIN_EXPORT float ABI45_0_0YGNodeLayoutGetWidth(ABI45_0_0YGNodeRef node);
WIN_EXPORT float ABI45_0_0YGNodeLayoutGetHeight(ABI45_0_0YGNodeRef node);
WIN_EXPORT ABI45_0_0YGDirection ABI45_0_0YGNodeLayoutGetDirection(ABI45_0_0YGNodeRef node);
WIN_EXPORT bool ABI45_0_0YGNodeLayoutGetHadOverflow(ABI45_0_0YGNodeRef node);
bool ABI45_0_0YGNodeLayoutGetDidLegacyStretchFlagAffectLayout(ABI45_0_0YGNodeRef node);

// Get the computed values for these nodes after performing layout. If they were
// set using point values then the returned value will be the same as
// ABI45_0_0YGNodeStyleGetXXX. However if they were set using a percentage value then the
// returned value is the computed value used during layout.
WIN_EXPORT float ABI45_0_0YGNodeLayoutGetMargin(ABI45_0_0YGNodeRef node, ABI45_0_0YGEdge edge);
WIN_EXPORT float ABI45_0_0YGNodeLayoutGetBorder(ABI45_0_0YGNodeRef node, ABI45_0_0YGEdge edge);
WIN_EXPORT float ABI45_0_0YGNodeLayoutGetPadding(ABI45_0_0YGNodeRef node, ABI45_0_0YGEdge edge);

WIN_EXPORT void ABI45_0_0YGConfigSetLogger(ABI45_0_0YGConfigRef config, ABI45_0_0YGLogger logger);
WIN_EXPORT void ABI45_0_0YGAssert(bool condition, const char* message);
WIN_EXPORT void ABI45_0_0YGAssertWithNode(
    ABI45_0_0YGNodeRef node,
    bool condition,
    const char* message);
WIN_EXPORT void ABI45_0_0YGAssertWithConfig(
    ABI45_0_0YGConfigRef config,
    bool condition,
    const char* message);
// Set this to number of pixels in 1 point to round calculation results If you
// want to avoid rounding - set PointScaleFactor to 0
WIN_EXPORT void ABI45_0_0YGConfigSetPointScaleFactor(
    ABI45_0_0YGConfigRef config,
    float pixelsInPoint);
void ABI45_0_0YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
    ABI45_0_0YGConfigRef config,
    bool shouldDiffLayout);

// Yoga previously had an error where containers would take the maximum space
// possible instead of the minimum like they are supposed to. In practice this
// resulted in implicit behaviour similar to align-self: stretch; Because this
// was such a long-standing bug we must allow legacy users to switch back to
// this behaviour.
WIN_EXPORT void ABI45_0_0YGConfigSetUseLegacyStretchBehaviour(
    ABI45_0_0YGConfigRef config,
    bool useLegacyStretchBehaviour);

// ABI45_0_0YGConfig
WIN_EXPORT ABI45_0_0YGConfigRef ABI45_0_0YGConfigNew(void);
WIN_EXPORT void ABI45_0_0YGConfigFree(ABI45_0_0YGConfigRef config);
WIN_EXPORT void ABI45_0_0YGConfigCopy(ABI45_0_0YGConfigRef dest, ABI45_0_0YGConfigRef src);
WIN_EXPORT int32_t ABI45_0_0YGConfigGetInstanceCount(void);

WIN_EXPORT void ABI45_0_0YGConfigSetExperimentalFeatureEnabled(
    ABI45_0_0YGConfigRef config,
    ABI45_0_0YGExperimentalFeature feature,
    bool enabled);
WIN_EXPORT bool ABI45_0_0YGConfigIsExperimentalFeatureEnabled(
    ABI45_0_0YGConfigRef config,
    ABI45_0_0YGExperimentalFeature feature);

// Using the web defaults is the preferred configuration for new projects. Usage
// of non web defaults should be considered as legacy.
WIN_EXPORT void ABI45_0_0YGConfigSetUseWebDefaults(ABI45_0_0YGConfigRef config, bool enabled);
WIN_EXPORT bool ABI45_0_0YGConfigGetUseWebDefaults(ABI45_0_0YGConfigRef config);

WIN_EXPORT void ABI45_0_0YGConfigSetCloneNodeFunc(
    ABI45_0_0YGConfigRef config,
    ABI45_0_0YGCloneNodeFunc callback);

// Export only for C#
WIN_EXPORT ABI45_0_0YGConfigRef ABI45_0_0YGConfigGetDefault(void);

WIN_EXPORT void ABI45_0_0YGConfigSetContext(ABI45_0_0YGConfigRef config, void* context);
WIN_EXPORT void* ABI45_0_0YGConfigGetContext(ABI45_0_0YGConfigRef config);

WIN_EXPORT float ABI45_0_0YGRoundValueToPixelGrid(
    double value,
    double pointScaleFactor,
    bool forceCeil,
    bool forceFloor);

ABI45_0_0YG_EXTERN_C_END

#ifdef __cplusplus

#include <functional>
#include <vector>

// Calls f on each node in the tree including the given node argument.
void ABI45_0_0YGTraversePreOrder(
    ABI45_0_0YGNodeRef node,
    std::function<void(ABI45_0_0YGNodeRef node)>&& f);

void ABI45_0_0YGNodeSetChildren(ABI45_0_0YGNodeRef owner, const std::vector<ABI45_0_0YGNodeRef>& children);

#endif
