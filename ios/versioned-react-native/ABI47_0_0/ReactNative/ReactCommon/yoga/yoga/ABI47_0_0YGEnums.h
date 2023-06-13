/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI47_0_0YGMacros.h"

#ifdef __cplusplus
namespace ABI47_0_0facebook {
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
} // namespace ABI47_0_0facebook
#endif

#define ABI47_0_0YG_ENUM_DECL(NAME, ...)                               \
  typedef ABI47_0_0YG_ENUM_BEGIN(NAME){__VA_ARGS__} ABI47_0_0YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

#ifdef __cplusplus
#define ABI47_0_0YG_ENUM_SEQ_DECL(NAME, ...)  \
  ABI47_0_0YG_ENUM_DECL(NAME, __VA_ARGS__)    \
  ABI47_0_0YG_EXTERN_C_END                    \
  namespace ABI47_0_0facebook {               \
  namespace yoga {                   \
  namespace enums {                  \
  template <>                        \
  constexpr int count<NAME>() {      \
    return detail::n<__VA_ARGS__>(); \
  }                                  \
  }                                  \
  }                                  \
  }                                  \
  ABI47_0_0YG_EXTERN_C_BEGIN
#else
#define ABI47_0_0YG_ENUM_SEQ_DECL ABI47_0_0YG_ENUM_DECL
#endif

ABI47_0_0YG_EXTERN_C_BEGIN

ABI47_0_0YG_ENUM_SEQ_DECL(
    ABI47_0_0YGAlign,
    ABI47_0_0YGAlignAuto,
    ABI47_0_0YGAlignFlexStart,
    ABI47_0_0YGAlignCenter,
    ABI47_0_0YGAlignFlexEnd,
    ABI47_0_0YGAlignStretch,
    ABI47_0_0YGAlignBaseline,
    ABI47_0_0YGAlignSpaceBetween,
    ABI47_0_0YGAlignSpaceAround);

ABI47_0_0YG_ENUM_SEQ_DECL(ABI47_0_0YGDimension, ABI47_0_0YGDimensionWidth, ABI47_0_0YGDimensionHeight)

ABI47_0_0YG_ENUM_SEQ_DECL(
    ABI47_0_0YGDirection,
    ABI47_0_0YGDirectionInherit,
    ABI47_0_0YGDirectionLTR,
    ABI47_0_0YGDirectionRTL)

ABI47_0_0YG_ENUM_SEQ_DECL(ABI47_0_0YGDisplay, ABI47_0_0YGDisplayFlex, ABI47_0_0YGDisplayNone)

ABI47_0_0YG_ENUM_SEQ_DECL(
    ABI47_0_0YGEdge,
    ABI47_0_0YGEdgeLeft,
    ABI47_0_0YGEdgeTop,
    ABI47_0_0YGEdgeRight,
    ABI47_0_0YGEdgeBottom,
    ABI47_0_0YGEdgeStart,
    ABI47_0_0YGEdgeEnd,
    ABI47_0_0YGEdgeHorizontal,
    ABI47_0_0YGEdgeVertical,
    ABI47_0_0YGEdgeAll)

ABI47_0_0YG_ENUM_SEQ_DECL(ABI47_0_0YGExperimentalFeature, ABI47_0_0YGExperimentalFeatureWebFlexBasis)

ABI47_0_0YG_ENUM_SEQ_DECL(
    ABI47_0_0YGFlexDirection,
    ABI47_0_0YGFlexDirectionColumn,
    ABI47_0_0YGFlexDirectionColumnReverse,
    ABI47_0_0YGFlexDirectionRow,
    ABI47_0_0YGFlexDirectionRowReverse)

ABI47_0_0YG_ENUM_SEQ_DECL(
    ABI47_0_0YGJustify,
    ABI47_0_0YGJustifyFlexStart,
    ABI47_0_0YGJustifyCenter,
    ABI47_0_0YGJustifyFlexEnd,
    ABI47_0_0YGJustifySpaceBetween,
    ABI47_0_0YGJustifySpaceAround,
    ABI47_0_0YGJustifySpaceEvenly)

ABI47_0_0YG_ENUM_SEQ_DECL(
    ABI47_0_0YGLogLevel,
    ABI47_0_0YGLogLevelError,
    ABI47_0_0YGLogLevelWarn,
    ABI47_0_0YGLogLevelInfo,
    ABI47_0_0YGLogLevelDebug,
    ABI47_0_0YGLogLevelVerbose,
    ABI47_0_0YGLogLevelFatal)

ABI47_0_0YG_ENUM_SEQ_DECL(
    ABI47_0_0YGMeasureMode,
    ABI47_0_0YGMeasureModeUndefined,
    ABI47_0_0YGMeasureModeExactly,
    ABI47_0_0YGMeasureModeAtMost)

ABI47_0_0YG_ENUM_SEQ_DECL(ABI47_0_0YGNodeType, ABI47_0_0YGNodeTypeDefault, ABI47_0_0YGNodeTypeText)

ABI47_0_0YG_ENUM_SEQ_DECL(
    ABI47_0_0YGOverflow,
    ABI47_0_0YGOverflowVisible,
    ABI47_0_0YGOverflowHidden,
    ABI47_0_0YGOverflowScroll)

ABI47_0_0YG_ENUM_SEQ_DECL(
    ABI47_0_0YGPositionType,
    ABI47_0_0YGPositionTypeStatic,
    ABI47_0_0YGPositionTypeRelative,
    ABI47_0_0YGPositionTypeAbsolute)

ABI47_0_0YG_ENUM_DECL(
    ABI47_0_0YGPrintOptions,
    ABI47_0_0YGPrintOptionsLayout = 1,
    ABI47_0_0YGPrintOptionsStyle = 2,
    ABI47_0_0YGPrintOptionsChildren = 4)

ABI47_0_0YG_ENUM_SEQ_DECL(
    ABI47_0_0YGUnit,
    ABI47_0_0YGUnitUndefined,
    ABI47_0_0YGUnitPoint,
    ABI47_0_0YGUnitPercent,
    ABI47_0_0YGUnitAuto)

ABI47_0_0YG_ENUM_SEQ_DECL(ABI47_0_0YGWrap, ABI47_0_0YGWrapNoWrap, ABI47_0_0YGWrapWrap, ABI47_0_0YGWrapWrapReverse)

ABI47_0_0YG_EXTERN_C_END

#undef ABI47_0_0YG_ENUM_DECL
#undef ABI47_0_0YG_ENUM_SEQ_DECL
