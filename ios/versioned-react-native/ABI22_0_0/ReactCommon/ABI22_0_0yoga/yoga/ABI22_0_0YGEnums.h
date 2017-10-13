/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "ABI22_0_0YGMacros.h"

ABI22_0_0YG_EXTERN_C_BEGIN

#define ABI22_0_0YGAlignCount 8
typedef ABI22_0_0YG_ENUM_BEGIN(ABI22_0_0YGAlign) {
  ABI22_0_0YGAlignAuto,
  ABI22_0_0YGAlignFlexStart,
  ABI22_0_0YGAlignCenter,
  ABI22_0_0YGAlignFlexEnd,
  ABI22_0_0YGAlignStretch,
  ABI22_0_0YGAlignBaseline,
  ABI22_0_0YGAlignSpaceBetween,
  ABI22_0_0YGAlignSpaceAround,
} ABI22_0_0YG_ENUM_END(ABI22_0_0YGAlign);
WIN_EXPORT const char *ABI22_0_0YGAlignToString(const ABI22_0_0YGAlign value);

#define ABI22_0_0YGDimensionCount 2
typedef ABI22_0_0YG_ENUM_BEGIN(ABI22_0_0YGDimension) {
  ABI22_0_0YGDimensionWidth,
  ABI22_0_0YGDimensionHeight,
} ABI22_0_0YG_ENUM_END(ABI22_0_0YGDimension);
WIN_EXPORT const char *ABI22_0_0YGDimensionToString(const ABI22_0_0YGDimension value);

#define ABI22_0_0YGDirectionCount 3
typedef ABI22_0_0YG_ENUM_BEGIN(ABI22_0_0YGDirection) {
  ABI22_0_0YGDirectionInherit,
  ABI22_0_0YGDirectionLTR,
  ABI22_0_0YGDirectionRTL,
} ABI22_0_0YG_ENUM_END(ABI22_0_0YGDirection);
WIN_EXPORT const char *ABI22_0_0YGDirectionToString(const ABI22_0_0YGDirection value);

#define ABI22_0_0YGDisplayCount 2
typedef ABI22_0_0YG_ENUM_BEGIN(ABI22_0_0YGDisplay) {
  ABI22_0_0YGDisplayFlex,
  ABI22_0_0YGDisplayNone,
} ABI22_0_0YG_ENUM_END(ABI22_0_0YGDisplay);
WIN_EXPORT const char *ABI22_0_0YGDisplayToString(const ABI22_0_0YGDisplay value);

#define ABI22_0_0YGEdgeCount 9
typedef ABI22_0_0YG_ENUM_BEGIN(ABI22_0_0YGEdge) {
  ABI22_0_0YGEdgeLeft,
  ABI22_0_0YGEdgeTop,
  ABI22_0_0YGEdgeRight,
  ABI22_0_0YGEdgeBottom,
  ABI22_0_0YGEdgeStart,
  ABI22_0_0YGEdgeEnd,
  ABI22_0_0YGEdgeHorizontal,
  ABI22_0_0YGEdgeVertical,
  ABI22_0_0YGEdgeAll,
} ABI22_0_0YG_ENUM_END(ABI22_0_0YGEdge);
WIN_EXPORT const char *ABI22_0_0YGEdgeToString(const ABI22_0_0YGEdge value);

#define ABI22_0_0YGExperimentalFeatureCount 1
typedef ABI22_0_0YG_ENUM_BEGIN(ABI22_0_0YGExperimentalFeature) {
  ABI22_0_0YGExperimentalFeatureWebFlexBasis,
} ABI22_0_0YG_ENUM_END(ABI22_0_0YGExperimentalFeature);
WIN_EXPORT const char *ABI22_0_0YGExperimentalFeatureToString(const ABI22_0_0YGExperimentalFeature value);

#define ABI22_0_0YGFlexDirectionCount 4
typedef ABI22_0_0YG_ENUM_BEGIN(ABI22_0_0YGFlexDirection) {
  ABI22_0_0YGFlexDirectionColumn,
  ABI22_0_0YGFlexDirectionColumnReverse,
  ABI22_0_0YGFlexDirectionRow,
  ABI22_0_0YGFlexDirectionRowReverse,
} ABI22_0_0YG_ENUM_END(ABI22_0_0YGFlexDirection);
WIN_EXPORT const char *ABI22_0_0YGFlexDirectionToString(const ABI22_0_0YGFlexDirection value);

#define ABI22_0_0YGJustifyCount 5
typedef ABI22_0_0YG_ENUM_BEGIN(ABI22_0_0YGJustify) {
  ABI22_0_0YGJustifyFlexStart,
  ABI22_0_0YGJustifyCenter,
  ABI22_0_0YGJustifyFlexEnd,
  ABI22_0_0YGJustifySpaceBetween,
  ABI22_0_0YGJustifySpaceAround,
} ABI22_0_0YG_ENUM_END(ABI22_0_0YGJustify);
WIN_EXPORT const char *ABI22_0_0YGJustifyToString(const ABI22_0_0YGJustify value);

#define ABI22_0_0YGLogLevelCount 6
typedef ABI22_0_0YG_ENUM_BEGIN(ABI22_0_0YGLogLevel) {
  ABI22_0_0YGLogLevelError,
  ABI22_0_0YGLogLevelWarn,
  ABI22_0_0YGLogLevelInfo,
  ABI22_0_0YGLogLevelDebug,
  ABI22_0_0YGLogLevelVerbose,
  ABI22_0_0YGLogLevelFatal,
} ABI22_0_0YG_ENUM_END(ABI22_0_0YGLogLevel);
WIN_EXPORT const char *ABI22_0_0YGLogLevelToString(const ABI22_0_0YGLogLevel value);

#define ABI22_0_0YGMeasureModeCount 3
typedef ABI22_0_0YG_ENUM_BEGIN(ABI22_0_0YGMeasureMode) {
  ABI22_0_0YGMeasureModeUndefined,
  ABI22_0_0YGMeasureModeExactly,
  ABI22_0_0YGMeasureModeAtMost,
} ABI22_0_0YG_ENUM_END(ABI22_0_0YGMeasureMode);
WIN_EXPORT const char *ABI22_0_0YGMeasureModeToString(const ABI22_0_0YGMeasureMode value);

#define ABI22_0_0YGNodeTypeCount 2
typedef ABI22_0_0YG_ENUM_BEGIN(ABI22_0_0YGNodeType) {
  ABI22_0_0YGNodeTypeDefault,
  ABI22_0_0YGNodeTypeText,
} ABI22_0_0YG_ENUM_END(ABI22_0_0YGNodeType);
WIN_EXPORT const char *ABI22_0_0YGNodeTypeToString(const ABI22_0_0YGNodeType value);

#define ABI22_0_0YGOverflowCount 3
typedef ABI22_0_0YG_ENUM_BEGIN(ABI22_0_0YGOverflow) {
  ABI22_0_0YGOverflowVisible,
  ABI22_0_0YGOverflowHidden,
  ABI22_0_0YGOverflowScroll,
} ABI22_0_0YG_ENUM_END(ABI22_0_0YGOverflow);
WIN_EXPORT const char *ABI22_0_0YGOverflowToString(const ABI22_0_0YGOverflow value);

#define ABI22_0_0YGPositionTypeCount 2
typedef ABI22_0_0YG_ENUM_BEGIN(ABI22_0_0YGPositionType) {
  ABI22_0_0YGPositionTypeRelative,
  ABI22_0_0YGPositionTypeAbsolute,
} ABI22_0_0YG_ENUM_END(ABI22_0_0YGPositionType);
WIN_EXPORT const char *ABI22_0_0YGPositionTypeToString(const ABI22_0_0YGPositionType value);

#define ABI22_0_0YGPrintOptionsCount 3
typedef ABI22_0_0YG_ENUM_BEGIN(ABI22_0_0YGPrintOptions) {
  ABI22_0_0YGPrintOptionsLayout = 1,
  ABI22_0_0YGPrintOptionsStyle = 2,
  ABI22_0_0YGPrintOptionsChildren = 4,
} ABI22_0_0YG_ENUM_END(ABI22_0_0YGPrintOptions);
WIN_EXPORT const char *ABI22_0_0YGPrintOptionsToString(const ABI22_0_0YGPrintOptions value);

#define ABI22_0_0YGUnitCount 4
typedef ABI22_0_0YG_ENUM_BEGIN(ABI22_0_0YGUnit) {
  ABI22_0_0YGUnitUndefined,
  ABI22_0_0YGUnitPoint,
  ABI22_0_0YGUnitPercent,
  ABI22_0_0YGUnitAuto,
} ABI22_0_0YG_ENUM_END(ABI22_0_0YGUnit);
WIN_EXPORT const char *ABI22_0_0YGUnitToString(const ABI22_0_0YGUnit value);

#define ABI22_0_0YGWrapCount 3
typedef ABI22_0_0YG_ENUM_BEGIN(ABI22_0_0YGWrap) {
  ABI22_0_0YGWrapNoWrap,
  ABI22_0_0YGWrapWrap,
  ABI22_0_0YGWrapWrapReverse,
} ABI22_0_0YG_ENUM_END(ABI22_0_0YGWrap);
WIN_EXPORT const char *ABI22_0_0YGWrapToString(const ABI22_0_0YGWrap value);

ABI22_0_0YG_EXTERN_C_END
