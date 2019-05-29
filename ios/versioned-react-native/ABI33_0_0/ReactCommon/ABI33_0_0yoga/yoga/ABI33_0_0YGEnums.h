/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include "ABI33_0_0YGMacros.h"

#ifdef __cplusplus
namespace facebook {
namespace ABI33_0_0yoga {
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
} // namespace ABI33_0_0yoga
} // namespace facebook
#endif

#define ABI33_0_0YG_ENUM_DECL(NAME, ...)                               \
  typedef ABI33_0_0YG_ENUM_BEGIN(NAME){__VA_ARGS__} ABI33_0_0YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

#ifdef __cplusplus
#define ABI33_0_0YG_ENUM_SEQ_DECL(NAME, ...)  \
  ABI33_0_0YG_ENUM_DECL(NAME, __VA_ARGS__)    \
  ABI33_0_0YG_EXTERN_C_END                    \
  namespace facebook {               \
  namespace ABI33_0_0yoga {                   \
  namespace enums {                  \
  template <>                        \
  constexpr int count<NAME>() {      \
    return detail::n<__VA_ARGS__>(); \
  }                                  \
  }                                  \
  }                                  \
  }                                  \
  ABI33_0_0YG_EXTERN_C_BEGIN
#else
#define ABI33_0_0YG_ENUM_SEQ_DECL ABI33_0_0YG_ENUM_DECL
#endif

ABI33_0_0YG_EXTERN_C_BEGIN

ABI33_0_0YG_ENUM_SEQ_DECL(
    ABI33_0_0YGAlign,
    ABI33_0_0YGAlignAuto,
    ABI33_0_0YGAlignFlexStart,
    ABI33_0_0YGAlignCenter,
    ABI33_0_0YGAlignFlexEnd,
    ABI33_0_0YGAlignStretch,
    ABI33_0_0YGAlignBaseline,
    ABI33_0_0YGAlignSpaceBetween,
    ABI33_0_0YGAlignSpaceAround);

ABI33_0_0YG_ENUM_SEQ_DECL(ABI33_0_0YGDimension, ABI33_0_0YGDimensionWidth, ABI33_0_0YGDimensionHeight)

ABI33_0_0YG_ENUM_SEQ_DECL(
    ABI33_0_0YGDirection,
    ABI33_0_0YGDirectionInherit,
    ABI33_0_0YGDirectionLTR,
    ABI33_0_0YGDirectionRTL)

ABI33_0_0YG_ENUM_SEQ_DECL(ABI33_0_0YGDisplay, ABI33_0_0YGDisplayFlex, ABI33_0_0YGDisplayNone)

ABI33_0_0YG_ENUM_SEQ_DECL(
    ABI33_0_0YGEdge,
    ABI33_0_0YGEdgeLeft,
    ABI33_0_0YGEdgeTop,
    ABI33_0_0YGEdgeRight,
    ABI33_0_0YGEdgeBottom,
    ABI33_0_0YGEdgeStart,
    ABI33_0_0YGEdgeEnd,
    ABI33_0_0YGEdgeHorizontal,
    ABI33_0_0YGEdgeVertical,
    ABI33_0_0YGEdgeAll)

ABI33_0_0YG_ENUM_SEQ_DECL(ABI33_0_0YGExperimentalFeature, ABI33_0_0YGExperimentalFeatureWebFlexBasis)

ABI33_0_0YG_ENUM_SEQ_DECL(
    ABI33_0_0YGFlexDirection,
    ABI33_0_0YGFlexDirectionColumn,
    ABI33_0_0YGFlexDirectionColumnReverse,
    ABI33_0_0YGFlexDirectionRow,
    ABI33_0_0YGFlexDirectionRowReverse)

ABI33_0_0YG_ENUM_SEQ_DECL(
    ABI33_0_0YGJustify,
    ABI33_0_0YGJustifyFlexStart,
    ABI33_0_0YGJustifyCenter,
    ABI33_0_0YGJustifyFlexEnd,
    ABI33_0_0YGJustifySpaceBetween,
    ABI33_0_0YGJustifySpaceAround,
    ABI33_0_0YGJustifySpaceEvenly)

ABI33_0_0YG_ENUM_SEQ_DECL(
    ABI33_0_0YGLogLevel,
    ABI33_0_0YGLogLevelError,
    ABI33_0_0YGLogLevelWarn,
    ABI33_0_0YGLogLevelInfo,
    ABI33_0_0YGLogLevelDebug,
    ABI33_0_0YGLogLevelVerbose,
    ABI33_0_0YGLogLevelFatal)

ABI33_0_0YG_ENUM_SEQ_DECL(
    ABI33_0_0YGMeasureMode,
    ABI33_0_0YGMeasureModeUndefined,
    ABI33_0_0YGMeasureModeExactly,
    ABI33_0_0YGMeasureModeAtMost)

ABI33_0_0YG_ENUM_SEQ_DECL(ABI33_0_0YGNodeType, ABI33_0_0YGNodeTypeDefault, ABI33_0_0YGNodeTypeText)

ABI33_0_0YG_ENUM_SEQ_DECL(
    ABI33_0_0YGOverflow,
    ABI33_0_0YGOverflowVisible,
    ABI33_0_0YGOverflowHidden,
    ABI33_0_0YGOverflowScroll)

ABI33_0_0YG_ENUM_SEQ_DECL(ABI33_0_0YGPositionType, ABI33_0_0YGPositionTypeRelative, ABI33_0_0YGPositionTypeAbsolute)

ABI33_0_0YG_ENUM_DECL(
    ABI33_0_0YGPrintOptions,
    ABI33_0_0YGPrintOptionsLayout = 1,
    ABI33_0_0YGPrintOptionsStyle = 2,
    ABI33_0_0YGPrintOptionsChildren = 4)

ABI33_0_0YG_ENUM_SEQ_DECL(
    ABI33_0_0YGUnit,
    ABI33_0_0YGUnitUndefined,
    ABI33_0_0YGUnitPoint,
    ABI33_0_0YGUnitPercent,
    ABI33_0_0YGUnitAuto)

ABI33_0_0YG_ENUM_SEQ_DECL(ABI33_0_0YGWrap, ABI33_0_0YGWrapNoWrap, ABI33_0_0YGWrapWrap, ABI33_0_0YGWrapWrapReverse)

ABI33_0_0YG_EXTERN_C_END

#undef ABI33_0_0YG_ENUM_DECL
#undef ABI33_0_0YG_ENUM_SEQ_DECL
