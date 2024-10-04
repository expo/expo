/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Conv.h>
#include <folly/dynamic.h>
#include <ABI44_0_0React/ABI44_0_0renderer/attributedstring/AttributedString.h>
#include <ABI44_0_0React/ABI44_0_0renderer/attributedstring/ParagraphAttributes.h>
#include <ABI44_0_0React/ABI44_0_0renderer/attributedstring/TextAttributes.h>
#include <ABI44_0_0React/ABI44_0_0renderer/attributedstring/conversions.h>
#include <ABI44_0_0React/ABI44_0_0renderer/attributedstring/primitives.h>
#include <ABI44_0_0React/ABI44_0_0renderer/core/LayoutableShadowNode.h>
#include <ABI44_0_0React/ABI44_0_0renderer/core/ShadowNode.h>
#include <ABI44_0_0React/ABI44_0_0renderer/core/conversions.h>
#include <ABI44_0_0React/ABI44_0_0renderer/core/propsConversions.h>
#include <ABI44_0_0React/ABI44_0_0renderer/graphics/Geometry.h>
#include <ABI44_0_0React/ABI44_0_0renderer/graphics/conversions.h>
#include <cmath>

#include <glog/logging.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

inline std::string toString(const EllipsizeMode &ellipsisMode) {
  switch (ellipsisMode) {
    case EllipsizeMode::Clip:
      return "clip";
    case EllipsizeMode::Head:
      return "head";
    case EllipsizeMode::Tail:
      return "tail";
    case EllipsizeMode::Middle:
      return "middle";
  }
}

inline void fromRawValue(const RawValue &value, EllipsizeMode &result) {
  auto string = (std::string)value;
  if (string == "clip") {
    result = EllipsizeMode::Clip;
    return;
  }
  if (string == "head") {
    result = EllipsizeMode::Head;
    return;
  }
  if (string == "tail") {
    result = EllipsizeMode::Tail;
    return;
  }
  if (string == "middle") {
    result = EllipsizeMode::Middle;
    return;
  }
  abort();
}

inline std::string toString(const TextBreakStrategy &textBreakStrategy) {
  switch (textBreakStrategy) {
    case TextBreakStrategy::Simple:
      return "simple";
    case TextBreakStrategy::HighQuality:
      return "highQuality";
    case TextBreakStrategy::Balanced:
      return "balanced";
  }
}

inline void fromRawValue(const RawValue &value, TextBreakStrategy &result) {
  auto string = (std::string)value;
  if (string == "simple") {
    result = TextBreakStrategy::Simple;
    return;
  }
  if (string == "highQuality") {
    result = TextBreakStrategy::HighQuality;
    return;
  }
  if (string == "balanced") {
    result = TextBreakStrategy::Balanced;
    return;
  }
  abort();
}

inline void fromRawValue(const RawValue &value, FontWeight &result) {
  auto string = (std::string)value;
  if (string == "normal") {
    result = FontWeight::Regular;
    return;
  }
  if (string == "regular") {
    result = FontWeight::Regular;
    return;
  }
  if (string == "bold") {
    result = FontWeight::Bold;
    return;
  }
  if (string == "100") {
    result = FontWeight::Weight100;
    return;
  }
  if (string == "200") {
    result = FontWeight::Weight200;
    return;
  }
  if (string == "300") {
    result = FontWeight::Weight300;
    return;
  }
  if (string == "400") {
    result = FontWeight::Weight400;
    return;
  }
  if (string == "500") {
    result = FontWeight::Weight500;
    return;
  }
  if (string == "600") {
    result = FontWeight::Weight600;
    return;
  }
  if (string == "700") {
    result = FontWeight::Weight700;
    return;
  }
  if (string == "800") {
    result = FontWeight::Weight800;
    return;
  }
  if (string == "900") {
    result = FontWeight::Weight900;
    return;
  }
  abort();
}

inline std::string toString(const FontWeight &fontWeight) {
  return folly::to<std::string>((int)fontWeight);
}

inline void fromRawValue(const RawValue &value, FontStyle &result) {
  auto string = (std::string)value;
  if (string == "normal") {
    result = FontStyle::Normal;
    return;
  }
  if (string == "italic") {
    result = FontStyle::Italic;
    return;
  }
  if (string == "oblique") {
    result = FontStyle::Oblique;
    return;
  }
  abort();
}

inline std::string toString(const FontStyle &fontStyle) {
  switch (fontStyle) {
    case FontStyle::Normal:
      return "normal";
    case FontStyle::Italic:
      return "italic";
    case FontStyle::Oblique:
      return "oblique";
  }
}

inline void fromRawValue(const RawValue &value, FontVariant &result) {
  assert(value.hasType<std::vector<std::string>>());
  result = FontVariant::Default;
  auto items = std::vector<std::string>{value};
  for (const auto &item : items) {
    if (item == "small-caps") {
      result = (FontVariant)((int)result | (int)FontVariant::SmallCaps);
      continue;
    }
    if (item == "oldstyle-nums") {
      result = (FontVariant)((int)result | (int)FontVariant::OldstyleNums);
      continue;
    }
    if (item == "lining-nums") {
      result = (FontVariant)((int)result | (int)FontVariant::LiningNums);
      continue;
    }
    if (item == "tabular-nums") {
      result = (FontVariant)((int)result | (int)FontVariant::TabularNums);
      continue;
    }
    if (item == "proportional-nums") {
      result = (FontVariant)((int)result | (int)FontVariant::ProportionalNums);
      continue;
    }
  }
}

inline std::string toString(const FontVariant &fontVariant) {
  auto result = std::string{};
  auto separator = std::string{", "};
  if ((int)fontVariant & (int)FontVariant::SmallCaps) {
    result += "small-caps" + separator;
  }
  if ((int)fontVariant & (int)FontVariant::OldstyleNums) {
    result += "oldstyle-nums" + separator;
  }
  if ((int)fontVariant & (int)FontVariant::LiningNums) {
    result += "lining-nums" + separator;
  }
  if ((int)fontVariant & (int)FontVariant::TabularNums) {
    result += "tabular-nums" + separator;
  }
  if ((int)fontVariant & (int)FontVariant::ProportionalNums) {
    result += "proportional-nums" + separator;
  }

  if (!result.empty()) {
    result.erase(result.length() - separator.length());
  }

  return result;
}

inline void fromRawValue(const RawValue &value, TextAlignment &result) {
  auto string = (std::string)value;
  if (string == "auto") {
    result = TextAlignment::Natural;
    return;
  }
  if (string == "left") {
    result = TextAlignment::Left;
    return;
  }
  if (string == "center") {
    result = TextAlignment::Center;
    return;
  }
  if (string == "right") {
    result = TextAlignment::Right;
    return;
  }
  if (string == "justify") {
    result = TextAlignment::Justified;
    return;
  }
  abort();
}

inline std::string toString(const TextAlignment &textAlignment) {
  switch (textAlignment) {
    case TextAlignment::Natural:
      return "natural";
    case TextAlignment::Left:
      return "left";
    case TextAlignment::Center:
      return "center";
    case TextAlignment::Right:
      return "right";
    case TextAlignment::Justified:
      return "justified";
  }
}

inline void fromRawValue(const RawValue &value, WritingDirection &result) {
  auto string = (std::string)value;
  if (string == "natural") {
    result = WritingDirection::Natural;
    return;
  }
  if (string == "ltr") {
    result = WritingDirection::LeftToRight;
    return;
  }
  if (string == "rtl") {
    result = WritingDirection::RightToLeft;
    return;
  }
  abort();
}

inline std::string toString(const WritingDirection &writingDirection) {
  switch (writingDirection) {
    case WritingDirection::Natural:
      return "natural";
    case WritingDirection::LeftToRight:
      return "ltr";
    case WritingDirection::RightToLeft:
      return "rtl";
  }
}

inline void fromRawValue(
    const RawValue &value,
    TextDecorationLineType &result) {
  auto string = (std::string)value;
  if (string == "none") {
    result = TextDecorationLineType::None;
    return;
  }
  if (string == "underline") {
    result = TextDecorationLineType::Underline;
    return;
  }

  // TODO: remove "line-through" after deprecation
  if (string == "strikethrough" || string == "line-through") {
    result = TextDecorationLineType::Strikethrough;
    return;
  }

  // TODO: remove "underline line-through" after "line-through" deprecation
  if (string == "underline-strikethrough" ||
      string == "underline line-through") {
    result = TextDecorationLineType::UnderlineStrikethrough;
    return;
  }
  abort();
}

inline std::string toString(
    const TextDecorationLineType &textDecorationLineType) {
  switch (textDecorationLineType) {
    case TextDecorationLineType::None:
      return "none";
    case TextDecorationLineType::Underline:
      return "underline";
    case TextDecorationLineType::Strikethrough:
      return "strikethrough";
    case TextDecorationLineType::UnderlineStrikethrough:
      return "underline-strikethrough";
  }
}

inline void fromRawValue(
    const RawValue &value,
    TextDecorationLineStyle &result) {
  auto string = (std::string)value;
  if (string == "single") {
    result = TextDecorationLineStyle::Single;
    return;
  }
  if (string == "thick") {
    result = TextDecorationLineStyle::Thick;
    return;
  }
  if (string == "double") {
    result = TextDecorationLineStyle::Double;
    return;
  }
  abort();
}

inline std::string toString(
    const TextDecorationLineStyle &textDecorationLineStyle) {
  switch (textDecorationLineStyle) {
    case TextDecorationLineStyle::Single:
      return "single";
    case TextDecorationLineStyle::Thick:
      return "thick";
    case TextDecorationLineStyle::Double:
      return "double";
  }
}

inline void fromRawValue(
    const RawValue &value,
    TextDecorationLinePattern &result) {
  auto string = (std::string)value;
  if (string == "solid") {
    result = TextDecorationLinePattern::Solid;
    return;
  }
  if (string == "dot") {
    result = TextDecorationLinePattern::Dot;
    return;
  }
  if (string == "dash") {
    result = TextDecorationLinePattern::Dash;
    return;
  }
  if (string == "dash-dot") {
    result = TextDecorationLinePattern::DashDot;
    return;
  }
  if (string == "dash-dot-dot") {
    result = TextDecorationLinePattern::DashDotDot;
    return;
  }
  abort();
}

inline std::string toString(
    const TextDecorationLinePattern &textDecorationLinePattern) {
  switch (textDecorationLinePattern) {
    case TextDecorationLinePattern::Solid:
      return "solid";
    case TextDecorationLinePattern::Dot:
      return "dot";
    case TextDecorationLinePattern::Dash:
      return "dash";
    case TextDecorationLinePattern::DashDot:
      return "dash-dot";
    case TextDecorationLinePattern::DashDotDot:
      return "dash-dot-dot";
  }
}

inline std::string toString(const AccessibilityRole &accessibilityRole) {
  switch (accessibilityRole) {
    case AccessibilityRole::None:
      return "none";
    case AccessibilityRole::Button:
      return "button";
    case AccessibilityRole::Link:
      return "link";
    case AccessibilityRole::Search:
      return "search";
    case AccessibilityRole::Image:
      return "image";
    case AccessibilityRole::Imagebutton:
      return "imagebutton";
    case AccessibilityRole::Keyboardkey:
      return "keyboardkey";
    case AccessibilityRole::Text:
      return "text";
    case AccessibilityRole::Adjustable:
      return "adjustable";
    case AccessibilityRole::Summary:
      return "summary";
    case AccessibilityRole::Header:
      return "header";
    case AccessibilityRole::Alert:
      return "alert";
    case AccessibilityRole::Checkbox:
      return "checkbox";
    case AccessibilityRole::Combobox:
      return "combobox";
    case AccessibilityRole::Menu:
      return "menu";
    case AccessibilityRole::Menubar:
      return "menubar";
    case AccessibilityRole::Menuitem:
      return "menuitem";
    case AccessibilityRole::Progressbar:
      return "progressbar";
    case AccessibilityRole::Radio:
      return "radio";
    case AccessibilityRole::Radiogroup:
      return "radiogroup";
    case AccessibilityRole::Scrollbar:
      return "scrollbar";
    case AccessibilityRole::Spinbutton:
      return "spinbutton";
    case AccessibilityRole::Switch:
      return "switch";
    case AccessibilityRole::Tab:
      return "tab";
    case AccessibilityRole::Tablist:
      return "tablist";
    case AccessibilityRole::Timer:
      return "timer";
    case AccessibilityRole::Toolbar:
      return "toolbar";
  }
}

inline void fromRawValue(const RawValue &value, AccessibilityRole &result) {
  auto string = (std::string)value;
  if (string == "none") {
    result = AccessibilityRole::None;
    return;
  }
  if (string == "button") {
    result = AccessibilityRole::Button;
    return;
  }
  if (string == "link") {
    result = AccessibilityRole::Link;
    return;
  }
  if (string == "search") {
    result = AccessibilityRole::Search;
    return;
  }
  if (string == "image") {
    result = AccessibilityRole::Image;
    return;
  }
  if (string == "imagebutton") {
    result = AccessibilityRole::Imagebutton;
    return;
  }
  if (string == "keyboardkey") {
    result = AccessibilityRole::Keyboardkey;
    return;
  }
  if (string == "text") {
    result = AccessibilityRole::Text;
    return;
  }
  if (string == "adjustable") {
    result = AccessibilityRole::Adjustable;
    return;
  }
  if (string == "summary") {
    result = AccessibilityRole::Summary;
    return;
  }
  if (string == "header") {
    result = AccessibilityRole::Header;
    return;
  }
  if (string == "alert") {
    result = AccessibilityRole::Alert;
    return;
  }
  if (string == "checkbox") {
    result = AccessibilityRole::Checkbox;
    return;
  }
  if (string == "combobox") {
    result = AccessibilityRole::Combobox;
    return;
  }
  if (string == "menu") {
    result = AccessibilityRole::Menu;
    return;
  }
  if (string == "menubar") {
    result = AccessibilityRole::Menubar;
    return;
  }
  if (string == "menuitem") {
    result = AccessibilityRole::Menuitem;
    return;
  }
  if (string == "progressbar") {
    result = AccessibilityRole::Progressbar;
    return;
  }
  if (string == "radio") {
    result = AccessibilityRole::Radio;
    return;
  }
  if (string == "radiogroup") {
    result = AccessibilityRole::Radiogroup;
    return;
  }
  if (string == "scrollbar") {
    result = AccessibilityRole::Scrollbar;
    return;
  }
  if (string == "spinbutton") {
    result = AccessibilityRole::Spinbutton;
    return;
  }
  if (string == "switch") {
    result = AccessibilityRole::Switch;
    return;
  }
  if (string == "tab") {
    result = AccessibilityRole::Tab;
    return;
  }
  if (string == "tablist") {
    result = AccessibilityRole::Tablist;
    return;
  }
  if (string == "timer") {
    result = AccessibilityRole::Timer;
    return;
  }
  if (string == "toolbar") {
    result = AccessibilityRole::Toolbar;
    return;
  }
  abort();
}

inline ParagraphAttributes convertRawProp(
    RawProps const &rawProps,
    ParagraphAttributes const &sourceParagraphAttributes,
    ParagraphAttributes const &defaultParagraphAttributes) {
  auto paragraphAttributes = ParagraphAttributes{};

  paragraphAttributes.maximumNumberOfLines = convertRawProp(
      rawProps,
      "numberOfLines",
      sourceParagraphAttributes.maximumNumberOfLines,
      defaultParagraphAttributes.maximumNumberOfLines);
  paragraphAttributes.ellipsizeMode = convertRawProp(
      rawProps,
      "ellipsizeMode",
      sourceParagraphAttributes.ellipsizeMode,
      defaultParagraphAttributes.ellipsizeMode);
  paragraphAttributes.textBreakStrategy = convertRawProp(
      rawProps,
      "textBreakStrategy",
      sourceParagraphAttributes.textBreakStrategy,
      defaultParagraphAttributes.textBreakStrategy);
  paragraphAttributes.adjustsFontSizeToFit = convertRawProp(
      rawProps,
      "adjustsFontSizeToFit",
      sourceParagraphAttributes.adjustsFontSizeToFit,
      defaultParagraphAttributes.adjustsFontSizeToFit);
  paragraphAttributes.minimumFontSize = convertRawProp(
      rawProps,
      "minimumFontSize",
      sourceParagraphAttributes.minimumFontSize,
      defaultParagraphAttributes.minimumFontSize);
  paragraphAttributes.maximumFontSize = convertRawProp(
      rawProps,
      "maximumFontSize",
      sourceParagraphAttributes.maximumFontSize,
      defaultParagraphAttributes.maximumFontSize);
  paragraphAttributes.includeFontPadding = convertRawProp(
      rawProps,
      "includeFontPadding",
      sourceParagraphAttributes.includeFontPadding,
      defaultParagraphAttributes.includeFontPadding);

  return paragraphAttributes;
}

inline void fromRawValue(
    RawValue const &value,
    AttributedString::Range &result) {
  auto map = (better::map<std::string, int>)value;

  auto start = map.find("start");
  if (start != map.end()) {
    result.location = start->second;
  }
  auto end = map.find("end");
  if (end != map.end()) {
    result.length = start->second - result.location;
  }
}

inline std::string toString(AttributedString::Range const &range) {
  return "{location: " + folly::to<std::string>(range.location) +
      ", length: " + folly::to<std::string>(range.length) + "}";
}

#ifdef ANDROID

inline folly::dynamic toDynamic(
    const ParagraphAttributes &paragraphAttributes) {
  auto values = folly::dynamic::object();
  values("maximumNumberOfLines", paragraphAttributes.maximumNumberOfLines);
  values("ellipsizeMode", toString(paragraphAttributes.ellipsizeMode));
  values("textBreakStrategy", toString(paragraphAttributes.textBreakStrategy));
  values("adjustsFontSizeToFit", paragraphAttributes.adjustsFontSizeToFit);
  values("includeFontPadding", paragraphAttributes.includeFontPadding);

  return values;
}

inline folly::dynamic toDynamic(const FontVariant &fontVariant) {
  auto result = folly::dynamic::array();
  if ((int)fontVariant & (int)FontVariant::SmallCaps) {
    result.push_back("small-caps");
  }
  if ((int)fontVariant & (int)FontVariant::OldstyleNums) {
    result.push_back("oldstyle-nums");
  }
  if ((int)fontVariant & (int)FontVariant::LiningNums) {
    result.push_back("lining-nums");
  }
  if ((int)fontVariant & (int)FontVariant::TabularNums) {
    result.push_back("tabular-nums");
  }
  if ((int)fontVariant & (int)FontVariant::ProportionalNums) {
    result.push_back("proportional-nums");
  }

  return result;
}

inline folly::dynamic toDynamic(const TextAttributes &textAttributes) {
  auto _textAttributes = folly::dynamic::object();
  if (textAttributes.foregroundColor) {
    _textAttributes(
        "foregroundColor", toDynamic(textAttributes.foregroundColor));
  }
  if (textAttributes.backgroundColor) {
    _textAttributes(
        "backgroundColor", toDynamic(textAttributes.backgroundColor));
  }
  if (!std::isnan(textAttributes.opacity)) {
    _textAttributes("opacity", textAttributes.opacity);
  }
  if (!textAttributes.fontFamily.empty()) {
    _textAttributes("fontFamily", textAttributes.fontFamily);
  }
  if (!std::isnan(textAttributes.fontSize)) {
    _textAttributes("fontSize", textAttributes.fontSize);
  }
  if (!std::isnan(textAttributes.fontSizeMultiplier)) {
    _textAttributes("fontSizeMultiplier", textAttributes.fontSizeMultiplier);
  }
  if (textAttributes.fontWeight.has_value()) {
    _textAttributes("fontWeight", toString(*textAttributes.fontWeight));
  }
  if (textAttributes.fontStyle.has_value()) {
    _textAttributes("fontStyle", toString(*textAttributes.fontStyle));
  }
  if (textAttributes.fontVariant.has_value()) {
    _textAttributes("fontVariant", toDynamic(*textAttributes.fontVariant));
  }
  if (textAttributes.allowFontScaling.has_value()) {
    _textAttributes("allowFontScaling", *textAttributes.allowFontScaling);
  }
  if (!std::isnan(textAttributes.letterSpacing)) {
    _textAttributes("letterSpacing", textAttributes.letterSpacing);
  }
  if (!std::isnan(textAttributes.lineHeight)) {
    _textAttributes("lineHeight", textAttributes.lineHeight);
  }
  if (textAttributes.alignment.has_value()) {
    _textAttributes("alignment", toString(*textAttributes.alignment));
  }
  if (textAttributes.baseWritingDirection.has_value()) {
    _textAttributes(
        "baseWritingDirection", toString(*textAttributes.baseWritingDirection));
  }
  // Decoration
  if (textAttributes.textDecorationColor) {
    _textAttributes(
        "textDecorationColor", toDynamic(textAttributes.textDecorationColor));
  }
  if (textAttributes.textDecorationLineType.has_value()) {
    _textAttributes(
        "textDecorationLine", toString(*textAttributes.textDecorationLineType));
  }
  if (textAttributes.textDecorationLineStyle.has_value()) {
    _textAttributes(
        "textDecorationLineStyle",
        toString(*textAttributes.textDecorationLineStyle));
  }
  if (textAttributes.textDecorationLinePattern.has_value()) {
    _textAttributes(
        "textDecorationLinePattern",
        toString(*textAttributes.textDecorationLinePattern));
  }
  // Shadow
  // textShadowOffset = textAttributes.textShadowOffset.has_value() ?
  // textAttributes.textShadowOffset.value() : textShadowOffset;
  if (!std::isnan(textAttributes.textShadowRadius)) {
    _textAttributes("textShadowRadius", textAttributes.textShadowRadius);
  }
  if (textAttributes.textShadowColor) {
    _textAttributes(
        "textShadowColor", toDynamic(textAttributes.textShadowColor));
  }
  // Special
  if (textAttributes.isHighlighted.has_value()) {
    _textAttributes("isHighlighted", *textAttributes.isHighlighted);
  }
  if (textAttributes.layoutDirection.has_value()) {
    _textAttributes(
        "layoutDirection", toString(*textAttributes.layoutDirection));
  }
  if (textAttributes.accessibilityRole.has_value()) {
    _textAttributes(
        "accessibilityRole", toString(*textAttributes.accessibilityRole));
  }
  return _textAttributes;
}

inline folly::dynamic toDynamic(const AttributedString &attributedString) {
  auto value = folly::dynamic::object();
  auto fragments = folly::dynamic::array();
  for (auto fragment : attributedString.getFragments()) {
    folly::dynamic dynamicFragment = folly::dynamic::object();
    dynamicFragment["string"] = fragment.string;
    if (fragment.parentShadowView.componentHandle) {
      dynamicFragment["ABI44_0_0ReactTag"] = fragment.parentShadowView.tag;
    }
    if (fragment.isAttachment()) {
      dynamicFragment["isAttachment"] = true;
      dynamicFragment["width"] =
          fragment.parentShadowView.layoutMetrics.frame.size.width;
      dynamicFragment["height"] =
          fragment.parentShadowView.layoutMetrics.frame.size.height;
    }
    dynamicFragment["textAttributes"] = toDynamic(fragment.textAttributes);
    fragments.push_back(dynamicFragment);
  }
  value("fragments", fragments);
  value(
      "hash", std::hash<ABI44_0_0facebook::ABI44_0_0React::AttributedString>{}(attributedString));
  value("string", attributedString.getString());
  return value;
}

inline folly::dynamic toDynamic(AttributedString::Range const &range) {
  folly::dynamic dynamicValue = folly::dynamic::object();
  dynamicValue["location"] = range.location;
  dynamicValue["length"] = range.length;
  return dynamicValue;
}

#endif

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
