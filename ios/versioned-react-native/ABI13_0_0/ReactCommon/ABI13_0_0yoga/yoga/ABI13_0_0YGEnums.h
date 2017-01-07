/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "ABI13_0_0YGMacros.h"

ABI13_0_0YG_EXTERN_C_BEGIN

typedef enum ABI13_0_0YGFlexDirection {
  ABI13_0_0YGFlexDirectionColumn,
  ABI13_0_0YGFlexDirectionColumnReverse,
  ABI13_0_0YGFlexDirectionRow,
  ABI13_0_0YGFlexDirectionRowReverse,
  ABI13_0_0YGFlexDirectionCount,
} ABI13_0_0YGFlexDirection;

typedef enum ABI13_0_0YGMeasureMode {
  ABI13_0_0YGMeasureModeUndefined,
  ABI13_0_0YGMeasureModeExactly,
  ABI13_0_0YGMeasureModeAtMost,
  ABI13_0_0YGMeasureModeCount,
} ABI13_0_0YGMeasureMode;

typedef enum ABI13_0_0YGPrintOptions {
  ABI13_0_0YGPrintOptionsLayout = 1,
  ABI13_0_0YGPrintOptionsStyle = 2,
  ABI13_0_0YGPrintOptionsChildren = 4,
  ABI13_0_0YGPrintOptionsCount,
} ABI13_0_0YGPrintOptions;

typedef enum ABI13_0_0YGEdge {
  ABI13_0_0YGEdgeLeft,
  ABI13_0_0YGEdgeTop,
  ABI13_0_0YGEdgeRight,
  ABI13_0_0YGEdgeBottom,
  ABI13_0_0YGEdgeStart,
  ABI13_0_0YGEdgeEnd,
  ABI13_0_0YGEdgeHorizontal,
  ABI13_0_0YGEdgeVertical,
  ABI13_0_0YGEdgeAll,
  ABI13_0_0YGEdgeCount,
} ABI13_0_0YGEdge;

typedef enum ABI13_0_0YGPositionType {
  ABI13_0_0YGPositionTypeRelative,
  ABI13_0_0YGPositionTypeAbsolute,
  ABI13_0_0YGPositionTypeCount,
} ABI13_0_0YGPositionType;

typedef enum ABI13_0_0YGDimension {
  ABI13_0_0YGDimensionWidth,
  ABI13_0_0YGDimensionHeight,
  ABI13_0_0YGDimensionCount,
} ABI13_0_0YGDimension;

typedef enum ABI13_0_0YGJustify {
  ABI13_0_0YGJustifyFlexStart,
  ABI13_0_0YGJustifyCenter,
  ABI13_0_0YGJustifyFlexEnd,
  ABI13_0_0YGJustifySpaceBetween,
  ABI13_0_0YGJustifySpaceAround,
  ABI13_0_0YGJustifyCount,
} ABI13_0_0YGJustify;

typedef enum ABI13_0_0YGDirection {
  ABI13_0_0YGDirectionInherit,
  ABI13_0_0YGDirectionLTR,
  ABI13_0_0YGDirectionRTL,
  ABI13_0_0YGDirectionCount,
} ABI13_0_0YGDirection;

typedef enum ABI13_0_0YGLogLevel {
  ABI13_0_0YGLogLevelError,
  ABI13_0_0YGLogLevelWarn,
  ABI13_0_0YGLogLevelInfo,
  ABI13_0_0YGLogLevelDebug,
  ABI13_0_0YGLogLevelVerbose,
  ABI13_0_0YGLogLevelCount,
} ABI13_0_0YGLogLevel;

typedef enum ABI13_0_0YGWrap {
  ABI13_0_0YGWrapNoWrap,
  ABI13_0_0YGWrapWrap,
  ABI13_0_0YGWrapCount,
} ABI13_0_0YGWrap;

typedef enum ABI13_0_0YGOverflow {
  ABI13_0_0YGOverflowVisible,
  ABI13_0_0YGOverflowHidden,
  ABI13_0_0YGOverflowScroll,
  ABI13_0_0YGOverflowCount,
} ABI13_0_0YGOverflow;

typedef enum ABI13_0_0YGExperimentalFeature {
  ABI13_0_0YGExperimentalFeatureRounding,
  ABI13_0_0YGExperimentalFeatureWebFlexBasis,
  ABI13_0_0YGExperimentalFeatureCount,
} ABI13_0_0YGExperimentalFeature;

typedef enum ABI13_0_0YGAlign {
  ABI13_0_0YGAlignAuto,
  ABI13_0_0YGAlignFlexStart,
  ABI13_0_0YGAlignCenter,
  ABI13_0_0YGAlignFlexEnd,
  ABI13_0_0YGAlignStretch,
  ABI13_0_0YGAlignCount,
} ABI13_0_0YGAlign;

ABI13_0_0YG_EXTERN_C_END
