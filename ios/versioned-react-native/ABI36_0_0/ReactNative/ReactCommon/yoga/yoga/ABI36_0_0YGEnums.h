/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include "ABI36_0_0YGMacros.h"

#ifdef __cplusplus
namespace ABI36_0_0facebook {
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
} // namespace ABI36_0_0facebook
#endif

#define ABI36_0_0YG_ENUM_DECL(NAME, ...)                               \
  typedef ABI36_0_0YG_ENUM_BEGIN(NAME){__VA_ARGS__} ABI36_0_0YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

#ifdef __cplusplus
#define ABI36_0_0YG_ENUM_SEQ_DECL(NAME, ...)  \
  ABI36_0_0YG_ENUM_DECL(NAME, __VA_ARGS__)    \
  ABI36_0_0YG_EXTERN_C_END                    \
  namespace ABI36_0_0facebook {               \
  namespace yoga {                   \
  namespace enums {                  \
  template <>                        \
  constexpr int count<NAME>() {      \
    return detail::n<__VA_ARGS__>(); \
  }                                  \
  }                                  \
  }                                  \
  }                                  \
  ABI36_0_0YG_EXTERN_C_BEGIN
#else
#define ABI36_0_0YG_ENUM_SEQ_DECL ABI36_0_0YG_ENUM_DECL
#endif

ABI36_0_0YG_EXTERN_C_BEGIN

ABI36_0_0YG_ENUM_SEQ_DECL(
    ABI36_0_0YGAlign,
    ABI36_0_0YGAlignAuto,
    ABI36_0_0YGAlignFlexStart,
    ABI36_0_0YGAlignCenter,
    ABI36_0_0YGAlignFlexEnd,
    ABI36_0_0YGAlignStretch,
    ABI36_0_0YGAlignBaseline,
    ABI36_0_0YGAlignSpaceBetween,
    ABI36_0_0YGAlignSpaceAround);

ABI36_0_0YG_ENUM_SEQ_DECL(ABI36_0_0YGDimension, ABI36_0_0YGDimensionWidth, ABI36_0_0YGDimensionHeight)

ABI36_0_0YG_ENUM_SEQ_DECL(
    ABI36_0_0YGDirection,
    ABI36_0_0YGDirectionInherit,
    ABI36_0_0YGDirectionLTR,
    ABI36_0_0YGDirectionRTL)

ABI36_0_0YG_ENUM_SEQ_DECL(ABI36_0_0YGDisplay, ABI36_0_0YGDisplayFlex, ABI36_0_0YGDisplayNone)

ABI36_0_0YG_ENUM_SEQ_DECL(
    ABI36_0_0YGEdge,
    ABI36_0_0YGEdgeLeft,
    ABI36_0_0YGEdgeTop,
    ABI36_0_0YGEdgeRight,
    ABI36_0_0YGEdgeBottom,
    ABI36_0_0YGEdgeStart,
    ABI36_0_0YGEdgeEnd,
    ABI36_0_0YGEdgeHorizontal,
    ABI36_0_0YGEdgeVertical,
    ABI36_0_0YGEdgeAll)

ABI36_0_0YG_ENUM_SEQ_DECL(ABI36_0_0YGExperimentalFeature, ABI36_0_0YGExperimentalFeatureWebFlexBasis)

ABI36_0_0YG_ENUM_SEQ_DECL(
    ABI36_0_0YGFlexDirection,
    ABI36_0_0YGFlexDirectionColumn,
    ABI36_0_0YGFlexDirectionColumnReverse,
    ABI36_0_0YGFlexDirectionRow,
    ABI36_0_0YGFlexDirectionRowReverse)

ABI36_0_0YG_ENUM_SEQ_DECL(
    ABI36_0_0YGJustify,
    ABI36_0_0YGJustifyFlexStart,
    ABI36_0_0YGJustifyCenter,
    ABI36_0_0YGJustifyFlexEnd,
    ABI36_0_0YGJustifySpaceBetween,
    ABI36_0_0YGJustifySpaceAround,
    ABI36_0_0YGJustifySpaceEvenly)

ABI36_0_0YG_ENUM_SEQ_DECL(
    ABI36_0_0YGLogLevel,
    ABI36_0_0YGLogLevelError,
    ABI36_0_0YGLogLevelWarn,
    ABI36_0_0YGLogLevelInfo,
    ABI36_0_0YGLogLevelDebug,
    ABI36_0_0YGLogLevelVerbose,
    ABI36_0_0YGLogLevelFatal)

ABI36_0_0YG_ENUM_SEQ_DECL(
    ABI36_0_0YGMeasureMode,
    ABI36_0_0YGMeasureModeUndefined,
    ABI36_0_0YGMeasureModeExactly,
    ABI36_0_0YGMeasureModeAtMost)

ABI36_0_0YG_ENUM_SEQ_DECL(ABI36_0_0YGNodeType, ABI36_0_0YGNodeTypeDefault, ABI36_0_0YGNodeTypeText)

ABI36_0_0YG_ENUM_SEQ_DECL(
    ABI36_0_0YGOverflow,
    ABI36_0_0YGOverflowVisible,
    ABI36_0_0YGOverflowHidden,
    ABI36_0_0YGOverflowScroll)

ABI36_0_0YG_ENUM_SEQ_DECL(ABI36_0_0YGPositionType, ABI36_0_0YGPositionTypeRelative, ABI36_0_0YGPositionTypeAbsolute)

ABI36_0_0YG_ENUM_DECL(
    ABI36_0_0YGPrintOptions,
    ABI36_0_0YGPrintOptionsLayout = 1,
    ABI36_0_0YGPrintOptionsStyle = 2,
    ABI36_0_0YGPrintOptionsChildren = 4)

ABI36_0_0YG_ENUM_SEQ_DECL(
    ABI36_0_0YGUnit,
    ABI36_0_0YGUnitUndefined,
    ABI36_0_0YGUnitPoint,
    ABI36_0_0YGUnitPercent,
    ABI36_0_0YGUnitAuto)

ABI36_0_0YG_ENUM_SEQ_DECL(ABI36_0_0YGWrap, ABI36_0_0YGWrapNoWrap, ABI36_0_0YGWrapWrap, ABI36_0_0YGWrapWrapReverse)

ABI36_0_0YG_EXTERN_C_END

#undef ABI36_0_0YG_ENUM_DECL
#undef ABI36_0_0YG_ENUM_SEQ_DECL
