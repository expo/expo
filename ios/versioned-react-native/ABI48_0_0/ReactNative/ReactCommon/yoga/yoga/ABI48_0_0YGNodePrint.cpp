/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef DEBUG
#include "ABI48_0_0YGNodePrint.h"
#include <stdarg.h>
#include "ABI48_0_0YGEnums.h"
#include "ABI48_0_0YGNode.h"
#include "ABI48_0_0Yoga-internal.h"
#include "ABI48_0_0Utils.h"

namespace ABI48_0_0facebook {
namespace yoga {
typedef std::string string;

static void indent(string& base, uint32_t level) {
  for (uint32_t i = 0; i < level; ++i) {
    base.append("  ");
  }
}

static bool areFourValuesEqual(const ABI48_0_0YGStyle::Edges& four) {
  return ABI48_0_0YGValueEqual(four[0], four[1]) && ABI48_0_0YGValueEqual(four[0], four[2]) &&
      ABI48_0_0YGValueEqual(four[0], four[3]);
}

static void appendFormatedString(string& str, const char* fmt, ...) {
  va_list args;
  va_start(args, fmt);
  va_list argsCopy;
  va_copy(argsCopy, args);
  std::vector<char> buf(1 + vsnprintf(NULL, 0, fmt, args));
  va_end(args);
  vsnprintf(buf.data(), buf.size(), fmt, argsCopy);
  va_end(argsCopy);
  string result = string(buf.begin(), buf.end() - 1);
  str.append(result);
}

static void appendFloatOptionalIfDefined(
    string& base,
    const string key,
    const ABI48_0_0YGFloatOptional num) {
  if (!num.isUndefined()) {
    appendFormatedString(base, "%s: %g; ", key.c_str(), num.unwrap());
  }
}

static void appendNumberIfNotUndefined(
    string& base,
    const string key,
    const ABI48_0_0YGValue number) {
  if (number.unit != ABI48_0_0YGUnitUndefined) {
    if (number.unit == ABI48_0_0YGUnitAuto) {
      base.append(key + ": auto; ");
    } else {
      string unit = number.unit == ABI48_0_0YGUnitPoint ? "px" : "%%";
      appendFormatedString(
          base, "%s: %g%s; ", key.c_str(), number.value, unit.c_str());
    }
  }
}

static void appendNumberIfNotAuto(
    string& base,
    const string& key,
    const ABI48_0_0YGValue number) {
  if (number.unit != ABI48_0_0YGUnitAuto) {
    appendNumberIfNotUndefined(base, key, number);
  }
}

static void appendNumberIfNotZero(
    string& base,
    const string& str,
    const ABI48_0_0YGValue number) {
  if (number.unit == ABI48_0_0YGUnitAuto) {
    base.append(str + ": auto; ");
  } else if (!ABI48_0_0YGFloatsEqual(number.value, 0)) {
    appendNumberIfNotUndefined(base, str, number);
  }
}

static void appendEdges(
    string& base,
    const string& key,
    const ABI48_0_0YGStyle::Edges& edges) {
  if (areFourValuesEqual(edges)) {
    appendNumberIfNotZero(base, key, edges[ABI48_0_0YGEdgeLeft]);
  } else {
    for (int edge = ABI48_0_0YGEdgeLeft; edge != ABI48_0_0YGEdgeAll; ++edge) {
      string str = key + "-" + ABI48_0_0YGEdgeToString(static_cast<ABI48_0_0YGEdge>(edge));
      appendNumberIfNotZero(base, str, edges[edge]);
    }
  }
}

static void appendEdgeIfNotUndefined(
    string& base,
    const string& str,
    const ABI48_0_0YGStyle::Edges& edges,
    const ABI48_0_0YGEdge edge) {
  // TODO: this doesn't take RTL / ABI48_0_0YGEdgeStart / ABI48_0_0YGEdgeEnd into account
  auto value = (edge == ABI48_0_0YGEdgeLeft || edge == ABI48_0_0YGEdgeRight)
      ? ABI48_0_0YGNode::computeEdgeValueForRow(
            edges, edge, edge, detail::CompactValue::ofUndefined())
      : ABI48_0_0YGNode::computeEdgeValueForColumn(
            edges, edge, detail::CompactValue::ofUndefined());
  appendNumberIfNotUndefined(base, str, value);
}

void ABI48_0_0YGNodeToString(
    std::string& str,
    ABI48_0_0YGNodeRef node,
    ABI48_0_0YGPrintOptions options,
    uint32_t level) {
  indent(str, level);
  appendFormatedString(str, "<div ");

  if (options & ABI48_0_0YGPrintOptionsLayout) {
    appendFormatedString(str, "layout=\"");
    appendFormatedString(
        str, "width: %g; ", node->getLayout().dimensions[ABI48_0_0YGDimensionWidth]);
    appendFormatedString(
        str, "height: %g; ", node->getLayout().dimensions[ABI48_0_0YGDimensionHeight]);
    appendFormatedString(
        str, "top: %g; ", node->getLayout().position[ABI48_0_0YGEdgeTop]);
    appendFormatedString(
        str, "left: %g;", node->getLayout().position[ABI48_0_0YGEdgeLeft]);
    appendFormatedString(str, "\" ");
  }

  if (options & ABI48_0_0YGPrintOptionsStyle) {
    appendFormatedString(str, "style=\"");
    const auto& style = node->getStyle();
    if (style.flexDirection() != ABI48_0_0YGNode().getStyle().flexDirection()) {
      appendFormatedString(
          str,
          "flex-direction: %s; ",
          ABI48_0_0YGFlexDirectionToString(style.flexDirection()));
    }
    if (style.justifyContent() != ABI48_0_0YGNode().getStyle().justifyContent()) {
      appendFormatedString(
          str,
          "justify-content: %s; ",
          ABI48_0_0YGJustifyToString(style.justifyContent()));
    }
    if (style.alignItems() != ABI48_0_0YGNode().getStyle().alignItems()) {
      appendFormatedString(
          str, "align-items: %s; ", ABI48_0_0YGAlignToString(style.alignItems()));
    }
    if (style.alignContent() != ABI48_0_0YGNode().getStyle().alignContent()) {
      appendFormatedString(
          str, "align-content: %s; ", ABI48_0_0YGAlignToString(style.alignContent()));
    }
    if (style.alignSelf() != ABI48_0_0YGNode().getStyle().alignSelf()) {
      appendFormatedString(
          str, "align-self: %s; ", ABI48_0_0YGAlignToString(style.alignSelf()));
    }
    appendFloatOptionalIfDefined(str, "flex-grow", style.flexGrow());
    appendFloatOptionalIfDefined(str, "flex-shrink", style.flexShrink());
    appendNumberIfNotAuto(str, "flex-basis", style.flexBasis());
    appendFloatOptionalIfDefined(str, "flex", style.flex());

    if (style.flexWrap() != ABI48_0_0YGNode().getStyle().flexWrap()) {
      appendFormatedString(
          str, "flex-wrap: %s; ", ABI48_0_0YGWrapToString(style.flexWrap()));
    }

    if (style.overflow() != ABI48_0_0YGNode().getStyle().overflow()) {
      appendFormatedString(
          str, "overflow: %s; ", ABI48_0_0YGOverflowToString(style.overflow()));
    }

    if (style.display() != ABI48_0_0YGNode().getStyle().display()) {
      appendFormatedString(
          str, "display: %s; ", ABI48_0_0YGDisplayToString(style.display()));
    }
    appendEdges(str, "margin", style.margin());
    appendEdges(str, "padding", style.padding());
    appendEdges(str, "border", style.border());

    if (ABI48_0_0YGNode::computeColumnGap(
            style.gap(), detail::CompactValue::ofUndefined()) !=
        ABI48_0_0YGNode::computeColumnGap(
            ABI48_0_0YGNode().getStyle().gap(), detail::CompactValue::ofUndefined())) {
      appendNumberIfNotUndefined(
          str, "column-gap", style.gap()[ABI48_0_0YGGutterColumn]);
    }
    if (ABI48_0_0YGNode::computeRowGap(
            style.gap(), detail::CompactValue::ofUndefined()) !=
        ABI48_0_0YGNode::computeRowGap(
            ABI48_0_0YGNode().getStyle().gap(), detail::CompactValue::ofUndefined())) {
      appendNumberIfNotUndefined(str, "row-gap", style.gap()[ABI48_0_0YGGutterRow]);
    }

    appendNumberIfNotAuto(str, "width", style.dimensions()[ABI48_0_0YGDimensionWidth]);
    appendNumberIfNotAuto(str, "height", style.dimensions()[ABI48_0_0YGDimensionHeight]);
    appendNumberIfNotAuto(
        str, "max-width", style.maxDimensions()[ABI48_0_0YGDimensionWidth]);
    appendNumberIfNotAuto(
        str, "max-height", style.maxDimensions()[ABI48_0_0YGDimensionHeight]);
    appendNumberIfNotAuto(
        str, "min-width", style.minDimensions()[ABI48_0_0YGDimensionWidth]);
    appendNumberIfNotAuto(
        str, "min-height", style.minDimensions()[ABI48_0_0YGDimensionHeight]);

    if (style.positionType() != ABI48_0_0YGNode().getStyle().positionType()) {
      appendFormatedString(
          str, "position: %s; ", ABI48_0_0YGPositionTypeToString(style.positionType()));
    }

    appendEdgeIfNotUndefined(str, "left", style.position(), ABI48_0_0YGEdgeLeft);
    appendEdgeIfNotUndefined(str, "right", style.position(), ABI48_0_0YGEdgeRight);
    appendEdgeIfNotUndefined(str, "top", style.position(), ABI48_0_0YGEdgeTop);
    appendEdgeIfNotUndefined(str, "bottom", style.position(), ABI48_0_0YGEdgeBottom);
    appendFormatedString(str, "\" ");

    if (node->hasMeasureFunc()) {
      appendFormatedString(str, "has-custom-measure=\"true\"");
    }
  }
  appendFormatedString(str, ">");

  const uint32_t childCount = static_cast<uint32_t>(node->getChildren().size());
  if (options & ABI48_0_0YGPrintOptionsChildren && childCount > 0) {
    for (uint32_t i = 0; i < childCount; i++) {
      appendFormatedString(str, "\n");
      ABI48_0_0YGNodeToString(str, ABI48_0_0YGNodeGetChild(node, i), options, level + 1);
    }
    appendFormatedString(str, "\n");
    indent(str, level);
  }
  appendFormatedString(str, "</div>");
}
} // namespace yoga
} // namespace ABI48_0_0facebook
#endif
