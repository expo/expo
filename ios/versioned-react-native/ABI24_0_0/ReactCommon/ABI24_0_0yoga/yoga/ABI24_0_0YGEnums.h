/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "ABI24_0_0YGMacros.h"

ABI24_0_0YG_EXTERN_C_BEGIN

#define ABI24_0_0YGAlignCount 8
typedef ABI24_0_0YG_ENUM_BEGIN(ABI24_0_0YGAlign) {
  ABI24_0_0YGAlignAuto,
  ABI24_0_0YGAlignFlexStart,
  ABI24_0_0YGAlignCenter,
  ABI24_0_0YGAlignFlexEnd,
  ABI24_0_0YGAlignStretch,
  ABI24_0_0YGAlignBaseline,
  ABI24_0_0YGAlignSpaceBetween,
  ABI24_0_0YGAlignSpaceAround,
} ABI24_0_0YG_ENUM_END(ABI24_0_0YGAlign);
WIN_EXPORT const char *ABI24_0_0YGAlignToString(const ABI24_0_0YGAlign value);

#define ABI24_0_0YGDimensionCount 2
typedef ABI24_0_0YG_ENUM_BEGIN(ABI24_0_0YGDimension) {
  ABI24_0_0YGDimensionWidth,
  ABI24_0_0YGDimensionHeight,
} ABI24_0_0YG_ENUM_END(ABI24_0_0YGDimension);
WIN_EXPORT const char *ABI24_0_0YGDimensionToString(const ABI24_0_0YGDimension value);

#define ABI24_0_0YGDirectionCount 3
typedef ABI24_0_0YG_ENUM_BEGIN(ABI24_0_0YGDirection) {
  ABI24_0_0YGDirectionInherit,
  ABI24_0_0YGDirectionLTR,
  ABI24_0_0YGDirectionRTL,
} ABI24_0_0YG_ENUM_END(ABI24_0_0YGDirection);
WIN_EXPORT const char *ABI24_0_0YGDirectionToString(const ABI24_0_0YGDirection value);

#define ABI24_0_0YGDisplayCount 2
typedef ABI24_0_0YG_ENUM_BEGIN(ABI24_0_0YGDisplay) {
  ABI24_0_0YGDisplayFlex,
  ABI24_0_0YGDisplayNone,
} ABI24_0_0YG_ENUM_END(ABI24_0_0YGDisplay);
WIN_EXPORT const char *ABI24_0_0YGDisplayToString(const ABI24_0_0YGDisplay value);

#define ABI24_0_0YGEdgeCount 9
typedef ABI24_0_0YG_ENUM_BEGIN(ABI24_0_0YGEdge) {
  ABI24_0_0YGEdgeLeft,
  ABI24_0_0YGEdgeTop,
  ABI24_0_0YGEdgeRight,
  ABI24_0_0YGEdgeBottom,
  ABI24_0_0YGEdgeStart,
  ABI24_0_0YGEdgeEnd,
  ABI24_0_0YGEdgeHorizontal,
  ABI24_0_0YGEdgeVertical,
  ABI24_0_0YGEdgeAll,
} ABI24_0_0YG_ENUM_END(ABI24_0_0YGEdge);
WIN_EXPORT const char *ABI24_0_0YGEdgeToString(const ABI24_0_0YGEdge value);

#define ABI24_0_0YGExperimentalFeatureCount 1
typedef ABI24_0_0YG_ENUM_BEGIN(ABI24_0_0YGExperimentalFeature) {
  ABI24_0_0YGExperimentalFeatureWebFlexBasis,
} ABI24_0_0YG_ENUM_END(ABI24_0_0YGExperimentalFeature);
WIN_EXPORT const char *ABI24_0_0YGExperimentalFeatureToString(const ABI24_0_0YGExperimentalFeature value);

#define ABI24_0_0YGFlexDirectionCount 4
typedef ABI24_0_0YG_ENUM_BEGIN(ABI24_0_0YGFlexDirection) {
  ABI24_0_0YGFlexDirectionColumn,
  ABI24_0_0YGFlexDirectionColumnReverse,
  ABI24_0_0YGFlexDirectionRow,
  ABI24_0_0YGFlexDirectionRowReverse,
} ABI24_0_0YG_ENUM_END(ABI24_0_0YGFlexDirection);
WIN_EXPORT const char *ABI24_0_0YGFlexDirectionToString(const ABI24_0_0YGFlexDirection value);

#define ABI24_0_0YGJustifyCount 5
typedef ABI24_0_0YG_ENUM_BEGIN(ABI24_0_0YGJustify) {
  ABI24_0_0YGJustifyFlexStart,
  ABI24_0_0YGJustifyCenter,
  ABI24_0_0YGJustifyFlexEnd,
  ABI24_0_0YGJustifySpaceBetween,
  ABI24_0_0YGJustifySpaceAround,
} ABI24_0_0YG_ENUM_END(ABI24_0_0YGJustify);
WIN_EXPORT const char *ABI24_0_0YGJustifyToString(const ABI24_0_0YGJustify value);

#define ABI24_0_0YGLogLevelCount 6
typedef ABI24_0_0YG_ENUM_BEGIN(ABI24_0_0YGLogLevel) {
  ABI24_0_0YGLogLevelError,
  ABI24_0_0YGLogLevelWarn,
  ABI24_0_0YGLogLevelInfo,
  ABI24_0_0YGLogLevelDebug,
  ABI24_0_0YGLogLevelVerbose,
  ABI24_0_0YGLogLevelFatal,
} ABI24_0_0YG_ENUM_END(ABI24_0_0YGLogLevel);
WIN_EXPORT const char *ABI24_0_0YGLogLevelToString(const ABI24_0_0YGLogLevel value);

#define ABI24_0_0YGMeasureModeCount 3
typedef ABI24_0_0YG_ENUM_BEGIN(ABI24_0_0YGMeasureMode) {
  ABI24_0_0YGMeasureModeUndefined,
  ABI24_0_0YGMeasureModeExactly,
  ABI24_0_0YGMeasureModeAtMost,
} ABI24_0_0YG_ENUM_END(ABI24_0_0YGMeasureMode);
WIN_EXPORT const char *ABI24_0_0YGMeasureModeToString(const ABI24_0_0YGMeasureMode value);

#define ABI24_0_0YGNodeTypeCount 2
typedef ABI24_0_0YG_ENUM_BEGIN(ABI24_0_0YGNodeType) {
  ABI24_0_0YGNodeTypeDefault,
  ABI24_0_0YGNodeTypeText,
} ABI24_0_0YG_ENUM_END(ABI24_0_0YGNodeType);
WIN_EXPORT const char *ABI24_0_0YGNodeTypeToString(const ABI24_0_0YGNodeType value);

#define ABI24_0_0YGOverflowCount 3
typedef ABI24_0_0YG_ENUM_BEGIN(ABI24_0_0YGOverflow) {
  ABI24_0_0YGOverflowVisible,
  ABI24_0_0YGOverflowHidden,
  ABI24_0_0YGOverflowScroll,
} ABI24_0_0YG_ENUM_END(ABI24_0_0YGOverflow);
WIN_EXPORT const char *ABI24_0_0YGOverflowToString(const ABI24_0_0YGOverflow value);

#define ABI24_0_0YGPositionTypeCount 2
typedef ABI24_0_0YG_ENUM_BEGIN(ABI24_0_0YGPositionType) {
  ABI24_0_0YGPositionTypeRelative,
  ABI24_0_0YGPositionTypeAbsolute,
} ABI24_0_0YG_ENUM_END(ABI24_0_0YGPositionType);
WIN_EXPORT const char *ABI24_0_0YGPositionTypeToString(const ABI24_0_0YGPositionType value);

#define ABI24_0_0YGPrintOptionsCount 3
typedef ABI24_0_0YG_ENUM_BEGIN(ABI24_0_0YGPrintOptions) {
  ABI24_0_0YGPrintOptionsLayout = 1,
  ABI24_0_0YGPrintOptionsStyle = 2,
  ABI24_0_0YGPrintOptionsChildren = 4,
} ABI24_0_0YG_ENUM_END(ABI24_0_0YGPrintOptions);
WIN_EXPORT const char *ABI24_0_0YGPrintOptionsToString(const ABI24_0_0YGPrintOptions value);

#define ABI24_0_0YGUnitCount 4
typedef ABI24_0_0YG_ENUM_BEGIN(ABI24_0_0YGUnit) {
  ABI24_0_0YGUnitUndefined,
  ABI24_0_0YGUnitPoint,
  ABI24_0_0YGUnitPercent,
  ABI24_0_0YGUnitAuto,
} ABI24_0_0YG_ENUM_END(ABI24_0_0YGUnit);
WIN_EXPORT const char *ABI24_0_0YGUnitToString(const ABI24_0_0YGUnit value);

#define ABI24_0_0YGWrapCount 3
typedef ABI24_0_0YG_ENUM_BEGIN(ABI24_0_0YGWrap) {
  ABI24_0_0YGWrapNoWrap,
  ABI24_0_0YGWrapWrap,
  ABI24_0_0YGWrapWrapReverse,
} ABI24_0_0YG_ENUM_END(ABI24_0_0YGWrap);
WIN_EXPORT const char *ABI24_0_0YGWrapToString(const ABI24_0_0YGWrap value);

ABI24_0_0YG_EXTERN_C_END
