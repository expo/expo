/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ABI41_0_0YGMacros.h"

#ifdef __cplusplus
namespace ABI41_0_0facebook {
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
} // namespace ABI41_0_0facebook
#endif

#define ABI41_0_0YG_ENUM_DECL(NAME, ...)                               \
  typedef ABI41_0_0YG_ENUM_BEGIN(NAME){__VA_ARGS__} ABI41_0_0YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

#ifdef __cplusplus
#define ABI41_0_0YG_ENUM_SEQ_DECL(NAME, ...)  \
  ABI41_0_0YG_ENUM_DECL(NAME, __VA_ARGS__)    \
  ABI41_0_0YG_EXTERN_C_END                    \
  namespace ABI41_0_0facebook {               \
  namespace yoga {                   \
  namespace enums {                  \
  template <>                        \
  constexpr int count<NAME>() {      \
    return detail::n<__VA_ARGS__>(); \
  }                                  \
  }                                  \
  }                                  \
  }                                  \
  ABI41_0_0YG_EXTERN_C_BEGIN
#else
#define ABI41_0_0YG_ENUM_SEQ_DECL ABI41_0_0YG_ENUM_DECL
#endif

ABI41_0_0YG_EXTERN_C_BEGIN

ABI41_0_0YG_ENUM_SEQ_DECL(
    ABI41_0_0YGAlign,
    ABI41_0_0YGAlignAuto,
    ABI41_0_0YGAlignFlexStart,
    ABI41_0_0YGAlignCenter,
    ABI41_0_0YGAlignFlexEnd,
    ABI41_0_0YGAlignStretch,
    ABI41_0_0YGAlignBaseline,
    ABI41_0_0YGAlignSpaceBetween,
    ABI41_0_0YGAlignSpaceAround);

ABI41_0_0YG_ENUM_SEQ_DECL(ABI41_0_0YGDimension, ABI41_0_0YGDimensionWidth, ABI41_0_0YGDimensionHeight)

ABI41_0_0YG_ENUM_SEQ_DECL(
    ABI41_0_0YGDirection,
    ABI41_0_0YGDirectionInherit,
    ABI41_0_0YGDirectionLTR,
    ABI41_0_0YGDirectionRTL)

ABI41_0_0YG_ENUM_SEQ_DECL(ABI41_0_0YGDisplay, ABI41_0_0YGDisplayFlex, ABI41_0_0YGDisplayNone)

ABI41_0_0YG_ENUM_SEQ_DECL(
    ABI41_0_0YGEdge,
    ABI41_0_0YGEdgeLeft,
    ABI41_0_0YGEdgeTop,
    ABI41_0_0YGEdgeRight,
    ABI41_0_0YGEdgeBottom,
    ABI41_0_0YGEdgeStart,
    ABI41_0_0YGEdgeEnd,
    ABI41_0_0YGEdgeHorizontal,
    ABI41_0_0YGEdgeVertical,
    ABI41_0_0YGEdgeAll)

ABI41_0_0YG_ENUM_SEQ_DECL(ABI41_0_0YGExperimentalFeature, ABI41_0_0YGExperimentalFeatureWebFlexBasis)

ABI41_0_0YG_ENUM_SEQ_DECL(
    ABI41_0_0YGFlexDirection,
    ABI41_0_0YGFlexDirectionColumn,
    ABI41_0_0YGFlexDirectionColumnReverse,
    ABI41_0_0YGFlexDirectionRow,
    ABI41_0_0YGFlexDirectionRowReverse)

ABI41_0_0YG_ENUM_SEQ_DECL(
    ABI41_0_0YGJustify,
    ABI41_0_0YGJustifyFlexStart,
    ABI41_0_0YGJustifyCenter,
    ABI41_0_0YGJustifyFlexEnd,
    ABI41_0_0YGJustifySpaceBetween,
    ABI41_0_0YGJustifySpaceAround,
    ABI41_0_0YGJustifySpaceEvenly)

ABI41_0_0YG_ENUM_SEQ_DECL(
    ABI41_0_0YGLogLevel,
    ABI41_0_0YGLogLevelError,
    ABI41_0_0YGLogLevelWarn,
    ABI41_0_0YGLogLevelInfo,
    ABI41_0_0YGLogLevelDebug,
    ABI41_0_0YGLogLevelVerbose,
    ABI41_0_0YGLogLevelFatal)

ABI41_0_0YG_ENUM_SEQ_DECL(
    ABI41_0_0YGMeasureMode,
    ABI41_0_0YGMeasureModeUndefined,
    ABI41_0_0YGMeasureModeExactly,
    ABI41_0_0YGMeasureModeAtMost)

ABI41_0_0YG_ENUM_SEQ_DECL(ABI41_0_0YGNodeType, ABI41_0_0YGNodeTypeDefault, ABI41_0_0YGNodeTypeText)

ABI41_0_0YG_ENUM_SEQ_DECL(
    ABI41_0_0YGOverflow,
    ABI41_0_0YGOverflowVisible,
    ABI41_0_0YGOverflowHidden,
    ABI41_0_0YGOverflowScroll)

ABI41_0_0YG_ENUM_SEQ_DECL(ABI41_0_0YGPositionType, ABI41_0_0YGPositionTypeRelative, ABI41_0_0YGPositionTypeAbsolute)

ABI41_0_0YG_ENUM_DECL(
    ABI41_0_0YGPrintOptions,
    ABI41_0_0YGPrintOptionsLayout = 1,
    ABI41_0_0YGPrintOptionsStyle = 2,
    ABI41_0_0YGPrintOptionsChildren = 4)

ABI41_0_0YG_ENUM_SEQ_DECL(
    ABI41_0_0YGUnit,
    ABI41_0_0YGUnitUndefined,
    ABI41_0_0YGUnitPoint,
    ABI41_0_0YGUnitPercent,
    ABI41_0_0YGUnitAuto)

ABI41_0_0YG_ENUM_SEQ_DECL(ABI41_0_0YGWrap, ABI41_0_0YGWrapNoWrap, ABI41_0_0YGWrapWrap, ABI41_0_0YGWrapWrapReverse)

ABI41_0_0YG_EXTERN_C_END

#undef ABI41_0_0YG_ENUM_DECL
#undef ABI41_0_0YG_ENUM_SEQ_DECL
