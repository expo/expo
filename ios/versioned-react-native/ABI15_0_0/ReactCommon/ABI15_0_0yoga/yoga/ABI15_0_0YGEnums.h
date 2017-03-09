/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "ABI15_0_0YGMacros.h"

ABI15_0_0YG_EXTERN_C_BEGIN

#define ABI15_0_0YGFlexDirectionCount 4
typedef ABI15_0_0YG_ENUM_BEGIN(ABI15_0_0YGFlexDirection) {
  ABI15_0_0YGFlexDirectionColumn, ABI15_0_0YGFlexDirectionColumnReverse, ABI15_0_0YGFlexDirectionRow,
      ABI15_0_0YGFlexDirectionRowReverse,
}
ABI15_0_0YG_ENUM_END(ABI15_0_0YGFlexDirection);

#define ABI15_0_0YGMeasureModeCount 3
typedef ABI15_0_0YG_ENUM_BEGIN(ABI15_0_0YGMeasureMode) {
  ABI15_0_0YGMeasureModeUndefined, ABI15_0_0YGMeasureModeExactly, ABI15_0_0YGMeasureModeAtMost,
}
ABI15_0_0YG_ENUM_END(ABI15_0_0YGMeasureMode);

#define ABI15_0_0YGPrintOptionsCount 3
typedef ABI15_0_0YG_ENUM_BEGIN(ABI15_0_0YGPrintOptions) {
  ABI15_0_0YGPrintOptionsLayout = 1, ABI15_0_0YGPrintOptionsStyle = 2, ABI15_0_0YGPrintOptionsChildren = 4,
}
ABI15_0_0YG_ENUM_END(ABI15_0_0YGPrintOptions);

#define ABI15_0_0YGEdgeCount 9
typedef ABI15_0_0YG_ENUM_BEGIN(ABI15_0_0YGEdge) {
  ABI15_0_0YGEdgeLeft, ABI15_0_0YGEdgeTop, ABI15_0_0YGEdgeRight, ABI15_0_0YGEdgeBottom, ABI15_0_0YGEdgeStart, ABI15_0_0YGEdgeEnd, ABI15_0_0YGEdgeHorizontal,
      ABI15_0_0YGEdgeVertical, ABI15_0_0YGEdgeAll,
}
ABI15_0_0YG_ENUM_END(ABI15_0_0YGEdge);

#define ABI15_0_0YGPositionTypeCount 2
typedef ABI15_0_0YG_ENUM_BEGIN(ABI15_0_0YGPositionType) {
  ABI15_0_0YGPositionTypeRelative, ABI15_0_0YGPositionTypeAbsolute,
}
ABI15_0_0YG_ENUM_END(ABI15_0_0YGPositionType);

#define ABI15_0_0YGDimensionCount 2
typedef ABI15_0_0YG_ENUM_BEGIN(ABI15_0_0YGDimension) {
  ABI15_0_0YGDimensionWidth, ABI15_0_0YGDimensionHeight,
}
ABI15_0_0YG_ENUM_END(ABI15_0_0YGDimension);

#define ABI15_0_0YGJustifyCount 5
typedef ABI15_0_0YG_ENUM_BEGIN(ABI15_0_0YGJustify) {
  ABI15_0_0YGJustifyFlexStart, ABI15_0_0YGJustifyCenter, ABI15_0_0YGJustifyFlexEnd, ABI15_0_0YGJustifySpaceBetween,
      ABI15_0_0YGJustifySpaceAround,
}
ABI15_0_0YG_ENUM_END(ABI15_0_0YGJustify);

#define ABI15_0_0YGDirectionCount 3
typedef ABI15_0_0YG_ENUM_BEGIN(ABI15_0_0YGDirection) {
  ABI15_0_0YGDirectionInherit, ABI15_0_0YGDirectionLTR, ABI15_0_0YGDirectionRTL,
}
ABI15_0_0YG_ENUM_END(ABI15_0_0YGDirection);

#define ABI15_0_0YGLogLevelCount 5
typedef ABI15_0_0YG_ENUM_BEGIN(ABI15_0_0YGLogLevel) {
  ABI15_0_0YGLogLevelError, ABI15_0_0YGLogLevelWarn, ABI15_0_0YGLogLevelInfo, ABI15_0_0YGLogLevelDebug, ABI15_0_0YGLogLevelVerbose,
}
ABI15_0_0YG_ENUM_END(ABI15_0_0YGLogLevel);

#define ABI15_0_0YGWrapCount 2
typedef ABI15_0_0YG_ENUM_BEGIN(ABI15_0_0YGWrap) {
  ABI15_0_0YGWrapNoWrap, ABI15_0_0YGWrapWrap,
}
ABI15_0_0YG_ENUM_END(ABI15_0_0YGWrap);

#define ABI15_0_0YGOverflowCount 3
typedef ABI15_0_0YG_ENUM_BEGIN(ABI15_0_0YGOverflow) {
  ABI15_0_0YGOverflowVisible, ABI15_0_0YGOverflowHidden, ABI15_0_0YGOverflowScroll,
}
ABI15_0_0YG_ENUM_END(ABI15_0_0YGOverflow);

#define ABI15_0_0YGExperimentalFeatureCount 2
typedef ABI15_0_0YG_ENUM_BEGIN(ABI15_0_0YGExperimentalFeature) {
  ABI15_0_0YGExperimentalFeatureRounding, ABI15_0_0YGExperimentalFeatureWebFlexBasis,
}
ABI15_0_0YG_ENUM_END(ABI15_0_0YGExperimentalFeature);

#define ABI15_0_0YGAlignCount 6
typedef ABI15_0_0YG_ENUM_BEGIN(ABI15_0_0YGAlign) {
  ABI15_0_0YGAlignAuto, ABI15_0_0YGAlignFlexStart, ABI15_0_0YGAlignCenter, ABI15_0_0YGAlignFlexEnd, ABI15_0_0YGAlignStretch, ABI15_0_0YGAlignBaseline,
}
ABI15_0_0YG_ENUM_END(ABI15_0_0YGAlign);

#define ABI15_0_0YGUnitCount 3
typedef ABI15_0_0YG_ENUM_BEGIN(ABI15_0_0YGUnit) {
  ABI15_0_0YGUnitUndefined, ABI15_0_0YGUnitPixel, ABI15_0_0YGUnitPercent,
}
ABI15_0_0YG_ENUM_END(ABI15_0_0YGUnit);

ABI15_0_0YG_EXTERN_C_END
