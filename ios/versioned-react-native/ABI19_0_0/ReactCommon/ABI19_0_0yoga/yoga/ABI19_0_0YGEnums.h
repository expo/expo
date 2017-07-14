/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "ABI19_0_0YGMacros.h"

ABI19_0_0YG_EXTERN_C_BEGIN

#define ABI19_0_0YGAlignCount 8
typedef ABI19_0_0YG_ENUM_BEGIN(ABI19_0_0YGAlign) {
  ABI19_0_0YGAlignAuto,
  ABI19_0_0YGAlignFlexStart,
  ABI19_0_0YGAlignCenter,
  ABI19_0_0YGAlignFlexEnd,
  ABI19_0_0YGAlignStretch,
  ABI19_0_0YGAlignBaseline,
  ABI19_0_0YGAlignSpaceBetween,
  ABI19_0_0YGAlignSpaceAround,
} ABI19_0_0YG_ENUM_END(ABI19_0_0YGAlign);
WIN_EXPORT const char *ABI19_0_0YGAlignToString(const ABI19_0_0YGAlign value);

#define ABI19_0_0YGDimensionCount 2
typedef ABI19_0_0YG_ENUM_BEGIN(ABI19_0_0YGDimension) {
  ABI19_0_0YGDimensionWidth,
  ABI19_0_0YGDimensionHeight,
} ABI19_0_0YG_ENUM_END(ABI19_0_0YGDimension);
WIN_EXPORT const char *ABI19_0_0YGDimensionToString(const ABI19_0_0YGDimension value);

#define ABI19_0_0YGDirectionCount 3
typedef ABI19_0_0YG_ENUM_BEGIN(ABI19_0_0YGDirection) {
  ABI19_0_0YGDirectionInherit,
  ABI19_0_0YGDirectionLTR,
  ABI19_0_0YGDirectionRTL,
} ABI19_0_0YG_ENUM_END(ABI19_0_0YGDirection);
WIN_EXPORT const char *ABI19_0_0YGDirectionToString(const ABI19_0_0YGDirection value);

#define ABI19_0_0YGDisplayCount 2
typedef ABI19_0_0YG_ENUM_BEGIN(ABI19_0_0YGDisplay) {
  ABI19_0_0YGDisplayFlex,
  ABI19_0_0YGDisplayNone,
} ABI19_0_0YG_ENUM_END(ABI19_0_0YGDisplay);
WIN_EXPORT const char *ABI19_0_0YGDisplayToString(const ABI19_0_0YGDisplay value);

#define ABI19_0_0YGEdgeCount 9
typedef ABI19_0_0YG_ENUM_BEGIN(ABI19_0_0YGEdge) {
  ABI19_0_0YGEdgeLeft,
  ABI19_0_0YGEdgeTop,
  ABI19_0_0YGEdgeRight,
  ABI19_0_0YGEdgeBottom,
  ABI19_0_0YGEdgeStart,
  ABI19_0_0YGEdgeEnd,
  ABI19_0_0YGEdgeHorizontal,
  ABI19_0_0YGEdgeVertical,
  ABI19_0_0YGEdgeAll,
} ABI19_0_0YG_ENUM_END(ABI19_0_0YGEdge);
WIN_EXPORT const char *ABI19_0_0YGEdgeToString(const ABI19_0_0YGEdge value);

#define ABI19_0_0YGExperimentalFeatureCount 1
typedef ABI19_0_0YG_ENUM_BEGIN(ABI19_0_0YGExperimentalFeature) {
  ABI19_0_0YGExperimentalFeatureWebFlexBasis,
} ABI19_0_0YG_ENUM_END(ABI19_0_0YGExperimentalFeature);
WIN_EXPORT const char *ABI19_0_0YGExperimentalFeatureToString(const ABI19_0_0YGExperimentalFeature value);

#define ABI19_0_0YGFlexDirectionCount 4
typedef ABI19_0_0YG_ENUM_BEGIN(ABI19_0_0YGFlexDirection) {
  ABI19_0_0YGFlexDirectionColumn,
  ABI19_0_0YGFlexDirectionColumnReverse,
  ABI19_0_0YGFlexDirectionRow,
  ABI19_0_0YGFlexDirectionRowReverse,
} ABI19_0_0YG_ENUM_END(ABI19_0_0YGFlexDirection);
WIN_EXPORT const char *ABI19_0_0YGFlexDirectionToString(const ABI19_0_0YGFlexDirection value);

#define ABI19_0_0YGJustifyCount 5
typedef ABI19_0_0YG_ENUM_BEGIN(ABI19_0_0YGJustify) {
  ABI19_0_0YGJustifyFlexStart,
  ABI19_0_0YGJustifyCenter,
  ABI19_0_0YGJustifyFlexEnd,
  ABI19_0_0YGJustifySpaceBetween,
  ABI19_0_0YGJustifySpaceAround,
} ABI19_0_0YG_ENUM_END(ABI19_0_0YGJustify);
WIN_EXPORT const char *ABI19_0_0YGJustifyToString(const ABI19_0_0YGJustify value);

#define ABI19_0_0YGLogLevelCount 6
typedef ABI19_0_0YG_ENUM_BEGIN(ABI19_0_0YGLogLevel) {
  ABI19_0_0YGLogLevelError,
  ABI19_0_0YGLogLevelWarn,
  ABI19_0_0YGLogLevelInfo,
  ABI19_0_0YGLogLevelDebug,
  ABI19_0_0YGLogLevelVerbose,
  ABI19_0_0YGLogLevelFatal,
} ABI19_0_0YG_ENUM_END(ABI19_0_0YGLogLevel);
WIN_EXPORT const char *ABI19_0_0YGLogLevelToString(const ABI19_0_0YGLogLevel value);

#define ABI19_0_0YGMeasureModeCount 3
typedef ABI19_0_0YG_ENUM_BEGIN(ABI19_0_0YGMeasureMode) {
  ABI19_0_0YGMeasureModeUndefined,
  ABI19_0_0YGMeasureModeExactly,
  ABI19_0_0YGMeasureModeAtMost,
} ABI19_0_0YG_ENUM_END(ABI19_0_0YGMeasureMode);
WIN_EXPORT const char *ABI19_0_0YGMeasureModeToString(const ABI19_0_0YGMeasureMode value);

#define ABI19_0_0YGNodeTypeCount 2
typedef ABI19_0_0YG_ENUM_BEGIN(ABI19_0_0YGNodeType) {
  ABI19_0_0YGNodeTypeDefault,
  ABI19_0_0YGNodeTypeText,
} ABI19_0_0YG_ENUM_END(ABI19_0_0YGNodeType);
WIN_EXPORT const char *ABI19_0_0YGNodeTypeToString(const ABI19_0_0YGNodeType value);

#define ABI19_0_0YGOverflowCount 3
typedef ABI19_0_0YG_ENUM_BEGIN(ABI19_0_0YGOverflow) {
  ABI19_0_0YGOverflowVisible,
  ABI19_0_0YGOverflowHidden,
  ABI19_0_0YGOverflowScroll,
} ABI19_0_0YG_ENUM_END(ABI19_0_0YGOverflow);
WIN_EXPORT const char *ABI19_0_0YGOverflowToString(const ABI19_0_0YGOverflow value);

#define ABI19_0_0YGPositionTypeCount 2
typedef ABI19_0_0YG_ENUM_BEGIN(ABI19_0_0YGPositionType) {
  ABI19_0_0YGPositionTypeRelative,
  ABI19_0_0YGPositionTypeAbsolute,
} ABI19_0_0YG_ENUM_END(ABI19_0_0YGPositionType);
WIN_EXPORT const char *ABI19_0_0YGPositionTypeToString(const ABI19_0_0YGPositionType value);

#define ABI19_0_0YGPrintOptionsCount 3
typedef ABI19_0_0YG_ENUM_BEGIN(ABI19_0_0YGPrintOptions) {
  ABI19_0_0YGPrintOptionsLayout = 1,
  ABI19_0_0YGPrintOptionsStyle = 2,
  ABI19_0_0YGPrintOptionsChildren = 4,
} ABI19_0_0YG_ENUM_END(ABI19_0_0YGPrintOptions);
WIN_EXPORT const char *ABI19_0_0YGPrintOptionsToString(const ABI19_0_0YGPrintOptions value);

#define ABI19_0_0YGUnitCount 4
typedef ABI19_0_0YG_ENUM_BEGIN(ABI19_0_0YGUnit) {
  ABI19_0_0YGUnitUndefined,
  ABI19_0_0YGUnitPoint,
  ABI19_0_0YGUnitPercent,
  ABI19_0_0YGUnitAuto,
} ABI19_0_0YG_ENUM_END(ABI19_0_0YGUnit);
WIN_EXPORT const char *ABI19_0_0YGUnitToString(const ABI19_0_0YGUnit value);

#define ABI19_0_0YGWrapCount 3
typedef ABI19_0_0YG_ENUM_BEGIN(ABI19_0_0YGWrap) {
  ABI19_0_0YGWrapNoWrap,
  ABI19_0_0YGWrapWrap,
  ABI19_0_0YGWrapWrapReverse,
} ABI19_0_0YG_ENUM_END(ABI19_0_0YGWrap);
WIN_EXPORT const char *ABI19_0_0YGWrapToString(const ABI19_0_0YGWrap value);

ABI19_0_0YG_EXTERN_C_END
