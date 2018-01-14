/*
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "ABI25_0_0YGNodePrint.h"
#include <stdarg.h>
#include "ABI25_0_0YGEnums.h"
#include "ABI25_0_0Yoga-internal.h"

namespace facebook {
namespace yoga {
typedef std::string string;

static void indent(string* base, uint32_t level) {
  for (uint32_t i = 0; i < level; ++i) {
    base->append("  ");
  }
}

static bool areFourValuesEqual(const ABI25_0_0YGValue four[4]) {
  return ABI25_0_0YGValueEqual(four[0], four[1]) && ABI25_0_0YGValueEqual(four[0], four[2]) &&
      ABI25_0_0YGValueEqual(four[0], four[3]);
}

static void appendFormatedString(string* str, const char* fmt, ...) {
  char buffer[1024];
  va_list args;
  va_start(args, fmt);
  va_list argsCopy;
  va_copy(argsCopy, args);
  va_end(args);
  vsnprintf(buffer, 1024, fmt, argsCopy);
  va_end(argsCopy);
  string result = string(buffer);
  str->append(result);
}

static void
appendFloatIfNotUndefined(string* base, const string key, const float num) {
  if (!ABI25_0_0YGFloatIsUndefined(num)) {
    appendFormatedString(base, "%s: %g; ", key.c_str(), num);
  }
}

static void appendNumberIfNotUndefined(
    string* base,
    const string key,
    const ABI25_0_0YGValue* const number) {
  if (number->unit != ABI25_0_0YGUnitUndefined) {
    if (number->unit == ABI25_0_0YGUnitAuto) {
      base->append(key + ": auto; ");
    } else {
      string unit = number->unit == ABI25_0_0YGUnitPoint ? "px" : "%%";
      appendFormatedString(
          base, "%s: %g%s; ", key.c_str(), number->value, unit.c_str());
    }
  }
}

static void appendNumberIfNotAuto(
    string* base,
    const string key,
    const ABI25_0_0YGValue* const number) {
  if (number->unit != ABI25_0_0YGUnitAuto) {
    appendNumberIfNotUndefined(base, key, number);
  }
}

static void appendNumberIfNotZero(
    string* base,
    const string str,
    const ABI25_0_0YGValue* const number) {
  if (!ABI25_0_0YGFloatsEqual(number->value, 0)) {
    appendNumberIfNotUndefined(base, str, number);
  }
}

static void appendEdges(string* base, const string key, const ABI25_0_0YGValue* edges) {
  if (areFourValuesEqual(edges)) {
    appendNumberIfNotZero(base, key, &edges[ABI25_0_0YGEdgeLeft]);
  } else {
    for (int edge = ABI25_0_0YGEdgeLeft; edge != ABI25_0_0YGEdgeAll; ++edge) {
      string str = key + "-" + ABI25_0_0YGEdgeToString(static_cast<ABI25_0_0YGEdge>(edge));
      appendNumberIfNotZero(base, str, &edges[edge]);
    }
  }
}

static void appendEdgeIfNotUndefined(
    string* base,
    const string str,
    const ABI25_0_0YGValue* edges,
    const ABI25_0_0YGEdge edge) {
  appendNumberIfNotUndefined(
      base, str, ABI25_0_0YGComputedEdgeValue(edges, edge, &ABI25_0_0YGValueUndefined));
}

void ABI25_0_0YGNodeToString(
    std::string* str,
    ABI25_0_0YGNodeRef node,
    ABI25_0_0YGPrintOptions options,
    uint32_t level) {
  indent(str, level);
  appendFormatedString(str, "<div ");
  if (node->print != nullptr) {
    node->print(node);
  }

  if (options & ABI25_0_0YGPrintOptionsLayout) {
    appendFormatedString(str, "layout=\"");
    appendFormatedString(
        str, "width: %g; ", node->layout.dimensions[ABI25_0_0YGDimensionWidth]);
    appendFormatedString(
        str, "height: %g; ", node->layout.dimensions[ABI25_0_0YGDimensionHeight]);
    appendFormatedString(str, "top: %g; ", node->layout.position[ABI25_0_0YGEdgeTop]);
    appendFormatedString(str, "left: %g;", node->layout.position[ABI25_0_0YGEdgeLeft]);
    appendFormatedString(str, "\" ");
  }

  if (options & ABI25_0_0YGPrintOptionsStyle) {
    appendFormatedString(str, "style=\"");
    if (node->style.flexDirection != gABI25_0_0YGNodeDefaults.style.flexDirection) {
      appendFormatedString(
          str,
          "flex-direction: %s; ",
          ABI25_0_0YGFlexDirectionToString(node->style.flexDirection));
    }
    if (node->style.justifyContent != gABI25_0_0YGNodeDefaults.style.justifyContent) {
      appendFormatedString(
          str,
          "justify-content: %s; ",
          ABI25_0_0YGJustifyToString(node->style.justifyContent));
    }
    if (node->style.alignItems != gABI25_0_0YGNodeDefaults.style.alignItems) {
      appendFormatedString(
          str, "align-items: %s; ", ABI25_0_0YGAlignToString(node->style.alignItems));
    }
    if (node->style.alignContent != gABI25_0_0YGNodeDefaults.style.alignContent) {
      appendFormatedString(
          str,
          "align-content: %s; ",
          ABI25_0_0YGAlignToString(node->style.alignContent));
    }
    if (node->style.alignSelf != gABI25_0_0YGNodeDefaults.style.alignSelf) {
      appendFormatedString(
          str, "align-self: %s; ", ABI25_0_0YGAlignToString(node->style.alignSelf));
    }
    appendFloatIfNotUndefined(str, "flex-grow", node->style.flexGrow);
    appendFloatIfNotUndefined(str, "flex-shrink", node->style.flexShrink);
    appendNumberIfNotAuto(str, "flex-basis", &node->style.flexBasis);
    appendFloatIfNotUndefined(str, "flex", node->style.flex);

    if (node->style.flexWrap != gABI25_0_0YGNodeDefaults.style.flexWrap) {
      appendFormatedString(
          str, "flexWrap: %s; ", ABI25_0_0YGWrapToString(node->style.flexWrap));
    }

    if (node->style.overflow != gABI25_0_0YGNodeDefaults.style.overflow) {
      appendFormatedString(
          str, "overflow: %s; ", ABI25_0_0YGOverflowToString(node->style.overflow));
    }

    if (node->style.display != gABI25_0_0YGNodeDefaults.style.display) {
      appendFormatedString(
          str, "display: %s; ", ABI25_0_0YGDisplayToString(node->style.display));
    }
    appendEdges(str, "margin", node->style.margin);
    appendEdges(str, "padding", node->style.padding);
    appendEdges(str, "border", node->style.border);

    appendNumberIfNotAuto(
        str, "width", &node->style.dimensions[ABI25_0_0YGDimensionWidth]);
    appendNumberIfNotAuto(
        str, "height", &node->style.dimensions[ABI25_0_0YGDimensionHeight]);
    appendNumberIfNotAuto(
        str, "max-width", &node->style.maxDimensions[ABI25_0_0YGDimensionWidth]);
    appendNumberIfNotAuto(
        str, "max-height", &node->style.maxDimensions[ABI25_0_0YGDimensionHeight]);
    appendNumberIfNotAuto(
        str, "min-width", &node->style.minDimensions[ABI25_0_0YGDimensionWidth]);
    appendNumberIfNotAuto(
        str, "min-height", &node->style.minDimensions[ABI25_0_0YGDimensionHeight]);

    if (node->style.positionType != gABI25_0_0YGNodeDefaults.style.positionType) {
      appendFormatedString(
          str,
          "position: %s; ",
          ABI25_0_0YGPositionTypeToString(node->style.positionType));
    }

    appendEdgeIfNotUndefined(str, "left", node->style.position, ABI25_0_0YGEdgeLeft);
    appendEdgeIfNotUndefined(str, "right", node->style.position, ABI25_0_0YGEdgeRight);
    appendEdgeIfNotUndefined(str, "top", node->style.position, ABI25_0_0YGEdgeTop);
    appendEdgeIfNotUndefined(str, "bottom", node->style.position, ABI25_0_0YGEdgeBottom);
    appendFormatedString(str, "\" ");

    if (node->measure != nullptr) {
      appendFormatedString(str, "has-custom-measure=\"true\"");
    }
  }
  appendFormatedString(str, ">");

  const uint32_t childCount = (uint32_t) node->children.size();
  if (options & ABI25_0_0YGPrintOptionsChildren && childCount > 0) {
    for (uint32_t i = 0; i < childCount; i++) {
      appendFormatedString(str, "\n");
      ABI25_0_0YGNodeToString(str, ABI25_0_0YGNodeGetChild(node, i), options, level + 1);
    }
    appendFormatedString(str, "\n");
    indent(str, level);
  }
  appendFormatedString(str, "</div>");
}
} // namespace yoga
} // namespace facebook
