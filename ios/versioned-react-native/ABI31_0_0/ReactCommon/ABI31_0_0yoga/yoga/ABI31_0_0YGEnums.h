/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI31_0_0YGMacros.h"

ABI31_0_0YG_EXTERN_C_BEGIN

#define ABI31_0_0YGAlignCount 8
typedef ABI31_0_0YG_ENUM_BEGIN(ABI31_0_0YGAlign) {
  ABI31_0_0YGAlignAuto,
  ABI31_0_0YGAlignFlexStart,
  ABI31_0_0YGAlignCenter,
  ABI31_0_0YGAlignFlexEnd,
  ABI31_0_0YGAlignStretch,
  ABI31_0_0YGAlignBaseline,
  ABI31_0_0YGAlignSpaceBetween,
  ABI31_0_0YGAlignSpaceAround,
} ABI31_0_0YG_ENUM_END(ABI31_0_0YGAlign);
WIN_EXPORT const char *ABI31_0_0YGAlignToString(const ABI31_0_0YGAlign value);

#define ABI31_0_0YGDimensionCount 2
typedef ABI31_0_0YG_ENUM_BEGIN(ABI31_0_0YGDimension) {
  ABI31_0_0YGDimensionWidth,
  ABI31_0_0YGDimensionHeight,
} ABI31_0_0YG_ENUM_END(ABI31_0_0YGDimension);
WIN_EXPORT const char *ABI31_0_0YGDimensionToString(const ABI31_0_0YGDimension value);

#define ABI31_0_0YGDirectionCount 3
typedef ABI31_0_0YG_ENUM_BEGIN(ABI31_0_0YGDirection) {
  ABI31_0_0YGDirectionInherit,
  ABI31_0_0YGDirectionLTR,
  ABI31_0_0YGDirectionRTL,
} ABI31_0_0YG_ENUM_END(ABI31_0_0YGDirection);
WIN_EXPORT const char *ABI31_0_0YGDirectionToString(const ABI31_0_0YGDirection value);

#define ABI31_0_0YGDisplayCount 2
typedef ABI31_0_0YG_ENUM_BEGIN(ABI31_0_0YGDisplay) {
  ABI31_0_0YGDisplayFlex,
  ABI31_0_0YGDisplayNone,
} ABI31_0_0YG_ENUM_END(ABI31_0_0YGDisplay);
WIN_EXPORT const char *ABI31_0_0YGDisplayToString(const ABI31_0_0YGDisplay value);

#define ABI31_0_0YGEdgeCount 9
typedef ABI31_0_0YG_ENUM_BEGIN(ABI31_0_0YGEdge) {
  ABI31_0_0YGEdgeLeft,
  ABI31_0_0YGEdgeTop,
  ABI31_0_0YGEdgeRight,
  ABI31_0_0YGEdgeBottom,
  ABI31_0_0YGEdgeStart,
  ABI31_0_0YGEdgeEnd,
  ABI31_0_0YGEdgeHorizontal,
  ABI31_0_0YGEdgeVertical,
  ABI31_0_0YGEdgeAll,
} ABI31_0_0YG_ENUM_END(ABI31_0_0YGEdge);
WIN_EXPORT const char *ABI31_0_0YGEdgeToString(const ABI31_0_0YGEdge value);

#define ABI31_0_0YGExperimentalFeatureCount 1
typedef ABI31_0_0YG_ENUM_BEGIN(ABI31_0_0YGExperimentalFeature) {
  ABI31_0_0YGExperimentalFeatureWebFlexBasis,
} ABI31_0_0YG_ENUM_END(ABI31_0_0YGExperimentalFeature);
WIN_EXPORT const char *ABI31_0_0YGExperimentalFeatureToString(const ABI31_0_0YGExperimentalFeature value);

#define ABI31_0_0YGFlexDirectionCount 4
typedef ABI31_0_0YG_ENUM_BEGIN(ABI31_0_0YGFlexDirection) {
  ABI31_0_0YGFlexDirectionColumn,
  ABI31_0_0YGFlexDirectionColumnReverse,
  ABI31_0_0YGFlexDirectionRow,
  ABI31_0_0YGFlexDirectionRowReverse,
} ABI31_0_0YG_ENUM_END(ABI31_0_0YGFlexDirection);
WIN_EXPORT const char *ABI31_0_0YGFlexDirectionToString(const ABI31_0_0YGFlexDirection value);

#define ABI31_0_0YGJustifyCount 6
typedef ABI31_0_0YG_ENUM_BEGIN(ABI31_0_0YGJustify){
    ABI31_0_0YGJustifyFlexStart,
    ABI31_0_0YGJustifyCenter,
    ABI31_0_0YGJustifyFlexEnd,
    ABI31_0_0YGJustifySpaceBetween,
    ABI31_0_0YGJustifySpaceAround,
    ABI31_0_0YGJustifySpaceEvenly,
} ABI31_0_0YG_ENUM_END(ABI31_0_0YGJustify);
WIN_EXPORT const char *ABI31_0_0YGJustifyToString(const ABI31_0_0YGJustify value);

#define ABI31_0_0YGLogLevelCount 6
typedef ABI31_0_0YG_ENUM_BEGIN(ABI31_0_0YGLogLevel) {
  ABI31_0_0YGLogLevelError,
  ABI31_0_0YGLogLevelWarn,
  ABI31_0_0YGLogLevelInfo,
  ABI31_0_0YGLogLevelDebug,
  ABI31_0_0YGLogLevelVerbose,
  ABI31_0_0YGLogLevelFatal,
} ABI31_0_0YG_ENUM_END(ABI31_0_0YGLogLevel);
WIN_EXPORT const char *ABI31_0_0YGLogLevelToString(const ABI31_0_0YGLogLevel value);

#define ABI31_0_0YGMeasureModeCount 3
typedef ABI31_0_0YG_ENUM_BEGIN(ABI31_0_0YGMeasureMode) {
  ABI31_0_0YGMeasureModeUndefined,
  ABI31_0_0YGMeasureModeExactly,
  ABI31_0_0YGMeasureModeAtMost,
} ABI31_0_0YG_ENUM_END(ABI31_0_0YGMeasureMode);
WIN_EXPORT const char *ABI31_0_0YGMeasureModeToString(const ABI31_0_0YGMeasureMode value);

#define ABI31_0_0YGNodeTypeCount 2
typedef ABI31_0_0YG_ENUM_BEGIN(ABI31_0_0YGNodeType) {
  ABI31_0_0YGNodeTypeDefault,
  ABI31_0_0YGNodeTypeText,
} ABI31_0_0YG_ENUM_END(ABI31_0_0YGNodeType);
WIN_EXPORT const char *ABI31_0_0YGNodeTypeToString(const ABI31_0_0YGNodeType value);

#define ABI31_0_0YGOverflowCount 3
typedef ABI31_0_0YG_ENUM_BEGIN(ABI31_0_0YGOverflow) {
  ABI31_0_0YGOverflowVisible,
  ABI31_0_0YGOverflowHidden,
  ABI31_0_0YGOverflowScroll,
} ABI31_0_0YG_ENUM_END(ABI31_0_0YGOverflow);
WIN_EXPORT const char *ABI31_0_0YGOverflowToString(const ABI31_0_0YGOverflow value);

#define ABI31_0_0YGPositionTypeCount 2
typedef ABI31_0_0YG_ENUM_BEGIN(ABI31_0_0YGPositionType) {
  ABI31_0_0YGPositionTypeRelative,
  ABI31_0_0YGPositionTypeAbsolute,
} ABI31_0_0YG_ENUM_END(ABI31_0_0YGPositionType);
WIN_EXPORT const char *ABI31_0_0YGPositionTypeToString(const ABI31_0_0YGPositionType value);

#define ABI31_0_0YGPrintOptionsCount 3
typedef ABI31_0_0YG_ENUM_BEGIN(ABI31_0_0YGPrintOptions) {
  ABI31_0_0YGPrintOptionsLayout = 1,
  ABI31_0_0YGPrintOptionsStyle = 2,
  ABI31_0_0YGPrintOptionsChildren = 4,
} ABI31_0_0YG_ENUM_END(ABI31_0_0YGPrintOptions);
WIN_EXPORT const char *ABI31_0_0YGPrintOptionsToString(const ABI31_0_0YGPrintOptions value);

#define ABI31_0_0YGUnitCount 4
typedef ABI31_0_0YG_ENUM_BEGIN(ABI31_0_0YGUnit) {
  ABI31_0_0YGUnitUndefined,
  ABI31_0_0YGUnitPoint,
  ABI31_0_0YGUnitPercent,
  ABI31_0_0YGUnitAuto,
} ABI31_0_0YG_ENUM_END(ABI31_0_0YGUnit);
WIN_EXPORT const char *ABI31_0_0YGUnitToString(const ABI31_0_0YGUnit value);

#define ABI31_0_0YGWrapCount 3
typedef ABI31_0_0YG_ENUM_BEGIN(ABI31_0_0YGWrap) {
  ABI31_0_0YGWrapNoWrap,
  ABI31_0_0YGWrapWrap,
  ABI31_0_0YGWrapWrapReverse,
} ABI31_0_0YG_ENUM_END(ABI31_0_0YGWrap);
WIN_EXPORT const char *ABI31_0_0YGWrapToString(const ABI31_0_0YGWrap value);

ABI31_0_0YG_EXTERN_C_END
