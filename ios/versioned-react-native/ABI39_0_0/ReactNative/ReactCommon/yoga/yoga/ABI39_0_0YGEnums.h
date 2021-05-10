/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI39_0_0YGMacros.h"

#ifdef __cplusplus
namespace ABI39_0_0facebook {
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
} // namespace ABI39_0_0facebook
#endif

#define ABI39_0_0YG_ENUM_DECL(NAME, ...)                               \
  typedef ABI39_0_0YG_ENUM_BEGIN(NAME){__VA_ARGS__} ABI39_0_0YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

#ifdef __cplusplus
#define ABI39_0_0YG_ENUM_SEQ_DECL(NAME, ...)  \
  ABI39_0_0YG_ENUM_DECL(NAME, __VA_ARGS__)    \
  ABI39_0_0YG_EXTERN_C_END                    \
  namespace ABI39_0_0facebook {               \
  namespace yoga {                   \
  namespace enums {                  \
  template <>                        \
  constexpr int count<NAME>() {      \
    return detail::n<__VA_ARGS__>(); \
  }                                  \
  }                                  \
  }                                  \
  }                                  \
  ABI39_0_0YG_EXTERN_C_BEGIN
#else
#define ABI39_0_0YG_ENUM_SEQ_DECL ABI39_0_0YG_ENUM_DECL
#endif

ABI39_0_0YG_EXTERN_C_BEGIN

ABI39_0_0YG_ENUM_SEQ_DECL(
    ABI39_0_0YGAlign,
    ABI39_0_0YGAlignAuto,
    ABI39_0_0YGAlignFlexStart,
    ABI39_0_0YGAlignCenter,
    ABI39_0_0YGAlignFlexEnd,
    ABI39_0_0YGAlignStretch,
    ABI39_0_0YGAlignBaseline,
    ABI39_0_0YGAlignSpaceBetween,
    ABI39_0_0YGAlignSpaceAround);

ABI39_0_0YG_ENUM_SEQ_DECL(ABI39_0_0YGDimension, ABI39_0_0YGDimensionWidth, ABI39_0_0YGDimensionHeight)

ABI39_0_0YG_ENUM_SEQ_DECL(
    ABI39_0_0YGDirection,
    ABI39_0_0YGDirectionInherit,
    ABI39_0_0YGDirectionLTR,
    ABI39_0_0YGDirectionRTL)

ABI39_0_0YG_ENUM_SEQ_DECL(ABI39_0_0YGDisplay, ABI39_0_0YGDisplayFlex, ABI39_0_0YGDisplayNone)

ABI39_0_0YG_ENUM_SEQ_DECL(
    ABI39_0_0YGEdge,
    ABI39_0_0YGEdgeLeft,
    ABI39_0_0YGEdgeTop,
    ABI39_0_0YGEdgeRight,
    ABI39_0_0YGEdgeBottom,
    ABI39_0_0YGEdgeStart,
    ABI39_0_0YGEdgeEnd,
    ABI39_0_0YGEdgeHorizontal,
    ABI39_0_0YGEdgeVertical,
    ABI39_0_0YGEdgeAll)

ABI39_0_0YG_ENUM_SEQ_DECL(ABI39_0_0YGExperimentalFeature, ABI39_0_0YGExperimentalFeatureWebFlexBasis)

ABI39_0_0YG_ENUM_SEQ_DECL(
    ABI39_0_0YGFlexDirection,
    ABI39_0_0YGFlexDirectionColumn,
    ABI39_0_0YGFlexDirectionColumnReverse,
    ABI39_0_0YGFlexDirectionRow,
    ABI39_0_0YGFlexDirectionRowReverse)

ABI39_0_0YG_ENUM_SEQ_DECL(
    ABI39_0_0YGJustify,
    ABI39_0_0YGJustifyFlexStart,
    ABI39_0_0YGJustifyCenter,
    ABI39_0_0YGJustifyFlexEnd,
    ABI39_0_0YGJustifySpaceBetween,
    ABI39_0_0YGJustifySpaceAround,
    ABI39_0_0YGJustifySpaceEvenly)

ABI39_0_0YG_ENUM_SEQ_DECL(
    ABI39_0_0YGLogLevel,
    ABI39_0_0YGLogLevelError,
    ABI39_0_0YGLogLevelWarn,
    ABI39_0_0YGLogLevelInfo,
    ABI39_0_0YGLogLevelDebug,
    ABI39_0_0YGLogLevelVerbose,
    ABI39_0_0YGLogLevelFatal)

ABI39_0_0YG_ENUM_SEQ_DECL(
    ABI39_0_0YGMeasureMode,
    ABI39_0_0YGMeasureModeUndefined,
    ABI39_0_0YGMeasureModeExactly,
    ABI39_0_0YGMeasureModeAtMost)

ABI39_0_0YG_ENUM_SEQ_DECL(ABI39_0_0YGNodeType, ABI39_0_0YGNodeTypeDefault, ABI39_0_0YGNodeTypeText)

ABI39_0_0YG_ENUM_SEQ_DECL(
    ABI39_0_0YGOverflow,
    ABI39_0_0YGOverflowVisible,
    ABI39_0_0YGOverflowHidden,
    ABI39_0_0YGOverflowScroll)

ABI39_0_0YG_ENUM_SEQ_DECL(ABI39_0_0YGPositionType, ABI39_0_0YGPositionTypeRelative, ABI39_0_0YGPositionTypeAbsolute)

ABI39_0_0YG_ENUM_DECL(
    ABI39_0_0YGPrintOptions,
    ABI39_0_0YGPrintOptionsLayout = 1,
    ABI39_0_0YGPrintOptionsStyle = 2,
    ABI39_0_0YGPrintOptionsChildren = 4)

ABI39_0_0YG_ENUM_SEQ_DECL(
    ABI39_0_0YGUnit,
    ABI39_0_0YGUnitUndefined,
    ABI39_0_0YGUnitPoint,
    ABI39_0_0YGUnitPercent,
    ABI39_0_0YGUnitAuto)

ABI39_0_0YG_ENUM_SEQ_DECL(ABI39_0_0YGWrap, ABI39_0_0YGWrapNoWrap, ABI39_0_0YGWrapWrap, ABI39_0_0YGWrapWrapReverse)

ABI39_0_0YG_EXTERN_C_END

#undef ABI39_0_0YG_ENUM_DECL
#undef ABI39_0_0YG_ENUM_SEQ_DECL
