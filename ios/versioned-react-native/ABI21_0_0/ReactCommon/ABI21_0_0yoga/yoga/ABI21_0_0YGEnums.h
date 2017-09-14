/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "ABI21_0_0YGMacros.h"

ABI21_0_0YG_EXTERN_C_BEGIN

#define ABI21_0_0YGAlignCount 8
typedef ABI21_0_0YG_ENUM_BEGIN(ABI21_0_0YGAlign) {
  ABI21_0_0YGAlignAuto,
  ABI21_0_0YGAlignFlexStart,
  ABI21_0_0YGAlignCenter,
  ABI21_0_0YGAlignFlexEnd,
  ABI21_0_0YGAlignStretch,
  ABI21_0_0YGAlignBaseline,
  ABI21_0_0YGAlignSpaceBetween,
  ABI21_0_0YGAlignSpaceAround,
} ABI21_0_0YG_ENUM_END(ABI21_0_0YGAlign);
WIN_EXPORT const char *ABI21_0_0YGAlignToString(const ABI21_0_0YGAlign value);

#define ABI21_0_0YGDimensionCount 2
typedef ABI21_0_0YG_ENUM_BEGIN(ABI21_0_0YGDimension) {
  ABI21_0_0YGDimensionWidth,
  ABI21_0_0YGDimensionHeight,
} ABI21_0_0YG_ENUM_END(ABI21_0_0YGDimension);
WIN_EXPORT const char *ABI21_0_0YGDimensionToString(const ABI21_0_0YGDimension value);

#define ABI21_0_0YGDirectionCount 3
typedef ABI21_0_0YG_ENUM_BEGIN(ABI21_0_0YGDirection) {
  ABI21_0_0YGDirectionInherit,
  ABI21_0_0YGDirectionLTR,
  ABI21_0_0YGDirectionRTL,
} ABI21_0_0YG_ENUM_END(ABI21_0_0YGDirection);
WIN_EXPORT const char *ABI21_0_0YGDirectionToString(const ABI21_0_0YGDirection value);

#define ABI21_0_0YGDisplayCount 2
typedef ABI21_0_0YG_ENUM_BEGIN(ABI21_0_0YGDisplay) {
  ABI21_0_0YGDisplayFlex,
  ABI21_0_0YGDisplayNone,
} ABI21_0_0YG_ENUM_END(ABI21_0_0YGDisplay);
WIN_EXPORT const char *ABI21_0_0YGDisplayToString(const ABI21_0_0YGDisplay value);

#define ABI21_0_0YGEdgeCount 9
typedef ABI21_0_0YG_ENUM_BEGIN(ABI21_0_0YGEdge) {
  ABI21_0_0YGEdgeLeft,
  ABI21_0_0YGEdgeTop,
  ABI21_0_0YGEdgeRight,
  ABI21_0_0YGEdgeBottom,
  ABI21_0_0YGEdgeStart,
  ABI21_0_0YGEdgeEnd,
  ABI21_0_0YGEdgeHorizontal,
  ABI21_0_0YGEdgeVertical,
  ABI21_0_0YGEdgeAll,
} ABI21_0_0YG_ENUM_END(ABI21_0_0YGEdge);
WIN_EXPORT const char *ABI21_0_0YGEdgeToString(const ABI21_0_0YGEdge value);

#define ABI21_0_0YGExperimentalFeatureCount 1
typedef ABI21_0_0YG_ENUM_BEGIN(ABI21_0_0YGExperimentalFeature) {
  ABI21_0_0YGExperimentalFeatureWebFlexBasis,
} ABI21_0_0YG_ENUM_END(ABI21_0_0YGExperimentalFeature);
WIN_EXPORT const char *ABI21_0_0YGExperimentalFeatureToString(const ABI21_0_0YGExperimentalFeature value);

#define ABI21_0_0YGFlexDirectionCount 4
typedef ABI21_0_0YG_ENUM_BEGIN(ABI21_0_0YGFlexDirection) {
  ABI21_0_0YGFlexDirectionColumn,
  ABI21_0_0YGFlexDirectionColumnReverse,
  ABI21_0_0YGFlexDirectionRow,
  ABI21_0_0YGFlexDirectionRowReverse,
} ABI21_0_0YG_ENUM_END(ABI21_0_0YGFlexDirection);
WIN_EXPORT const char *ABI21_0_0YGFlexDirectionToString(const ABI21_0_0YGFlexDirection value);

#define ABI21_0_0YGJustifyCount 5
typedef ABI21_0_0YG_ENUM_BEGIN(ABI21_0_0YGJustify) {
  ABI21_0_0YGJustifyFlexStart,
  ABI21_0_0YGJustifyCenter,
  ABI21_0_0YGJustifyFlexEnd,
  ABI21_0_0YGJustifySpaceBetween,
  ABI21_0_0YGJustifySpaceAround,
} ABI21_0_0YG_ENUM_END(ABI21_0_0YGJustify);
WIN_EXPORT const char *ABI21_0_0YGJustifyToString(const ABI21_0_0YGJustify value);

#define ABI21_0_0YGLogLevelCount 6
typedef ABI21_0_0YG_ENUM_BEGIN(ABI21_0_0YGLogLevel) {
  ABI21_0_0YGLogLevelError,
  ABI21_0_0YGLogLevelWarn,
  ABI21_0_0YGLogLevelInfo,
  ABI21_0_0YGLogLevelDebug,
  ABI21_0_0YGLogLevelVerbose,
  ABI21_0_0YGLogLevelFatal,
} ABI21_0_0YG_ENUM_END(ABI21_0_0YGLogLevel);
WIN_EXPORT const char *ABI21_0_0YGLogLevelToString(const ABI21_0_0YGLogLevel value);

#define ABI21_0_0YGMeasureModeCount 3
typedef ABI21_0_0YG_ENUM_BEGIN(ABI21_0_0YGMeasureMode) {
  ABI21_0_0YGMeasureModeUndefined,
  ABI21_0_0YGMeasureModeExactly,
  ABI21_0_0YGMeasureModeAtMost,
} ABI21_0_0YG_ENUM_END(ABI21_0_0YGMeasureMode);
WIN_EXPORT const char *ABI21_0_0YGMeasureModeToString(const ABI21_0_0YGMeasureMode value);

#define ABI21_0_0YGNodeTypeCount 2
typedef ABI21_0_0YG_ENUM_BEGIN(ABI21_0_0YGNodeType) {
  ABI21_0_0YGNodeTypeDefault,
  ABI21_0_0YGNodeTypeText,
} ABI21_0_0YG_ENUM_END(ABI21_0_0YGNodeType);
WIN_EXPORT const char *ABI21_0_0YGNodeTypeToString(const ABI21_0_0YGNodeType value);

#define ABI21_0_0YGOverflowCount 3
typedef ABI21_0_0YG_ENUM_BEGIN(ABI21_0_0YGOverflow) {
  ABI21_0_0YGOverflowVisible,
  ABI21_0_0YGOverflowHidden,
  ABI21_0_0YGOverflowScroll,
} ABI21_0_0YG_ENUM_END(ABI21_0_0YGOverflow);
WIN_EXPORT const char *ABI21_0_0YGOverflowToString(const ABI21_0_0YGOverflow value);

#define ABI21_0_0YGPositionTypeCount 2
typedef ABI21_0_0YG_ENUM_BEGIN(ABI21_0_0YGPositionType) {
  ABI21_0_0YGPositionTypeRelative,
  ABI21_0_0YGPositionTypeAbsolute,
} ABI21_0_0YG_ENUM_END(ABI21_0_0YGPositionType);
WIN_EXPORT const char *ABI21_0_0YGPositionTypeToString(const ABI21_0_0YGPositionType value);

#define ABI21_0_0YGPrintOptionsCount 3
typedef ABI21_0_0YG_ENUM_BEGIN(ABI21_0_0YGPrintOptions) {
  ABI21_0_0YGPrintOptionsLayout = 1,
  ABI21_0_0YGPrintOptionsStyle = 2,
  ABI21_0_0YGPrintOptionsChildren = 4,
} ABI21_0_0YG_ENUM_END(ABI21_0_0YGPrintOptions);
WIN_EXPORT const char *ABI21_0_0YGPrintOptionsToString(const ABI21_0_0YGPrintOptions value);

#define ABI21_0_0YGUnitCount 4
typedef ABI21_0_0YG_ENUM_BEGIN(ABI21_0_0YGUnit) {
  ABI21_0_0YGUnitUndefined,
  ABI21_0_0YGUnitPoint,
  ABI21_0_0YGUnitPercent,
  ABI21_0_0YGUnitAuto,
} ABI21_0_0YG_ENUM_END(ABI21_0_0YGUnit);
WIN_EXPORT const char *ABI21_0_0YGUnitToString(const ABI21_0_0YGUnit value);

#define ABI21_0_0YGWrapCount 3
typedef ABI21_0_0YG_ENUM_BEGIN(ABI21_0_0YGWrap) {
  ABI21_0_0YGWrapNoWrap,
  ABI21_0_0YGWrapWrap,
  ABI21_0_0YGWrapWrapReverse,
} ABI21_0_0YG_ENUM_END(ABI21_0_0YGWrap);
WIN_EXPORT const char *ABI21_0_0YGWrapToString(const ABI21_0_0YGWrap value);

ABI21_0_0YG_EXTERN_C_END
