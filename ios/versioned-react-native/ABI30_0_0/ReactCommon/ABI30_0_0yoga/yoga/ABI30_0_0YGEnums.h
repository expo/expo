/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI30_0_0YGMacros.h"

ABI30_0_0YG_EXTERN_C_BEGIN

#define ABI30_0_0YGAlignCount 8
typedef ABI30_0_0YG_ENUM_BEGIN(ABI30_0_0YGAlign) {
  ABI30_0_0YGAlignAuto,
  ABI30_0_0YGAlignFlexStart,
  ABI30_0_0YGAlignCenter,
  ABI30_0_0YGAlignFlexEnd,
  ABI30_0_0YGAlignStretch,
  ABI30_0_0YGAlignBaseline,
  ABI30_0_0YGAlignSpaceBetween,
  ABI30_0_0YGAlignSpaceAround,
} ABI30_0_0YG_ENUM_END(ABI30_0_0YGAlign);
WIN_EXPORT const char *ABI30_0_0YGAlignToString(const ABI30_0_0YGAlign value);

#define ABI30_0_0YGDimensionCount 2
typedef ABI30_0_0YG_ENUM_BEGIN(ABI30_0_0YGDimension) {
  ABI30_0_0YGDimensionWidth,
  ABI30_0_0YGDimensionHeight,
} ABI30_0_0YG_ENUM_END(ABI30_0_0YGDimension);
WIN_EXPORT const char *ABI30_0_0YGDimensionToString(const ABI30_0_0YGDimension value);

#define ABI30_0_0YGDirectionCount 3
typedef ABI30_0_0YG_ENUM_BEGIN(ABI30_0_0YGDirection) {
  ABI30_0_0YGDirectionInherit,
  ABI30_0_0YGDirectionLTR,
  ABI30_0_0YGDirectionRTL,
} ABI30_0_0YG_ENUM_END(ABI30_0_0YGDirection);
WIN_EXPORT const char *ABI30_0_0YGDirectionToString(const ABI30_0_0YGDirection value);

#define ABI30_0_0YGDisplayCount 2
typedef ABI30_0_0YG_ENUM_BEGIN(ABI30_0_0YGDisplay) {
  ABI30_0_0YGDisplayFlex,
  ABI30_0_0YGDisplayNone,
} ABI30_0_0YG_ENUM_END(ABI30_0_0YGDisplay);
WIN_EXPORT const char *ABI30_0_0YGDisplayToString(const ABI30_0_0YGDisplay value);

#define ABI30_0_0YGEdgeCount 9
typedef ABI30_0_0YG_ENUM_BEGIN(ABI30_0_0YGEdge) {
  ABI30_0_0YGEdgeLeft,
  ABI30_0_0YGEdgeTop,
  ABI30_0_0YGEdgeRight,
  ABI30_0_0YGEdgeBottom,
  ABI30_0_0YGEdgeStart,
  ABI30_0_0YGEdgeEnd,
  ABI30_0_0YGEdgeHorizontal,
  ABI30_0_0YGEdgeVertical,
  ABI30_0_0YGEdgeAll,
} ABI30_0_0YG_ENUM_END(ABI30_0_0YGEdge);
WIN_EXPORT const char *ABI30_0_0YGEdgeToString(const ABI30_0_0YGEdge value);

#define ABI30_0_0YGExperimentalFeatureCount 1
typedef ABI30_0_0YG_ENUM_BEGIN(ABI30_0_0YGExperimentalFeature) {
  ABI30_0_0YGExperimentalFeatureWebFlexBasis,
} ABI30_0_0YG_ENUM_END(ABI30_0_0YGExperimentalFeature);
WIN_EXPORT const char *ABI30_0_0YGExperimentalFeatureToString(const ABI30_0_0YGExperimentalFeature value);

#define ABI30_0_0YGFlexDirectionCount 4
typedef ABI30_0_0YG_ENUM_BEGIN(ABI30_0_0YGFlexDirection) {
  ABI30_0_0YGFlexDirectionColumn,
  ABI30_0_0YGFlexDirectionColumnReverse,
  ABI30_0_0YGFlexDirectionRow,
  ABI30_0_0YGFlexDirectionRowReverse,
} ABI30_0_0YG_ENUM_END(ABI30_0_0YGFlexDirection);
WIN_EXPORT const char *ABI30_0_0YGFlexDirectionToString(const ABI30_0_0YGFlexDirection value);

#define ABI30_0_0YGJustifyCount 6
typedef ABI30_0_0YG_ENUM_BEGIN(ABI30_0_0YGJustify){
    ABI30_0_0YGJustifyFlexStart,
    ABI30_0_0YGJustifyCenter,
    ABI30_0_0YGJustifyFlexEnd,
    ABI30_0_0YGJustifySpaceBetween,
    ABI30_0_0YGJustifySpaceAround,
    ABI30_0_0YGJustifySpaceEvenly,
} ABI30_0_0YG_ENUM_END(ABI30_0_0YGJustify);
WIN_EXPORT const char *ABI30_0_0YGJustifyToString(const ABI30_0_0YGJustify value);

#define ABI30_0_0YGLogLevelCount 6
typedef ABI30_0_0YG_ENUM_BEGIN(ABI30_0_0YGLogLevel) {
  ABI30_0_0YGLogLevelError,
  ABI30_0_0YGLogLevelWarn,
  ABI30_0_0YGLogLevelInfo,
  ABI30_0_0YGLogLevelDebug,
  ABI30_0_0YGLogLevelVerbose,
  ABI30_0_0YGLogLevelFatal,
} ABI30_0_0YG_ENUM_END(ABI30_0_0YGLogLevel);
WIN_EXPORT const char *ABI30_0_0YGLogLevelToString(const ABI30_0_0YGLogLevel value);

#define ABI30_0_0YGMeasureModeCount 3
typedef ABI30_0_0YG_ENUM_BEGIN(ABI30_0_0YGMeasureMode) {
  ABI30_0_0YGMeasureModeUndefined,
  ABI30_0_0YGMeasureModeExactly,
  ABI30_0_0YGMeasureModeAtMost,
} ABI30_0_0YG_ENUM_END(ABI30_0_0YGMeasureMode);
WIN_EXPORT const char *ABI30_0_0YGMeasureModeToString(const ABI30_0_0YGMeasureMode value);

#define ABI30_0_0YGNodeTypeCount 2
typedef ABI30_0_0YG_ENUM_BEGIN(ABI30_0_0YGNodeType) {
  ABI30_0_0YGNodeTypeDefault,
  ABI30_0_0YGNodeTypeText,
} ABI30_0_0YG_ENUM_END(ABI30_0_0YGNodeType);
WIN_EXPORT const char *ABI30_0_0YGNodeTypeToString(const ABI30_0_0YGNodeType value);

#define ABI30_0_0YGOverflowCount 3
typedef ABI30_0_0YG_ENUM_BEGIN(ABI30_0_0YGOverflow) {
  ABI30_0_0YGOverflowVisible,
  ABI30_0_0YGOverflowHidden,
  ABI30_0_0YGOverflowScroll,
} ABI30_0_0YG_ENUM_END(ABI30_0_0YGOverflow);
WIN_EXPORT const char *ABI30_0_0YGOverflowToString(const ABI30_0_0YGOverflow value);

#define ABI30_0_0YGPositionTypeCount 2
typedef ABI30_0_0YG_ENUM_BEGIN(ABI30_0_0YGPositionType) {
  ABI30_0_0YGPositionTypeRelative,
  ABI30_0_0YGPositionTypeAbsolute,
} ABI30_0_0YG_ENUM_END(ABI30_0_0YGPositionType);
WIN_EXPORT const char *ABI30_0_0YGPositionTypeToString(const ABI30_0_0YGPositionType value);

#define ABI30_0_0YGPrintOptionsCount 3
typedef ABI30_0_0YG_ENUM_BEGIN(ABI30_0_0YGPrintOptions) {
  ABI30_0_0YGPrintOptionsLayout = 1,
  ABI30_0_0YGPrintOptionsStyle = 2,
  ABI30_0_0YGPrintOptionsChildren = 4,
} ABI30_0_0YG_ENUM_END(ABI30_0_0YGPrintOptions);
WIN_EXPORT const char *ABI30_0_0YGPrintOptionsToString(const ABI30_0_0YGPrintOptions value);

#define ABI30_0_0YGUnitCount 4
typedef ABI30_0_0YG_ENUM_BEGIN(ABI30_0_0YGUnit) {
  ABI30_0_0YGUnitUndefined,
  ABI30_0_0YGUnitPoint,
  ABI30_0_0YGUnitPercent,
  ABI30_0_0YGUnitAuto,
} ABI30_0_0YG_ENUM_END(ABI30_0_0YGUnit);
WIN_EXPORT const char *ABI30_0_0YGUnitToString(const ABI30_0_0YGUnit value);

#define ABI30_0_0YGWrapCount 3
typedef ABI30_0_0YG_ENUM_BEGIN(ABI30_0_0YGWrap) {
  ABI30_0_0YGWrapNoWrap,
  ABI30_0_0YGWrapWrap,
  ABI30_0_0YGWrapWrapReverse,
} ABI30_0_0YG_ENUM_END(ABI30_0_0YGWrap);
WIN_EXPORT const char *ABI30_0_0YGWrapToString(const ABI30_0_0YGWrap value);

ABI30_0_0YG_EXTERN_C_END
