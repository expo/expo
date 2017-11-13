/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "ABI23_0_0YGMacros.h"

ABI23_0_0YG_EXTERN_C_BEGIN

#define ABI23_0_0YGAlignCount 8
typedef ABI23_0_0YG_ENUM_BEGIN(ABI23_0_0YGAlign) {
  ABI23_0_0YGAlignAuto,
  ABI23_0_0YGAlignFlexStart,
  ABI23_0_0YGAlignCenter,
  ABI23_0_0YGAlignFlexEnd,
  ABI23_0_0YGAlignStretch,
  ABI23_0_0YGAlignBaseline,
  ABI23_0_0YGAlignSpaceBetween,
  ABI23_0_0YGAlignSpaceAround,
} ABI23_0_0YG_ENUM_END(ABI23_0_0YGAlign);
WIN_EXPORT const char *ABI23_0_0YGAlignToString(const ABI23_0_0YGAlign value);

#define ABI23_0_0YGDimensionCount 2
typedef ABI23_0_0YG_ENUM_BEGIN(ABI23_0_0YGDimension) {
  ABI23_0_0YGDimensionWidth,
  ABI23_0_0YGDimensionHeight,
} ABI23_0_0YG_ENUM_END(ABI23_0_0YGDimension);
WIN_EXPORT const char *ABI23_0_0YGDimensionToString(const ABI23_0_0YGDimension value);

#define ABI23_0_0YGDirectionCount 3
typedef ABI23_0_0YG_ENUM_BEGIN(ABI23_0_0YGDirection) {
  ABI23_0_0YGDirectionInherit,
  ABI23_0_0YGDirectionLTR,
  ABI23_0_0YGDirectionRTL,
} ABI23_0_0YG_ENUM_END(ABI23_0_0YGDirection);
WIN_EXPORT const char *ABI23_0_0YGDirectionToString(const ABI23_0_0YGDirection value);

#define ABI23_0_0YGDisplayCount 2
typedef ABI23_0_0YG_ENUM_BEGIN(ABI23_0_0YGDisplay) {
  ABI23_0_0YGDisplayFlex,
  ABI23_0_0YGDisplayNone,
} ABI23_0_0YG_ENUM_END(ABI23_0_0YGDisplay);
WIN_EXPORT const char *ABI23_0_0YGDisplayToString(const ABI23_0_0YGDisplay value);

#define ABI23_0_0YGEdgeCount 9
typedef ABI23_0_0YG_ENUM_BEGIN(ABI23_0_0YGEdge) {
  ABI23_0_0YGEdgeLeft,
  ABI23_0_0YGEdgeTop,
  ABI23_0_0YGEdgeRight,
  ABI23_0_0YGEdgeBottom,
  ABI23_0_0YGEdgeStart,
  ABI23_0_0YGEdgeEnd,
  ABI23_0_0YGEdgeHorizontal,
  ABI23_0_0YGEdgeVertical,
  ABI23_0_0YGEdgeAll,
} ABI23_0_0YG_ENUM_END(ABI23_0_0YGEdge);
WIN_EXPORT const char *ABI23_0_0YGEdgeToString(const ABI23_0_0YGEdge value);

#define ABI23_0_0YGExperimentalFeatureCount 1
typedef ABI23_0_0YG_ENUM_BEGIN(ABI23_0_0YGExperimentalFeature) {
  ABI23_0_0YGExperimentalFeatureWebFlexBasis,
} ABI23_0_0YG_ENUM_END(ABI23_0_0YGExperimentalFeature);
WIN_EXPORT const char *ABI23_0_0YGExperimentalFeatureToString(const ABI23_0_0YGExperimentalFeature value);

#define ABI23_0_0YGFlexDirectionCount 4
typedef ABI23_0_0YG_ENUM_BEGIN(ABI23_0_0YGFlexDirection) {
  ABI23_0_0YGFlexDirectionColumn,
  ABI23_0_0YGFlexDirectionColumnReverse,
  ABI23_0_0YGFlexDirectionRow,
  ABI23_0_0YGFlexDirectionRowReverse,
} ABI23_0_0YG_ENUM_END(ABI23_0_0YGFlexDirection);
WIN_EXPORT const char *ABI23_0_0YGFlexDirectionToString(const ABI23_0_0YGFlexDirection value);

#define ABI23_0_0YGJustifyCount 5
typedef ABI23_0_0YG_ENUM_BEGIN(ABI23_0_0YGJustify) {
  ABI23_0_0YGJustifyFlexStart,
  ABI23_0_0YGJustifyCenter,
  ABI23_0_0YGJustifyFlexEnd,
  ABI23_0_0YGJustifySpaceBetween,
  ABI23_0_0YGJustifySpaceAround,
} ABI23_0_0YG_ENUM_END(ABI23_0_0YGJustify);
WIN_EXPORT const char *ABI23_0_0YGJustifyToString(const ABI23_0_0YGJustify value);

#define ABI23_0_0YGLogLevelCount 6
typedef ABI23_0_0YG_ENUM_BEGIN(ABI23_0_0YGLogLevel) {
  ABI23_0_0YGLogLevelError,
  ABI23_0_0YGLogLevelWarn,
  ABI23_0_0YGLogLevelInfo,
  ABI23_0_0YGLogLevelDebug,
  ABI23_0_0YGLogLevelVerbose,
  ABI23_0_0YGLogLevelFatal,
} ABI23_0_0YG_ENUM_END(ABI23_0_0YGLogLevel);
WIN_EXPORT const char *ABI23_0_0YGLogLevelToString(const ABI23_0_0YGLogLevel value);

#define ABI23_0_0YGMeasureModeCount 3
typedef ABI23_0_0YG_ENUM_BEGIN(ABI23_0_0YGMeasureMode) {
  ABI23_0_0YGMeasureModeUndefined,
  ABI23_0_0YGMeasureModeExactly,
  ABI23_0_0YGMeasureModeAtMost,
} ABI23_0_0YG_ENUM_END(ABI23_0_0YGMeasureMode);
WIN_EXPORT const char *ABI23_0_0YGMeasureModeToString(const ABI23_0_0YGMeasureMode value);

#define ABI23_0_0YGNodeTypeCount 2
typedef ABI23_0_0YG_ENUM_BEGIN(ABI23_0_0YGNodeType) {
  ABI23_0_0YGNodeTypeDefault,
  ABI23_0_0YGNodeTypeText,
} ABI23_0_0YG_ENUM_END(ABI23_0_0YGNodeType);
WIN_EXPORT const char *ABI23_0_0YGNodeTypeToString(const ABI23_0_0YGNodeType value);

#define ABI23_0_0YGOverflowCount 3
typedef ABI23_0_0YG_ENUM_BEGIN(ABI23_0_0YGOverflow) {
  ABI23_0_0YGOverflowVisible,
  ABI23_0_0YGOverflowHidden,
  ABI23_0_0YGOverflowScroll,
} ABI23_0_0YG_ENUM_END(ABI23_0_0YGOverflow);
WIN_EXPORT const char *ABI23_0_0YGOverflowToString(const ABI23_0_0YGOverflow value);

#define ABI23_0_0YGPositionTypeCount 2
typedef ABI23_0_0YG_ENUM_BEGIN(ABI23_0_0YGPositionType) {
  ABI23_0_0YGPositionTypeRelative,
  ABI23_0_0YGPositionTypeAbsolute,
} ABI23_0_0YG_ENUM_END(ABI23_0_0YGPositionType);
WIN_EXPORT const char *ABI23_0_0YGPositionTypeToString(const ABI23_0_0YGPositionType value);

#define ABI23_0_0YGPrintOptionsCount 3
typedef ABI23_0_0YG_ENUM_BEGIN(ABI23_0_0YGPrintOptions) {
  ABI23_0_0YGPrintOptionsLayout = 1,
  ABI23_0_0YGPrintOptionsStyle = 2,
  ABI23_0_0YGPrintOptionsChildren = 4,
} ABI23_0_0YG_ENUM_END(ABI23_0_0YGPrintOptions);
WIN_EXPORT const char *ABI23_0_0YGPrintOptionsToString(const ABI23_0_0YGPrintOptions value);

#define ABI23_0_0YGUnitCount 4
typedef ABI23_0_0YG_ENUM_BEGIN(ABI23_0_0YGUnit) {
  ABI23_0_0YGUnitUndefined,
  ABI23_0_0YGUnitPoint,
  ABI23_0_0YGUnitPercent,
  ABI23_0_0YGUnitAuto,
} ABI23_0_0YG_ENUM_END(ABI23_0_0YGUnit);
WIN_EXPORT const char *ABI23_0_0YGUnitToString(const ABI23_0_0YGUnit value);

#define ABI23_0_0YGWrapCount 3
typedef ABI23_0_0YG_ENUM_BEGIN(ABI23_0_0YGWrap) {
  ABI23_0_0YGWrapNoWrap,
  ABI23_0_0YGWrapWrap,
  ABI23_0_0YGWrapWrapReverse,
} ABI23_0_0YG_ENUM_END(ABI23_0_0YGWrap);
WIN_EXPORT const char *ABI23_0_0YGWrapToString(const ABI23_0_0YGWrap value);

ABI23_0_0YG_EXTERN_C_END
