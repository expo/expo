/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI38_0_0YGMacros.h"

#ifdef __cplusplus
namespace ABI38_0_0facebook {
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
} // namespace ABI38_0_0facebook
#endif

#define ABI38_0_0YG_ENUM_DECL(NAME, ...)                               \
  typedef ABI38_0_0YG_ENUM_BEGIN(NAME){__VA_ARGS__} ABI38_0_0YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

#ifdef __cplusplus
#define ABI38_0_0YG_ENUM_SEQ_DECL(NAME, ...)  \
  ABI38_0_0YG_ENUM_DECL(NAME, __VA_ARGS__)    \
  ABI38_0_0YG_EXTERN_C_END                    \
  namespace ABI38_0_0facebook {               \
  namespace yoga {                   \
  namespace enums {                  \
  template <>                        \
  constexpr int count<NAME>() {      \
    return detail::n<__VA_ARGS__>(); \
  }                                  \
  }                                  \
  }                                  \
  }                                  \
  ABI38_0_0YG_EXTERN_C_BEGIN
#else
#define ABI38_0_0YG_ENUM_SEQ_DECL ABI38_0_0YG_ENUM_DECL
#endif

ABI38_0_0YG_EXTERN_C_BEGIN

ABI38_0_0YG_ENUM_SEQ_DECL(
    ABI38_0_0YGAlign,
    ABI38_0_0YGAlignAuto,
    ABI38_0_0YGAlignFlexStart,
    ABI38_0_0YGAlignCenter,
    ABI38_0_0YGAlignFlexEnd,
    ABI38_0_0YGAlignStretch,
    ABI38_0_0YGAlignBaseline,
    ABI38_0_0YGAlignSpaceBetween,
    ABI38_0_0YGAlignSpaceAround);

ABI38_0_0YG_ENUM_SEQ_DECL(ABI38_0_0YGDimension, ABI38_0_0YGDimensionWidth, ABI38_0_0YGDimensionHeight)

ABI38_0_0YG_ENUM_SEQ_DECL(
    ABI38_0_0YGDirection,
    ABI38_0_0YGDirectionInherit,
    ABI38_0_0YGDirectionLTR,
    ABI38_0_0YGDirectionRTL)

ABI38_0_0YG_ENUM_SEQ_DECL(ABI38_0_0YGDisplay, ABI38_0_0YGDisplayFlex, ABI38_0_0YGDisplayNone)

ABI38_0_0YG_ENUM_SEQ_DECL(
    ABI38_0_0YGEdge,
    ABI38_0_0YGEdgeLeft,
    ABI38_0_0YGEdgeTop,
    ABI38_0_0YGEdgeRight,
    ABI38_0_0YGEdgeBottom,
    ABI38_0_0YGEdgeStart,
    ABI38_0_0YGEdgeEnd,
    ABI38_0_0YGEdgeHorizontal,
    ABI38_0_0YGEdgeVertical,
    ABI38_0_0YGEdgeAll)

ABI38_0_0YG_ENUM_SEQ_DECL(ABI38_0_0YGExperimentalFeature, ABI38_0_0YGExperimentalFeatureWebFlexBasis)

ABI38_0_0YG_ENUM_SEQ_DECL(
    ABI38_0_0YGFlexDirection,
    ABI38_0_0YGFlexDirectionColumn,
    ABI38_0_0YGFlexDirectionColumnReverse,
    ABI38_0_0YGFlexDirectionRow,
    ABI38_0_0YGFlexDirectionRowReverse)

ABI38_0_0YG_ENUM_SEQ_DECL(
    ABI38_0_0YGJustify,
    ABI38_0_0YGJustifyFlexStart,
    ABI38_0_0YGJustifyCenter,
    ABI38_0_0YGJustifyFlexEnd,
    ABI38_0_0YGJustifySpaceBetween,
    ABI38_0_0YGJustifySpaceAround,
    ABI38_0_0YGJustifySpaceEvenly)

ABI38_0_0YG_ENUM_SEQ_DECL(
    ABI38_0_0YGLogLevel,
    ABI38_0_0YGLogLevelError,
    ABI38_0_0YGLogLevelWarn,
    ABI38_0_0YGLogLevelInfo,
    ABI38_0_0YGLogLevelDebug,
    ABI38_0_0YGLogLevelVerbose,
    ABI38_0_0YGLogLevelFatal)

ABI38_0_0YG_ENUM_SEQ_DECL(
    ABI38_0_0YGMeasureMode,
    ABI38_0_0YGMeasureModeUndefined,
    ABI38_0_0YGMeasureModeExactly,
    ABI38_0_0YGMeasureModeAtMost)

ABI38_0_0YG_ENUM_SEQ_DECL(ABI38_0_0YGNodeType, ABI38_0_0YGNodeTypeDefault, ABI38_0_0YGNodeTypeText)

ABI38_0_0YG_ENUM_SEQ_DECL(
    ABI38_0_0YGOverflow,
    ABI38_0_0YGOverflowVisible,
    ABI38_0_0YGOverflowHidden,
    ABI38_0_0YGOverflowScroll)

ABI38_0_0YG_ENUM_SEQ_DECL(ABI38_0_0YGPositionType, ABI38_0_0YGPositionTypeRelative, ABI38_0_0YGPositionTypeAbsolute)

ABI38_0_0YG_ENUM_DECL(
    ABI38_0_0YGPrintOptions,
    ABI38_0_0YGPrintOptionsLayout = 1,
    ABI38_0_0YGPrintOptionsStyle = 2,
    ABI38_0_0YGPrintOptionsChildren = 4)

ABI38_0_0YG_ENUM_SEQ_DECL(
    ABI38_0_0YGUnit,
    ABI38_0_0YGUnitUndefined,
    ABI38_0_0YGUnitPoint,
    ABI38_0_0YGUnitPercent,
    ABI38_0_0YGUnitAuto)

ABI38_0_0YG_ENUM_SEQ_DECL(ABI38_0_0YGWrap, ABI38_0_0YGWrapNoWrap, ABI38_0_0YGWrapWrap, ABI38_0_0YGWrapWrapReverse)

ABI38_0_0YG_EXTERN_C_END

#undef ABI38_0_0YG_ENUM_DECL
#undef ABI38_0_0YG_ENUM_SEQ_DECL
