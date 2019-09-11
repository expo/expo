/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include "ABI35_0_0YGMacros.h"

#ifdef __cplusplus
namespace facebook {
namespace ABI35_0_0yoga {
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
} // namespace ABI35_0_0yoga
} // namespace facebook
#endif

#define ABI35_0_0YG_ENUM_DECL(NAME, ...)                               \
  typedef ABI35_0_0YG_ENUM_BEGIN(NAME){__VA_ARGS__} ABI35_0_0YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

#ifdef __cplusplus
#define ABI35_0_0YG_ENUM_SEQ_DECL(NAME, ...)  \
  ABI35_0_0YG_ENUM_DECL(NAME, __VA_ARGS__)    \
  ABI35_0_0YG_EXTERN_C_END                    \
  namespace facebook {               \
  namespace ABI35_0_0yoga {                   \
  namespace enums {                  \
  template <>                        \
  constexpr int count<NAME>() {      \
    return detail::n<__VA_ARGS__>(); \
  }                                  \
  }                                  \
  }                                  \
  }                                  \
  ABI35_0_0YG_EXTERN_C_BEGIN
#else
#define ABI35_0_0YG_ENUM_SEQ_DECL ABI35_0_0YG_ENUM_DECL
#endif

ABI35_0_0YG_EXTERN_C_BEGIN

ABI35_0_0YG_ENUM_SEQ_DECL(
    ABI35_0_0YGAlign,
    ABI35_0_0YGAlignAuto,
    ABI35_0_0YGAlignFlexStart,
    ABI35_0_0YGAlignCenter,
    ABI35_0_0YGAlignFlexEnd,
    ABI35_0_0YGAlignStretch,
    ABI35_0_0YGAlignBaseline,
    ABI35_0_0YGAlignSpaceBetween,
    ABI35_0_0YGAlignSpaceAround);

ABI35_0_0YG_ENUM_SEQ_DECL(ABI35_0_0YGDimension, ABI35_0_0YGDimensionWidth, ABI35_0_0YGDimensionHeight)

ABI35_0_0YG_ENUM_SEQ_DECL(
    ABI35_0_0YGDirection,
    ABI35_0_0YGDirectionInherit,
    ABI35_0_0YGDirectionLTR,
    ABI35_0_0YGDirectionRTL)

ABI35_0_0YG_ENUM_SEQ_DECL(ABI35_0_0YGDisplay, ABI35_0_0YGDisplayFlex, ABI35_0_0YGDisplayNone)

ABI35_0_0YG_ENUM_SEQ_DECL(
    ABI35_0_0YGEdge,
    ABI35_0_0YGEdgeLeft,
    ABI35_0_0YGEdgeTop,
    ABI35_0_0YGEdgeRight,
    ABI35_0_0YGEdgeBottom,
    ABI35_0_0YGEdgeStart,
    ABI35_0_0YGEdgeEnd,
    ABI35_0_0YGEdgeHorizontal,
    ABI35_0_0YGEdgeVertical,
    ABI35_0_0YGEdgeAll)

ABI35_0_0YG_ENUM_SEQ_DECL(ABI35_0_0YGExperimentalFeature, ABI35_0_0YGExperimentalFeatureWebFlexBasis)

ABI35_0_0YG_ENUM_SEQ_DECL(
    ABI35_0_0YGFlexDirection,
    ABI35_0_0YGFlexDirectionColumn,
    ABI35_0_0YGFlexDirectionColumnReverse,
    ABI35_0_0YGFlexDirectionRow,
    ABI35_0_0YGFlexDirectionRowReverse)

ABI35_0_0YG_ENUM_SEQ_DECL(
    ABI35_0_0YGJustify,
    ABI35_0_0YGJustifyFlexStart,
    ABI35_0_0YGJustifyCenter,
    ABI35_0_0YGJustifyFlexEnd,
    ABI35_0_0YGJustifySpaceBetween,
    ABI35_0_0YGJustifySpaceAround,
    ABI35_0_0YGJustifySpaceEvenly)

ABI35_0_0YG_ENUM_SEQ_DECL(
    ABI35_0_0YGLogLevel,
    ABI35_0_0YGLogLevelError,
    ABI35_0_0YGLogLevelWarn,
    ABI35_0_0YGLogLevelInfo,
    ABI35_0_0YGLogLevelDebug,
    ABI35_0_0YGLogLevelVerbose,
    ABI35_0_0YGLogLevelFatal)

ABI35_0_0YG_ENUM_SEQ_DECL(
    ABI35_0_0YGMeasureMode,
    ABI35_0_0YGMeasureModeUndefined,
    ABI35_0_0YGMeasureModeExactly,
    ABI35_0_0YGMeasureModeAtMost)

ABI35_0_0YG_ENUM_SEQ_DECL(ABI35_0_0YGNodeType, ABI35_0_0YGNodeTypeDefault, ABI35_0_0YGNodeTypeText)

ABI35_0_0YG_ENUM_SEQ_DECL(
    ABI35_0_0YGOverflow,
    ABI35_0_0YGOverflowVisible,
    ABI35_0_0YGOverflowHidden,
    ABI35_0_0YGOverflowScroll)

ABI35_0_0YG_ENUM_SEQ_DECL(ABI35_0_0YGPositionType, ABI35_0_0YGPositionTypeRelative, ABI35_0_0YGPositionTypeAbsolute)

ABI35_0_0YG_ENUM_DECL(
    ABI35_0_0YGPrintOptions,
    ABI35_0_0YGPrintOptionsLayout = 1,
    ABI35_0_0YGPrintOptionsStyle = 2,
    ABI35_0_0YGPrintOptionsChildren = 4)

ABI35_0_0YG_ENUM_SEQ_DECL(
    ABI35_0_0YGUnit,
    ABI35_0_0YGUnitUndefined,
    ABI35_0_0YGUnitPoint,
    ABI35_0_0YGUnitPercent,
    ABI35_0_0YGUnitAuto)

ABI35_0_0YG_ENUM_SEQ_DECL(ABI35_0_0YGWrap, ABI35_0_0YGWrapNoWrap, ABI35_0_0YGWrapWrap, ABI35_0_0YGWrapWrapReverse)

ABI35_0_0YG_EXTERN_C_END

#undef ABI35_0_0YG_ENUM_DECL
#undef ABI35_0_0YG_ENUM_SEQ_DECL
