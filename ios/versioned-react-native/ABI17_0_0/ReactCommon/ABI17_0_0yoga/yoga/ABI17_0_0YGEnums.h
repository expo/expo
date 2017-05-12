/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "ABI17_0_0YGMacros.h"

ABI17_0_0YG_EXTERN_C_BEGIN

#define ABI17_0_0YGAlignCount 8
typedef ABI17_0_0YG_ENUM_BEGIN(ABI17_0_0YGAlign) {
  ABI17_0_0YGAlignAuto,
  ABI17_0_0YGAlignFlexStart,
  ABI17_0_0YGAlignCenter,
  ABI17_0_0YGAlignFlexEnd,
  ABI17_0_0YGAlignStretch,
  ABI17_0_0YGAlignBaseline,
  ABI17_0_0YGAlignSpaceBetween,
  ABI17_0_0YGAlignSpaceAround,
} ABI17_0_0YG_ENUM_END(ABI17_0_0YGAlign);

#define ABI17_0_0YGDimensionCount 2
typedef ABI17_0_0YG_ENUM_BEGIN(ABI17_0_0YGDimension) {
  ABI17_0_0YGDimensionWidth,
  ABI17_0_0YGDimensionHeight,
} ABI17_0_0YG_ENUM_END(ABI17_0_0YGDimension);

#define ABI17_0_0YGDirectionCount 3
typedef ABI17_0_0YG_ENUM_BEGIN(ABI17_0_0YGDirection) {
  ABI17_0_0YGDirectionInherit,
  ABI17_0_0YGDirectionLTR,
  ABI17_0_0YGDirectionRTL,
} ABI17_0_0YG_ENUM_END(ABI17_0_0YGDirection);

#define ABI17_0_0YGDisplayCount 2
typedef ABI17_0_0YG_ENUM_BEGIN(ABI17_0_0YGDisplay) {
  ABI17_0_0YGDisplayFlex,
  ABI17_0_0YGDisplayNone,
} ABI17_0_0YG_ENUM_END(ABI17_0_0YGDisplay);

#define ABI17_0_0YGEdgeCount 9
typedef ABI17_0_0YG_ENUM_BEGIN(ABI17_0_0YGEdge) {
  ABI17_0_0YGEdgeLeft,
  ABI17_0_0YGEdgeTop,
  ABI17_0_0YGEdgeRight,
  ABI17_0_0YGEdgeBottom,
  ABI17_0_0YGEdgeStart,
  ABI17_0_0YGEdgeEnd,
  ABI17_0_0YGEdgeHorizontal,
  ABI17_0_0YGEdgeVertical,
  ABI17_0_0YGEdgeAll,
} ABI17_0_0YG_ENUM_END(ABI17_0_0YGEdge);

#define ABI17_0_0YGExperimentalFeatureCount 3
typedef ABI17_0_0YG_ENUM_BEGIN(ABI17_0_0YGExperimentalFeature) {
  ABI17_0_0YGExperimentalFeatureRounding,
  ABI17_0_0YGExperimentalFeatureWebFlexBasis,
  ABI17_0_0YGExperimentalFeatureMinFlexFix,
} ABI17_0_0YG_ENUM_END(ABI17_0_0YGExperimentalFeature);

#define ABI17_0_0YGFlexDirectionCount 4
typedef ABI17_0_0YG_ENUM_BEGIN(ABI17_0_0YGFlexDirection) {
  ABI17_0_0YGFlexDirectionColumn,
  ABI17_0_0YGFlexDirectionColumnReverse,
  ABI17_0_0YGFlexDirectionRow,
  ABI17_0_0YGFlexDirectionRowReverse,
} ABI17_0_0YG_ENUM_END(ABI17_0_0YGFlexDirection);

#define ABI17_0_0YGJustifyCount 5
typedef ABI17_0_0YG_ENUM_BEGIN(ABI17_0_0YGJustify) {
  ABI17_0_0YGJustifyFlexStart,
  ABI17_0_0YGJustifyCenter,
  ABI17_0_0YGJustifyFlexEnd,
  ABI17_0_0YGJustifySpaceBetween,
  ABI17_0_0YGJustifySpaceAround,
} ABI17_0_0YG_ENUM_END(ABI17_0_0YGJustify);

#define ABI17_0_0YGLogLevelCount 5
typedef ABI17_0_0YG_ENUM_BEGIN(ABI17_0_0YGLogLevel) {
  ABI17_0_0YGLogLevelError,
  ABI17_0_0YGLogLevelWarn,
  ABI17_0_0YGLogLevelInfo,
  ABI17_0_0YGLogLevelDebug,
  ABI17_0_0YGLogLevelVerbose,
} ABI17_0_0YG_ENUM_END(ABI17_0_0YGLogLevel);

#define ABI17_0_0YGMeasureModeCount 3
typedef ABI17_0_0YG_ENUM_BEGIN(ABI17_0_0YGMeasureMode) {
  ABI17_0_0YGMeasureModeUndefined,
  ABI17_0_0YGMeasureModeExactly,
  ABI17_0_0YGMeasureModeAtMost,
} ABI17_0_0YG_ENUM_END(ABI17_0_0YGMeasureMode);

#define ABI17_0_0YGOverflowCount 3
typedef ABI17_0_0YG_ENUM_BEGIN(ABI17_0_0YGOverflow) {
  ABI17_0_0YGOverflowVisible,
  ABI17_0_0YGOverflowHidden,
  ABI17_0_0YGOverflowScroll,
} ABI17_0_0YG_ENUM_END(ABI17_0_0YGOverflow);

#define ABI17_0_0YGPositionTypeCount 2
typedef ABI17_0_0YG_ENUM_BEGIN(ABI17_0_0YGPositionType) {
  ABI17_0_0YGPositionTypeRelative,
  ABI17_0_0YGPositionTypeAbsolute,
} ABI17_0_0YG_ENUM_END(ABI17_0_0YGPositionType);

#define ABI17_0_0YGPrintOptionsCount 3
typedef ABI17_0_0YG_ENUM_BEGIN(ABI17_0_0YGPrintOptions) {
  ABI17_0_0YGPrintOptionsLayout = 1,
  ABI17_0_0YGPrintOptionsStyle = 2,
  ABI17_0_0YGPrintOptionsChildren = 4,
} ABI17_0_0YG_ENUM_END(ABI17_0_0YGPrintOptions);

#define ABI17_0_0YGUnitCount 4
typedef ABI17_0_0YG_ENUM_BEGIN(ABI17_0_0YGUnit) {
  ABI17_0_0YGUnitUndefined,
  ABI17_0_0YGUnitPoint,
  ABI17_0_0YGUnitPercent,
  ABI17_0_0YGUnitAuto,
} ABI17_0_0YG_ENUM_END(ABI17_0_0YGUnit);

#define ABI17_0_0YGWrapCount 3
typedef ABI17_0_0YG_ENUM_BEGIN(ABI17_0_0YGWrap) {
  ABI17_0_0YGWrapNoWrap,
  ABI17_0_0YGWrapWrap,
  ABI17_0_0YGWrapWrapReverse,
} ABI17_0_0YG_ENUM_END(ABI17_0_0YGWrap);

ABI17_0_0YG_EXTERN_C_END
