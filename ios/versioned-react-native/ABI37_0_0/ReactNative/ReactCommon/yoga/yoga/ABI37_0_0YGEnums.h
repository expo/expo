/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include "ABI37_0_0YGMacros.h"

#ifdef __cplusplus
namespace ABI37_0_0facebook {
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
} // namespace ABI37_0_0facebook
#endif

#define ABI37_0_0YG_ENUM_DECL(NAME, ...)                               \
  typedef ABI37_0_0YG_ENUM_BEGIN(NAME){__VA_ARGS__} ABI37_0_0YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

#ifdef __cplusplus
#define ABI37_0_0YG_ENUM_SEQ_DECL(NAME, ...)  \
  ABI37_0_0YG_ENUM_DECL(NAME, __VA_ARGS__)    \
  ABI37_0_0YG_EXTERN_C_END                    \
  namespace ABI37_0_0facebook {               \
  namespace yoga {                   \
  namespace enums {                  \
  template <>                        \
  constexpr int count<NAME>() {      \
    return detail::n<__VA_ARGS__>(); \
  }                                  \
  }                                  \
  }                                  \
  }                                  \
  ABI37_0_0YG_EXTERN_C_BEGIN
#else
#define ABI37_0_0YG_ENUM_SEQ_DECL ABI37_0_0YG_ENUM_DECL
#endif

ABI37_0_0YG_EXTERN_C_BEGIN

ABI37_0_0YG_ENUM_SEQ_DECL(
    ABI37_0_0YGAlign,
    ABI37_0_0YGAlignAuto,
    ABI37_0_0YGAlignFlexStart,
    ABI37_0_0YGAlignCenter,
    ABI37_0_0YGAlignFlexEnd,
    ABI37_0_0YGAlignStretch,
    ABI37_0_0YGAlignBaseline,
    ABI37_0_0YGAlignSpaceBetween,
    ABI37_0_0YGAlignSpaceAround);

ABI37_0_0YG_ENUM_SEQ_DECL(ABI37_0_0YGDimension, ABI37_0_0YGDimensionWidth, ABI37_0_0YGDimensionHeight)

ABI37_0_0YG_ENUM_SEQ_DECL(
    ABI37_0_0YGDirection,
    ABI37_0_0YGDirectionInherit,
    ABI37_0_0YGDirectionLTR,
    ABI37_0_0YGDirectionRTL)

ABI37_0_0YG_ENUM_SEQ_DECL(ABI37_0_0YGDisplay, ABI37_0_0YGDisplayFlex, ABI37_0_0YGDisplayNone)

ABI37_0_0YG_ENUM_SEQ_DECL(
    ABI37_0_0YGEdge,
    ABI37_0_0YGEdgeLeft,
    ABI37_0_0YGEdgeTop,
    ABI37_0_0YGEdgeRight,
    ABI37_0_0YGEdgeBottom,
    ABI37_0_0YGEdgeStart,
    ABI37_0_0YGEdgeEnd,
    ABI37_0_0YGEdgeHorizontal,
    ABI37_0_0YGEdgeVertical,
    ABI37_0_0YGEdgeAll)

ABI37_0_0YG_ENUM_SEQ_DECL(ABI37_0_0YGExperimentalFeature, ABI37_0_0YGExperimentalFeatureWebFlexBasis)

ABI37_0_0YG_ENUM_SEQ_DECL(
    ABI37_0_0YGFlexDirection,
    ABI37_0_0YGFlexDirectionColumn,
    ABI37_0_0YGFlexDirectionColumnReverse,
    ABI37_0_0YGFlexDirectionRow,
    ABI37_0_0YGFlexDirectionRowReverse)

ABI37_0_0YG_ENUM_SEQ_DECL(
    ABI37_0_0YGJustify,
    ABI37_0_0YGJustifyFlexStart,
    ABI37_0_0YGJustifyCenter,
    ABI37_0_0YGJustifyFlexEnd,
    ABI37_0_0YGJustifySpaceBetween,
    ABI37_0_0YGJustifySpaceAround,
    ABI37_0_0YGJustifySpaceEvenly)

ABI37_0_0YG_ENUM_SEQ_DECL(
    ABI37_0_0YGLogLevel,
    ABI37_0_0YGLogLevelError,
    ABI37_0_0YGLogLevelWarn,
    ABI37_0_0YGLogLevelInfo,
    ABI37_0_0YGLogLevelDebug,
    ABI37_0_0YGLogLevelVerbose,
    ABI37_0_0YGLogLevelFatal)

ABI37_0_0YG_ENUM_SEQ_DECL(
    ABI37_0_0YGMeasureMode,
    ABI37_0_0YGMeasureModeUndefined,
    ABI37_0_0YGMeasureModeExactly,
    ABI37_0_0YGMeasureModeAtMost)

ABI37_0_0YG_ENUM_SEQ_DECL(ABI37_0_0YGNodeType, ABI37_0_0YGNodeTypeDefault, ABI37_0_0YGNodeTypeText)

ABI37_0_0YG_ENUM_SEQ_DECL(
    ABI37_0_0YGOverflow,
    ABI37_0_0YGOverflowVisible,
    ABI37_0_0YGOverflowHidden,
    ABI37_0_0YGOverflowScroll)

ABI37_0_0YG_ENUM_SEQ_DECL(ABI37_0_0YGPositionType, ABI37_0_0YGPositionTypeRelative, ABI37_0_0YGPositionTypeAbsolute)

ABI37_0_0YG_ENUM_DECL(
    ABI37_0_0YGPrintOptions,
    ABI37_0_0YGPrintOptionsLayout = 1,
    ABI37_0_0YGPrintOptionsStyle = 2,
    ABI37_0_0YGPrintOptionsChildren = 4)

ABI37_0_0YG_ENUM_SEQ_DECL(
    ABI37_0_0YGUnit,
    ABI37_0_0YGUnitUndefined,
    ABI37_0_0YGUnitPoint,
    ABI37_0_0YGUnitPercent,
    ABI37_0_0YGUnitAuto)

ABI37_0_0YG_ENUM_SEQ_DECL(ABI37_0_0YGWrap, ABI37_0_0YGWrapNoWrap, ABI37_0_0YGWrapWrap, ABI37_0_0YGWrapWrapReverse)

ABI37_0_0YG_EXTERN_C_END

#undef ABI37_0_0YG_ENUM_DECL
#undef ABI37_0_0YG_ENUM_SEQ_DECL
