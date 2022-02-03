/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI44_0_0YGMacros.h"

#ifdef __cplusplus
namespace ABI44_0_0facebook {
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
} // namespace ABI44_0_0facebook
#endif

#define ABI44_0_0YG_ENUM_DECL(NAME, ...)                               \
  typedef ABI44_0_0YG_ENUM_BEGIN(NAME){__VA_ARGS__} ABI44_0_0YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

#ifdef __cplusplus
#define ABI44_0_0YG_ENUM_SEQ_DECL(NAME, ...)  \
  ABI44_0_0YG_ENUM_DECL(NAME, __VA_ARGS__)    \
  ABI44_0_0YG_EXTERN_C_END                    \
  namespace ABI44_0_0facebook {               \
  namespace yoga {                   \
  namespace enums {                  \
  template <>                        \
  constexpr int count<NAME>() {      \
    return detail::n<__VA_ARGS__>(); \
  }                                  \
  }                                  \
  }                                  \
  }                                  \
  ABI44_0_0YG_EXTERN_C_BEGIN
#else
#define ABI44_0_0YG_ENUM_SEQ_DECL ABI44_0_0YG_ENUM_DECL
#endif

ABI44_0_0YG_EXTERN_C_BEGIN

ABI44_0_0YG_ENUM_SEQ_DECL(
    ABI44_0_0YGAlign,
    ABI44_0_0YGAlignAuto,
    ABI44_0_0YGAlignFlexStart,
    ABI44_0_0YGAlignCenter,
    ABI44_0_0YGAlignFlexEnd,
    ABI44_0_0YGAlignStretch,
    ABI44_0_0YGAlignBaseline,
    ABI44_0_0YGAlignSpaceBetween,
    ABI44_0_0YGAlignSpaceAround);

ABI44_0_0YG_ENUM_SEQ_DECL(ABI44_0_0YGDimension, ABI44_0_0YGDimensionWidth, ABI44_0_0YGDimensionHeight)

ABI44_0_0YG_ENUM_SEQ_DECL(
    ABI44_0_0YGDirection,
    ABI44_0_0YGDirectionInherit,
    ABI44_0_0YGDirectionLTR,
    ABI44_0_0YGDirectionRTL)

ABI44_0_0YG_ENUM_SEQ_DECL(ABI44_0_0YGDisplay, ABI44_0_0YGDisplayFlex, ABI44_0_0YGDisplayNone)

ABI44_0_0YG_ENUM_SEQ_DECL(
    ABI44_0_0YGEdge,
    ABI44_0_0YGEdgeLeft,
    ABI44_0_0YGEdgeTop,
    ABI44_0_0YGEdgeRight,
    ABI44_0_0YGEdgeBottom,
    ABI44_0_0YGEdgeStart,
    ABI44_0_0YGEdgeEnd,
    ABI44_0_0YGEdgeHorizontal,
    ABI44_0_0YGEdgeVertical,
    ABI44_0_0YGEdgeAll)

ABI44_0_0YG_ENUM_SEQ_DECL(ABI44_0_0YGExperimentalFeature, ABI44_0_0YGExperimentalFeatureWebFlexBasis)

ABI44_0_0YG_ENUM_SEQ_DECL(
    ABI44_0_0YGFlexDirection,
    ABI44_0_0YGFlexDirectionColumn,
    ABI44_0_0YGFlexDirectionColumnReverse,
    ABI44_0_0YGFlexDirectionRow,
    ABI44_0_0YGFlexDirectionRowReverse)

ABI44_0_0YG_ENUM_SEQ_DECL(
    ABI44_0_0YGJustify,
    ABI44_0_0YGJustifyFlexStart,
    ABI44_0_0YGJustifyCenter,
    ABI44_0_0YGJustifyFlexEnd,
    ABI44_0_0YGJustifySpaceBetween,
    ABI44_0_0YGJustifySpaceAround,
    ABI44_0_0YGJustifySpaceEvenly)

ABI44_0_0YG_ENUM_SEQ_DECL(
    ABI44_0_0YGLogLevel,
    ABI44_0_0YGLogLevelError,
    ABI44_0_0YGLogLevelWarn,
    ABI44_0_0YGLogLevelInfo,
    ABI44_0_0YGLogLevelDebug,
    ABI44_0_0YGLogLevelVerbose,
    ABI44_0_0YGLogLevelFatal)

ABI44_0_0YG_ENUM_SEQ_DECL(
    ABI44_0_0YGMeasureMode,
    ABI44_0_0YGMeasureModeUndefined,
    ABI44_0_0YGMeasureModeExactly,
    ABI44_0_0YGMeasureModeAtMost)

ABI44_0_0YG_ENUM_SEQ_DECL(ABI44_0_0YGNodeType, ABI44_0_0YGNodeTypeDefault, ABI44_0_0YGNodeTypeText)

ABI44_0_0YG_ENUM_SEQ_DECL(
    ABI44_0_0YGOverflow,
    ABI44_0_0YGOverflowVisible,
    ABI44_0_0YGOverflowHidden,
    ABI44_0_0YGOverflowScroll)

ABI44_0_0YG_ENUM_SEQ_DECL(
    ABI44_0_0YGPositionType,
    ABI44_0_0YGPositionTypeStatic,
    ABI44_0_0YGPositionTypeRelative,
    ABI44_0_0YGPositionTypeAbsolute)

ABI44_0_0YG_ENUM_DECL(
    ABI44_0_0YGPrintOptions,
    ABI44_0_0YGPrintOptionsLayout = 1,
    ABI44_0_0YGPrintOptionsStyle = 2,
    ABI44_0_0YGPrintOptionsChildren = 4)

ABI44_0_0YG_ENUM_SEQ_DECL(
    ABI44_0_0YGUnit,
    ABI44_0_0YGUnitUndefined,
    ABI44_0_0YGUnitPoint,
    ABI44_0_0YGUnitPercent,
    ABI44_0_0YGUnitAuto)

ABI44_0_0YG_ENUM_SEQ_DECL(ABI44_0_0YGWrap, ABI44_0_0YGWrapNoWrap, ABI44_0_0YGWrapWrap, ABI44_0_0YGWrapWrapReverse)

ABI44_0_0YG_EXTERN_C_END

#undef ABI44_0_0YG_ENUM_DECL
#undef ABI44_0_0YG_ENUM_SEQ_DECL
