/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI46_0_0YGMacros.h"

#ifdef __cplusplus
namespace ABI46_0_0facebook {
namespace yoga {
namespace enums {

template <typename T>
constexpr int count(); // can't use `= delete` due to a defect in clang < 3.9

namespace detail {
template <int... xs>
constexpr int n() {
  return sizeof...(xs);
}
} // namespace detail

} // namespace enums
} // namespace yoga
} // namespace ABI46_0_0facebook
#endif

#define ABI46_0_0YG_ENUM_DECL(NAME, ...)                               \
  typedef ABI46_0_0YG_ENUM_BEGIN(NAME){__VA_ARGS__} ABI46_0_0YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

#ifdef __cplusplus
#define ABI46_0_0YG_ENUM_SEQ_DECL(NAME, ...)  \
  ABI46_0_0YG_ENUM_DECL(NAME, __VA_ARGS__)    \
  ABI46_0_0YG_EXTERN_C_END                    \
  namespace ABI46_0_0facebook {               \
  namespace yoga {                   \
  namespace enums {                  \
  template <>                        \
  constexpr int count<NAME>() {      \
    return detail::n<__VA_ARGS__>(); \
  }                                  \
  }                                  \
  }                                  \
  }                                  \
  ABI46_0_0YG_EXTERN_C_BEGIN
#else
#define ABI46_0_0YG_ENUM_SEQ_DECL ABI46_0_0YG_ENUM_DECL
#endif

ABI46_0_0YG_EXTERN_C_BEGIN

ABI46_0_0YG_ENUM_SEQ_DECL(
    ABI46_0_0YGAlign,
    ABI46_0_0YGAlignAuto,
    ABI46_0_0YGAlignFlexStart,
    ABI46_0_0YGAlignCenter,
    ABI46_0_0YGAlignFlexEnd,
    ABI46_0_0YGAlignStretch,
    ABI46_0_0YGAlignBaseline,
    ABI46_0_0YGAlignSpaceBetween,
    ABI46_0_0YGAlignSpaceAround);

ABI46_0_0YG_ENUM_SEQ_DECL(ABI46_0_0YGDimension, ABI46_0_0YGDimensionWidth, ABI46_0_0YGDimensionHeight)

ABI46_0_0YG_ENUM_SEQ_DECL(
    ABI46_0_0YGDirection,
    ABI46_0_0YGDirectionInherit,
    ABI46_0_0YGDirectionLTR,
    ABI46_0_0YGDirectionRTL)

ABI46_0_0YG_ENUM_SEQ_DECL(ABI46_0_0YGDisplay, ABI46_0_0YGDisplayFlex, ABI46_0_0YGDisplayNone)

ABI46_0_0YG_ENUM_SEQ_DECL(
    ABI46_0_0YGEdge,
    ABI46_0_0YGEdgeLeft,
    ABI46_0_0YGEdgeTop,
    ABI46_0_0YGEdgeRight,
    ABI46_0_0YGEdgeBottom,
    ABI46_0_0YGEdgeStart,
    ABI46_0_0YGEdgeEnd,
    ABI46_0_0YGEdgeHorizontal,
    ABI46_0_0YGEdgeVertical,
    ABI46_0_0YGEdgeAll)

ABI46_0_0YG_ENUM_SEQ_DECL(ABI46_0_0YGExperimentalFeature, ABI46_0_0YGExperimentalFeatureWebFlexBasis)

ABI46_0_0YG_ENUM_SEQ_DECL(
    ABI46_0_0YGFlexDirection,
    ABI46_0_0YGFlexDirectionColumn,
    ABI46_0_0YGFlexDirectionColumnReverse,
    ABI46_0_0YGFlexDirectionRow,
    ABI46_0_0YGFlexDirectionRowReverse)

ABI46_0_0YG_ENUM_SEQ_DECL(
    ABI46_0_0YGJustify,
    ABI46_0_0YGJustifyFlexStart,
    ABI46_0_0YGJustifyCenter,
    ABI46_0_0YGJustifyFlexEnd,
    ABI46_0_0YGJustifySpaceBetween,
    ABI46_0_0YGJustifySpaceAround,
    ABI46_0_0YGJustifySpaceEvenly)

ABI46_0_0YG_ENUM_SEQ_DECL(
    ABI46_0_0YGLogLevel,
    ABI46_0_0YGLogLevelError,
    ABI46_0_0YGLogLevelWarn,
    ABI46_0_0YGLogLevelInfo,
    ABI46_0_0YGLogLevelDebug,
    ABI46_0_0YGLogLevelVerbose,
    ABI46_0_0YGLogLevelFatal)

ABI46_0_0YG_ENUM_SEQ_DECL(
    ABI46_0_0YGMeasureMode,
    ABI46_0_0YGMeasureModeUndefined,
    ABI46_0_0YGMeasureModeExactly,
    ABI46_0_0YGMeasureModeAtMost)

ABI46_0_0YG_ENUM_SEQ_DECL(ABI46_0_0YGNodeType, ABI46_0_0YGNodeTypeDefault, ABI46_0_0YGNodeTypeText)

ABI46_0_0YG_ENUM_SEQ_DECL(
    ABI46_0_0YGOverflow,
    ABI46_0_0YGOverflowVisible,
    ABI46_0_0YGOverflowHidden,
    ABI46_0_0YGOverflowScroll)

ABI46_0_0YG_ENUM_SEQ_DECL(
    ABI46_0_0YGPositionType,
    ABI46_0_0YGPositionTypeStatic,
    ABI46_0_0YGPositionTypeRelative,
    ABI46_0_0YGPositionTypeAbsolute)

ABI46_0_0YG_ENUM_DECL(
    ABI46_0_0YGPrintOptions,
    ABI46_0_0YGPrintOptionsLayout = 1,
    ABI46_0_0YGPrintOptionsStyle = 2,
    ABI46_0_0YGPrintOptionsChildren = 4)

ABI46_0_0YG_ENUM_SEQ_DECL(
    ABI46_0_0YGUnit,
    ABI46_0_0YGUnitUndefined,
    ABI46_0_0YGUnitPoint,
    ABI46_0_0YGUnitPercent,
    ABI46_0_0YGUnitAuto)

ABI46_0_0YG_ENUM_SEQ_DECL(ABI46_0_0YGWrap, ABI46_0_0YGWrapNoWrap, ABI46_0_0YGWrapWrap, ABI46_0_0YGWrapWrapReverse)

ABI46_0_0YG_EXTERN_C_END

#undef ABI46_0_0YG_ENUM_DECL
#undef ABI46_0_0YG_ENUM_SEQ_DECL
