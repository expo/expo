/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "ABI14_0_0YGMacros.h"

ABI14_0_0YG_EXTERN_C_BEGIN

#define ABI14_0_0YGFlexDirectionCount 4
typedef enum ABI14_0_0YGFlexDirection {
  ABI14_0_0YGFlexDirectionColumn,
  ABI14_0_0YGFlexDirectionColumnReverse,
  ABI14_0_0YGFlexDirectionRow,
  ABI14_0_0YGFlexDirectionRowReverse,
} ABI14_0_0YGFlexDirection;

#define ABI14_0_0YGMeasureModeCount 3
typedef enum ABI14_0_0YGMeasureMode {
  ABI14_0_0YGMeasureModeUndefined,
  ABI14_0_0YGMeasureModeExactly,
  ABI14_0_0YGMeasureModeAtMost,
} ABI14_0_0YGMeasureMode;

#define ABI14_0_0YGPrintOptionsCount 3
typedef enum ABI14_0_0YGPrintOptions {
  ABI14_0_0YGPrintOptionsLayout = 1,
  ABI14_0_0YGPrintOptionsStyle = 2,
  ABI14_0_0YGPrintOptionsChildren = 4,
} ABI14_0_0YGPrintOptions;

#define ABI14_0_0YGEdgeCount 9
typedef enum ABI14_0_0YGEdge {
  ABI14_0_0YGEdgeLeft,
  ABI14_0_0YGEdgeTop,
  ABI14_0_0YGEdgeRight,
  ABI14_0_0YGEdgeBottom,
  ABI14_0_0YGEdgeStart,
  ABI14_0_0YGEdgeEnd,
  ABI14_0_0YGEdgeHorizontal,
  ABI14_0_0YGEdgeVertical,
  ABI14_0_0YGEdgeAll,
} ABI14_0_0YGEdge;

#define ABI14_0_0YGPositionTypeCount 2
typedef enum ABI14_0_0YGPositionType {
  ABI14_0_0YGPositionTypeRelative,
  ABI14_0_0YGPositionTypeAbsolute,
} ABI14_0_0YGPositionType;

#define ABI14_0_0YGDimensionCount 2
typedef enum ABI14_0_0YGDimension {
  ABI14_0_0YGDimensionWidth,
  ABI14_0_0YGDimensionHeight,
} ABI14_0_0YGDimension;

#define ABI14_0_0YGJustifyCount 5
typedef enum ABI14_0_0YGJustify {
  ABI14_0_0YGJustifyFlexStart,
  ABI14_0_0YGJustifyCenter,
  ABI14_0_0YGJustifyFlexEnd,
  ABI14_0_0YGJustifySpaceBetween,
  ABI14_0_0YGJustifySpaceAround,
} ABI14_0_0YGJustify;

#define ABI14_0_0YGDirectionCount 3
typedef enum ABI14_0_0YGDirection {
  ABI14_0_0YGDirectionInherit,
  ABI14_0_0YGDirectionLTR,
  ABI14_0_0YGDirectionRTL,
} ABI14_0_0YGDirection;

#define ABI14_0_0YGLogLevelCount 5
typedef enum ABI14_0_0YGLogLevel {
  ABI14_0_0YGLogLevelError,
  ABI14_0_0YGLogLevelWarn,
  ABI14_0_0YGLogLevelInfo,
  ABI14_0_0YGLogLevelDebug,
  ABI14_0_0YGLogLevelVerbose,
} ABI14_0_0YGLogLevel;

#define ABI14_0_0YGWrapCount 2
typedef enum ABI14_0_0YGWrap {
  ABI14_0_0YGWrapNoWrap,
  ABI14_0_0YGWrapWrap,
} ABI14_0_0YGWrap;

#define ABI14_0_0YGOverflowCount 3
typedef enum ABI14_0_0YGOverflow {
  ABI14_0_0YGOverflowVisible,
  ABI14_0_0YGOverflowHidden,
  ABI14_0_0YGOverflowScroll,
} ABI14_0_0YGOverflow;

#define ABI14_0_0YGExperimentalFeatureCount 2
typedef enum ABI14_0_0YGExperimentalFeature {
  ABI14_0_0YGExperimentalFeatureRounding,
  ABI14_0_0YGExperimentalFeatureWebFlexBasis,
} ABI14_0_0YGExperimentalFeature;

#define ABI14_0_0YGAlignCount 5
typedef enum ABI14_0_0YGAlign {
  ABI14_0_0YGAlignAuto,
  ABI14_0_0YGAlignFlexStart,
  ABI14_0_0YGAlignCenter,
  ABI14_0_0YGAlignFlexEnd,
  ABI14_0_0YGAlignStretch,
} ABI14_0_0YGAlign;

#define ABI14_0_0YGUnitCount 3
typedef enum ABI14_0_0YGUnit {
  ABI14_0_0YGUnitUndefined,
  ABI14_0_0YGUnitPixel,
  ABI14_0_0YGUnitPercent,
} ABI14_0_0YGUnit;

ABI14_0_0YG_EXTERN_C_END
