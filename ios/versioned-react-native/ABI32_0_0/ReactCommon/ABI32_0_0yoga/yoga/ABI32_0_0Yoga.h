/*
 *  Copyright (c) 2014-present, Facebook, Inc.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
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
 *Earlier we used to have ABI32_0_0YGundefined as NAN, but the downside of this is that
 *we can't use -ffast-math compiler flag as it assumes all floating-point
 *calculation involve and result into finite numbers. For more information
 *regarding -ffast-math compiler flag in clang, have a look at
 *https://clang.llvm.org/docs/UsersManual.html#cmdoption-ffast-math
 **/
#define ABI32_0_0YGUndefined 10E20F

#include "ABI32_0_0YGEnums.h"
#include "ABI32_0_0YGMacros.h"

ABI32_0_0YG_EXTERN_C_BEGIN

typedef struct ABI32_0_0YGSize {
  float width;
  float height;
} ABI32_0_0YGSize;

typedef struct ABI32_0_0YGValue {
  float value;
  ABI32_0_0YGUnit unit;
} ABI32_0_0YGValue;

extern const ABI32_0_0YGValue ABI32_0_0YGValueUndefined;
extern const ABI32_0_0YGValue ABI32_0_0YGValueAuto;

#ifdef __cplusplus

extern bool operator==(const ABI32_0_0YGValue& lhs, const ABI32_0_0YGValue& rhs);
extern bool operator!=(const ABI32_0_0YGValue& lhs, const ABI32_0_0YGValue& rhs);

#endif

typedef struct ABI32_0_0YGConfig* ABI32_0_0YGConfigRef;

typedef struct ABI32_0_0YGNode* ABI32_0_0YGNodeRef;

typedef ABI32_0_0YGSize (*ABI32_0_0YGMeasureFunc)(
    ABI32_0_0YGNodeRef node,
    float width,
    ABI32_0_0YGMeasureMode widthMode,
    float height,
    ABI32_0_0YGMeasureMode heightMode);
typedef float (
    *ABI32_0_0YGBaselineFunc)(ABI32_0_0YGNodeRef node, const float width, const float height);
typedef void (*ABI32_0_0YGDirtiedFunc)(ABI32_0_0YGNodeRef node);
typedef void (*ABI32_0_0YGPrintFunc)(ABI32_0_0YGNodeRef node);
typedef int (*ABI32_0_0YGLogger)(
    const ABI32_0_0YGConfigRef config,
    const ABI32_0_0YGNodeRef node,
    ABI32_0_0YGLogLevel level,
    const char* format,
    va_list args);
typedef ABI32_0_0YGNodeRef (
    *ABI32_0_0YGCloneNodeFunc)(ABI32_0_0YGNodeRef oldNode, ABI32_0_0YGNodeRef owner, int childIndex);

// ABI32_0_0YGNode
WIN_EXPORT ABI32_0_0YGNodeRef ABI32_0_0YGNodeNew(void);
WIN_EXPORT ABI32_0_0YGNodeRef ABI32_0_0YGNodeNewWithConfig(const ABI32_0_0YGConfigRef config);
WIN_EXPORT ABI32_0_0YGNodeRef ABI32_0_0YGNodeClone(const ABI32_0_0YGNodeRef node);
WIN_EXPORT void ABI32_0_0YGNodeFree(const ABI32_0_0YGNodeRef node);
WIN_EXPORT void ABI32_0_0YGNodeFreeRecursive(const ABI32_0_0YGNodeRef node);
WIN_EXPORT void ABI32_0_0YGNodeReset(const ABI32_0_0YGNodeRef node);
WIN_EXPORT int32_t ABI32_0_0YGNodeGetInstanceCount(void);

WIN_EXPORT void ABI32_0_0YGNodeInsertChild(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGNodeRef child,
    const uint32_t index);

// This function inserts the child ABI32_0_0YGNodeRef as a children of the node received
// by parameter and set the Owner of the child object to null. This function is
// expected to be called when using Yoga in persistent mode in order to share a
// ABI32_0_0YGNodeRef object as a child of two different Yoga trees. The child ABI32_0_0YGNodeRef
// is expected to be referenced from its original owner and from a clone of its
// original owner.
WIN_EXPORT void ABI32_0_0YGNodeInsertSharedChild(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGNodeRef child,
    const uint32_t index);
WIN_EXPORT void ABI32_0_0YGNodeRemoveChild(const ABI32_0_0YGNodeRef node, const ABI32_0_0YGNodeRef child);
WIN_EXPORT void ABI32_0_0YGNodeRemoveAllChildren(const ABI32_0_0YGNodeRef node);
WIN_EXPORT ABI32_0_0YGNodeRef ABI32_0_0YGNodeGetChild(const ABI32_0_0YGNodeRef node, const uint32_t index);
WIN_EXPORT ABI32_0_0YGNodeRef ABI32_0_0YGNodeGetOwner(const ABI32_0_0YGNodeRef node);
WIN_EXPORT ABI32_0_0YGNodeRef ABI32_0_0YGNodeGetParent(const ABI32_0_0YGNodeRef node);
WIN_EXPORT uint32_t ABI32_0_0YGNodeGetChildCount(const ABI32_0_0YGNodeRef node);
WIN_EXPORT void ABI32_0_0YGNodeSetChildren(
    ABI32_0_0YGNodeRef const owner,
    const ABI32_0_0YGNodeRef children[],
    const uint32_t count);

WIN_EXPORT void ABI32_0_0YGNodeCalculateLayout(
    const ABI32_0_0YGNodeRef node,
    const float availableWidth,
    const float availableHeight,
    const ABI32_0_0YGDirection ownerDirection);

// Mark a node as dirty. Only valid for nodes with a custom measure function
// set.
// ABI32_0_0YG knows when to mark all other nodes as dirty but because nodes with
// measure functions
// depends on information not known to ABI32_0_0YG they must perform this dirty
// marking manually.
WIN_EXPORT void ABI32_0_0YGNodeMarkDirty(const ABI32_0_0YGNodeRef node);

// This function marks the current node and all its descendants as dirty. This
// function is added to test yoga benchmarks. This function is not expected to
// be used in production as calling `ABI32_0_0YGCalculateLayout` will cause the
// recalculation of each and every node.
WIN_EXPORT void ABI32_0_0YGNodeMarkDirtyAndPropogateToDescendants(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodePrint(const ABI32_0_0YGNodeRef node, const ABI32_0_0YGPrintOptions options);

WIN_EXPORT bool ABI32_0_0YGFloatIsUndefined(const float value);

WIN_EXPORT bool ABI32_0_0YGNodeCanUseCachedMeasurement(
    const ABI32_0_0YGMeasureMode widthMode,
    const float width,
    const ABI32_0_0YGMeasureMode heightMode,
    const float height,
    const ABI32_0_0YGMeasureMode lastWidthMode,
    const float lastWidth,
    const ABI32_0_0YGMeasureMode lastHeightMode,
    const float lastHeight,
    const float lastComputedWidth,
    const float lastComputedHeight,
    const float marginRow,
    const float marginColumn,
    const ABI32_0_0YGConfigRef config);

WIN_EXPORT void ABI32_0_0YGNodeCopyStyle(
    const ABI32_0_0YGNodeRef dstNode,
    const ABI32_0_0YGNodeRef srcNode);

void* ABI32_0_0YGNodeGetContext(ABI32_0_0YGNodeRef node);
void ABI32_0_0YGNodeSetContext(ABI32_0_0YGNodeRef node, void* context);
ABI32_0_0YGMeasureFunc ABI32_0_0YGNodeGetMeasureFunc(ABI32_0_0YGNodeRef node);
void ABI32_0_0YGNodeSetMeasureFunc(ABI32_0_0YGNodeRef node, ABI32_0_0YGMeasureFunc measureFunc);
ABI32_0_0YGBaselineFunc ABI32_0_0YGNodeGetBaselineFunc(ABI32_0_0YGNodeRef node);
void ABI32_0_0YGNodeSetBaselineFunc(ABI32_0_0YGNodeRef node, ABI32_0_0YGBaselineFunc baselineFunc);
ABI32_0_0YGDirtiedFunc ABI32_0_0YGNodeGetDirtiedFunc(ABI32_0_0YGNodeRef node);
void ABI32_0_0YGNodeSetDirtiedFunc(ABI32_0_0YGNodeRef node, ABI32_0_0YGDirtiedFunc dirtiedFunc);
ABI32_0_0YGPrintFunc ABI32_0_0YGNodeGetPrintFunc(ABI32_0_0YGNodeRef node);
void ABI32_0_0YGNodeSetPrintFunc(ABI32_0_0YGNodeRef node, ABI32_0_0YGPrintFunc printFunc);
bool ABI32_0_0YGNodeGetHasNewLayout(ABI32_0_0YGNodeRef node);
void ABI32_0_0YGNodeSetHasNewLayout(ABI32_0_0YGNodeRef node, bool hasNewLayout);
ABI32_0_0YGNodeType ABI32_0_0YGNodeGetNodeType(ABI32_0_0YGNodeRef node);
void ABI32_0_0YGNodeSetNodeType(ABI32_0_0YGNodeRef node, ABI32_0_0YGNodeType nodeType);
bool ABI32_0_0YGNodeIsDirty(ABI32_0_0YGNodeRef node);
bool ABI32_0_0YGNodeLayoutGetDidUseLegacyFlag(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetDirection(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGDirection direction);
WIN_EXPORT ABI32_0_0YGDirection ABI32_0_0YGNodeStyleGetDirection(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetFlexDirection(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGFlexDirection flexDirection);
WIN_EXPORT ABI32_0_0YGFlexDirection ABI32_0_0YGNodeStyleGetFlexDirection(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetJustifyContent(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGJustify justifyContent);
WIN_EXPORT ABI32_0_0YGJustify ABI32_0_0YGNodeStyleGetJustifyContent(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetAlignContent(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGAlign alignContent);
WIN_EXPORT ABI32_0_0YGAlign ABI32_0_0YGNodeStyleGetAlignContent(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetAlignItems(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGAlign alignItems);
WIN_EXPORT ABI32_0_0YGAlign ABI32_0_0YGNodeStyleGetAlignItems(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetAlignSelf(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGAlign alignSelf);
WIN_EXPORT ABI32_0_0YGAlign ABI32_0_0YGNodeStyleGetAlignSelf(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetPositionType(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGPositionType positionType);
WIN_EXPORT ABI32_0_0YGPositionType ABI32_0_0YGNodeStyleGetPositionType(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetFlexWrap(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGWrap flexWrap);
WIN_EXPORT ABI32_0_0YGWrap ABI32_0_0YGNodeStyleGetFlexWrap(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetOverflow(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGOverflow overflow);
WIN_EXPORT ABI32_0_0YGOverflow ABI32_0_0YGNodeStyleGetOverflow(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetDisplay(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGDisplay display);
WIN_EXPORT ABI32_0_0YGDisplay ABI32_0_0YGNodeStyleGetDisplay(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetFlex(const ABI32_0_0YGNodeRef node, const float flex);
WIN_EXPORT float ABI32_0_0YGNodeStyleGetFlex(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetFlexGrow(
    const ABI32_0_0YGNodeRef node,
    const float flexGrow);
WIN_EXPORT float ABI32_0_0YGNodeStyleGetFlexGrow(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetFlexShrink(
    const ABI32_0_0YGNodeRef node,
    const float flexShrink);
WIN_EXPORT float ABI32_0_0YGNodeStyleGetFlexShrink(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetFlexBasis(
    const ABI32_0_0YGNodeRef node,
    const float flexBasis);
WIN_EXPORT void ABI32_0_0YGNodeStyleSetFlexBasisPercent(
    const ABI32_0_0YGNodeRef node,
    const float flexBasis);
WIN_EXPORT void ABI32_0_0YGNodeStyleSetFlexBasisAuto(const ABI32_0_0YGNodeRef node);
WIN_EXPORT ABI32_0_0YGValue ABI32_0_0YGNodeStyleGetFlexBasis(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetPosition(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGEdge edge,
    const float position);
WIN_EXPORT void ABI32_0_0YGNodeStyleSetPositionPercent(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGEdge edge,
    const float position);
WIN_EXPORT WIN_STRUCT(ABI32_0_0YGValue)
    ABI32_0_0YGNodeStyleGetPosition(const ABI32_0_0YGNodeRef node, const ABI32_0_0YGEdge edge);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetMargin(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGEdge edge,
    const float margin);
WIN_EXPORT void ABI32_0_0YGNodeStyleSetMarginPercent(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGEdge edge,
    const float margin);
WIN_EXPORT void ABI32_0_0YGNodeStyleSetMarginAuto(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGEdge edge);
WIN_EXPORT ABI32_0_0YGValue
ABI32_0_0YGNodeStyleGetMargin(const ABI32_0_0YGNodeRef node, const ABI32_0_0YGEdge edge);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetPadding(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGEdge edge,
    const float padding);
WIN_EXPORT void ABI32_0_0YGNodeStyleSetPaddingPercent(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGEdge edge,
    const float padding);
WIN_EXPORT ABI32_0_0YGValue
ABI32_0_0YGNodeStyleGetPadding(const ABI32_0_0YGNodeRef node, const ABI32_0_0YGEdge edge);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetBorder(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGEdge edge,
    const float border);
WIN_EXPORT float ABI32_0_0YGNodeStyleGetBorder(const ABI32_0_0YGNodeRef node, const ABI32_0_0YGEdge edge);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetWidth(const ABI32_0_0YGNodeRef node, const float width);
WIN_EXPORT void ABI32_0_0YGNodeStyleSetWidthPercent(
    const ABI32_0_0YGNodeRef node,
    const float width);
WIN_EXPORT void ABI32_0_0YGNodeStyleSetWidthAuto(const ABI32_0_0YGNodeRef node);
WIN_EXPORT ABI32_0_0YGValue ABI32_0_0YGNodeStyleGetWidth(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetHeight(const ABI32_0_0YGNodeRef node, const float height);
WIN_EXPORT void ABI32_0_0YGNodeStyleSetHeightPercent(
    const ABI32_0_0YGNodeRef node,
    const float height);
WIN_EXPORT void ABI32_0_0YGNodeStyleSetHeightAuto(const ABI32_0_0YGNodeRef node);
WIN_EXPORT ABI32_0_0YGValue ABI32_0_0YGNodeStyleGetHeight(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetMinWidth(
    const ABI32_0_0YGNodeRef node,
    const float minWidth);
WIN_EXPORT void ABI32_0_0YGNodeStyleSetMinWidthPercent(
    const ABI32_0_0YGNodeRef node,
    const float minWidth);
WIN_EXPORT ABI32_0_0YGValue ABI32_0_0YGNodeStyleGetMinWidth(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetMinHeight(
    const ABI32_0_0YGNodeRef node,
    const float minHeight);
WIN_EXPORT void ABI32_0_0YGNodeStyleSetMinHeightPercent(
    const ABI32_0_0YGNodeRef node,
    const float minHeight);
WIN_EXPORT ABI32_0_0YGValue ABI32_0_0YGNodeStyleGetMinHeight(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetMaxWidth(
    const ABI32_0_0YGNodeRef node,
    const float maxWidth);
WIN_EXPORT void ABI32_0_0YGNodeStyleSetMaxWidthPercent(
    const ABI32_0_0YGNodeRef node,
    const float maxWidth);
WIN_EXPORT ABI32_0_0YGValue ABI32_0_0YGNodeStyleGetMaxWidth(const ABI32_0_0YGNodeRef node);

WIN_EXPORT void ABI32_0_0YGNodeStyleSetMaxHeight(
    const ABI32_0_0YGNodeRef node,
    const float maxHeight);
WIN_EXPORT void ABI32_0_0YGNodeStyleSetMaxHeightPercent(
    const ABI32_0_0YGNodeRef node,
    const float maxHeight);
WIN_EXPORT ABI32_0_0YGValue ABI32_0_0YGNodeStyleGetMaxHeight(const ABI32_0_0YGNodeRef node);

// Yoga specific properties, not compatible with flexbox specification
// Aspect ratio control the size of the undefined dimension of a node.
// Aspect ratio is encoded as a floating point value width/height. e.g. A value
// of 2 leads to a node with a width twice the size of its height while a value
// of 0.5 gives the opposite effect.
//
// - On a node with a set width/height aspect ratio control the size of the
// unset dimension
// - On a node with a set flex basis aspect ratio controls the size of the node
// in the cross axis if unset
// - On a node with a measure function aspect ratio works as though the measure
// function measures the flex basis
// - On a node with flex grow/shrink aspect ratio controls the size of the node
// in the cross axis if unset
// - Aspect ratio takes min/max dimensions into account
WIN_EXPORT void ABI32_0_0YGNodeStyleSetAspectRatio(
    const ABI32_0_0YGNodeRef node,
    const float aspectRatio);
WIN_EXPORT float ABI32_0_0YGNodeStyleGetAspectRatio(const ABI32_0_0YGNodeRef node);

WIN_EXPORT float ABI32_0_0YGNodeLayoutGetLeft(const ABI32_0_0YGNodeRef node);
WIN_EXPORT float ABI32_0_0YGNodeLayoutGetTop(const ABI32_0_0YGNodeRef node);
WIN_EXPORT float ABI32_0_0YGNodeLayoutGetRight(const ABI32_0_0YGNodeRef node);
WIN_EXPORT float ABI32_0_0YGNodeLayoutGetBottom(const ABI32_0_0YGNodeRef node);
WIN_EXPORT float ABI32_0_0YGNodeLayoutGetWidth(const ABI32_0_0YGNodeRef node);
WIN_EXPORT float ABI32_0_0YGNodeLayoutGetHeight(const ABI32_0_0YGNodeRef node);
WIN_EXPORT ABI32_0_0YGDirection ABI32_0_0YGNodeLayoutGetDirection(const ABI32_0_0YGNodeRef node);
WIN_EXPORT bool ABI32_0_0YGNodeLayoutGetHadOverflow(const ABI32_0_0YGNodeRef node);
bool ABI32_0_0YGNodeLayoutGetDidLegacyStretchFlagAffectLayout(const ABI32_0_0YGNodeRef node);

// Get the computed values for these nodes after performing layout. If they were
// set using point values then the returned value will be the same as
// ABI32_0_0YGNodeStyleGetXXX. However if they were set using a percentage value then the
// returned value is the computed value used during layout.
WIN_EXPORT float ABI32_0_0YGNodeLayoutGetMargin(const ABI32_0_0YGNodeRef node, const ABI32_0_0YGEdge edge);
WIN_EXPORT float ABI32_0_0YGNodeLayoutGetBorder(const ABI32_0_0YGNodeRef node, const ABI32_0_0YGEdge edge);
WIN_EXPORT float ABI32_0_0YGNodeLayoutGetPadding(
    const ABI32_0_0YGNodeRef node,
    const ABI32_0_0YGEdge edge);

WIN_EXPORT void ABI32_0_0YGConfigSetLogger(const ABI32_0_0YGConfigRef config, ABI32_0_0YGLogger logger);
WIN_EXPORT void
ABI32_0_0YGLog(const ABI32_0_0YGNodeRef node, ABI32_0_0YGLogLevel level, const char* message, ...);
WIN_EXPORT void ABI32_0_0YGLogWithConfig(
    const ABI32_0_0YGConfigRef config,
    ABI32_0_0YGLogLevel level,
    const char* format,
    ...);
WIN_EXPORT void ABI32_0_0YGAssert(const bool condition, const char* message);
WIN_EXPORT void ABI32_0_0YGAssertWithNode(
    const ABI32_0_0YGNodeRef node,
    const bool condition,
    const char* message);
WIN_EXPORT void ABI32_0_0YGAssertWithConfig(
    const ABI32_0_0YGConfigRef config,
    const bool condition,
    const char* message);
// Set this to number of pixels in 1 point to round calculation results
// If you want to avoid rounding - set PointScaleFactor to 0
WIN_EXPORT void ABI32_0_0YGConfigSetPointScaleFactor(
    const ABI32_0_0YGConfigRef config,
    const float pixelsInPoint);
void ABI32_0_0YGConfigSetShouldDiffLayoutWithoutLegacyStretchBehaviour(
    const ABI32_0_0YGConfigRef config,
    const bool shouldDiffLayout);

// Yoga previously had an error where containers would take the maximum space
// possible instead of the minimum like they are supposed to. In practice this
// resulted in implicit behaviour similar to align-self: stretch; Because this
// was such a long-standing bug we must allow legacy users to switch back to
// this behaviour.
WIN_EXPORT void ABI32_0_0YGConfigSetUseLegacyStretchBehaviour(
    const ABI32_0_0YGConfigRef config,
    const bool useLegacyStretchBehaviour);

// ABI32_0_0YGConfig
WIN_EXPORT ABI32_0_0YGConfigRef ABI32_0_0YGConfigNew(void);
WIN_EXPORT void ABI32_0_0YGConfigFree(const ABI32_0_0YGConfigRef config);
WIN_EXPORT void ABI32_0_0YGConfigCopy(const ABI32_0_0YGConfigRef dest, const ABI32_0_0YGConfigRef src);
WIN_EXPORT int32_t ABI32_0_0YGConfigGetInstanceCount(void);

WIN_EXPORT void ABI32_0_0YGConfigSetExperimentalFeatureEnabled(
    const ABI32_0_0YGConfigRef config,
    const ABI32_0_0YGExperimentalFeature feature,
    const bool enabled);
WIN_EXPORT bool ABI32_0_0YGConfigIsExperimentalFeatureEnabled(
    const ABI32_0_0YGConfigRef config,
    const ABI32_0_0YGExperimentalFeature feature);

// Using the web defaults is the prefered configuration for new projects.
// Usage of non web defaults should be considered as legacy.
WIN_EXPORT void ABI32_0_0YGConfigSetUseWebDefaults(
    const ABI32_0_0YGConfigRef config,
    const bool enabled);
WIN_EXPORT bool ABI32_0_0YGConfigGetUseWebDefaults(const ABI32_0_0YGConfigRef config);

WIN_EXPORT void ABI32_0_0YGConfigSetCloneNodeFunc(
    const ABI32_0_0YGConfigRef config,
    const ABI32_0_0YGCloneNodeFunc callback);

// Export only for C#
WIN_EXPORT ABI32_0_0YGConfigRef ABI32_0_0YGConfigGetDefault(void);

WIN_EXPORT void ABI32_0_0YGConfigSetContext(const ABI32_0_0YGConfigRef config, void* context);
WIN_EXPORT void* ABI32_0_0YGConfigGetContext(const ABI32_0_0YGConfigRef config);

WIN_EXPORT float ABI32_0_0YGRoundValueToPixelGrid(
    const float value,
    const float pointScaleFactor,
    const bool forceCeil,
    const bool forceFloor);

ABI32_0_0YG_EXTERN_C_END

#ifdef __cplusplus

#include <functional>
#include <vector>

// Calls f on each node in the tree including the given node argument.
extern void ABI32_0_0YGTraversePreOrder(
    ABI32_0_0YGNodeRef const node,
    std::function<void(ABI32_0_0YGNodeRef node)>&& f);

extern void ABI32_0_0YGNodeSetChildren(
    ABI32_0_0YGNodeRef const owner,
    const std::vector<ABI32_0_0YGNodeRef>& children);

#endif
