/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI29_0_0YGMacros.h"

ABI29_0_0YG_EXTERN_C_BEGIN

#define ABI29_0_0YGAlignCount 8
typedef ABI29_0_0YG_ENUM_BEGIN(ABI29_0_0YGAlign) {
  ABI29_0_0YGAlignAuto,
  ABI29_0_0YGAlignFlexStart,
  ABI29_0_0YGAlignCenter,
  ABI29_0_0YGAlignFlexEnd,
  ABI29_0_0YGAlignStretch,
  ABI29_0_0YGAlignBaseline,
  ABI29_0_0YGAlignSpaceBetween,
  ABI29_0_0YGAlignSpaceAround,
} ABI29_0_0YG_ENUM_END(ABI29_0_0YGAlign);
WIN_EXPORT const char *ABI29_0_0YGAlignToString(const ABI29_0_0YGAlign value);

#define ABI29_0_0YGDimensionCount 2
typedef ABI29_0_0YG_ENUM_BEGIN(ABI29_0_0YGDimension) {
  ABI29_0_0YGDimensionWidth,
  ABI29_0_0YGDimensionHeight,
} ABI29_0_0YG_ENUM_END(ABI29_0_0YGDimension);
WIN_EXPORT const char *ABI29_0_0YGDimensionToString(const ABI29_0_0YGDimension value);

#define ABI29_0_0YGDirectionCount 3
typedef ABI29_0_0YG_ENUM_BEGIN(ABI29_0_0YGDirection) {
  ABI29_0_0YGDirectionInherit,
  ABI29_0_0YGDirectionLTR,
  ABI29_0_0YGDirectionRTL,
} ABI29_0_0YG_ENUM_END(ABI29_0_0YGDirection);
WIN_EXPORT const char *ABI29_0_0YGDirectionToString(const ABI29_0_0YGDirection value);

#define ABI29_0_0YGDisplayCount 2
typedef ABI29_0_0YG_ENUM_BEGIN(ABI29_0_0YGDisplay) {
  ABI29_0_0YGDisplayFlex,
  ABI29_0_0YGDisplayNone,
} ABI29_0_0YG_ENUM_END(ABI29_0_0YGDisplay);
WIN_EXPORT const char *ABI29_0_0YGDisplayToString(const ABI29_0_0YGDisplay value);

#define ABI29_0_0YGEdgeCount 9
typedef ABI29_0_0YG_ENUM_BEGIN(ABI29_0_0YGEdge) {
  ABI29_0_0YGEdgeLeft,
  ABI29_0_0YGEdgeTop,
  ABI29_0_0YGEdgeRight,
  ABI29_0_0YGEdgeBottom,
  ABI29_0_0YGEdgeStart,
  ABI29_0_0YGEdgeEnd,
  ABI29_0_0YGEdgeHorizontal,
  ABI29_0_0YGEdgeVertical,
  ABI29_0_0YGEdgeAll,
} ABI29_0_0YG_ENUM_END(ABI29_0_0YGEdge);
WIN_EXPORT const char *ABI29_0_0YGEdgeToString(const ABI29_0_0YGEdge value);

#define ABI29_0_0YGExperimentalFeatureCount 1
typedef ABI29_0_0YG_ENUM_BEGIN(ABI29_0_0YGExperimentalFeature) {
  ABI29_0_0YGExperimentalFeatureWebFlexBasis,
} ABI29_0_0YG_ENUM_END(ABI29_0_0YGExperimentalFeature);
WIN_EXPORT const char *ABI29_0_0YGExperimentalFeatureToString(const ABI29_0_0YGExperimentalFeature value);

#define ABI29_0_0YGFlexDirectionCount 4
typedef ABI29_0_0YG_ENUM_BEGIN(ABI29_0_0YGFlexDirection) {
  ABI29_0_0YGFlexDirectionColumn,
  ABI29_0_0YGFlexDirectionColumnReverse,
  ABI29_0_0YGFlexDirectionRow,
  ABI29_0_0YGFlexDirectionRowReverse,
} ABI29_0_0YG_ENUM_END(ABI29_0_0YGFlexDirection);
WIN_EXPORT const char *ABI29_0_0YGFlexDirectionToString(const ABI29_0_0YGFlexDirection value);

#define ABI29_0_0YGJustifyCount 6
typedef ABI29_0_0YG_ENUM_BEGIN(ABI29_0_0YGJustify){
    ABI29_0_0YGJustifyFlexStart,
    ABI29_0_0YGJustifyCenter,
    ABI29_0_0YGJustifyFlexEnd,
    ABI29_0_0YGJustifySpaceBetween,
    ABI29_0_0YGJustifySpaceAround,
    ABI29_0_0YGJustifySpaceEvenly,
} ABI29_0_0YG_ENUM_END(ABI29_0_0YGJustify);
WIN_EXPORT const char *ABI29_0_0YGJustifyToString(const ABI29_0_0YGJustify value);

#define ABI29_0_0YGLogLevelCount 6
typedef ABI29_0_0YG_ENUM_BEGIN(ABI29_0_0YGLogLevel) {
  ABI29_0_0YGLogLevelError,
  ABI29_0_0YGLogLevelWarn,
  ABI29_0_0YGLogLevelInfo,
  ABI29_0_0YGLogLevelDebug,
  ABI29_0_0YGLogLevelVerbose,
  ABI29_0_0YGLogLevelFatal,
} ABI29_0_0YG_ENUM_END(ABI29_0_0YGLogLevel);
WIN_EXPORT const char *ABI29_0_0YGLogLevelToString(const ABI29_0_0YGLogLevel value);

#define ABI29_0_0YGMeasureModeCount 3
typedef ABI29_0_0YG_ENUM_BEGIN(ABI29_0_0YGMeasureMode) {
  ABI29_0_0YGMeasureModeUndefined,
  ABI29_0_0YGMeasureModeExactly,
  ABI29_0_0YGMeasureModeAtMost,
} ABI29_0_0YG_ENUM_END(ABI29_0_0YGMeasureMode);
WIN_EXPORT const char *ABI29_0_0YGMeasureModeToString(const ABI29_0_0YGMeasureMode value);

#define ABI29_0_0YGNodeTypeCount 2
typedef ABI29_0_0YG_ENUM_BEGIN(ABI29_0_0YGNodeType) {
  ABI29_0_0YGNodeTypeDefault,
  ABI29_0_0YGNodeTypeText,
} ABI29_0_0YG_ENUM_END(ABI29_0_0YGNodeType);
WIN_EXPORT const char *ABI29_0_0YGNodeTypeToString(const ABI29_0_0YGNodeType value);

#define ABI29_0_0YGOverflowCount 3
typedef ABI29_0_0YG_ENUM_BEGIN(ABI29_0_0YGOverflow) {
  ABI29_0_0YGOverflowVisible,
  ABI29_0_0YGOverflowHidden,
  ABI29_0_0YGOverflowScroll,
} ABI29_0_0YG_ENUM_END(ABI29_0_0YGOverflow);
WIN_EXPORT const char *ABI29_0_0YGOverflowToString(const ABI29_0_0YGOverflow value);

#define ABI29_0_0YGPositionTypeCount 2
typedef ABI29_0_0YG_ENUM_BEGIN(ABI29_0_0YGPositionType) {
  ABI29_0_0YGPositionTypeRelative,
  ABI29_0_0YGPositionTypeAbsolute,
} ABI29_0_0YG_ENUM_END(ABI29_0_0YGPositionType);
WIN_EXPORT const char *ABI29_0_0YGPositionTypeToString(const ABI29_0_0YGPositionType value);

#define ABI29_0_0YGPrintOptionsCount 3
typedef ABI29_0_0YG_ENUM_BEGIN(ABI29_0_0YGPrintOptions) {
  ABI29_0_0YGPrintOptionsLayout = 1,
  ABI29_0_0YGPrintOptionsStyle = 2,
  ABI29_0_0YGPrintOptionsChildren = 4,
} ABI29_0_0YG_ENUM_END(ABI29_0_0YGPrintOptions);
WIN_EXPORT const char *ABI29_0_0YGPrintOptionsToString(const ABI29_0_0YGPrintOptions value);

#define ABI29_0_0YGUnitCount 4
typedef ABI29_0_0YG_ENUM_BEGIN(ABI29_0_0YGUnit) {
  ABI29_0_0YGUnitUndefined,
  ABI29_0_0YGUnitPoint,
  ABI29_0_0YGUnitPercent,
  ABI29_0_0YGUnitAuto,
} ABI29_0_0YG_ENUM_END(ABI29_0_0YGUnit);
WIN_EXPORT const char *ABI29_0_0YGUnitToString(const ABI29_0_0YGUnit value);

#define ABI29_0_0YGWrapCount 3
typedef ABI29_0_0YG_ENUM_BEGIN(ABI29_0_0YGWrap) {
  ABI29_0_0YGWrapNoWrap,
  ABI29_0_0YGWrapWrap,
  ABI29_0_0YGWrapWrapReverse,
} ABI29_0_0YG_ENUM_END(ABI29_0_0YGWrap);
WIN_EXPORT const char *ABI29_0_0YGWrapToString(const ABI29_0_0YGWrap value);

ABI29_0_0YG_EXTERN_C_END
