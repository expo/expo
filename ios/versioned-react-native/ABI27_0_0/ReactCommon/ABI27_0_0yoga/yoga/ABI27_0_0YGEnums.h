/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI27_0_0YGMacros.h"

ABI27_0_0YG_EXTERN_C_BEGIN

#define ABI27_0_0YGAlignCount 8
typedef ABI27_0_0YG_ENUM_BEGIN(ABI27_0_0YGAlign) {
  ABI27_0_0YGAlignAuto,
  ABI27_0_0YGAlignFlexStart,
  ABI27_0_0YGAlignCenter,
  ABI27_0_0YGAlignFlexEnd,
  ABI27_0_0YGAlignStretch,
  ABI27_0_0YGAlignBaseline,
  ABI27_0_0YGAlignSpaceBetween,
  ABI27_0_0YGAlignSpaceAround,
} ABI27_0_0YG_ENUM_END(ABI27_0_0YGAlign);
WIN_EXPORT const char *ABI27_0_0YGAlignToString(const ABI27_0_0YGAlign value);

#define ABI27_0_0YGDimensionCount 2
typedef ABI27_0_0YG_ENUM_BEGIN(ABI27_0_0YGDimension) {
  ABI27_0_0YGDimensionWidth,
  ABI27_0_0YGDimensionHeight,
} ABI27_0_0YG_ENUM_END(ABI27_0_0YGDimension);
WIN_EXPORT const char *ABI27_0_0YGDimensionToString(const ABI27_0_0YGDimension value);

#define ABI27_0_0YGDirectionCount 3
typedef ABI27_0_0YG_ENUM_BEGIN(ABI27_0_0YGDirection) {
  ABI27_0_0YGDirectionInherit,
  ABI27_0_0YGDirectionLTR,
  ABI27_0_0YGDirectionRTL,
} ABI27_0_0YG_ENUM_END(ABI27_0_0YGDirection);
WIN_EXPORT const char *ABI27_0_0YGDirectionToString(const ABI27_0_0YGDirection value);

#define ABI27_0_0YGDisplayCount 2
typedef ABI27_0_0YG_ENUM_BEGIN(ABI27_0_0YGDisplay) {
  ABI27_0_0YGDisplayFlex,
  ABI27_0_0YGDisplayNone,
} ABI27_0_0YG_ENUM_END(ABI27_0_0YGDisplay);
WIN_EXPORT const char *ABI27_0_0YGDisplayToString(const ABI27_0_0YGDisplay value);

#define ABI27_0_0YGEdgeCount 9
typedef ABI27_0_0YG_ENUM_BEGIN(ABI27_0_0YGEdge) {
  ABI27_0_0YGEdgeLeft,
  ABI27_0_0YGEdgeTop,
  ABI27_0_0YGEdgeRight,
  ABI27_0_0YGEdgeBottom,
  ABI27_0_0YGEdgeStart,
  ABI27_0_0YGEdgeEnd,
  ABI27_0_0YGEdgeHorizontal,
  ABI27_0_0YGEdgeVertical,
  ABI27_0_0YGEdgeAll,
} ABI27_0_0YG_ENUM_END(ABI27_0_0YGEdge);
WIN_EXPORT const char *ABI27_0_0YGEdgeToString(const ABI27_0_0YGEdge value);

#define ABI27_0_0YGExperimentalFeatureCount 1
typedef ABI27_0_0YG_ENUM_BEGIN(ABI27_0_0YGExperimentalFeature) {
  ABI27_0_0YGExperimentalFeatureWebFlexBasis,
} ABI27_0_0YG_ENUM_END(ABI27_0_0YGExperimentalFeature);
WIN_EXPORT const char *ABI27_0_0YGExperimentalFeatureToString(const ABI27_0_0YGExperimentalFeature value);

#define ABI27_0_0YGFlexDirectionCount 4
typedef ABI27_0_0YG_ENUM_BEGIN(ABI27_0_0YGFlexDirection) {
  ABI27_0_0YGFlexDirectionColumn,
  ABI27_0_0YGFlexDirectionColumnReverse,
  ABI27_0_0YGFlexDirectionRow,
  ABI27_0_0YGFlexDirectionRowReverse,
} ABI27_0_0YG_ENUM_END(ABI27_0_0YGFlexDirection);
WIN_EXPORT const char *ABI27_0_0YGFlexDirectionToString(const ABI27_0_0YGFlexDirection value);

#define ABI27_0_0YGJustifyCount 6
typedef ABI27_0_0YG_ENUM_BEGIN(ABI27_0_0YGJustify){
    ABI27_0_0YGJustifyFlexStart,
    ABI27_0_0YGJustifyCenter,
    ABI27_0_0YGJustifyFlexEnd,
    ABI27_0_0YGJustifySpaceBetween,
    ABI27_0_0YGJustifySpaceAround,
    ABI27_0_0YGJustifySpaceEvenly,
} ABI27_0_0YG_ENUM_END(ABI27_0_0YGJustify);
WIN_EXPORT const char *ABI27_0_0YGJustifyToString(const ABI27_0_0YGJustify value);

#define ABI27_0_0YGLogLevelCount 6
typedef ABI27_0_0YG_ENUM_BEGIN(ABI27_0_0YGLogLevel) {
  ABI27_0_0YGLogLevelError,
  ABI27_0_0YGLogLevelWarn,
  ABI27_0_0YGLogLevelInfo,
  ABI27_0_0YGLogLevelDebug,
  ABI27_0_0YGLogLevelVerbose,
  ABI27_0_0YGLogLevelFatal,
} ABI27_0_0YG_ENUM_END(ABI27_0_0YGLogLevel);
WIN_EXPORT const char *ABI27_0_0YGLogLevelToString(const ABI27_0_0YGLogLevel value);

#define ABI27_0_0YGMeasureModeCount 3
typedef ABI27_0_0YG_ENUM_BEGIN(ABI27_0_0YGMeasureMode) {
  ABI27_0_0YGMeasureModeUndefined,
  ABI27_0_0YGMeasureModeExactly,
  ABI27_0_0YGMeasureModeAtMost,
} ABI27_0_0YG_ENUM_END(ABI27_0_0YGMeasureMode);
WIN_EXPORT const char *ABI27_0_0YGMeasureModeToString(const ABI27_0_0YGMeasureMode value);

#define ABI27_0_0YGNodeTypeCount 2
typedef ABI27_0_0YG_ENUM_BEGIN(ABI27_0_0YGNodeType) {
  ABI27_0_0YGNodeTypeDefault,
  ABI27_0_0YGNodeTypeText,
} ABI27_0_0YG_ENUM_END(ABI27_0_0YGNodeType);
WIN_EXPORT const char *ABI27_0_0YGNodeTypeToString(const ABI27_0_0YGNodeType value);

#define ABI27_0_0YGOverflowCount 3
typedef ABI27_0_0YG_ENUM_BEGIN(ABI27_0_0YGOverflow) {
  ABI27_0_0YGOverflowVisible,
  ABI27_0_0YGOverflowHidden,
  ABI27_0_0YGOverflowScroll,
} ABI27_0_0YG_ENUM_END(ABI27_0_0YGOverflow);
WIN_EXPORT const char *ABI27_0_0YGOverflowToString(const ABI27_0_0YGOverflow value);

#define ABI27_0_0YGPositionTypeCount 2
typedef ABI27_0_0YG_ENUM_BEGIN(ABI27_0_0YGPositionType) {
  ABI27_0_0YGPositionTypeRelative,
  ABI27_0_0YGPositionTypeAbsolute,
} ABI27_0_0YG_ENUM_END(ABI27_0_0YGPositionType);
WIN_EXPORT const char *ABI27_0_0YGPositionTypeToString(const ABI27_0_0YGPositionType value);

#define ABI27_0_0YGPrintOptionsCount 3
typedef ABI27_0_0YG_ENUM_BEGIN(ABI27_0_0YGPrintOptions) {
  ABI27_0_0YGPrintOptionsLayout = 1,
  ABI27_0_0YGPrintOptionsStyle = 2,
  ABI27_0_0YGPrintOptionsChildren = 4,
} ABI27_0_0YG_ENUM_END(ABI27_0_0YGPrintOptions);
WIN_EXPORT const char *ABI27_0_0YGPrintOptionsToString(const ABI27_0_0YGPrintOptions value);

#define ABI27_0_0YGUnitCount 4
typedef ABI27_0_0YG_ENUM_BEGIN(ABI27_0_0YGUnit) {
  ABI27_0_0YGUnitUndefined,
  ABI27_0_0YGUnitPoint,
  ABI27_0_0YGUnitPercent,
  ABI27_0_0YGUnitAuto,
} ABI27_0_0YG_ENUM_END(ABI27_0_0YGUnit);
WIN_EXPORT const char *ABI27_0_0YGUnitToString(const ABI27_0_0YGUnit value);

#define ABI27_0_0YGWrapCount 3
typedef ABI27_0_0YG_ENUM_BEGIN(ABI27_0_0YGWrap) {
  ABI27_0_0YGWrapNoWrap,
  ABI27_0_0YGWrapWrap,
  ABI27_0_0YGWrapWrapReverse,
} ABI27_0_0YG_ENUM_END(ABI27_0_0YGWrap);
WIN_EXPORT const char *ABI27_0_0YGWrapToString(const ABI27_0_0YGWrap value);

ABI27_0_0YG_EXTERN_C_END
