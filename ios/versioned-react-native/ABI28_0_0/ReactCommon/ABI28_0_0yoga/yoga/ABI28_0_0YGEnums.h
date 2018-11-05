/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI28_0_0YGMacros.h"

ABI28_0_0YG_EXTERN_C_BEGIN

#define ABI28_0_0YGAlignCount 8
typedef ABI28_0_0YG_ENUM_BEGIN(ABI28_0_0YGAlign) {
  ABI28_0_0YGAlignAuto,
  ABI28_0_0YGAlignFlexStart,
  ABI28_0_0YGAlignCenter,
  ABI28_0_0YGAlignFlexEnd,
  ABI28_0_0YGAlignStretch,
  ABI28_0_0YGAlignBaseline,
  ABI28_0_0YGAlignSpaceBetween,
  ABI28_0_0YGAlignSpaceAround,
} ABI28_0_0YG_ENUM_END(ABI28_0_0YGAlign);
WIN_EXPORT const char *ABI28_0_0YGAlignToString(const ABI28_0_0YGAlign value);

#define ABI28_0_0YGDimensionCount 2
typedef ABI28_0_0YG_ENUM_BEGIN(ABI28_0_0YGDimension) {
  ABI28_0_0YGDimensionWidth,
  ABI28_0_0YGDimensionHeight,
} ABI28_0_0YG_ENUM_END(ABI28_0_0YGDimension);
WIN_EXPORT const char *ABI28_0_0YGDimensionToString(const ABI28_0_0YGDimension value);

#define ABI28_0_0YGDirectionCount 3
typedef ABI28_0_0YG_ENUM_BEGIN(ABI28_0_0YGDirection) {
  ABI28_0_0YGDirectionInherit,
  ABI28_0_0YGDirectionLTR,
  ABI28_0_0YGDirectionRTL,
} ABI28_0_0YG_ENUM_END(ABI28_0_0YGDirection);
WIN_EXPORT const char *ABI28_0_0YGDirectionToString(const ABI28_0_0YGDirection value);

#define ABI28_0_0YGDisplayCount 2
typedef ABI28_0_0YG_ENUM_BEGIN(ABI28_0_0YGDisplay) {
  ABI28_0_0YGDisplayFlex,
  ABI28_0_0YGDisplayNone,
} ABI28_0_0YG_ENUM_END(ABI28_0_0YGDisplay);
WIN_EXPORT const char *ABI28_0_0YGDisplayToString(const ABI28_0_0YGDisplay value);

#define ABI28_0_0YGEdgeCount 9
typedef ABI28_0_0YG_ENUM_BEGIN(ABI28_0_0YGEdge) {
  ABI28_0_0YGEdgeLeft,
  ABI28_0_0YGEdgeTop,
  ABI28_0_0YGEdgeRight,
  ABI28_0_0YGEdgeBottom,
  ABI28_0_0YGEdgeStart,
  ABI28_0_0YGEdgeEnd,
  ABI28_0_0YGEdgeHorizontal,
  ABI28_0_0YGEdgeVertical,
  ABI28_0_0YGEdgeAll,
} ABI28_0_0YG_ENUM_END(ABI28_0_0YGEdge);
WIN_EXPORT const char *ABI28_0_0YGEdgeToString(const ABI28_0_0YGEdge value);

#define ABI28_0_0YGExperimentalFeatureCount 1
typedef ABI28_0_0YG_ENUM_BEGIN(ABI28_0_0YGExperimentalFeature) {
  ABI28_0_0YGExperimentalFeatureWebFlexBasis,
} ABI28_0_0YG_ENUM_END(ABI28_0_0YGExperimentalFeature);
WIN_EXPORT const char *ABI28_0_0YGExperimentalFeatureToString(const ABI28_0_0YGExperimentalFeature value);

#define ABI28_0_0YGFlexDirectionCount 4
typedef ABI28_0_0YG_ENUM_BEGIN(ABI28_0_0YGFlexDirection) {
  ABI28_0_0YGFlexDirectionColumn,
  ABI28_0_0YGFlexDirectionColumnReverse,
  ABI28_0_0YGFlexDirectionRow,
  ABI28_0_0YGFlexDirectionRowReverse,
} ABI28_0_0YG_ENUM_END(ABI28_0_0YGFlexDirection);
WIN_EXPORT const char *ABI28_0_0YGFlexDirectionToString(const ABI28_0_0YGFlexDirection value);

#define ABI28_0_0YGJustifyCount 6
typedef ABI28_0_0YG_ENUM_BEGIN(ABI28_0_0YGJustify){
    ABI28_0_0YGJustifyFlexStart,
    ABI28_0_0YGJustifyCenter,
    ABI28_0_0YGJustifyFlexEnd,
    ABI28_0_0YGJustifySpaceBetween,
    ABI28_0_0YGJustifySpaceAround,
    ABI28_0_0YGJustifySpaceEvenly,
} ABI28_0_0YG_ENUM_END(ABI28_0_0YGJustify);
WIN_EXPORT const char *ABI28_0_0YGJustifyToString(const ABI28_0_0YGJustify value);

#define ABI28_0_0YGLogLevelCount 6
typedef ABI28_0_0YG_ENUM_BEGIN(ABI28_0_0YGLogLevel) {
  ABI28_0_0YGLogLevelError,
  ABI28_0_0YGLogLevelWarn,
  ABI28_0_0YGLogLevelInfo,
  ABI28_0_0YGLogLevelDebug,
  ABI28_0_0YGLogLevelVerbose,
  ABI28_0_0YGLogLevelFatal,
} ABI28_0_0YG_ENUM_END(ABI28_0_0YGLogLevel);
WIN_EXPORT const char *ABI28_0_0YGLogLevelToString(const ABI28_0_0YGLogLevel value);

#define ABI28_0_0YGMeasureModeCount 3
typedef ABI28_0_0YG_ENUM_BEGIN(ABI28_0_0YGMeasureMode) {
  ABI28_0_0YGMeasureModeUndefined,
  ABI28_0_0YGMeasureModeExactly,
  ABI28_0_0YGMeasureModeAtMost,
} ABI28_0_0YG_ENUM_END(ABI28_0_0YGMeasureMode);
WIN_EXPORT const char *ABI28_0_0YGMeasureModeToString(const ABI28_0_0YGMeasureMode value);

#define ABI28_0_0YGNodeTypeCount 2
typedef ABI28_0_0YG_ENUM_BEGIN(ABI28_0_0YGNodeType) {
  ABI28_0_0YGNodeTypeDefault,
  ABI28_0_0YGNodeTypeText,
} ABI28_0_0YG_ENUM_END(ABI28_0_0YGNodeType);
WIN_EXPORT const char *ABI28_0_0YGNodeTypeToString(const ABI28_0_0YGNodeType value);

#define ABI28_0_0YGOverflowCount 3
typedef ABI28_0_0YG_ENUM_BEGIN(ABI28_0_0YGOverflow) {
  ABI28_0_0YGOverflowVisible,
  ABI28_0_0YGOverflowHidden,
  ABI28_0_0YGOverflowScroll,
} ABI28_0_0YG_ENUM_END(ABI28_0_0YGOverflow);
WIN_EXPORT const char *ABI28_0_0YGOverflowToString(const ABI28_0_0YGOverflow value);

#define ABI28_0_0YGPositionTypeCount 2
typedef ABI28_0_0YG_ENUM_BEGIN(ABI28_0_0YGPositionType) {
  ABI28_0_0YGPositionTypeRelative,
  ABI28_0_0YGPositionTypeAbsolute,
} ABI28_0_0YG_ENUM_END(ABI28_0_0YGPositionType);
WIN_EXPORT const char *ABI28_0_0YGPositionTypeToString(const ABI28_0_0YGPositionType value);

#define ABI28_0_0YGPrintOptionsCount 3
typedef ABI28_0_0YG_ENUM_BEGIN(ABI28_0_0YGPrintOptions) {
  ABI28_0_0YGPrintOptionsLayout = 1,
  ABI28_0_0YGPrintOptionsStyle = 2,
  ABI28_0_0YGPrintOptionsChildren = 4,
} ABI28_0_0YG_ENUM_END(ABI28_0_0YGPrintOptions);
WIN_EXPORT const char *ABI28_0_0YGPrintOptionsToString(const ABI28_0_0YGPrintOptions value);

#define ABI28_0_0YGUnitCount 4
typedef ABI28_0_0YG_ENUM_BEGIN(ABI28_0_0YGUnit) {
  ABI28_0_0YGUnitUndefined,
  ABI28_0_0YGUnitPoint,
  ABI28_0_0YGUnitPercent,
  ABI28_0_0YGUnitAuto,
} ABI28_0_0YG_ENUM_END(ABI28_0_0YGUnit);
WIN_EXPORT const char *ABI28_0_0YGUnitToString(const ABI28_0_0YGUnit value);

#define ABI28_0_0YGWrapCount 3
typedef ABI28_0_0YG_ENUM_BEGIN(ABI28_0_0YGWrap) {
  ABI28_0_0YGWrapNoWrap,
  ABI28_0_0YGWrapWrap,
  ABI28_0_0YGWrapWrapReverse,
} ABI28_0_0YG_ENUM_END(ABI28_0_0YGWrap);
WIN_EXPORT const char *ABI28_0_0YGWrapToString(const ABI28_0_0YGWrap value);

ABI28_0_0YG_EXTERN_C_END
