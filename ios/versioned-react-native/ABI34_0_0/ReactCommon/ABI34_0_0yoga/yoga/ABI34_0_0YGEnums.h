/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include "ABI34_0_0YGMacros.h"

#ifdef __cplusplus
namespace facebook {
namespace ABI34_0_0yoga {
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
} // namespace ABI34_0_0yoga
} // namespace facebook
#endif

#define ABI34_0_0YG_ENUM_DECL(NAME, ...)                               \
  typedef ABI34_0_0YG_ENUM_BEGIN(NAME){__VA_ARGS__} ABI34_0_0YG_ENUM_END(NAME); \
  WIN_EXPORT const char* NAME##ToString(NAME);

#ifdef __cplusplus
#define ABI34_0_0YG_ENUM_SEQ_DECL(NAME, ...)  \
  ABI34_0_0YG_ENUM_DECL(NAME, __VA_ARGS__)    \
  ABI34_0_0YG_EXTERN_C_END                    \
  namespace facebook {               \
  namespace ABI34_0_0yoga {                   \
  namespace enums {                  \
  template <>                        \
  constexpr int count<NAME>() {      \
    return detail::n<__VA_ARGS__>(); \
  }                                  \
  }                                  \
  }                                  \
  }                                  \
  ABI34_0_0YG_EXTERN_C_BEGIN
#else
#define ABI34_0_0YG_ENUM_SEQ_DECL ABI34_0_0YG_ENUM_DECL
#endif

ABI34_0_0YG_EXTERN_C_BEGIN

ABI34_0_0YG_ENUM_SEQ_DECL(
    ABI34_0_0YGAlign,
    ABI34_0_0YGAlignAuto,
    ABI34_0_0YGAlignFlexStart,
    ABI34_0_0YGAlignCenter,
    ABI34_0_0YGAlignFlexEnd,
    ABI34_0_0YGAlignStretch,
    ABI34_0_0YGAlignBaseline,
    ABI34_0_0YGAlignSpaceBetween,
    ABI34_0_0YGAlignSpaceAround);

ABI34_0_0YG_ENUM_SEQ_DECL(ABI34_0_0YGDimension, ABI34_0_0YGDimensionWidth, ABI34_0_0YGDimensionHeight)

ABI34_0_0YG_ENUM_SEQ_DECL(
    ABI34_0_0YGDirection,
    ABI34_0_0YGDirectionInherit,
    ABI34_0_0YGDirectionLTR,
    ABI34_0_0YGDirectionRTL)

ABI34_0_0YG_ENUM_SEQ_DECL(ABI34_0_0YGDisplay, ABI34_0_0YGDisplayFlex, ABI34_0_0YGDisplayNone)

ABI34_0_0YG_ENUM_SEQ_DECL(
    ABI34_0_0YGEdge,
    ABI34_0_0YGEdgeLeft,
    ABI34_0_0YGEdgeTop,
    ABI34_0_0YGEdgeRight,
    ABI34_0_0YGEdgeBottom,
    ABI34_0_0YGEdgeStart,
    ABI34_0_0YGEdgeEnd,
    ABI34_0_0YGEdgeHorizontal,
    ABI34_0_0YGEdgeVertical,
    ABI34_0_0YGEdgeAll)

ABI34_0_0YG_ENUM_SEQ_DECL(ABI34_0_0YGExperimentalFeature, ABI34_0_0YGExperimentalFeatureWebFlexBasis)

ABI34_0_0YG_ENUM_SEQ_DECL(
    ABI34_0_0YGFlexDirection,
    ABI34_0_0YGFlexDirectionColumn,
    ABI34_0_0YGFlexDirectionColumnReverse,
    ABI34_0_0YGFlexDirectionRow,
    ABI34_0_0YGFlexDirectionRowReverse)

ABI34_0_0YG_ENUM_SEQ_DECL(
    ABI34_0_0YGJustify,
    ABI34_0_0YGJustifyFlexStart,
    ABI34_0_0YGJustifyCenter,
    ABI34_0_0YGJustifyFlexEnd,
    ABI34_0_0YGJustifySpaceBetween,
    ABI34_0_0YGJustifySpaceAround,
    ABI34_0_0YGJustifySpaceEvenly)

ABI34_0_0YG_ENUM_SEQ_DECL(
    ABI34_0_0YGLogLevel,
    ABI34_0_0YGLogLevelError,
    ABI34_0_0YGLogLevelWarn,
    ABI34_0_0YGLogLevelInfo,
    ABI34_0_0YGLogLevelDebug,
    ABI34_0_0YGLogLevelVerbose,
    ABI34_0_0YGLogLevelFatal)

ABI34_0_0YG_ENUM_SEQ_DECL(
    ABI34_0_0YGMeasureMode,
    ABI34_0_0YGMeasureModeUndefined,
    ABI34_0_0YGMeasureModeExactly,
    ABI34_0_0YGMeasureModeAtMost)

ABI34_0_0YG_ENUM_SEQ_DECL(ABI34_0_0YGNodeType, ABI34_0_0YGNodeTypeDefault, ABI34_0_0YGNodeTypeText)

ABI34_0_0YG_ENUM_SEQ_DECL(
    ABI34_0_0YGOverflow,
    ABI34_0_0YGOverflowVisible,
    ABI34_0_0YGOverflowHidden,
    ABI34_0_0YGOverflowScroll)

ABI34_0_0YG_ENUM_SEQ_DECL(ABI34_0_0YGPositionType, ABI34_0_0YGPositionTypeRelative, ABI34_0_0YGPositionTypeAbsolute)

ABI34_0_0YG_ENUM_DECL(
    ABI34_0_0YGPrintOptions,
    ABI34_0_0YGPrintOptionsLayout = 1,
    ABI34_0_0YGPrintOptionsStyle = 2,
    ABI34_0_0YGPrintOptionsChildren = 4)

ABI34_0_0YG_ENUM_SEQ_DECL(
    ABI34_0_0YGUnit,
    ABI34_0_0YGUnitUndefined,
    ABI34_0_0YGUnitPoint,
    ABI34_0_0YGUnitPercent,
    ABI34_0_0YGUnitAuto)

ABI34_0_0YG_ENUM_SEQ_DECL(ABI34_0_0YGWrap, ABI34_0_0YGWrapNoWrap, ABI34_0_0YGWrapWrap, ABI34_0_0YGWrapWrapReverse)

ABI34_0_0YG_EXTERN_C_END

#undef ABI34_0_0YG_ENUM_DECL
#undef ABI34_0_0YG_ENUM_SEQ_DECL
