/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI43_0_0YGMacros.h"

#ifdef __cplusplus
namespace ABI43_0_0facebook {
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
} // namespace ABI43_0_0facebook
#endif

#define ABI43_0_0YG_ENUM_DECL(NAME, ...)                               \
  typedef ABI43_0_0YG_ENUM_BEGIN(NAME){__VA_ARGS__} ABI43_0_0YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

#ifdef __cplusplus
#define ABI43_0_0YG_ENUM_SEQ_DECL(NAME, ...)  \
  ABI43_0_0YG_ENUM_DECL(NAME, __VA_ARGS__)    \
  ABI43_0_0YG_EXTERN_C_END                    \
  namespace ABI43_0_0facebook {               \
  namespace yoga {                   \
  namespace enums {                  \
  template <>                        \
  constexpr int count<NAME>() {      \
    return detail::n<__VA_ARGS__>(); \
  }                                  \
  }                                  \
  }                                  \
  }                                  \
  ABI43_0_0YG_EXTERN_C_BEGIN
#else
#define ABI43_0_0YG_ENUM_SEQ_DECL ABI43_0_0YG_ENUM_DECL
#endif

ABI43_0_0YG_EXTERN_C_BEGIN

ABI43_0_0YG_ENUM_SEQ_DECL(
    ABI43_0_0YGAlign,
    ABI43_0_0YGAlignAuto,
    ABI43_0_0YGAlignFlexStart,
    ABI43_0_0YGAlignCenter,
    ABI43_0_0YGAlignFlexEnd,
    ABI43_0_0YGAlignStretch,
    ABI43_0_0YGAlignBaseline,
    ABI43_0_0YGAlignSpaceBetween,
    ABI43_0_0YGAlignSpaceAround);

ABI43_0_0YG_ENUM_SEQ_DECL(ABI43_0_0YGDimension, ABI43_0_0YGDimensionWidth, ABI43_0_0YGDimensionHeight)

ABI43_0_0YG_ENUM_SEQ_DECL(
    ABI43_0_0YGDirection,
    ABI43_0_0YGDirectionInherit,
    ABI43_0_0YGDirectionLTR,
    ABI43_0_0YGDirectionRTL)

ABI43_0_0YG_ENUM_SEQ_DECL(ABI43_0_0YGDisplay, ABI43_0_0YGDisplayFlex, ABI43_0_0YGDisplayNone)

ABI43_0_0YG_ENUM_SEQ_DECL(
    ABI43_0_0YGEdge,
    ABI43_0_0YGEdgeLeft,
    ABI43_0_0YGEdgeTop,
    ABI43_0_0YGEdgeRight,
    ABI43_0_0YGEdgeBottom,
    ABI43_0_0YGEdgeStart,
    ABI43_0_0YGEdgeEnd,
    ABI43_0_0YGEdgeHorizontal,
    ABI43_0_0YGEdgeVertical,
    ABI43_0_0YGEdgeAll)

ABI43_0_0YG_ENUM_SEQ_DECL(ABI43_0_0YGExperimentalFeature, ABI43_0_0YGExperimentalFeatureWebFlexBasis)

ABI43_0_0YG_ENUM_SEQ_DECL(
    ABI43_0_0YGFlexDirection,
    ABI43_0_0YGFlexDirectionColumn,
    ABI43_0_0YGFlexDirectionColumnReverse,
    ABI43_0_0YGFlexDirectionRow,
    ABI43_0_0YGFlexDirectionRowReverse)

ABI43_0_0YG_ENUM_SEQ_DECL(
    ABI43_0_0YGJustify,
    ABI43_0_0YGJustifyFlexStart,
    ABI43_0_0YGJustifyCenter,
    ABI43_0_0YGJustifyFlexEnd,
    ABI43_0_0YGJustifySpaceBetween,
    ABI43_0_0YGJustifySpaceAround,
    ABI43_0_0YGJustifySpaceEvenly)

ABI43_0_0YG_ENUM_SEQ_DECL(
    ABI43_0_0YGLogLevel,
    ABI43_0_0YGLogLevelError,
    ABI43_0_0YGLogLevelWarn,
    ABI43_0_0YGLogLevelInfo,
    ABI43_0_0YGLogLevelDebug,
    ABI43_0_0YGLogLevelVerbose,
    ABI43_0_0YGLogLevelFatal)

ABI43_0_0YG_ENUM_SEQ_DECL(
    ABI43_0_0YGMeasureMode,
    ABI43_0_0YGMeasureModeUndefined,
    ABI43_0_0YGMeasureModeExactly,
    ABI43_0_0YGMeasureModeAtMost)

ABI43_0_0YG_ENUM_SEQ_DECL(ABI43_0_0YGNodeType, ABI43_0_0YGNodeTypeDefault, ABI43_0_0YGNodeTypeText)

ABI43_0_0YG_ENUM_SEQ_DECL(
    ABI43_0_0YGOverflow,
    ABI43_0_0YGOverflowVisible,
    ABI43_0_0YGOverflowHidden,
    ABI43_0_0YGOverflowScroll)

ABI43_0_0YG_ENUM_SEQ_DECL(
    ABI43_0_0YGPositionType,
    ABI43_0_0YGPositionTypeStatic,
    ABI43_0_0YGPositionTypeRelative,
    ABI43_0_0YGPositionTypeAbsolute)

ABI43_0_0YG_ENUM_DECL(
    ABI43_0_0YGPrintOptions,
    ABI43_0_0YGPrintOptionsLayout = 1,
    ABI43_0_0YGPrintOptionsStyle = 2,
    ABI43_0_0YGPrintOptionsChildren = 4)

ABI43_0_0YG_ENUM_SEQ_DECL(
    ABI43_0_0YGUnit,
    ABI43_0_0YGUnitUndefined,
    ABI43_0_0YGUnitPoint,
    ABI43_0_0YGUnitPercent,
    ABI43_0_0YGUnitAuto)

ABI43_0_0YG_ENUM_SEQ_DECL(ABI43_0_0YGWrap, ABI43_0_0YGWrapNoWrap, ABI43_0_0YGWrapWrap, ABI43_0_0YGWrapWrapReverse)

ABI43_0_0YG_EXTERN_C_END

#undef ABI43_0_0YG_ENUM_DECL
#undef ABI43_0_0YG_ENUM_SEQ_DECL
