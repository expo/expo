/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI42_0_0YGMacros.h"

#ifdef __cplusplus
namespace ABI42_0_0facebook {
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
} // namespace ABI42_0_0facebook
#endif

#define ABI42_0_0YG_ENUM_DECL(NAME, ...)                               \
  typedef ABI42_0_0YG_ENUM_BEGIN(NAME){__VA_ARGS__} ABI42_0_0YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

#ifdef __cplusplus
#define ABI42_0_0YG_ENUM_SEQ_DECL(NAME, ...)  \
  ABI42_0_0YG_ENUM_DECL(NAME, __VA_ARGS__)    \
  ABI42_0_0YG_EXTERN_C_END                    \
  namespace ABI42_0_0facebook {               \
  namespace yoga {                   \
  namespace enums {                  \
  template <>                        \
  constexpr int count<NAME>() {      \
    return detail::n<__VA_ARGS__>(); \
  }                                  \
  }                                  \
  }                                  \
  }                                  \
  ABI42_0_0YG_EXTERN_C_BEGIN
#else
#define ABI42_0_0YG_ENUM_SEQ_DECL ABI42_0_0YG_ENUM_DECL
#endif

ABI42_0_0YG_EXTERN_C_BEGIN

ABI42_0_0YG_ENUM_SEQ_DECL(
    ABI42_0_0YGAlign,
    ABI42_0_0YGAlignAuto,
    ABI42_0_0YGAlignFlexStart,
    ABI42_0_0YGAlignCenter,
    ABI42_0_0YGAlignFlexEnd,
    ABI42_0_0YGAlignStretch,
    ABI42_0_0YGAlignBaseline,
    ABI42_0_0YGAlignSpaceBetween,
    ABI42_0_0YGAlignSpaceAround);

ABI42_0_0YG_ENUM_SEQ_DECL(ABI42_0_0YGDimension, ABI42_0_0YGDimensionWidth, ABI42_0_0YGDimensionHeight)

ABI42_0_0YG_ENUM_SEQ_DECL(
    ABI42_0_0YGDirection,
    ABI42_0_0YGDirectionInherit,
    ABI42_0_0YGDirectionLTR,
    ABI42_0_0YGDirectionRTL)

ABI42_0_0YG_ENUM_SEQ_DECL(ABI42_0_0YGDisplay, ABI42_0_0YGDisplayFlex, ABI42_0_0YGDisplayNone)

ABI42_0_0YG_ENUM_SEQ_DECL(
    ABI42_0_0YGEdge,
    ABI42_0_0YGEdgeLeft,
    ABI42_0_0YGEdgeTop,
    ABI42_0_0YGEdgeRight,
    ABI42_0_0YGEdgeBottom,
    ABI42_0_0YGEdgeStart,
    ABI42_0_0YGEdgeEnd,
    ABI42_0_0YGEdgeHorizontal,
    ABI42_0_0YGEdgeVertical,
    ABI42_0_0YGEdgeAll)

ABI42_0_0YG_ENUM_SEQ_DECL(ABI42_0_0YGExperimentalFeature, ABI42_0_0YGExperimentalFeatureWebFlexBasis)

ABI42_0_0YG_ENUM_SEQ_DECL(
    ABI42_0_0YGFlexDirection,
    ABI42_0_0YGFlexDirectionColumn,
    ABI42_0_0YGFlexDirectionColumnReverse,
    ABI42_0_0YGFlexDirectionRow,
    ABI42_0_0YGFlexDirectionRowReverse)

ABI42_0_0YG_ENUM_SEQ_DECL(
    ABI42_0_0YGJustify,
    ABI42_0_0YGJustifyFlexStart,
    ABI42_0_0YGJustifyCenter,
    ABI42_0_0YGJustifyFlexEnd,
    ABI42_0_0YGJustifySpaceBetween,
    ABI42_0_0YGJustifySpaceAround,
    ABI42_0_0YGJustifySpaceEvenly)

ABI42_0_0YG_ENUM_SEQ_DECL(
    ABI42_0_0YGLogLevel,
    ABI42_0_0YGLogLevelError,
    ABI42_0_0YGLogLevelWarn,
    ABI42_0_0YGLogLevelInfo,
    ABI42_0_0YGLogLevelDebug,
    ABI42_0_0YGLogLevelVerbose,
    ABI42_0_0YGLogLevelFatal)

ABI42_0_0YG_ENUM_SEQ_DECL(
    ABI42_0_0YGMeasureMode,
    ABI42_0_0YGMeasureModeUndefined,
    ABI42_0_0YGMeasureModeExactly,
    ABI42_0_0YGMeasureModeAtMost)

ABI42_0_0YG_ENUM_SEQ_DECL(ABI42_0_0YGNodeType, ABI42_0_0YGNodeTypeDefault, ABI42_0_0YGNodeTypeText)

ABI42_0_0YG_ENUM_SEQ_DECL(
    ABI42_0_0YGOverflow,
    ABI42_0_0YGOverflowVisible,
    ABI42_0_0YGOverflowHidden,
    ABI42_0_0YGOverflowScroll)

ABI42_0_0YG_ENUM_SEQ_DECL(ABI42_0_0YGPositionType, ABI42_0_0YGPositionTypeRelative, ABI42_0_0YGPositionTypeAbsolute)

ABI42_0_0YG_ENUM_DECL(
    ABI42_0_0YGPrintOptions,
    ABI42_0_0YGPrintOptionsLayout = 1,
    ABI42_0_0YGPrintOptionsStyle = 2,
    ABI42_0_0YGPrintOptionsChildren = 4)

ABI42_0_0YG_ENUM_SEQ_DECL(
    ABI42_0_0YGUnit,
    ABI42_0_0YGUnitUndefined,
    ABI42_0_0YGUnitPoint,
    ABI42_0_0YGUnitPercent,
    ABI42_0_0YGUnitAuto)

ABI42_0_0YG_ENUM_SEQ_DECL(ABI42_0_0YGWrap, ABI42_0_0YGWrapNoWrap, ABI42_0_0YGWrapWrap, ABI42_0_0YGWrapWrapReverse)

ABI42_0_0YG_EXTERN_C_END

#undef ABI42_0_0YG_ENUM_DECL
#undef ABI42_0_0YG_ENUM_SEQ_DECL
