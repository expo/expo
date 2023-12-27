/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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

#include "ABI43_0_0YGEnums.h"
#include "ABI43_0_0YGMacros.h"
#include "ABI43_0_0YGValue.h"

ABI43_0_0YG_EXTERN_C_BEGIN

typedef struct ABI43_0_0YGSize {
  float width;
  float height;
} ABI43_0_0YGSize;

typedef struct ABI43_0_0YGConfig* ABI43_0_0YGConfigRef;

typedef struct ABI43_0_0YGNode* ABI43_0_0YGNodeRef;
typedef const struct ABI43_0_0YGNode* ABI43_0_0YGNodeConstRef;

typedef ABI43_0_0YGSize (*ABI43_0_0YGMeasureFunc)(
    ABI43_0_0YGNodeRef node,
    float width,
    ABI43_0_0YGMeasureMode widthMode,
    float height,
    ABI43_0_0YGMeasureMode heightMode);
typedef float (*ABI43_0_0YGBaselineFunc)(ABI43_0_0YGNodeRef node, float width, float height);
typedef void (*ABI43_0_0YGDirtiedFunc)(ABI43_0_0YGNodeRef node);
typedef void (*ABI43_0_0YGPrintFunc)(ABI43_0_0YGNodeRef node);
typedef void (*ABI43_0_0YGNodeCleanupFunc)(ABI43_0_0YGNodeRef node);
typedef int (*ABI43_0_0YGLogger)(
    ABI43_0_0YGConfigRef config,
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGLogLevel level,
    const char* format,
    va_list args);
typedef ABI43_0_0YGNodeRef (
    *ABI43_0_0YGCloneNodeFunc)(ABI43_0_0YGNodeRef oldNode, ABI43_0_0YGNodeRef owner, int childIndex);

// ABI43_0_0YGNode
WIN_EXPORT ABI43_0_0YGNodeRef ABI43_0_0YGNodeNew(void);
WIN_EXPORT ABI43_0_0YGNodeRef ABI43_0_0YGNodeNewWithConfig(ABI43_0_0YGConfigRef config);
WIN_EXPORT ABI43_0_0YGNodeRef ABI43_0_0YGNodeClone(ABI43_0_0YGNodeRef node);
WIN_EXPORT void ABI43_0_0YGNodeFree(ABI43_0_0YGNodeRef node);
WIN_EXPORT void ABI43_0_0YGNodeFreeRecursiveWithCleanupFunc(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGNodeCleanupFunc cleanup);
WIN_EXPORT void ABI43_0_0YGNodeFreeRecursive(ABI43_0_0YGNodeRef node);
WIN_EXPORT void ABI43_0_0YGNodeReset(ABI43_0_0YGNodeRef node);

WIN_EXPORT void ABI43_0_0YGNodeInsertChild(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGNodeRef child,
    uint32_t index);

WIN_EXPORT void ABI43_0_0YGNodeSwapChild(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGNodeRef child,
    uint32_t index);

WIN_EXPORT void ABI43_0_0YGNodeRemoveChild(ABI43_0_0YGNodeRef node, ABI43_0_0YGNodeRef child);
WIN_EXPORT void ABI43_0_0YGNodeRemoveAllChildren(ABI43_0_0YGNodeRef node);
WIN_EXPORT ABI43_0_0YGNodeRef ABI43_0_0YGNodeGetChild(ABI43_0_0YGNodeRef node, uint32_t index);
WIN_EXPORT ABI43_0_0YGNodeRef ABI43_0_0YGNodeGetOwner(ABI43_0_0YGNodeRef node);
WIN_EXPORT ABI43_0_0YGNodeRef ABI43_0_0YGNodeGetParent(ABI43_0_0YGNodeRef node);
WIN_EXPORT uint32_t ABI43_0_0YGNodeGetChildCount(ABI43_0_0YGNodeRef node);
WIN_EXPORT void ABI43_0_0YGNodeSetChildren(
    ABI43_0_0YGNodeRef owner,
    const ABI43_0_0YGNodeRef children[],
    uint32_t count);

WIN_EXPORT void ABI43_0_0YGNodeSetIsReferenceBaseline(
    ABI43_0_0YGNodeRef node,
    bool isReferenceBaseline);

WIN_EXPORT bool ABI43_0_0YGNodeIsReferenceBaseline(ABI43_0_0YGNodeRef node);

WIN_EXPORT void ABI43_0_0YGNodeCalculateLayout(
    ABI43_0_0YGNodeRef node,
    float availableWidth,
    float availableHeight,
    ABI43_0_0YGDirection ownerDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
//
// Yoga knows when to mark all other nodes as dirty but because nodes with
// measure functions depend on information not known to Yoga they must perform
// this dirty marking manually.
WIN_EXPORT void ABI43_0_0YGNodeMarkDirty(ABI43_0_0YGNodeRef node);

// Marks the current node and all its descendants as dirty.
//
// Intended to be used for Uoga benchmarks. Don't use in production, as calling
// `ABI43_0_0YGCalculateLayout` will cause the recalculation of each and every node.
WIN_EXPORT void ABI43_0_0YGNodeMarkDirtyAndPropogateToDescendants(ABI43_0_0YGNodeRef node);

WIN_EXPORT void ABI43_0_0YGNodePrint(ABI43_0_0YGNodeRef node, ABI43_0_0YGPrintOptions options);

WIN_EXPORT bool ABI43_0_0YGFloatIsUndefined(float value);

WIN_EXPORT bool ABI43_0_0YGNodeCanUseCachedMeasurement(
    ABI43_0_0YGMeasureMode widthMode,
    float width,
    ABI43_0_0YGMeasureMode heightMode,
    float height,
    ABI43_0_0YGMeasureMode lastWidthMode,
    float lastWidth,
    ABI43_0_0YGMeasureMode lastHeightMode,
    float lastHeight,
    float lastComputedWidth,
    float lastComputedHeight,
    float marginRow,
    float marginColumn,
    ABI43_0_0YGConfigRef config);

WIN_EXPORT void ABI43_0_0YGNodeCopyStyle(ABI43_0_0YGNodeRef dstNode, ABI43_0_0YGNodeRef srcNode);

WIN_EXPORT void* ABI43_0_0YGNodeGetContext(ABI43_0_0YGNodeRef node);
WIN_EXPORT void ABI43_0_0YGNodeSetContext(ABI43_0_0YGNodeRef node, void* context);
void ABI43_0_0YGConfigSetPrintTreeFlag(ABI43_0_0YGConfigRef config, bool enabled);
bool ABI43_0_0YGNodeHasMeasureFunc(ABI43_0_0YGNodeRef node);
WIN_EXPORT void ABI43_0_0YGNodeSetMeasureFunc(ABI43_0_0YGNodeRef node, ABI43_0_0YGMeasureFunc measureFunc);
bool ABI43_0_0YGNodeHasBaselineFunc(ABI43_0_0YGNodeRef node);
void ABI43_0_0YGNodeSetBaselineFunc(ABI43_0_0YGNodeRef node, ABI43_0_0YGBaselineFunc baselineFunc);
ABI43_0_0YGDirtiedFunc ABI43_0_0YGNodeGetDirtiedFunc(ABI43_0_0YGNodeRef node);
void ABI43_0_0YGNodeSetDirtiedFunc(ABI43_0_0YGNodeRef node, ABI43_0_0YGDirtiedFunc dirtiedFunc);
void ABI43_0_0YGNodeSetPrintFunc(ABI43_0_0YGNodeRef node, ABI43_0_0YGPrintFunc printFunc);
WIN_EXPORT bool ABI43_0_0YGNodeGetHasNewLayout(ABI43_0_0YGNodeRef node);
WIN_EXPORT void ABI43_0_0YGNodeSetHasNewLayout(ABI43_0_0YGNodeRef node, bool hasNewLayout);
ABI43_0_0YGNodeType ABI43_0_0YGNodeGetNodeType(ABI43_0_0YGNodeRef node);
void ABI43_0_0YGNodeSetNodeType(ABI43_0_0YGNodeRef node, ABI43_0_0YGNodeType nodeType);
WIN_EXPORT bool ABI43_0_0YGNodeIsDirty(ABI43_0_0YGNodeRef node);
bool ABI43_0_0YGNodeLayoutGetDidUseLegacyFlag(ABI43_0_0YGNodeRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetDirection(ABI43_0_0YGNodeRef node, ABI43_0_0YGDirection direction);
WIN_EXPORT ABI43_0_0YGDirection ABI43_0_0YGNodeStyleGetDirection(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetFlexDirection(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGFlexDirection flexDirection);
WIN_EXPORT ABI43_0_0YGFlexDirection ABI43_0_0YGNodeStyleGetFlexDirection(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetJustifyContent(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGJustify justifyContent);
WIN_EXPORT ABI43_0_0YGJustify ABI43_0_0YGNodeStyleGetJustifyContent(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetAlignContent(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGAlign alignContent);
WIN_EXPORT ABI43_0_0YGAlign ABI43_0_0YGNodeStyleGetAlignContent(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetAlignItems(ABI43_0_0YGNodeRef node, ABI43_0_0YGAlign alignItems);
WIN_EXPORT ABI43_0_0YGAlign ABI43_0_0YGNodeStyleGetAlignItems(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetAlignSelf(ABI43_0_0YGNodeRef node, ABI43_0_0YGAlign alignSelf);
WIN_EXPORT ABI43_0_0YGAlign ABI43_0_0YGNodeStyleGetAlignSelf(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetPositionType(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGPositionType positionType);
WIN_EXPORT ABI43_0_0YGPositionType ABI43_0_0YGNodeStyleGetPositionType(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetFlexWrap(ABI43_0_0YGNodeRef node, ABI43_0_0YGWrap flexWrap);
WIN_EXPORT ABI43_0_0YGWrap ABI43_0_0YGNodeStyleGetFlexWrap(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetOverflow(ABI43_0_0YGNodeRef node, ABI43_0_0YGOverflow overflow);
WIN_EXPORT ABI43_0_0YGOverflow ABI43_0_0YGNodeStyleGetOverflow(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetDisplay(ABI43_0_0YGNodeRef node, ABI43_0_0YGDisplay display);
WIN_EXPORT ABI43_0_0YGDisplay ABI43_0_0YGNodeStyleGetDisplay(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetFlex(ABI43_0_0YGNodeRef node, float flex);
WIN_EXPORT float ABI43_0_0YGNodeStyleGetFlex(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetFlexGrow(ABI43_0_0YGNodeRef node, float flexGrow);
WIN_EXPORT float ABI43_0_0YGNodeStyleGetFlexGrow(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetFlexShrink(ABI43_0_0YGNodeRef node, float flexShrink);
WIN_EXPORT float ABI43_0_0YGNodeStyleGetFlexShrink(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetFlexBasis(ABI43_0_0YGNodeRef node, float flexBasis);
WIN_EXPORT void ABI43_0_0YGNodeStyleSetFlexBasisPercent(ABI43_0_0YGNodeRef node, float flexBasis);
WIN_EXPORT void ABI43_0_0YGNodeStyleSetFlexBasisAuto(ABI43_0_0YGNodeRef node);
WIN_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetFlexBasis(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetPosition(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGEdge edge,
    float position);
WIN_EXPORT void ABI43_0_0YGNodeStyleSetPositionPercent(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGEdge edge,
    float position);
WIN_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetPosition(ABI43_0_0YGNodeConstRef node, ABI43_0_0YGEdge edge);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetMargin(ABI43_0_0YGNodeRef node, ABI43_0_0YGEdge edge, float margin);
WIN_EXPORT void ABI43_0_0YGNodeStyleSetMarginPercent(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGEdge edge,
    float margin);
WIN_EXPORT void ABI43_0_0YGNodeStyleSetMarginAuto(ABI43_0_0YGNodeRef node, ABI43_0_0YGEdge edge);
WIN_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetMargin(ABI43_0_0YGNodeConstRef node, ABI43_0_0YGEdge edge);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetPadding(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGEdge edge,
    float padding);
WIN_EXPORT void ABI43_0_0YGNodeStyleSetPaddingPercent(
    ABI43_0_0YGNodeRef node,
    ABI43_0_0YGEdge edge,
    float padding);
WIN_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetPadding(ABI43_0_0YGNodeConstRef node, ABI43_0_0YGEdge edge);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetBorder(ABI43_0_0YGNodeRef node, ABI43_0_0YGEdge edge, float border);
WIN_EXPORT float ABI43_0_0YGNodeStyleGetBorder(ABI43_0_0YGNodeConstRef node, ABI43_0_0YGEdge edge);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetWidth(ABI43_0_0YGNodeRef node, float width);
WIN_EXPORT void ABI43_0_0YGNodeStyleSetWidthPercent(ABI43_0_0YGNodeRef node, float width);
WIN_EXPORT void ABI43_0_0YGNodeStyleSetWidthAuto(ABI43_0_0YGNodeRef node);
WIN_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetWidth(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetHeight(ABI43_0_0YGNodeRef node, float height);
WIN_EXPORT void ABI43_0_0YGNodeStyleSetHeightPercent(ABI43_0_0YGNodeRef node, float height);
WIN_EXPORT void ABI43_0_0YGNodeStyleSetHeightAuto(ABI43_0_0YGNodeRef node);
WIN_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetHeight(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetMinWidth(ABI43_0_0YGNodeRef node, float minWidth);
WIN_EXPORT void ABI43_0_0YGNodeStyleSetMinWidthPercent(ABI43_0_0YGNodeRef node, float minWidth);
WIN_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetMinWidth(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetMinHeight(ABI43_0_0YGNodeRef node, float minHeight);
WIN_EXPORT void ABI43_0_0YGNodeStyleSetMinHeightPercent(ABI43_0_0YGNodeRef node, float minHeight);
WIN_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetMinHeight(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetMaxWidth(ABI43_0_0YGNodeRef node, float maxWidth);
WIN_EXPORT void ABI43_0_0YGNodeStyleSetMaxWidthPercent(ABI43_0_0YGNodeRef node, float maxWidth);
WIN_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetMaxWidth(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT void ABI43_0_0YGNodeStyleSetMaxHeight(ABI43_0_0YGNodeRef node, float maxHeight);
WIN_EXPORT void ABI43_0_0YGNodeStyleSetMaxHeightPercent(ABI43_0_0YGNodeRef node, float maxHeight);
WIN_EXPORT ABI43_0_0YGValue ABI43_0_0YGNodeStyleGetMaxHeight(ABI43_0_0YGNodeConstRef node);

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
WIN_EXPORT void ABI43_0_0YGNodeStyleSetAspectRatio(ABI43_0_0YGNodeRef node, float aspectRatio);
WIN_EXPORT float ABI43_0_0YGNodeStyleGetAspectRatio(ABI43_0_0YGNodeConstRef node);

WIN_EXPORT float ABI43_0_0YGNodeLayoutGetLeft(ABI43_0_0YGNodeRef node);
WIN_EXPORT float ABI43_0_0YGNodeLayoutGetTop(ABI43_0_0YGNodeRef node);
WIN_EXPORT float ABI43_0_0YGNodeLayoutGetRight(ABI43_0_0YGNodeRef node);
WIN_EXPORT float ABI43_0_0YGNodeLayoutGetBottom(ABI43_0_0YGNodeRef node);
WIN_EXPORT float ABI43_0_0YGNodeLayoutGetWidth(ABI43_0_0YGNodeRef node);
WIN_EXPORT float ABI43_0_0YGNodeLayoutGetHeight(ABI43_0_0YGNodeRef node);
WIN_EXPORT ABI43_0_0YGDirection ABI43_0_0YGNodeLayoutGetDirection(ABI43_0_0YGNodeRef node);
WIN_EXPORT bool ABI43_0_0YGNodeLayoutGetHadOverflow(ABI43_0_0YGNodeRef node);
bool ABI43_0_0YGNodeLayoutGetDidLegacyStretchFlagAffectLayout(ABI43_0_0YGNodeRef node);

// Get the computed values for these nodes after performing layout. If they were
// set using point values then the returned value will be the same as
// ABI43_0_0YGNodeStyleGetXXX. However if they were set using a percentage value then the
// returned value is the computed value used during layout.
WIN_EXPORT float ABI43_0_0YGNodeLayoutGetMargin(ABI43_0_0YGNodeRef node, ABI43_0_0YGEdge edge);
WIN_EXPORT float ABI43_0_0YGNodeLayoutGetBorder(ABI43_0_0YGNodeRef node, ABI43_0_0YGEdge edge);
WIN_EXPORT float ABI43_0_0YGNodeLayoutGetPadding(ABI43_0_0YGNodeRef node, ABI43_0_0YGEdge edge);

WIN_EXPORT void ABI43_0_0YGConfigSetLogger(ABI43_0_0YGConfigRef config, ABI43_0_0YGLogger logger);
WIN_EXPORT void ABI43_0_0YGAssert(bool condition, const char* message);
WIN_EXPORT void ABI43_0_0YGAssertWithNode(
    ABI43_0_0YGNodeRef node,
    bool condition,
    const char* message);
WIN_EXPORT void ABI43_0_0YGAssertWithConfig(
    ABI43_0_0YGConfigRef config,
    bool condition,
    const char* message);
// Set this to number of pixels in 1 point to round calculation results If you
// want to avoid rounding - set PointScaleFactor to 0
WIN_EXPORT void ABI43_0_0YGConfigSetPointScaleFactor(
    ABI43_0_0YGConfigRef config,
    float pixelsInPoint);
void ABI43_0_0YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
    ABI43_0_0YGConfigRef config,
    bool shouldDiffLayout);

// Yoga previously had an error where containers would take the maximum space
// possible instead of the minimum like they are supposed to. In practice this
// resulted in implicit behaviour similar to align-self: stretch; Because this
// was such a long-standing bug we must allow legacy users to switch back to
// this behaviour.
WIN_EXPORT void ABI43_0_0YGConfigSetUseLegacyStretchBehaviour(
    ABI43_0_0YGConfigRef config,
    bool useLegacyStretchBehaviour);

// ABI43_0_0YGConfig
WIN_EXPORT ABI43_0_0YGConfigRef ABI43_0_0YGConfigNew(void);
WIN_EXPORT void ABI43_0_0YGConfigFree(ABI43_0_0YGConfigRef config);
WIN_EXPORT void ABI43_0_0YGConfigCopy(ABI43_0_0YGConfigRef dest, ABI43_0_0YGConfigRef src);
WIN_EXPORT int32_t ABI43_0_0YGConfigGetInstanceCount(void);

WIN_EXPORT void ABI43_0_0YGConfigSetExperimentalFeatureEnabled(
    ABI43_0_0YGConfigRef config,
    ABI43_0_0YGExperimentalFeature feature,
    bool enabled);
WIN_EXPORT bool ABI43_0_0YGConfigIsExperimentalFeatureEnabled(
    ABI43_0_0YGConfigRef config,
    ABI43_0_0YGExperimentalFeature feature);

// Using the web defaults is the preferred configuration for new projects. Usage
// of non web defaults should be considered as legacy.
WIN_EXPORT void ABI43_0_0YGConfigSetUseWebDefaults(ABI43_0_0YGConfigRef config, bool enabled);
WIN_EXPORT bool ABI43_0_0YGConfigGetUseWebDefaults(ABI43_0_0YGConfigRef config);

WIN_EXPORT void ABI43_0_0YGConfigSetCloneNodeFunc(
    ABI43_0_0YGConfigRef config,
    ABI43_0_0YGCloneNodeFunc callback);

// Export only for C#
WIN_EXPORT ABI43_0_0YGConfigRef ABI43_0_0YGConfigGetDefault(void);

WIN_EXPORT void ABI43_0_0YGConfigSetContext(ABI43_0_0YGConfigRef config, void* context);
WIN_EXPORT void* ABI43_0_0YGConfigGetContext(ABI43_0_0YGConfigRef config);

WIN_EXPORT float ABI43_0_0YGRoundValueToPixelGrid(
    double value,
    double pointScaleFactor,
    bool forceCeil,
    bool forceFloor);

ABI43_0_0YG_EXTERN_C_END

#ifdef __cplusplus

#include <functional>
#include <vector>

// Calls f on each node in the tree including the given node argument.
void ABI43_0_0YGTraversePreOrder(
    ABI43_0_0YGNodeRef node,
    std::function<void(ABI43_0_0YGNodeRef node)>&& f);

void ABI43_0_0YGNodeSetChildren(ABI43_0_0YGNodeRef owner, const std::vector<ABI43_0_0YGNodeRef>& children);

#endif
