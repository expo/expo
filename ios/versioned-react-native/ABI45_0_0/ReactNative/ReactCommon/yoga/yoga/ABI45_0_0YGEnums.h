/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI45_0_0YGMacros.h"

#ifdef __cplusplus
namespace ABI45_0_0facebook {
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
} // namespace ABI45_0_0facebook
#endif

#define ABI45_0_0YG_ENUM_DECL(NAME, ...)                               \
  typedef ABI45_0_0YG_ENUM_BEGIN(NAME){__VA_ARGS__} ABI45_0_0YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

#ifdef __cplusplus
#define ABI45_0_0YG_ENUM_SEQ_DECL(NAME, ...)  \
  ABI45_0_0YG_ENUM_DECL(NAME, __VA_ARGS__)    \
  ABI45_0_0YG_EXTERN_C_END                    \
  namespace ABI45_0_0facebook {               \
  namespace yoga {                   \
  namespace enums {                  \
  template <>                        \
  constexpr int count<NAME>() {      \
    return detail::n<__VA_ARGS__>(); \
  }                                  \
  }                                  \
  }                                  \
  }                                  \
  ABI45_0_0YG_EXTERN_C_BEGIN
#else
#define ABI45_0_0YG_ENUM_SEQ_DECL ABI45_0_0YG_ENUM_DECL
#endif

ABI45_0_0YG_EXTERN_C_BEGIN

ABI45_0_0YG_ENUM_SEQ_DECL(
    ABI45_0_0YGAlign,
    ABI45_0_0YGAlignAuto,
    ABI45_0_0YGAlignFlexStart,
    ABI45_0_0YGAlignCenter,
    ABI45_0_0YGAlignFlexEnd,
    ABI45_0_0YGAlignStretch,
    ABI45_0_0YGAlignBaseline,
    ABI45_0_0YGAlignSpaceBetween,
    ABI45_0_0YGAlignSpaceAround);

ABI45_0_0YG_ENUM_SEQ_DECL(ABI45_0_0YGDimension, ABI45_0_0YGDimensionWidth, ABI45_0_0YGDimensionHeight)

ABI45_0_0YG_ENUM_SEQ_DECL(
    ABI45_0_0YGDirection,
    ABI45_0_0YGDirectionInherit,
    ABI45_0_0YGDirectionLTR,
    ABI45_0_0YGDirectionRTL)

ABI45_0_0YG_ENUM_SEQ_DECL(ABI45_0_0YGDisplay, ABI45_0_0YGDisplayFlex, ABI45_0_0YGDisplayNone)

ABI45_0_0YG_ENUM_SEQ_DECL(
    ABI45_0_0YGEdge,
    ABI45_0_0YGEdgeLeft,
    ABI45_0_0YGEdgeTop,
    ABI45_0_0YGEdgeRight,
    ABI45_0_0YGEdgeBottom,
    ABI45_0_0YGEdgeStart,
    ABI45_0_0YGEdgeEnd,
    ABI45_0_0YGEdgeHorizontal,
    ABI45_0_0YGEdgeVertical,
    ABI45_0_0YGEdgeAll)

ABI45_0_0YG_ENUM_SEQ_DECL(ABI45_0_0YGExperimentalFeature, ABI45_0_0YGExperimentalFeatureWebFlexBasis)

ABI45_0_0YG_ENUM_SEQ_DECL(
    ABI45_0_0YGFlexDirection,
    ABI45_0_0YGFlexDirectionColumn,
    ABI45_0_0YGFlexDirectionColumnReverse,
    ABI45_0_0YGFlexDirectionRow,
    ABI45_0_0YGFlexDirectionRowReverse)

ABI45_0_0YG_ENUM_SEQ_DECL(
    ABI45_0_0YGJustify,
    ABI45_0_0YGJustifyFlexStart,
    ABI45_0_0YGJustifyCenter,
    ABI45_0_0YGJustifyFlexEnd,
    ABI45_0_0YGJustifySpaceBetween,
    ABI45_0_0YGJustifySpaceAround,
    ABI45_0_0YGJustifySpaceEvenly)

ABI45_0_0YG_ENUM_SEQ_DECL(
    ABI45_0_0YGLogLevel,
    ABI45_0_0YGLogLevelError,
    ABI45_0_0YGLogLevelWarn,
    ABI45_0_0YGLogLevelInfo,
    ABI45_0_0YGLogLevelDebug,
    ABI45_0_0YGLogLevelVerbose,
    ABI45_0_0YGLogLevelFatal)

ABI45_0_0YG_ENUM_SEQ_DECL(
    ABI45_0_0YGMeasureMode,
    ABI45_0_0YGMeasureModeUndefined,
    ABI45_0_0YGMeasureModeExactly,
    ABI45_0_0YGMeasureModeAtMost)

ABI45_0_0YG_ENUM_SEQ_DECL(ABI45_0_0YGNodeType, ABI45_0_0YGNodeTypeDefault, ABI45_0_0YGNodeTypeText)

ABI45_0_0YG_ENUM_SEQ_DECL(
    ABI45_0_0YGOverflow,
    ABI45_0_0YGOverflowVisible,
    ABI45_0_0YGOverflowHidden,
    ABI45_0_0YGOverflowScroll)

ABI45_0_0YG_ENUM_SEQ_DECL(
    ABI45_0_0YGPositionType,
    ABI45_0_0YGPositionTypeStatic,
    ABI45_0_0YGPositionTypeRelative,
    ABI45_0_0YGPositionTypeAbsolute)

ABI45_0_0YG_ENUM_DECL(
    ABI45_0_0YGPrintOptions,
    ABI45_0_0YGPrintOptionsLayout = 1,
    ABI45_0_0YGPrintOptionsStyle = 2,
    ABI45_0_0YGPrintOptionsChildren = 4)

ABI45_0_0YG_ENUM_SEQ_DECL(
    ABI45_0_0YGUnit,
    ABI45_0_0YGUnitUndefined,
    ABI45_0_0YGUnitPoint,
    ABI45_0_0YGUnitPercent,
    ABI45_0_0YGUnitAuto)

ABI45_0_0YG_ENUM_SEQ_DECL(ABI45_0_0YGWrap, ABI45_0_0YGWrapNoWrap, ABI45_0_0YGWrapWrap, ABI45_0_0YGWrapWrapReverse)

ABI45_0_0YG_EXTERN_C_END

#undef ABI45_0_0YG_ENUM_DECL
#undef ABI45_0_0YG_ENUM_SEQ_DECL
