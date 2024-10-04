/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0YGEnums.h"

const char* ABI47_0_0YGAlignToString(const ABI47_0_0YGAlign value) {
  switch (value) {
    case ABI47_0_0YGAlignAuto:
      return "auto";
    case ABI47_0_0YGAlignFlexStart:
      return "flex-start";
    case ABI47_0_0YGAlignCenter:
      return "center";
    case ABI47_0_0YGAlignFlexEnd:
      return "flex-end";
    case ABI47_0_0YGAlignStretch:
      return "stretch";
    case ABI47_0_0YGAlignBaseline:
      return "baseline";
    case ABI47_0_0YGAlignSpaceBetween:
      return "space-between";
    case ABI47_0_0YGAlignSpaceAround:
      return "space-around";
  }
  return "unknown";
}

const char* ABI47_0_0YGDimensionToString(const ABI47_0_0YGDimension value) {
  switch (value) {
    case ABI47_0_0YGDimensionWidth:
      return "width";
    case ABI47_0_0YGDimensionHeight:
      return "height";
  }
  return "unknown";
}

const char* ABI47_0_0YGDirectionToString(const ABI47_0_0YGDirection value) {
  switch (value) {
    case ABI47_0_0YGDirectionInherit:
      return "inherit";
    case ABI47_0_0YGDirectionLTR:
      return "ltr";
    case ABI47_0_0YGDirectionRTL:
      return "rtl";
  }
  return "unknown";
}

const char* ABI47_0_0YGDisplayToString(const ABI47_0_0YGDisplay value) {
  switch (value) {
    case ABI47_0_0YGDisplayFlex:
      return "flex";
    case ABI47_0_0YGDisplayNone:
      return "none";
  }
  return "unknown";
}

const char* ABI47_0_0YGEdgeToString(const ABI47_0_0YGEdge value) {
  switch (value) {
    case ABI47_0_0YGEdgeLeft:
      return "left";
    case ABI47_0_0YGEdgeTop:
      return "top";
    case ABI47_0_0YGEdgeRight:
      return "right";
    case ABI47_0_0YGEdgeBottom:
      return "bottom";
    case ABI47_0_0YGEdgeStart:
      return "start";
    case ABI47_0_0YGEdgeEnd:
      return "end";
    case ABI47_0_0YGEdgeHorizontal:
      return "horizontal";
    case ABI47_0_0YGEdgeVertical:
      return "vertical";
    case ABI47_0_0YGEdgeAll:
      return "all";
  }
  return "unknown";
}

const char* ABI47_0_0YGExperimentalFeatureToString(const ABI47_0_0YGExperimentalFeature value) {
  switch (value) {
    case ABI47_0_0YGExperimentalFeatureWebFlexBasis:
      return "web-flex-basis";
  }
  return "unknown";
}

const char* ABI47_0_0YGFlexDirectionToString(const ABI47_0_0YGFlexDirection value) {
  switch (value) {
    case ABI47_0_0YGFlexDirectionColumn:
      return "column";
    case ABI47_0_0YGFlexDirectionColumnReverse:
      return "column-reverse";
    case ABI47_0_0YGFlexDirectionRow:
      return "row";
    case ABI47_0_0YGFlexDirectionRowReverse:
      return "row-reverse";
  }
  return "unknown";
}

const char* ABI47_0_0YGJustifyToString(const ABI47_0_0YGJustify value) {
  switch (value) {
    case ABI47_0_0YGJustifyFlexStart:
      return "flex-start";
    case ABI47_0_0YGJustifyCenter:
      return "center";
    case ABI47_0_0YGJustifyFlexEnd:
      return "flex-end";
    case ABI47_0_0YGJustifySpaceBetween:
      return "space-between";
    case ABI47_0_0YGJustifySpaceAround:
      return "space-around";
    case ABI47_0_0YGJustifySpaceEvenly:
      return "space-evenly";
  }
  return "unknown";
}

const char* ABI47_0_0YGLogLevelToString(const ABI47_0_0YGLogLevel value) {
  switch (value) {
    case ABI47_0_0YGLogLevelError:
      return "error";
    case ABI47_0_0YGLogLevelWarn:
      return "warn";
    case ABI47_0_0YGLogLevelInfo:
      return "info";
    case ABI47_0_0YGLogLevelDebug:
      return "debug";
    case ABI47_0_0YGLogLevelVerbose:
      return "verbose";
    case ABI47_0_0YGLogLevelFatal:
      return "fatal";
  }
  return "unknown";
}

const char* ABI47_0_0YGMeasureModeToString(const ABI47_0_0YGMeasureMode value) {
  switch (value) {
    case ABI47_0_0YGMeasureModeUndefined:
      return "undefined";
    case ABI47_0_0YGMeasureModeExactly:
      return "exactly";
    case ABI47_0_0YGMeasureModeAtMost:
      return "at-most";
  }
  return "unknown";
}

const char* ABI47_0_0YGNodeTypeToString(const ABI47_0_0YGNodeType value) {
  switch (value) {
    case ABI47_0_0YGNodeTypeDefault:
      return "default";
    case ABI47_0_0YGNodeTypeText:
      return "text";
  }
  return "unknown";
}

const char* ABI47_0_0YGOverflowToString(const ABI47_0_0YGOverflow value) {
  switch (value) {
    case ABI47_0_0YGOverflowVisible:
      return "visible";
    case ABI47_0_0YGOverflowHidden:
      return "hidden";
    case ABI47_0_0YGOverflowScroll:
      return "scroll";
  }
  return "unknown";
}

const char* ABI47_0_0YGPositionTypeToString(const ABI47_0_0YGPositionType value) {
  switch (value) {
    case ABI47_0_0YGPositionTypeStatic:
      return "static";
    case ABI47_0_0YGPositionTypeRelative:
      return "relative";
    case ABI47_0_0YGPositionTypeAbsolute:
      return "absolute";
  }
  return "unknown";
}

const char* ABI47_0_0YGPrintOptionsToString(const ABI47_0_0YGPrintOptions value) {
  switch (value) {
    case ABI47_0_0YGPrintOptionsLayout:
      return "layout";
    case ABI47_0_0YGPrintOptionsStyle:
      return "style";
    case ABI47_0_0YGPrintOptionsChildren:
      return "children";
  }
  return "unknown";
}

const char* ABI47_0_0YGUnitToString(const ABI47_0_0YGUnit value) {
  switch (value) {
    case ABI47_0_0YGUnitUndefined:
      return "undefined";
    case ABI47_0_0YGUnitPoint:
      return "point";
    case ABI47_0_0YGUnitPercent:
      return "percent";
    case ABI47_0_0YGUnitAuto:
      return "auto";
  }
  return "unknown";
}

const char* ABI47_0_0YGWrapToString(const ABI47_0_0YGWrap value) {
  switch (value) {
    case ABI47_0_0YGWrapNoWrap:
      return "no-wrap";
    case ABI47_0_0YGWrapWrap:
      return "wrap";
    case ABI47_0_0YGWrapWrapReverse:
      return "wrap-reverse";
  }
  return "unknown";
}
