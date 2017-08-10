/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "ABI20_0_0YGMacros.h"

ABI20_0_0YG_EXTERN_C_BEGIN

#define ABI20_0_0YGAlignCount 8
typedef ABI20_0_0YG_ENUM_BEGIN(ABI20_0_0YGAlign) {
  ABI20_0_0YGAlignAuto,
  ABI20_0_0YGAlignFlexStart,
  ABI20_0_0YGAlignCenter,
  ABI20_0_0YGAlignFlexEnd,
  ABI20_0_0YGAlignStretch,
  ABI20_0_0YGAlignBaseline,
  ABI20_0_0YGAlignSpaceBetween,
  ABI20_0_0YGAlignSpaceAround,
} ABI20_0_0YG_ENUM_END(ABI20_0_0YGAlign);
WIN_EXPORT const char *ABI20_0_0YGAlignToString(const ABI20_0_0YGAlign value);

#define ABI20_0_0YGDimensionCount 2
typedef ABI20_0_0YG_ENUM_BEGIN(ABI20_0_0YGDimension) {
  ABI20_0_0YGDimensionWidth,
  ABI20_0_0YGDimensionHeight,
} ABI20_0_0YG_ENUM_END(ABI20_0_0YGDimension);
WIN_EXPORT const char *ABI20_0_0YGDimensionToString(const ABI20_0_0YGDimension value);

#define ABI20_0_0YGDirectionCount 3
typedef ABI20_0_0YG_ENUM_BEGIN(ABI20_0_0YGDirection) {
  ABI20_0_0YGDirectionInherit,
  ABI20_0_0YGDirectionLTR,
  ABI20_0_0YGDirectionRTL,
} ABI20_0_0YG_ENUM_END(ABI20_0_0YGDirection);
WIN_EXPORT const char *ABI20_0_0YGDirectionToString(const ABI20_0_0YGDirection value);

#define ABI20_0_0YGDisplayCount 2
typedef ABI20_0_0YG_ENUM_BEGIN(ABI20_0_0YGDisplay) {
  ABI20_0_0YGDisplayFlex,
  ABI20_0_0YGDisplayNone,
} ABI20_0_0YG_ENUM_END(ABI20_0_0YGDisplay);
WIN_EXPORT const char *ABI20_0_0YGDisplayToString(const ABI20_0_0YGDisplay value);

#define ABI20_0_0YGEdgeCount 9
typedef ABI20_0_0YG_ENUM_BEGIN(ABI20_0_0YGEdge) {
  ABI20_0_0YGEdgeLeft,
  ABI20_0_0YGEdgeTop,
  ABI20_0_0YGEdgeRight,
  ABI20_0_0YGEdgeBottom,
  ABI20_0_0YGEdgeStart,
  ABI20_0_0YGEdgeEnd,
  ABI20_0_0YGEdgeHorizontal,
  ABI20_0_0YGEdgeVertical,
  ABI20_0_0YGEdgeAll,
} ABI20_0_0YG_ENUM_END(ABI20_0_0YGEdge);
WIN_EXPORT const char *ABI20_0_0YGEdgeToString(const ABI20_0_0YGEdge value);

#define ABI20_0_0YGExperimentalFeatureCount 1
typedef ABI20_0_0YG_ENUM_BEGIN(ABI20_0_0YGExperimentalFeature) {
  ABI20_0_0YGExperimentalFeatureWebFlexBasis,
} ABI20_0_0YG_ENUM_END(ABI20_0_0YGExperimentalFeature);
WIN_EXPORT const char *ABI20_0_0YGExperimentalFeatureToString(const ABI20_0_0YGExperimentalFeature value);

#define ABI20_0_0YGFlexDirectionCount 4
typedef ABI20_0_0YG_ENUM_BEGIN(ABI20_0_0YGFlexDirection) {
  ABI20_0_0YGFlexDirectionColumn,
  ABI20_0_0YGFlexDirectionColumnReverse,
  ABI20_0_0YGFlexDirectionRow,
  ABI20_0_0YGFlexDirectionRowReverse,
} ABI20_0_0YG_ENUM_END(ABI20_0_0YGFlexDirection);
WIN_EXPORT const char *ABI20_0_0YGFlexDirectionToString(const ABI20_0_0YGFlexDirection value);

#define ABI20_0_0YGJustifyCount 5
typedef ABI20_0_0YG_ENUM_BEGIN(ABI20_0_0YGJustify) {
  ABI20_0_0YGJustifyFlexStart,
  ABI20_0_0YGJustifyCenter,
  ABI20_0_0YGJustifyFlexEnd,
  ABI20_0_0YGJustifySpaceBetween,
  ABI20_0_0YGJustifySpaceAround,
} ABI20_0_0YG_ENUM_END(ABI20_0_0YGJustify);
WIN_EXPORT const char *ABI20_0_0YGJustifyToString(const ABI20_0_0YGJustify value);

#define ABI20_0_0YGLogLevelCount 6
typedef ABI20_0_0YG_ENUM_BEGIN(ABI20_0_0YGLogLevel) {
  ABI20_0_0YGLogLevelError,
  ABI20_0_0YGLogLevelWarn,
  ABI20_0_0YGLogLevelInfo,
  ABI20_0_0YGLogLevelDebug,
  ABI20_0_0YGLogLevelVerbose,
  ABI20_0_0YGLogLevelFatal,
} ABI20_0_0YG_ENUM_END(ABI20_0_0YGLogLevel);
WIN_EXPORT const char *ABI20_0_0YGLogLevelToString(const ABI20_0_0YGLogLevel value);

#define ABI20_0_0YGMeasureModeCount 3
typedef ABI20_0_0YG_ENUM_BEGIN(ABI20_0_0YGMeasureMode) {
  ABI20_0_0YGMeasureModeUndefined,
  ABI20_0_0YGMeasureModeExactly,
  ABI20_0_0YGMeasureModeAtMost,
} ABI20_0_0YG_ENUM_END(ABI20_0_0YGMeasureMode);
WIN_EXPORT const char *ABI20_0_0YGMeasureModeToString(const ABI20_0_0YGMeasureMode value);

#define ABI20_0_0YGNodeTypeCount 2
typedef ABI20_0_0YG_ENUM_BEGIN(ABI20_0_0YGNodeType) {
  ABI20_0_0YGNodeTypeDefault,
  ABI20_0_0YGNodeTypeText,
} ABI20_0_0YG_ENUM_END(ABI20_0_0YGNodeType);
WIN_EXPORT const char *ABI20_0_0YGNodeTypeToString(const ABI20_0_0YGNodeType value);

#define ABI20_0_0YGOverflowCount 3
typedef ABI20_0_0YG_ENUM_BEGIN(ABI20_0_0YGOverflow) {
  ABI20_0_0YGOverflowVisible,
  ABI20_0_0YGOverflowHidden,
  ABI20_0_0YGOverflowScroll,
} ABI20_0_0YG_ENUM_END(ABI20_0_0YGOverflow);
WIN_EXPORT const char *ABI20_0_0YGOverflowToString(const ABI20_0_0YGOverflow value);

#define ABI20_0_0YGPositionTypeCount 2
typedef ABI20_0_0YG_ENUM_BEGIN(ABI20_0_0YGPositionType) {
  ABI20_0_0YGPositionTypeRelative,
  ABI20_0_0YGPositionTypeAbsolute,
} ABI20_0_0YG_ENUM_END(ABI20_0_0YGPositionType);
WIN_EXPORT const char *ABI20_0_0YGPositionTypeToString(const ABI20_0_0YGPositionType value);

#define ABI20_0_0YGPrintOptionsCount 3
typedef ABI20_0_0YG_ENUM_BEGIN(ABI20_0_0YGPrintOptions) {
  ABI20_0_0YGPrintOptionsLayout = 1,
  ABI20_0_0YGPrintOptionsStyle = 2,
  ABI20_0_0YGPrintOptionsChildren = 4,
} ABI20_0_0YG_ENUM_END(ABI20_0_0YGPrintOptions);
WIN_EXPORT const char *ABI20_0_0YGPrintOptionsToString(const ABI20_0_0YGPrintOptions value);

#define ABI20_0_0YGUnitCount 4
typedef ABI20_0_0YG_ENUM_BEGIN(ABI20_0_0YGUnit) {
  ABI20_0_0YGUnitUndefined,
  ABI20_0_0YGUnitPoint,
  ABI20_0_0YGUnitPercent,
  ABI20_0_0YGUnitAuto,
} ABI20_0_0YG_ENUM_END(ABI20_0_0YGUnit);
WIN_EXPORT const char *ABI20_0_0YGUnitToString(const ABI20_0_0YGUnit value);

#define ABI20_0_0YGWrapCount 3
typedef ABI20_0_0YG_ENUM_BEGIN(ABI20_0_0YGWrap) {
  ABI20_0_0YGWrapNoWrap,
  ABI20_0_0YGWrapWrap,
  ABI20_0_0YGWrapWrapReverse,
} ABI20_0_0YG_ENUM_END(ABI20_0_0YGWrap);
WIN_EXPORT const char *ABI20_0_0YGWrapToString(const ABI20_0_0YGWrap value);

ABI20_0_0YG_EXTERN_C_END
