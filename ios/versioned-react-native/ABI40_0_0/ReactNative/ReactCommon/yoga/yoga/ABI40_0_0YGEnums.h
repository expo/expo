/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI40_0_0YGMacros.h"

#ifdef __cplusplus
namespace ABI40_0_0facebook {
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
} // namespace ABI40_0_0facebook
#endif

#define ABI40_0_0YG_ENUM_DECL(NAME, ...)                               \
  typedef ABI40_0_0YG_ENUM_BEGIN(NAME){__VA_ARGS__} ABI40_0_0YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

#ifdef __cplusplus
#define ABI40_0_0YG_ENUM_SEQ_DECL(NAME, ...)  \
  ABI40_0_0YG_ENUM_DECL(NAME, __VA_ARGS__)    \
  ABI40_0_0YG_EXTERN_C_END                    \
  namespace ABI40_0_0facebook {               \
  namespace yoga {                   \
  namespace enums {                  \
  template <>                        \
  constexpr int count<NAME>() {      \
    return detail::n<__VA_ARGS__>(); \
  }                                  \
  }                                  \
  }                                  \
  }                                  \
  ABI40_0_0YG_EXTERN_C_BEGIN
#else
#define ABI40_0_0YG_ENUM_SEQ_DECL ABI40_0_0YG_ENUM_DECL
#endif

ABI40_0_0YG_EXTERN_C_BEGIN

ABI40_0_0YG_ENUM_SEQ_DECL(
    ABI40_0_0YGAlign,
    ABI40_0_0YGAlignAuto,
    ABI40_0_0YGAlignFlexStart,
    ABI40_0_0YGAlignCenter,
    ABI40_0_0YGAlignFlexEnd,
    ABI40_0_0YGAlignStretch,
    ABI40_0_0YGAlignBaseline,
    ABI40_0_0YGAlignSpaceBetween,
    ABI40_0_0YGAlignSpaceAround);

ABI40_0_0YG_ENUM_SEQ_DECL(ABI40_0_0YGDimension, ABI40_0_0YGDimensionWidth, ABI40_0_0YGDimensionHeight)

ABI40_0_0YG_ENUM_SEQ_DECL(
    ABI40_0_0YGDirection,
    ABI40_0_0YGDirectionInherit,
    ABI40_0_0YGDirectionLTR,
    ABI40_0_0YGDirectionRTL)

ABI40_0_0YG_ENUM_SEQ_DECL(ABI40_0_0YGDisplay, ABI40_0_0YGDisplayFlex, ABI40_0_0YGDisplayNone)

ABI40_0_0YG_ENUM_SEQ_DECL(
    ABI40_0_0YGEdge,
    ABI40_0_0YGEdgeLeft,
    ABI40_0_0YGEdgeTop,
    ABI40_0_0YGEdgeRight,
    ABI40_0_0YGEdgeBottom,
    ABI40_0_0YGEdgeStart,
    ABI40_0_0YGEdgeEnd,
    ABI40_0_0YGEdgeHorizontal,
    ABI40_0_0YGEdgeVertical,
    ABI40_0_0YGEdgeAll)

ABI40_0_0YG_ENUM_SEQ_DECL(ABI40_0_0YGExperimentalFeature, ABI40_0_0YGExperimentalFeatureWebFlexBasis)

ABI40_0_0YG_ENUM_SEQ_DECL(
    ABI40_0_0YGFlexDirection,
    ABI40_0_0YGFlexDirectionColumn,
    ABI40_0_0YGFlexDirectionColumnReverse,
    ABI40_0_0YGFlexDirectionRow,
    ABI40_0_0YGFlexDirectionRowReverse)

ABI40_0_0YG_ENUM_SEQ_DECL(
    ABI40_0_0YGJustify,
    ABI40_0_0YGJustifyFlexStart,
    ABI40_0_0YGJustifyCenter,
    ABI40_0_0YGJustifyFlexEnd,
    ABI40_0_0YGJustifySpaceBetween,
    ABI40_0_0YGJustifySpaceAround,
    ABI40_0_0YGJustifySpaceEvenly)

ABI40_0_0YG_ENUM_SEQ_DECL(
    ABI40_0_0YGLogLevel,
    ABI40_0_0YGLogLevelError,
    ABI40_0_0YGLogLevelWarn,
    ABI40_0_0YGLogLevelInfo,
    ABI40_0_0YGLogLevelDebug,
    ABI40_0_0YGLogLevelVerbose,
    ABI40_0_0YGLogLevelFatal)

ABI40_0_0YG_ENUM_SEQ_DECL(
    ABI40_0_0YGMeasureMode,
    ABI40_0_0YGMeasureModeUndefined,
    ABI40_0_0YGMeasureModeExactly,
    ABI40_0_0YGMeasureModeAtMost)

ABI40_0_0YG_ENUM_SEQ_DECL(ABI40_0_0YGNodeType, ABI40_0_0YGNodeTypeDefault, ABI40_0_0YGNodeTypeText)

ABI40_0_0YG_ENUM_SEQ_DECL(
    ABI40_0_0YGOverflow,
    ABI40_0_0YGOverflowVisible,
    ABI40_0_0YGOverflowHidden,
    ABI40_0_0YGOverflowScroll)

ABI40_0_0YG_ENUM_SEQ_DECL(ABI40_0_0YGPositionType, ABI40_0_0YGPositionTypeRelative, ABI40_0_0YGPositionTypeAbsolute)

ABI40_0_0YG_ENUM_DECL(
    ABI40_0_0YGPrintOptions,
    ABI40_0_0YGPrintOptionsLayout = 1,
    ABI40_0_0YGPrintOptionsStyle = 2,
    ABI40_0_0YGPrintOptionsChildren = 4)

ABI40_0_0YG_ENUM_SEQ_DECL(
    ABI40_0_0YGUnit,
    ABI40_0_0YGUnitUndefined,
    ABI40_0_0YGUnitPoint,
    ABI40_0_0YGUnitPercent,
    ABI40_0_0YGUnitAuto)

ABI40_0_0YG_ENUM_SEQ_DECL(ABI40_0_0YGWrap, ABI40_0_0YGWrapNoWrap, ABI40_0_0YGWrapWrap, ABI40_0_0YGWrapWrapReverse)

ABI40_0_0YG_EXTERN_C_END

#undef ABI40_0_0YG_ENUM_DECL
#undef ABI40_0_0YG_ENUM_SEQ_DECL
