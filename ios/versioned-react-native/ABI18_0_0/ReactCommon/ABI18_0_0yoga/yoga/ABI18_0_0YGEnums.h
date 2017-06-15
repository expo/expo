/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "ABI18_0_0YGMacros.h"

ABI18_0_0YG_EXTERN_C_BEGIN

#define ABI18_0_0YGAlignCount 8
typedef ABI18_0_0YG_ENUM_BEGIN(ABI18_0_0YGAlign) {
  ABI18_0_0YGAlignAuto,
  ABI18_0_0YGAlignFlexStart,
  ABI18_0_0YGAlignCenter,
  ABI18_0_0YGAlignFlexEnd,
  ABI18_0_0YGAlignStretch,
  ABI18_0_0YGAlignBaseline,
  ABI18_0_0YGAlignSpaceBetween,
  ABI18_0_0YGAlignSpaceAround,
} ABI18_0_0YG_ENUM_END(ABI18_0_0YGAlign);
WIN_EXPORT const char *ABI18_0_0YGAlignToString(const ABI18_0_0YGAlign value);

#define ABI18_0_0YGDimensionCount 2
typedef ABI18_0_0YG_ENUM_BEGIN(ABI18_0_0YGDimension) {
  ABI18_0_0YGDimensionWidth,
  ABI18_0_0YGDimensionHeight,
} ABI18_0_0YG_ENUM_END(ABI18_0_0YGDimension);
WIN_EXPORT const char *ABI18_0_0YGDimensionToString(const ABI18_0_0YGDimension value);

#define ABI18_0_0YGDirectionCount 3
typedef ABI18_0_0YG_ENUM_BEGIN(ABI18_0_0YGDirection) {
  ABI18_0_0YGDirectionInherit,
  ABI18_0_0YGDirectionLTR,
  ABI18_0_0YGDirectionRTL,
} ABI18_0_0YG_ENUM_END(ABI18_0_0YGDirection);
WIN_EXPORT const char *ABI18_0_0YGDirectionToString(const ABI18_0_0YGDirection value);

#define ABI18_0_0YGDisplayCount 2
typedef ABI18_0_0YG_ENUM_BEGIN(ABI18_0_0YGDisplay) {
  ABI18_0_0YGDisplayFlex,
  ABI18_0_0YGDisplayNone,
} ABI18_0_0YG_ENUM_END(ABI18_0_0YGDisplay);
WIN_EXPORT const char *ABI18_0_0YGDisplayToString(const ABI18_0_0YGDisplay value);

#define ABI18_0_0YGEdgeCount 9
typedef ABI18_0_0YG_ENUM_BEGIN(ABI18_0_0YGEdge) {
  ABI18_0_0YGEdgeLeft,
  ABI18_0_0YGEdgeTop,
  ABI18_0_0YGEdgeRight,
  ABI18_0_0YGEdgeBottom,
  ABI18_0_0YGEdgeStart,
  ABI18_0_0YGEdgeEnd,
  ABI18_0_0YGEdgeHorizontal,
  ABI18_0_0YGEdgeVertical,
  ABI18_0_0YGEdgeAll,
} ABI18_0_0YG_ENUM_END(ABI18_0_0YGEdge);
WIN_EXPORT const char *ABI18_0_0YGEdgeToString(const ABI18_0_0YGEdge value);

#define ABI18_0_0YGExperimentalFeatureCount 1
typedef ABI18_0_0YG_ENUM_BEGIN(ABI18_0_0YGExperimentalFeature) {
  ABI18_0_0YGExperimentalFeatureWebFlexBasis,
} ABI18_0_0YG_ENUM_END(ABI18_0_0YGExperimentalFeature);
WIN_EXPORT const char *ABI18_0_0YGExperimentalFeatureToString(const ABI18_0_0YGExperimentalFeature value);

#define ABI18_0_0YGFlexDirectionCount 4
typedef ABI18_0_0YG_ENUM_BEGIN(ABI18_0_0YGFlexDirection) {
  ABI18_0_0YGFlexDirectionColumn,
  ABI18_0_0YGFlexDirectionColumnReverse,
  ABI18_0_0YGFlexDirectionRow,
  ABI18_0_0YGFlexDirectionRowReverse,
} ABI18_0_0YG_ENUM_END(ABI18_0_0YGFlexDirection);
WIN_EXPORT const char *ABI18_0_0YGFlexDirectionToString(const ABI18_0_0YGFlexDirection value);

#define ABI18_0_0YGJustifyCount 5
typedef ABI18_0_0YG_ENUM_BEGIN(ABI18_0_0YGJustify) {
  ABI18_0_0YGJustifyFlexStart,
  ABI18_0_0YGJustifyCenter,
  ABI18_0_0YGJustifyFlexEnd,
  ABI18_0_0YGJustifySpaceBetween,
  ABI18_0_0YGJustifySpaceAround,
} ABI18_0_0YG_ENUM_END(ABI18_0_0YGJustify);
WIN_EXPORT const char *ABI18_0_0YGJustifyToString(const ABI18_0_0YGJustify value);

#define ABI18_0_0YGLogLevelCount 6
typedef ABI18_0_0YG_ENUM_BEGIN(ABI18_0_0YGLogLevel) {
  ABI18_0_0YGLogLevelError,
  ABI18_0_0YGLogLevelWarn,
  ABI18_0_0YGLogLevelInfo,
  ABI18_0_0YGLogLevelDebug,
  ABI18_0_0YGLogLevelVerbose,
  ABI18_0_0YGLogLevelFatal,
} ABI18_0_0YG_ENUM_END(ABI18_0_0YGLogLevel);
WIN_EXPORT const char *ABI18_0_0YGLogLevelToString(const ABI18_0_0YGLogLevel value);

#define ABI18_0_0YGMeasureModeCount 3
typedef ABI18_0_0YG_ENUM_BEGIN(ABI18_0_0YGMeasureMode) {
  ABI18_0_0YGMeasureModeUndefined,
  ABI18_0_0YGMeasureModeExactly,
  ABI18_0_0YGMeasureModeAtMost,
} ABI18_0_0YG_ENUM_END(ABI18_0_0YGMeasureMode);
WIN_EXPORT const char *ABI18_0_0YGMeasureModeToString(const ABI18_0_0YGMeasureMode value);

#define ABI18_0_0YGOverflowCount 3
typedef ABI18_0_0YG_ENUM_BEGIN(ABI18_0_0YGOverflow) {
  ABI18_0_0YGOverflowVisible,
  ABI18_0_0YGOverflowHidden,
  ABI18_0_0YGOverflowScroll,
} ABI18_0_0YG_ENUM_END(ABI18_0_0YGOverflow);
WIN_EXPORT const char *ABI18_0_0YGOverflowToString(const ABI18_0_0YGOverflow value);

#define ABI18_0_0YGPositionTypeCount 2
typedef ABI18_0_0YG_ENUM_BEGIN(ABI18_0_0YGPositionType) {
  ABI18_0_0YGPositionTypeRelative,
  ABI18_0_0YGPositionTypeAbsolute,
} ABI18_0_0YG_ENUM_END(ABI18_0_0YGPositionType);
WIN_EXPORT const char *ABI18_0_0YGPositionTypeToString(const ABI18_0_0YGPositionType value);

#define ABI18_0_0YGPrintOptionsCount 3
typedef ABI18_0_0YG_ENUM_BEGIN(ABI18_0_0YGPrintOptions) {
  ABI18_0_0YGPrintOptionsLayout = 1,
  ABI18_0_0YGPrintOptionsStyle = 2,
  ABI18_0_0YGPrintOptionsChildren = 4,
} ABI18_0_0YG_ENUM_END(ABI18_0_0YGPrintOptions);
WIN_EXPORT const char *ABI18_0_0YGPrintOptionsToString(const ABI18_0_0YGPrintOptions value);

#define ABI18_0_0YGUnitCount 4
typedef ABI18_0_0YG_ENUM_BEGIN(ABI18_0_0YGUnit) {
  ABI18_0_0YGUnitUndefined,
  ABI18_0_0YGUnitPoint,
  ABI18_0_0YGUnitPercent,
  ABI18_0_0YGUnitAuto,
} ABI18_0_0YG_ENUM_END(ABI18_0_0YGUnit);
WIN_EXPORT const char *ABI18_0_0YGUnitToString(const ABI18_0_0YGUnit value);

#define ABI18_0_0YGWrapCount 3
typedef ABI18_0_0YG_ENUM_BEGIN(ABI18_0_0YGWrap) {
  ABI18_0_0YGWrapNoWrap,
  ABI18_0_0YGWrapWrap,
  ABI18_0_0YGWrapWrapReverse,
} ABI18_0_0YG_ENUM_END(ABI18_0_0YGWrap);
WIN_EXPORT const char *ABI18_0_0YGWrapToString(const ABI18_0_0YGWrap value);

ABI18_0_0YG_EXTERN_C_END
