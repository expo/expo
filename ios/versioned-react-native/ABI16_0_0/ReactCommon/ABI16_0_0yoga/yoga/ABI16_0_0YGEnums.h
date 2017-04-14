/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "ABI16_0_0YGMacros.h"

ABI16_0_0YG_EXTERN_C_BEGIN

#define ABI16_0_0YGAlignCount 8
typedef ABI16_0_0YG_ENUM_BEGIN(ABI16_0_0YGAlign) {
  ABI16_0_0YGAlignAuto,
  ABI16_0_0YGAlignFlexStart,
  ABI16_0_0YGAlignCenter,
  ABI16_0_0YGAlignFlexEnd,
  ABI16_0_0YGAlignStretch,
  ABI16_0_0YGAlignBaseline,
  ABI16_0_0YGAlignSpaceBetween,
  ABI16_0_0YGAlignSpaceAround,
} ABI16_0_0YG_ENUM_END(ABI16_0_0YGAlign);

#define ABI16_0_0YGDimensionCount 2
typedef ABI16_0_0YG_ENUM_BEGIN(ABI16_0_0YGDimension) {
  ABI16_0_0YGDimensionWidth,
  ABI16_0_0YGDimensionHeight,
} ABI16_0_0YG_ENUM_END(ABI16_0_0YGDimension);

#define ABI16_0_0YGDirectionCount 3
typedef ABI16_0_0YG_ENUM_BEGIN(ABI16_0_0YGDirection) {
  ABI16_0_0YGDirectionInherit,
  ABI16_0_0YGDirectionLTR,
  ABI16_0_0YGDirectionRTL,
} ABI16_0_0YG_ENUM_END(ABI16_0_0YGDirection);

#define ABI16_0_0YGDisplayCount 2
typedef ABI16_0_0YG_ENUM_BEGIN(ABI16_0_0YGDisplay) {
  ABI16_0_0YGDisplayFlex,
  ABI16_0_0YGDisplayNone,
} ABI16_0_0YG_ENUM_END(ABI16_0_0YGDisplay);

#define ABI16_0_0YGEdgeCount 9
typedef ABI16_0_0YG_ENUM_BEGIN(ABI16_0_0YGEdge) {
  ABI16_0_0YGEdgeLeft,
  ABI16_0_0YGEdgeTop,
  ABI16_0_0YGEdgeRight,
  ABI16_0_0YGEdgeBottom,
  ABI16_0_0YGEdgeStart,
  ABI16_0_0YGEdgeEnd,
  ABI16_0_0YGEdgeHorizontal,
  ABI16_0_0YGEdgeVertical,
  ABI16_0_0YGEdgeAll,
} ABI16_0_0YG_ENUM_END(ABI16_0_0YGEdge);

#define ABI16_0_0YGExperimentalFeatureCount 3
typedef ABI16_0_0YG_ENUM_BEGIN(ABI16_0_0YGExperimentalFeature) {
  ABI16_0_0YGExperimentalFeatureRounding,
  ABI16_0_0YGExperimentalFeatureWebFlexBasis,
  ABI16_0_0YGExperimentalFeatureMinFlexFix,
} ABI16_0_0YG_ENUM_END(ABI16_0_0YGExperimentalFeature);

#define ABI16_0_0YGFlexDirectionCount 4
typedef ABI16_0_0YG_ENUM_BEGIN(ABI16_0_0YGFlexDirection) {
  ABI16_0_0YGFlexDirectionColumn,
  ABI16_0_0YGFlexDirectionColumnReverse,
  ABI16_0_0YGFlexDirectionRow,
  ABI16_0_0YGFlexDirectionRowReverse,
} ABI16_0_0YG_ENUM_END(ABI16_0_0YGFlexDirection);

#define ABI16_0_0YGJustifyCount 5
typedef ABI16_0_0YG_ENUM_BEGIN(ABI16_0_0YGJustify) {
  ABI16_0_0YGJustifyFlexStart,
  ABI16_0_0YGJustifyCenter,
  ABI16_0_0YGJustifyFlexEnd,
  ABI16_0_0YGJustifySpaceBetween,
  ABI16_0_0YGJustifySpaceAround,
} ABI16_0_0YG_ENUM_END(ABI16_0_0YGJustify);

#define ABI16_0_0YGLogLevelCount 5
typedef ABI16_0_0YG_ENUM_BEGIN(ABI16_0_0YGLogLevel) {
  ABI16_0_0YGLogLevelError,
  ABI16_0_0YGLogLevelWarn,
  ABI16_0_0YGLogLevelInfo,
  ABI16_0_0YGLogLevelDebug,
  ABI16_0_0YGLogLevelVerbose,
} ABI16_0_0YG_ENUM_END(ABI16_0_0YGLogLevel);

#define ABI16_0_0YGMeasureModeCount 3
typedef ABI16_0_0YG_ENUM_BEGIN(ABI16_0_0YGMeasureMode) {
  ABI16_0_0YGMeasureModeUndefined,
  ABI16_0_0YGMeasureModeExactly,
  ABI16_0_0YGMeasureModeAtMost,
} ABI16_0_0YG_ENUM_END(ABI16_0_0YGMeasureMode);

#define ABI16_0_0YGOverflowCount 3
typedef ABI16_0_0YG_ENUM_BEGIN(ABI16_0_0YGOverflow) {
  ABI16_0_0YGOverflowVisible,
  ABI16_0_0YGOverflowHidden,
  ABI16_0_0YGOverflowScroll,
} ABI16_0_0YG_ENUM_END(ABI16_0_0YGOverflow);

#define ABI16_0_0YGPositionTypeCount 2
typedef ABI16_0_0YG_ENUM_BEGIN(ABI16_0_0YGPositionType) {
  ABI16_0_0YGPositionTypeRelative,
  ABI16_0_0YGPositionTypeAbsolute,
} ABI16_0_0YG_ENUM_END(ABI16_0_0YGPositionType);

#define ABI16_0_0YGPrintOptionsCount 3
typedef ABI16_0_0YG_ENUM_BEGIN(ABI16_0_0YGPrintOptions) {
  ABI16_0_0YGPrintOptionsLayout = 1,
  ABI16_0_0YGPrintOptionsStyle = 2,
  ABI16_0_0YGPrintOptionsChildren = 4,
} ABI16_0_0YG_ENUM_END(ABI16_0_0YGPrintOptions);

#define ABI16_0_0YGUnitCount 4
typedef ABI16_0_0YG_ENUM_BEGIN(ABI16_0_0YGUnit) {
  ABI16_0_0YGUnitUndefined,
  ABI16_0_0YGUnitPoint,
  ABI16_0_0YGUnitPercent,
  ABI16_0_0YGUnitAuto,
} ABI16_0_0YG_ENUM_END(ABI16_0_0YGUnit);

#define ABI16_0_0YGWrapCount 3
typedef ABI16_0_0YG_ENUM_BEGIN(ABI16_0_0YGWrap) {
  ABI16_0_0YGWrapNoWrap,
  ABI16_0_0YGWrapWrap,
  ABI16_0_0YGWrapWrapReverse,
} ABI16_0_0YG_ENUM_END(ABI16_0_0YGWrap);

ABI16_0_0YG_EXTERN_C_END
