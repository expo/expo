/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "ABI26_0_0YGMacros.h"

ABI26_0_0YG_EXTERN_C_BEGIN

#define ABI26_0_0YGAlignCount 8
typedef ABI26_0_0YG_ENUM_BEGIN(ABI26_0_0YGAlign) {
  ABI26_0_0YGAlignAuto,
  ABI26_0_0YGAlignFlexStart,
  ABI26_0_0YGAlignCenter,
  ABI26_0_0YGAlignFlexEnd,
  ABI26_0_0YGAlignStretch,
  ABI26_0_0YGAlignBaseline,
  ABI26_0_0YGAlignSpaceBetween,
  ABI26_0_0YGAlignSpaceAround,
} ABI26_0_0YG_ENUM_END(ABI26_0_0YGAlign);
WIN_EXPORT const char *ABI26_0_0YGAlignToString(const ABI26_0_0YGAlign value);

#define ABI26_0_0YGDimensionCount 2
typedef ABI26_0_0YG_ENUM_BEGIN(ABI26_0_0YGDimension) {
  ABI26_0_0YGDimensionWidth,
  ABI26_0_0YGDimensionHeight,
} ABI26_0_0YG_ENUM_END(ABI26_0_0YGDimension);
WIN_EXPORT const char *ABI26_0_0YGDimensionToString(const ABI26_0_0YGDimension value);

#define ABI26_0_0YGDirectionCount 3
typedef ABI26_0_0YG_ENUM_BEGIN(ABI26_0_0YGDirection) {
  ABI26_0_0YGDirectionInherit,
  ABI26_0_0YGDirectionLTR,
  ABI26_0_0YGDirectionRTL,
} ABI26_0_0YG_ENUM_END(ABI26_0_0YGDirection);
WIN_EXPORT const char *ABI26_0_0YGDirectionToString(const ABI26_0_0YGDirection value);

#define ABI26_0_0YGDisplayCount 2
typedef ABI26_0_0YG_ENUM_BEGIN(ABI26_0_0YGDisplay) {
  ABI26_0_0YGDisplayFlex,
  ABI26_0_0YGDisplayNone,
} ABI26_0_0YG_ENUM_END(ABI26_0_0YGDisplay);
WIN_EXPORT const char *ABI26_0_0YGDisplayToString(const ABI26_0_0YGDisplay value);

#define ABI26_0_0YGEdgeCount 9
typedef ABI26_0_0YG_ENUM_BEGIN(ABI26_0_0YGEdge) {
  ABI26_0_0YGEdgeLeft,
  ABI26_0_0YGEdgeTop,
  ABI26_0_0YGEdgeRight,
  ABI26_0_0YGEdgeBottom,
  ABI26_0_0YGEdgeStart,
  ABI26_0_0YGEdgeEnd,
  ABI26_0_0YGEdgeHorizontal,
  ABI26_0_0YGEdgeVertical,
  ABI26_0_0YGEdgeAll,
} ABI26_0_0YG_ENUM_END(ABI26_0_0YGEdge);
WIN_EXPORT const char *ABI26_0_0YGEdgeToString(const ABI26_0_0YGEdge value);

#define ABI26_0_0YGExperimentalFeatureCount 1
typedef ABI26_0_0YG_ENUM_BEGIN(ABI26_0_0YGExperimentalFeature) {
  ABI26_0_0YGExperimentalFeatureWebFlexBasis,
} ABI26_0_0YG_ENUM_END(ABI26_0_0YGExperimentalFeature);
WIN_EXPORT const char *ABI26_0_0YGExperimentalFeatureToString(const ABI26_0_0YGExperimentalFeature value);

#define ABI26_0_0YGFlexDirectionCount 4
typedef ABI26_0_0YG_ENUM_BEGIN(ABI26_0_0YGFlexDirection) {
  ABI26_0_0YGFlexDirectionColumn,
  ABI26_0_0YGFlexDirectionColumnReverse,
  ABI26_0_0YGFlexDirectionRow,
  ABI26_0_0YGFlexDirectionRowReverse,
} ABI26_0_0YG_ENUM_END(ABI26_0_0YGFlexDirection);
WIN_EXPORT const char *ABI26_0_0YGFlexDirectionToString(const ABI26_0_0YGFlexDirection value);

#define ABI26_0_0YGJustifyCount 6
typedef ABI26_0_0YG_ENUM_BEGIN(ABI26_0_0YGJustify){
    ABI26_0_0YGJustifyFlexStart,
    ABI26_0_0YGJustifyCenter,
    ABI26_0_0YGJustifyFlexEnd,
    ABI26_0_0YGJustifySpaceBetween,
    ABI26_0_0YGJustifySpaceAround,
    ABI26_0_0YGJustifySpaceEvenly,
} ABI26_0_0YG_ENUM_END(ABI26_0_0YGJustify);
WIN_EXPORT const char *ABI26_0_0YGJustifyToString(const ABI26_0_0YGJustify value);

#define ABI26_0_0YGLogLevelCount 6
typedef ABI26_0_0YG_ENUM_BEGIN(ABI26_0_0YGLogLevel) {
  ABI26_0_0YGLogLevelError,
  ABI26_0_0YGLogLevelWarn,
  ABI26_0_0YGLogLevelInfo,
  ABI26_0_0YGLogLevelDebug,
  ABI26_0_0YGLogLevelVerbose,
  ABI26_0_0YGLogLevelFatal,
} ABI26_0_0YG_ENUM_END(ABI26_0_0YGLogLevel);
WIN_EXPORT const char *ABI26_0_0YGLogLevelToString(const ABI26_0_0YGLogLevel value);

#define ABI26_0_0YGMeasureModeCount 3
typedef ABI26_0_0YG_ENUM_BEGIN(ABI26_0_0YGMeasureMode) {
  ABI26_0_0YGMeasureModeUndefined,
  ABI26_0_0YGMeasureModeExactly,
  ABI26_0_0YGMeasureModeAtMost,
} ABI26_0_0YG_ENUM_END(ABI26_0_0YGMeasureMode);
WIN_EXPORT const char *ABI26_0_0YGMeasureModeToString(const ABI26_0_0YGMeasureMode value);

#define ABI26_0_0YGNodeTypeCount 2
typedef ABI26_0_0YG_ENUM_BEGIN(ABI26_0_0YGNodeType) {
  ABI26_0_0YGNodeTypeDefault,
  ABI26_0_0YGNodeTypeText,
} ABI26_0_0YG_ENUM_END(ABI26_0_0YGNodeType);
WIN_EXPORT const char *ABI26_0_0YGNodeTypeToString(const ABI26_0_0YGNodeType value);

#define ABI26_0_0YGOverflowCount 3
typedef ABI26_0_0YG_ENUM_BEGIN(ABI26_0_0YGOverflow) {
  ABI26_0_0YGOverflowVisible,
  ABI26_0_0YGOverflowHidden,
  ABI26_0_0YGOverflowScroll,
} ABI26_0_0YG_ENUM_END(ABI26_0_0YGOverflow);
WIN_EXPORT const char *ABI26_0_0YGOverflowToString(const ABI26_0_0YGOverflow value);

#define ABI26_0_0YGPositionTypeCount 2
typedef ABI26_0_0YG_ENUM_BEGIN(ABI26_0_0YGPositionType) {
  ABI26_0_0YGPositionTypeRelative,
  ABI26_0_0YGPositionTypeAbsolute,
} ABI26_0_0YG_ENUM_END(ABI26_0_0YGPositionType);
WIN_EXPORT const char *ABI26_0_0YGPositionTypeToString(const ABI26_0_0YGPositionType value);

#define ABI26_0_0YGPrintOptionsCount 3
typedef ABI26_0_0YG_ENUM_BEGIN(ABI26_0_0YGPrintOptions) {
  ABI26_0_0YGPrintOptionsLayout = 1,
  ABI26_0_0YGPrintOptionsStyle = 2,
  ABI26_0_0YGPrintOptionsChildren = 4,
} ABI26_0_0YG_ENUM_END(ABI26_0_0YGPrintOptions);
WIN_EXPORT const char *ABI26_0_0YGPrintOptionsToString(const ABI26_0_0YGPrintOptions value);

#define ABI26_0_0YGUnitCount 4
typedef ABI26_0_0YG_ENUM_BEGIN(ABI26_0_0YGUnit) {
  ABI26_0_0YGUnitUndefined,
  ABI26_0_0YGUnitPoint,
  ABI26_0_0YGUnitPercent,
  ABI26_0_0YGUnitAuto,
} ABI26_0_0YG_ENUM_END(ABI26_0_0YGUnit);
WIN_EXPORT const char *ABI26_0_0YGUnitToString(const ABI26_0_0YGUnit value);

#define ABI26_0_0YGWrapCount 3
typedef ABI26_0_0YG_ENUM_BEGIN(ABI26_0_0YGWrap) {
  ABI26_0_0YGWrapNoWrap,
  ABI26_0_0YGWrapWrap,
  ABI26_0_0YGWrapWrapReverse,
} ABI26_0_0YG_ENUM_END(ABI26_0_0YGWrap);
WIN_EXPORT const char *ABI26_0_0YGWrapToString(const ABI26_0_0YGWrap value);

ABI26_0_0YG_EXTERN_C_END
