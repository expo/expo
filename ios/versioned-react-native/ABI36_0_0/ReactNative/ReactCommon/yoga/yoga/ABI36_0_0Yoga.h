/*
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

#include "ABI36_0_0YGEnums.h"
#include "ABI36_0_0YGMacros.h"
#include "ABI36_0_0YGValue.h"

ABI36_0_0YG_EXTERN_C_BEGIN

typedef struct ABI36_0_0YGSize {
  float width;
  float height;
} ABI36_0_0YGSize;

typedef struct ABI36_0_0YGConfig* ABI36_0_0YGConfigRef;

typedef struct ABI36_0_0YGNode* ABI36_0_0YGNodeRef;
typedef const struct ABI36_0_0YGNode* ABI36_0_0YGNodeConstRef;

typedef ABI36_0_0YGSize (*ABI36_0_0YGMeasureFunc)(
    ABI36_0_0YGNodeRef node,
    float width,
    ABI36_0_0YGMeasureMode widthMode,
    float height,
    ABI36_0_0YGMeasureMode heightMode);
typedef float (*ABI36_0_0YGBaselineFunc)(ABI36_0_0YGNodeRef node, float width, float height);
typedef void (*ABI36_0_0YGDirtiedFunc)(ABI36_0_0YGNodeRef node);
typedef void (*ABI36_0_0YGPrintFunc)(ABI36_0_0YGNodeRef node);
typedef void (*ABI36_0_0YGNodeCleanupFunc)(ABI36_0_0YGNodeRef node);
typedef int (*ABI36_0_0YGLogger)(
    ABI36_0_0YGConfigRef config,
    ABI36_0_0YGNodeRef node,
    ABI36_0_0YGLogLevel level,
    const char* format,
    va_list args);
typedef ABI36_0_0YGNodeRef (
    *ABI36_0_0YGCloneNodeFunc)(ABI36_0_0YGNodeRef oldNode, ABI36_0_0YGNodeRef owner, int childIndex);

// ABI36_0_0YGNode
WIN_EXPORT ABI36_0_0YGNodeRef ABI36_0_0YGNodeNew(void);
WIN_EXPORT ABI36_0_0YGNodeRef ABI36_0_0YGNodeNewWithConfig(ABI36_0_0YGConfigRef config);
WIN_EXPORT ABI36_0_0YGNodeRef ABI36_0_0YGNodeClone(ABI36_0_0YGNodeRef node);
WIN_EXPORT void ABI36_0_0YGNodeFree(ABI36_0_0YGNodeRef node);
WIN_EXPORT void ABI36_0_0YGNodeFreeRecursiveWithCleanupFunc(
    ABI36_0_0YGNodeRef node,
    ABI36_0_0YGNodeCleanupFunc cleanup);
WIN_EXPORT void ABI36_0_0YGNodeFreeRecursive(ABI36_0_0YGNodeRef node);
WIN_EXPORT void ABI36_0_0YGNodeReset(ABI36_0_0YGNodeRef node);

WIN_EXPORT void ABI36_0_0YGNodeInsertChild(
    ABI36_0_0YGNodeRef node,
    ABI36_0_0YGNodeRef child,
    uint32_t index);

WIN_EXPORT void ABI36_0_0YGNodeRemoveChild(ABI36_0_0YGNodeRef node, ABI36_0_0YGNodeRef child);
WIN_EXPORT void ABI36_0_0YGNodeRemoveAllChildren(ABI36_0_0YGNodeRef node);
WIN_EXPORT ABI36_0_0YGNodeRef ABI36_0_0YGNodeGetChild(ABI36_0_0YGNodeRef node, uint32_t index);
WIN_EXPORT ABI36_0_0YGNodeRef ABI36_0_0YGNodeGetOwner(ABI36_0_0YGNodeRef node);
WIN_EXPORT ABI36_0_0YGNodeRef ABI36_0_0YGNodeGetParent(ABI36_0_0YGNodeRef node);
WIN_EXPORT uint32_t ABI36_0_0YGNodeGetChildCount(ABI36_0_0YGNodeRef node);
WIN_EXPORT void ABI36_0_0YGNodeSetChildren(
    ABI36_0_0YGNodeRef owner,
    const ABI36_0_0YGNodeRef children[],
    uint32_t count);

WIN_EXPORT void ABI36_0_0YGNodeSetIsReferenceBaseline(
    ABI36_0_0YGNodeRef node,
    bool isReferenceBaseline);

WIN_EXPORT bool ABI36_0_0YGNodeIsReferenceBaseline(ABI36_0_0YGNodeRef node);

WIN_EXPORT void ABI36_0_0YGNodeCalculateLayout(
    ABI36_0_0YGNodeRef node,
    float availableWidth,
    float availableHeight,
    ABI36_0_0YGDirection ownerDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
//
// Yoga knows when to mark all other nodes as dirty but because nodes with
// measure functions depend on information not known to Yoga they must perform
// this dirty marking manually.
WIN_EXPORT void ABI36_0_0YGNodeMarkDirty(ABI36_0_0YGNodeRef node);

// Marks the current node and all its descendants as dirty.
//
// Intended to be used for Uoga benchmarks. Don't use in production, as calling
// `ABI36_0_0YGCalculateLayout` will cause the recalculation of each and every node.
WIN_EXPORT void ABI36_0_0YGNodeMarkDirtyAndPropogateToDescendants(ABI36_0_0YGNodeRef node);

WIN_EXPORT void ABI36_0_0YGNodePrint(ABI36_0_0YGNodeRef node, ABI36_0_0YGPrintOptions options);

WIN_EXPORT bool ABI36_0_0YGFloatIsUndefined(float value);

WIN_EXPORT bool ABI36_0_0YGNodeCanUseCachedMeasurement(
    ABI36_0_0YGMeasureMode widthMode,
    float width,
    ABI36_0_0YGMeasureMode heightMode,
    float height,
    ABI36_0_0YGMeasureMode lastWidthMode,
    float lastWidth,
    ABI36_0_0YGMeasureMode lastHeightMode,
    float lastHeight,
    float lastComputedWidth,
    float lastComputedHeight,
    float marginRow,
    float marginColumn,
    ABI36_0_0YGConfigRef config);

WIN_EXPORT void ABI36_0_0YGNodeCopyStyle(ABI36_0_0YGNodeRef dstNode, ABI36_0_0YGNodeRef srcNode);

WIN_EXPORT void* ABI36_0_0YGNodeGetContext(ABI36_0_0YGNodeRef node);
WIN_EXPORT void ABI36_0_0YGNodeSetContext(ABI36_0_0YGNodeRef node, void* context);
void ABI36_0_0YGConfigSetPrintTreeFlag(ABI36_0_0YGConfigRef config, bool enabled);
bool ABI36_0_0YGNodeHasMeasureFunc(ABI36_0_0YGNodeRef node);
WIN_EXPORT void ABI36_0_0YGNodeSetMeasureFunc(ABI36_0_0YGNodeRef node, ABI36_0_0YGMeasureFunc measureFunc);
bool ABI36_0_0YGNodeHasBaselineFunc(ABI36_0_0YGNodeRef node);
void ABI36_0_0YGNodeSetBaselineFunc(ABI36_0_0YGNodeRef node, ABI36_0_0YGBaselineFunc baselineFunc);
ABI36_0_0YGDirtiedFunc ABI36_0_0YGNodeGetDirtiedFunc(ABI36_0_0YGNodeRef node);
void ABI36_0_0YGNodeSetDirtiedFunc(ABI36_0_0YGNodeRef node, ABI36_0_0YGDirtiedFunc dirtiedFunc);
void ABI36_0_0YGNodeSetPrintFunc(ABI36_0_0YGNodeRef node, ABI36_0_0YGPrintFunc printFunc);
WIN_EXPORT bool ABI36_0_0YGNodeGetHasNewLayout(ABI36_0_0YGNodeRef node);
WIN_EXPORT void ABI36_0_0YGNodeSetHasNewLayout(ABI36_0_0YGNodeRef node, bool hasNewLayout);
ABI36_0_0YGNodeType ABI36_0_0YGNodeGetNodeType(ABI36_0_0YGNodeRef node);
void ABI36_0_0YGNodeSetNodeType(ABI36_0_0YGNodeRef node, ABI36_0_0YGNodeType nodeType);
WIN_EXPORT bool ABI36_0_0YGNodeIsDirty(ABI36_0_0YGNodeRef node);
bool ABI36_0_0YGNodeLayoutGetDidUseLegacyFlag(ABI36_0_0YGNodeRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetDirection(ABI36_0_0YGNodeRef node, ABI36_0_0YGDirection direction);
WIN_EXPORT ABI36_0_0YGDirection ABI36_0_0YGNodeStyleGetDirection(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetFlexDirection(
    ABI36_0_0YGNodeRef node,
    ABI36_0_0YGFlexDirection flexDirection);
WIN_EXPORT ABI36_0_0YGFlexDirection ABI36_0_0YGNodeStyleGetFlexDirection(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetJustifyContent(
    ABI36_0_0YGNodeRef node,
    ABI36_0_0YGJustify justifyContent);
WIN_EXPORT ABI36_0_0YGJustify ABI36_0_0YGNodeStyleGetJustifyContent(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetAlignContent(
    ABI36_0_0YGNodeRef node,
    ABI36_0_0YGAlign alignContent);
WIN_EXPORT ABI36_0_0YGAlign ABI36_0_0YGNodeStyleGetAlignContent(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetAlignItems(ABI36_0_0YGNodeRef node, ABI36_0_0YGAlign alignItems);
WIN_EXPORT ABI36_0_0YGAlign ABI36_0_0YGNodeStyleGetAlignItems(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetAlignSelf(ABI36_0_0YGNodeRef node, ABI36_0_0YGAlign alignSelf);
WIN_EXPORT ABI36_0_0YGAlign ABI36_0_0YGNodeStyleGetAlignSelf(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetPositionType(
    ABI36_0_0YGNodeRef node,
    ABI36_0_0YGPositionType positionType);
WIN_EXPORT ABI36_0_0YGPositionType ABI36_0_0YGNodeStyleGetPositionType(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetFlexWrap(ABI36_0_0YGNodeRef node, ABI36_0_0YGWrap flexWrap);
WIN_EXPORT ABI36_0_0YGWrap ABI36_0_0YGNodeStyleGetFlexWrap(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetOverflow(ABI36_0_0YGNodeRef node, ABI36_0_0YGOverflow overflow);
WIN_EXPORT ABI36_0_0YGOverflow ABI36_0_0YGNodeStyleGetOverflow(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetDisplay(ABI36_0_0YGNodeRef node, ABI36_0_0YGDisplay display);
WIN_EXPORT ABI36_0_0YGDisplay ABI36_0_0YGNodeStyleGetDisplay(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetFlex(ABI36_0_0YGNodeRef node, float flex);
WIN_EXPORT float ABI36_0_0YGNodeStyleGetFlex(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetFlexGrow(ABI36_0_0YGNodeRef node, float flexGrow);
WIN_EXPORT float ABI36_0_0YGNodeStyleGetFlexGrow(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetFlexShrink(ABI36_0_0YGNodeRef node, float flexShrink);
WIN_EXPORT float ABI36_0_0YGNodeStyleGetFlexShrink(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetFlexBasis(ABI36_0_0YGNodeRef node, float flexBasis);
WIN_EXPORT void ABI36_0_0YGNodeStyleSetFlexBasisPercent(ABI36_0_0YGNodeRef node, float flexBasis);
WIN_EXPORT void ABI36_0_0YGNodeStyleSetFlexBasisAuto(ABI36_0_0YGNodeRef node);
WIN_EXPORT ABI36_0_0YGValue ABI36_0_0YGNodeStyleGetFlexBasis(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetPosition(
    ABI36_0_0YGNodeRef node,
    ABI36_0_0YGEdge edge,
    float position);
WIN_EXPORT void ABI36_0_0YGNodeStyleSetPositionPercent(
    ABI36_0_0YGNodeRef node,
    ABI36_0_0YGEdge edge,
    float position);
WIN_EXPORT ABI36_0_0YGValue ABI36_0_0YGNodeStyleGetPosition(ABI36_0_0YGNodeConstRef node, ABI36_0_0YGEdge edge);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetMargin(ABI36_0_0YGNodeRef node, ABI36_0_0YGEdge edge, float margin);
WIN_EXPORT void ABI36_0_0YGNodeStyleSetMarginPercent(
    ABI36_0_0YGNodeRef node,
    ABI36_0_0YGEdge edge,
    float margin);
WIN_EXPORT void ABI36_0_0YGNodeStyleSetMarginAuto(ABI36_0_0YGNodeRef node, ABI36_0_0YGEdge edge);
WIN_EXPORT ABI36_0_0YGValue ABI36_0_0YGNodeStyleGetMargin(ABI36_0_0YGNodeConstRef node, ABI36_0_0YGEdge edge);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetPadding(
    ABI36_0_0YGNodeRef node,
    ABI36_0_0YGEdge edge,
    float padding);
WIN_EXPORT void ABI36_0_0YGNodeStyleSetPaddingPercent(
    ABI36_0_0YGNodeRef node,
    ABI36_0_0YGEdge edge,
    float padding);
WIN_EXPORT ABI36_0_0YGValue ABI36_0_0YGNodeStyleGetPadding(ABI36_0_0YGNodeConstRef node, ABI36_0_0YGEdge edge);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetBorder(ABI36_0_0YGNodeRef node, ABI36_0_0YGEdge edge, float border);
WIN_EXPORT float ABI36_0_0YGNodeStyleGetBorder(ABI36_0_0YGNodeConstRef node, ABI36_0_0YGEdge edge);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetWidth(ABI36_0_0YGNodeRef node, float width);
WIN_EXPORT void ABI36_0_0YGNodeStyleSetWidthPercent(ABI36_0_0YGNodeRef node, float width);
WIN_EXPORT void ABI36_0_0YGNodeStyleSetWidthAuto(ABI36_0_0YGNodeRef node);
WIN_EXPORT ABI36_0_0YGValue ABI36_0_0YGNodeStyleGetWidth(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetHeight(ABI36_0_0YGNodeRef node, float height);
WIN_EXPORT void ABI36_0_0YGNodeStyleSetHeightPercent(ABI36_0_0YGNodeRef node, float height);
WIN_EXPORT void ABI36_0_0YGNodeStyleSetHeightAuto(ABI36_0_0YGNodeRef node);
WIN_EXPORT ABI36_0_0YGValue ABI36_0_0YGNodeStyleGetHeight(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetMinWidth(ABI36_0_0YGNodeRef node, float minWidth);
WIN_EXPORT void ABI36_0_0YGNodeStyleSetMinWidthPercent(ABI36_0_0YGNodeRef node, float minWidth);
WIN_EXPORT ABI36_0_0YGValue ABI36_0_0YGNodeStyleGetMinWidth(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetMinHeight(ABI36_0_0YGNodeRef node, float minHeight);
WIN_EXPORT void ABI36_0_0YGNodeStyleSetMinHeightPercent(ABI36_0_0YGNodeRef node, float minHeight);
WIN_EXPORT ABI36_0_0YGValue ABI36_0_0YGNodeStyleGetMinHeight(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetMaxWidth(ABI36_0_0YGNodeRef node, float maxWidth);
WIN_EXPORT void ABI36_0_0YGNodeStyleSetMaxWidthPercent(ABI36_0_0YGNodeRef node, float maxWidth);
WIN_EXPORT ABI36_0_0YGValue ABI36_0_0YGNodeStyleGetMaxWidth(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT void ABI36_0_0YGNodeStyleSetMaxHeight(ABI36_0_0YGNodeRef node, float maxHeight);
WIN_EXPORT void ABI36_0_0YGNodeStyleSetMaxHeightPercent(ABI36_0_0YGNodeRef node, float maxHeight);
WIN_EXPORT ABI36_0_0YGValue ABI36_0_0YGNodeStyleGetMaxHeight(ABI36_0_0YGNodeConstRef node);

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
WIN_EXPORT void ABI36_0_0YGNodeStyleSetAspectRatio(ABI36_0_0YGNodeRef node, float aspectRatio);
WIN_EXPORT float ABI36_0_0YGNodeStyleGetAspectRatio(ABI36_0_0YGNodeConstRef node);

WIN_EXPORT float ABI36_0_0YGNodeLayoutGetLeft(ABI36_0_0YGNodeRef node);
WIN_EXPORT float ABI36_0_0YGNodeLayoutGetTop(ABI36_0_0YGNodeRef node);
WIN_EXPORT float ABI36_0_0YGNodeLayoutGetRight(ABI36_0_0YGNodeRef node);
WIN_EXPORT float ABI36_0_0YGNodeLayoutGetBottom(ABI36_0_0YGNodeRef node);
WIN_EXPORT float ABI36_0_0YGNodeLayoutGetWidth(ABI36_0_0YGNodeRef node);
WIN_EXPORT float ABI36_0_0YGNodeLayoutGetHeight(ABI36_0_0YGNodeRef node);
WIN_EXPORT ABI36_0_0YGDirection ABI36_0_0YGNodeLayoutGetDirection(ABI36_0_0YGNodeRef node);
WIN_EXPORT bool ABI36_0_0YGNodeLayoutGetHadOverflow(ABI36_0_0YGNodeRef node);
bool ABI36_0_0YGNodeLayoutGetDidLegacyStretchFlagAffectLayout(ABI36_0_0YGNodeRef node);

// Get the computed values for these nodes after performing layout. If they were
// set using point values then the returned value will be the same as
// ABI36_0_0YGNodeStyleGetXXX. However if they were set using a percentage value then the
// returned value is the computed value used during layout.
WIN_EXPORT float ABI36_0_0YGNodeLayoutGetMargin(ABI36_0_0YGNodeRef node, ABI36_0_0YGEdge edge);
WIN_EXPORT float ABI36_0_0YGNodeLayoutGetBorder(ABI36_0_0YGNodeRef node, ABI36_0_0YGEdge edge);
WIN_EXPORT float ABI36_0_0YGNodeLayoutGetPadding(ABI36_0_0YGNodeRef node, ABI36_0_0YGEdge edge);

WIN_EXPORT void ABI36_0_0YGConfigSetLogger(ABI36_0_0YGConfigRef config, ABI36_0_0YGLogger logger);
WIN_EXPORT void ABI36_0_0YGAssert(bool condition, const char* message);
WIN_EXPORT void ABI36_0_0YGAssertWithNode(
    ABI36_0_0YGNodeRef node,
    bool condition,
    const char* message);
WIN_EXPORT void ABI36_0_0YGAssertWithConfig(
    ABI36_0_0YGConfigRef config,
    bool condition,
    const char* message);
// Set this to number of pixels in 1 point to round calculation results If you
// want to avoid rounding - set PointScaleFactor to 0
WIN_EXPORT void ABI36_0_0YGConfigSetPointScaleFactor(
    ABI36_0_0YGConfigRef config,
    float pixelsInPoint);
void ABI36_0_0YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
    ABI36_0_0YGConfigRef config,
    bool shouldDiffLayout);

// Yoga previously had an error where containers would take the maximum space
// possible instead of the minimum like they are supposed to. In practice this
// resulted in implicit behaviour similar to align-self: stretch; Because this
// was such a long-standing bug we must allow legacy users to switch back to
// this behaviour.
WIN_EXPORT void ABI36_0_0YGConfigSetUseLegacyStretchBehaviour(
    ABI36_0_0YGConfigRef config,
    bool useLegacyStretchBehaviour);

// ABI36_0_0YGConfig
WIN_EXPORT ABI36_0_0YGConfigRef ABI36_0_0YGConfigNew(void);
WIN_EXPORT void ABI36_0_0YGConfigFree(ABI36_0_0YGConfigRef config);
WIN_EXPORT void ABI36_0_0YGConfigCopy(ABI36_0_0YGConfigRef dest, ABI36_0_0YGConfigRef src);
WIN_EXPORT int32_t ABI36_0_0YGConfigGetInstanceCount(void);

WIN_EXPORT void ABI36_0_0YGConfigSetExperimentalFeatureEnabled(
    ABI36_0_0YGConfigRef config,
    ABI36_0_0YGExperimentalFeature feature,
    bool enabled);
WIN_EXPORT bool ABI36_0_0YGConfigIsExperimentalFeatureEnabled(
    ABI36_0_0YGConfigRef config,
    ABI36_0_0YGExperimentalFeature feature);

// Using the web defaults is the preferred configuration for new projects. Usage
// of non web defaults should be considered as legacy.
WIN_EXPORT void ABI36_0_0YGConfigSetUseWebDefaults(ABI36_0_0YGConfigRef config, bool enabled);
WIN_EXPORT bool ABI36_0_0YGConfigGetUseWebDefaults(ABI36_0_0YGConfigRef config);

WIN_EXPORT void ABI36_0_0YGConfigSetCloneNodeFunc(
    ABI36_0_0YGConfigRef config,
    ABI36_0_0YGCloneNodeFunc callback);

// Export only for C#
WIN_EXPORT ABI36_0_0YGConfigRef ABI36_0_0YGConfigGetDefault(void);

WIN_EXPORT void ABI36_0_0YGConfigSetContext(ABI36_0_0YGConfigRef config, void* context);
WIN_EXPORT void* ABI36_0_0YGConfigGetContext(ABI36_0_0YGConfigRef config);

WIN_EXPORT float ABI36_0_0YGRoundValueToPixelGrid(
    float value,
    float pointScaleFactor,
    bool forceCeil,
    bool forceFloor);

ABI36_0_0YG_EXTERN_C_END

#ifdef __cplusplus

#include <functional>
#include <vector>

// Calls f on each node in the tree including the given node argument.
void ABI36_0_0YGTraversePreOrder(
    ABI36_0_0YGNodeRef node,
    std::function<void(ABI36_0_0YGNodeRef node)>&& f);

void ABI36_0_0YGNodeSetChildren(ABI36_0_0YGNodeRef owner, const std::vector<ABI36_0_0YGNodeRef>& children);

#endif
