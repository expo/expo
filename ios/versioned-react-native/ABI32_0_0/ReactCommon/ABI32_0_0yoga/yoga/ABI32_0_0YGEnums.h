/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI32_0_0YGMacros.h"

ABI32_0_0YG_EXTERN_C_BEGIN

#define ABI32_0_0YGAlignCount 8
typedef ABI32_0_0YG_ENUM_BEGIN(ABI32_0_0YGAlign) {
  ABI32_0_0YGAlignAuto,
  ABI32_0_0YGAlignFlexStart,
  ABI32_0_0YGAlignCenter,
  ABI32_0_0YGAlignFlexEnd,
  ABI32_0_0YGAlignStretch,
  ABI32_0_0YGAlignBaseline,
  ABI32_0_0YGAlignSpaceBetween,
  ABI32_0_0YGAlignSpaceAround,
} ABI32_0_0YG_ENUM_END(ABI32_0_0YGAlign);
WIN_EXPORT const char *ABI32_0_0YGAlignToString(const ABI32_0_0YGAlign value);

#define ABI32_0_0YGDimensionCount 2
typedef ABI32_0_0YG_ENUM_BEGIN(ABI32_0_0YGDimension) {
  ABI32_0_0YGDimensionWidth,
  ABI32_0_0YGDimensionHeight,
} ABI32_0_0YG_ENUM_END(ABI32_0_0YGDimension);
WIN_EXPORT const char *ABI32_0_0YGDimensionToString(const ABI32_0_0YGDimension value);

#define ABI32_0_0YGDirectionCount 3
typedef ABI32_0_0YG_ENUM_BEGIN(ABI32_0_0YGDirection) {
  ABI32_0_0YGDirectionInherit,
  ABI32_0_0YGDirectionLTR,
  ABI32_0_0YGDirectionRTL,
} ABI32_0_0YG_ENUM_END(ABI32_0_0YGDirection);
WIN_EXPORT const char *ABI32_0_0YGDirectionToString(const ABI32_0_0YGDirection value);

#define ABI32_0_0YGDisplayCount 2
typedef ABI32_0_0YG_ENUM_BEGIN(ABI32_0_0YGDisplay) {
  ABI32_0_0YGDisplayFlex,
  ABI32_0_0YGDisplayNone,
} ABI32_0_0YG_ENUM_END(ABI32_0_0YGDisplay);
WIN_EXPORT const char *ABI32_0_0YGDisplayToString(const ABI32_0_0YGDisplay value);

#define ABI32_0_0YGEdgeCount 9
typedef ABI32_0_0YG_ENUM_BEGIN(ABI32_0_0YGEdge) {
  ABI32_0_0YGEdgeLeft,
  ABI32_0_0YGEdgeTop,
  ABI32_0_0YGEdgeRight,
  ABI32_0_0YGEdgeBottom,
  ABI32_0_0YGEdgeStart,
  ABI32_0_0YGEdgeEnd,
  ABI32_0_0YGEdgeHorizontal,
  ABI32_0_0YGEdgeVertical,
  ABI32_0_0YGEdgeAll,
} ABI32_0_0YG_ENUM_END(ABI32_0_0YGEdge);
WIN_EXPORT const char *ABI32_0_0YGEdgeToString(const ABI32_0_0YGEdge value);

#define ABI32_0_0YGExperimentalFeatureCount 1
typedef ABI32_0_0YG_ENUM_BEGIN(ABI32_0_0YGExperimentalFeature) {
  ABI32_0_0YGExperimentalFeatureWebFlexBasis,
} ABI32_0_0YG_ENUM_END(ABI32_0_0YGExperimentalFeature);
WIN_EXPORT const char *ABI32_0_0YGExperimentalFeatureToString(const ABI32_0_0YGExperimentalFeature value);

#define ABI32_0_0YGFlexDirectionCount 4
typedef ABI32_0_0YG_ENUM_BEGIN(ABI32_0_0YGFlexDirection) {
  ABI32_0_0YGFlexDirectionColumn,
  ABI32_0_0YGFlexDirectionColumnReverse,
  ABI32_0_0YGFlexDirectionRow,
  ABI32_0_0YGFlexDirectionRowReverse,
} ABI32_0_0YG_ENUM_END(ABI32_0_0YGFlexDirection);
WIN_EXPORT const char *ABI32_0_0YGFlexDirectionToString(const ABI32_0_0YGFlexDirection value);

#define ABI32_0_0YGJustifyCount 6
typedef ABI32_0_0YG_ENUM_BEGIN(ABI32_0_0YGJustify){
    ABI32_0_0YGJustifyFlexStart,
    ABI32_0_0YGJustifyCenter,
    ABI32_0_0YGJustifyFlexEnd,
    ABI32_0_0YGJustifySpaceBetween,
    ABI32_0_0YGJustifySpaceAround,
    ABI32_0_0YGJustifySpaceEvenly,
} ABI32_0_0YG_ENUM_END(ABI32_0_0YGJustify);
WIN_EXPORT const char *ABI32_0_0YGJustifyToString(const ABI32_0_0YGJustify value);

#define ABI32_0_0YGLogLevelCount 6
typedef ABI32_0_0YG_ENUM_BEGIN(ABI32_0_0YGLogLevel) {
  ABI32_0_0YGLogLevelError,
  ABI32_0_0YGLogLevelWarn,
  ABI32_0_0YGLogLevelInfo,
  ABI32_0_0YGLogLevelDebug,
  ABI32_0_0YGLogLevelVerbose,
  ABI32_0_0YGLogLevelFatal,
} ABI32_0_0YG_ENUM_END(ABI32_0_0YGLogLevel);
WIN_EXPORT const char *ABI32_0_0YGLogLevelToString(const ABI32_0_0YGLogLevel value);

#define ABI32_0_0YGMeasureModeCount 3
typedef ABI32_0_0YG_ENUM_BEGIN(ABI32_0_0YGMeasureMode) {
  ABI32_0_0YGMeasureModeUndefined,
  ABI32_0_0YGMeasureModeExactly,
  ABI32_0_0YGMeasureModeAtMost,
} ABI32_0_0YG_ENUM_END(ABI32_0_0YGMeasureMode);
WIN_EXPORT const char *ABI32_0_0YGMeasureModeToString(const ABI32_0_0YGMeasureMode value);

#define ABI32_0_0YGNodeTypeCount 2
typedef ABI32_0_0YG_ENUM_BEGIN(ABI32_0_0YGNodeType) {
  ABI32_0_0YGNodeTypeDefault,
  ABI32_0_0YGNodeTypeText,
} ABI32_0_0YG_ENUM_END(ABI32_0_0YGNodeType);
WIN_EXPORT const char *ABI32_0_0YGNodeTypeToString(const ABI32_0_0YGNodeType value);

#define ABI32_0_0YGOverflowCount 3
typedef ABI32_0_0YG_ENUM_BEGIN(ABI32_0_0YGOverflow) {
  ABI32_0_0YGOverflowVisible,
  ABI32_0_0YGOverflowHidden,
  ABI32_0_0YGOverflowScroll,
} ABI32_0_0YG_ENUM_END(ABI32_0_0YGOverflow);
WIN_EXPORT const char *ABI32_0_0YGOverflowToString(const ABI32_0_0YGOverflow value);

#define ABI32_0_0YGPositionTypeCount 2
typedef ABI32_0_0YG_ENUM_BEGIN(ABI32_0_0YGPositionType) {
  ABI32_0_0YGPositionTypeRelative,
  ABI32_0_0YGPositionTypeAbsolute,
} ABI32_0_0YG_ENUM_END(ABI32_0_0YGPositionType);
WIN_EXPORT const char *ABI32_0_0YGPositionTypeToString(const ABI32_0_0YGPositionType value);

#define ABI32_0_0YGPrintOptionsCount 3
typedef ABI32_0_0YG_ENUM_BEGIN(ABI32_0_0YGPrintOptions) {
  ABI32_0_0YGPrintOptionsLayout = 1,
  ABI32_0_0YGPrintOptionsStyle = 2,
  ABI32_0_0YGPrintOptionsChildren = 4,
} ABI32_0_0YG_ENUM_END(ABI32_0_0YGPrintOptions);
WIN_EXPORT const char *ABI32_0_0YGPrintOptionsToString(const ABI32_0_0YGPrintOptions value);

#define ABI32_0_0YGUnitCount 4
typedef ABI32_0_0YG_ENUM_BEGIN(ABI32_0_0YGUnit) {
  ABI32_0_0YGUnitUndefined,
  ABI32_0_0YGUnitPoint,
  ABI32_0_0YGUnitPercent,
  ABI32_0_0YGUnitAuto,
} ABI32_0_0YG_ENUM_END(ABI32_0_0YGUnit);
WIN_EXPORT const char *ABI32_0_0YGUnitToString(const ABI32_0_0YGUnit value);

#define ABI32_0_0YGWrapCount 3
typedef ABI32_0_0YG_ENUM_BEGIN(ABI32_0_0YGWrap) {
  ABI32_0_0YGWrapNoWrap,
  ABI32_0_0YGWrapWrap,
  ABI32_0_0YGWrapWrapReverse,
} ABI32_0_0YG_ENUM_END(ABI32_0_0YGWrap);
WIN_EXPORT const char *ABI32_0_0YGWrapToString(const ABI32_0_0YGWrap value);

ABI32_0_0YG_EXTERN_C_END
