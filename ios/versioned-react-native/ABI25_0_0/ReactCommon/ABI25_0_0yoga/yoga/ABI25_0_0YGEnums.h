/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#include "ABI25_0_0YGMacros.h"

ABI25_0_0YG_EXTERN_C_BEGIN

#define ABI25_0_0YGAlignCount 8
typedef ABI25_0_0YG_ENUM_BEGIN(ABI25_0_0YGAlign) {
  ABI25_0_0YGAlignAuto,
  ABI25_0_0YGAlignFlexStart,
  ABI25_0_0YGAlignCenter,
  ABI25_0_0YGAlignFlexEnd,
  ABI25_0_0YGAlignStretch,
  ABI25_0_0YGAlignBaseline,
  ABI25_0_0YGAlignSpaceBetween,
  ABI25_0_0YGAlignSpaceAround,
} ABI25_0_0YG_ENUM_END(ABI25_0_0YGAlign);
WIN_EXPORT const char *ABI25_0_0YGAlignToString(const ABI25_0_0YGAlign value);

#define ABI25_0_0YGDimensionCount 2
typedef ABI25_0_0YG_ENUM_BEGIN(ABI25_0_0YGDimension) {
  ABI25_0_0YGDimensionWidth,
  ABI25_0_0YGDimensionHeight,
} ABI25_0_0YG_ENUM_END(ABI25_0_0YGDimension);
WIN_EXPORT const char *ABI25_0_0YGDimensionToString(const ABI25_0_0YGDimension value);

#define ABI25_0_0YGDirectionCount 3
typedef ABI25_0_0YG_ENUM_BEGIN(ABI25_0_0YGDirection) {
  ABI25_0_0YGDirectionInherit,
  ABI25_0_0YGDirectionLTR,
  ABI25_0_0YGDirectionRTL,
} ABI25_0_0YG_ENUM_END(ABI25_0_0YGDirection);
WIN_EXPORT const char *ABI25_0_0YGDirectionToString(const ABI25_0_0YGDirection value);

#define ABI25_0_0YGDisplayCount 2
typedef ABI25_0_0YG_ENUM_BEGIN(ABI25_0_0YGDisplay) {
  ABI25_0_0YGDisplayFlex,
  ABI25_0_0YGDisplayNone,
} ABI25_0_0YG_ENUM_END(ABI25_0_0YGDisplay);
WIN_EXPORT const char *ABI25_0_0YGDisplayToString(const ABI25_0_0YGDisplay value);

#define ABI25_0_0YGEdgeCount 9
typedef ABI25_0_0YG_ENUM_BEGIN(ABI25_0_0YGEdge) {
  ABI25_0_0YGEdgeLeft,
  ABI25_0_0YGEdgeTop,
  ABI25_0_0YGEdgeRight,
  ABI25_0_0YGEdgeBottom,
  ABI25_0_0YGEdgeStart,
  ABI25_0_0YGEdgeEnd,
  ABI25_0_0YGEdgeHorizontal,
  ABI25_0_0YGEdgeVertical,
  ABI25_0_0YGEdgeAll,
} ABI25_0_0YG_ENUM_END(ABI25_0_0YGEdge);
WIN_EXPORT const char *ABI25_0_0YGEdgeToString(const ABI25_0_0YGEdge value);

#define ABI25_0_0YGExperimentalFeatureCount 1
typedef ABI25_0_0YG_ENUM_BEGIN(ABI25_0_0YGExperimentalFeature) {
  ABI25_0_0YGExperimentalFeatureWebFlexBasis,
} ABI25_0_0YG_ENUM_END(ABI25_0_0YGExperimentalFeature);
WIN_EXPORT const char *ABI25_0_0YGExperimentalFeatureToString(const ABI25_0_0YGExperimentalFeature value);

#define ABI25_0_0YGFlexDirectionCount 4
typedef ABI25_0_0YG_ENUM_BEGIN(ABI25_0_0YGFlexDirection) {
  ABI25_0_0YGFlexDirectionColumn,
  ABI25_0_0YGFlexDirectionColumnReverse,
  ABI25_0_0YGFlexDirectionRow,
  ABI25_0_0YGFlexDirectionRowReverse,
} ABI25_0_0YG_ENUM_END(ABI25_0_0YGFlexDirection);
WIN_EXPORT const char *ABI25_0_0YGFlexDirectionToString(const ABI25_0_0YGFlexDirection value);

#define ABI25_0_0YGJustifyCount 6
typedef ABI25_0_0YG_ENUM_BEGIN(ABI25_0_0YGJustify){
    ABI25_0_0YGJustifyFlexStart,
    ABI25_0_0YGJustifyCenter,
    ABI25_0_0YGJustifyFlexEnd,
    ABI25_0_0YGJustifySpaceBetween,
    ABI25_0_0YGJustifySpaceAround,
    ABI25_0_0YGJustifySpaceEvenly,
} ABI25_0_0YG_ENUM_END(ABI25_0_0YGJustify);
WIN_EXPORT const char *ABI25_0_0YGJustifyToString(const ABI25_0_0YGJustify value);

#define ABI25_0_0YGLogLevelCount 6
typedef ABI25_0_0YG_ENUM_BEGIN(ABI25_0_0YGLogLevel) {
  ABI25_0_0YGLogLevelError,
  ABI25_0_0YGLogLevelWarn,
  ABI25_0_0YGLogLevelInfo,
  ABI25_0_0YGLogLevelDebug,
  ABI25_0_0YGLogLevelVerbose,
  ABI25_0_0YGLogLevelFatal,
} ABI25_0_0YG_ENUM_END(ABI25_0_0YGLogLevel);
WIN_EXPORT const char *ABI25_0_0YGLogLevelToString(const ABI25_0_0YGLogLevel value);

#define ABI25_0_0YGMeasureModeCount 3
typedef ABI25_0_0YG_ENUM_BEGIN(ABI25_0_0YGMeasureMode) {
  ABI25_0_0YGMeasureModeUndefined,
  ABI25_0_0YGMeasureModeExactly,
  ABI25_0_0YGMeasureModeAtMost,
} ABI25_0_0YG_ENUM_END(ABI25_0_0YGMeasureMode);
WIN_EXPORT const char *ABI25_0_0YGMeasureModeToString(const ABI25_0_0YGMeasureMode value);

#define ABI25_0_0YGNodeTypeCount 2
typedef ABI25_0_0YG_ENUM_BEGIN(ABI25_0_0YGNodeType) {
  ABI25_0_0YGNodeTypeDefault,
  ABI25_0_0YGNodeTypeText,
} ABI25_0_0YG_ENUM_END(ABI25_0_0YGNodeType);
WIN_EXPORT const char *ABI25_0_0YGNodeTypeToString(const ABI25_0_0YGNodeType value);

#define ABI25_0_0YGOverflowCount 3
typedef ABI25_0_0YG_ENUM_BEGIN(ABI25_0_0YGOverflow) {
  ABI25_0_0YGOverflowVisible,
  ABI25_0_0YGOverflowHidden,
  ABI25_0_0YGOverflowScroll,
} ABI25_0_0YG_ENUM_END(ABI25_0_0YGOverflow);
WIN_EXPORT const char *ABI25_0_0YGOverflowToString(const ABI25_0_0YGOverflow value);

#define ABI25_0_0YGPositionTypeCount 2
typedef ABI25_0_0YG_ENUM_BEGIN(ABI25_0_0YGPositionType) {
  ABI25_0_0YGPositionTypeRelative,
  ABI25_0_0YGPositionTypeAbsolute,
} ABI25_0_0YG_ENUM_END(ABI25_0_0YGPositionType);
WIN_EXPORT const char *ABI25_0_0YGPositionTypeToString(const ABI25_0_0YGPositionType value);

#define ABI25_0_0YGPrintOptionsCount 3
typedef ABI25_0_0YG_ENUM_BEGIN(ABI25_0_0YGPrintOptions) {
  ABI25_0_0YGPrintOptionsLayout = 1,
  ABI25_0_0YGPrintOptionsStyle = 2,
  ABI25_0_0YGPrintOptionsChildren = 4,
} ABI25_0_0YG_ENUM_END(ABI25_0_0YGPrintOptions);
WIN_EXPORT const char *ABI25_0_0YGPrintOptionsToString(const ABI25_0_0YGPrintOptions value);

#define ABI25_0_0YGUnitCount 4
typedef ABI25_0_0YG_ENUM_BEGIN(ABI25_0_0YGUnit) {
  ABI25_0_0YGUnitUndefined,
  ABI25_0_0YGUnitPoint,
  ABI25_0_0YGUnitPercent,
  ABI25_0_0YGUnitAuto,
} ABI25_0_0YG_ENUM_END(ABI25_0_0YGUnit);
WIN_EXPORT const char *ABI25_0_0YGUnitToString(const ABI25_0_0YGUnit value);

#define ABI25_0_0YGWrapCount 3
typedef ABI25_0_0YG_ENUM_BEGIN(ABI25_0_0YGWrap) {
  ABI25_0_0YGWrapNoWrap,
  ABI25_0_0YGWrapWrap,
  ABI25_0_0YGWrapWrapReverse,
} ABI25_0_0YG_ENUM_END(ABI25_0_0YGWrap);
WIN_EXPORT const char *ABI25_0_0YGWrapToString(const ABI25_0_0YGWrap value);

ABI25_0_0YG_EXTERN_C_END
