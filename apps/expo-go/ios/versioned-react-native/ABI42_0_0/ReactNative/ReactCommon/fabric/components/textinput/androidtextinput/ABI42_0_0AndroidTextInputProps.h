/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

// #include <ABI42_0_0React/components/text/BaseTextProps.h>
#include <ABI42_0_0React/core/Props.h>
#include <ABI42_0_0React/graphics/Color.h>
#include <ABI42_0_0React/graphics/Geometry.h>

#include <ABI42_0_0React/attributedstring/TextAttributes.h>
#include <ABI42_0_0React/attributedstring/conversions.h>
#include <ABI42_0_0React/components/text/BaseTextProps.h>
#include <ABI42_0_0React/components/view/ViewProps.h>
#include <ABI42_0_0React/core/propsConversions.h>
#include <ABI42_0_0React/graphics/Color.h>
#include <ABI42_0_0React/imagemanager/primitives.h>
#include <cinttypes>
#include <vector>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

struct AndroidTextInputSelectionStruct {
  int start;
  int end;
};

static inline void fromRawValue(
    const RawValue &value,
    AndroidTextInputSelectionStruct &result) {
  auto map = (better::map<std::string, RawValue>)value;

  auto start = map.find("start");
  if (start != map.end()) {
    fromRawValue(start->second, result.start);
  }
  auto end = map.find("end");
  if (end != map.end()) {
    fromRawValue(end->second, result.end);
  }
}

static inline std::string toString(
    const AndroidTextInputSelectionStruct &value) {
  return "[Object AndroidTextInputSelectionStruct]";
}

struct AndroidTextInputTextShadowOffsetStruct {
  double width;
  double height;
};

static inline void fromRawValue(
    const RawValue &value,
    AndroidTextInputTextShadowOffsetStruct &result) {
  auto map = (better::map<std::string, RawValue>)value;

  auto width = map.find("width");
  if (width != map.end()) {
    fromRawValue(width->second, result.width);
  }
  auto height = map.find("height");
  if (height != map.end()) {
    fromRawValue(height->second, result.height);
  }
}

static inline std::string toString(
    const AndroidTextInputTextShadowOffsetStruct &value) {
  return "[Object AndroidTextInputTextShadowOffsetStruct]";
}

#ifdef ANDROID
inline folly::dynamic toDynamic(
    const AndroidTextInputTextShadowOffsetStruct &value) {
  folly::dynamic dynamicValue = folly::dynamic::object();
  dynamicValue["width"] = value.width;
  dynamicValue["height"] = value.height;
  return dynamicValue;
}

inline folly::dynamic toDynamic(const AndroidTextInputSelectionStruct &value) {
  folly::dynamic dynamicValue = folly::dynamic::object();
  dynamicValue["start"] = value.start;
  dynamicValue["end"] = value.end;
  return dynamicValue;
}
#endif

class AndroidTextInputProps final : public ViewProps, public BaseTextProps {
 public:
  AndroidTextInputProps() = default;
  AndroidTextInputProps(
      const AndroidTextInputProps &sourceProps,
      const RawProps &rawProps);

  folly::dynamic getDynamic() const;

#pragma mark - Props

  const std::string autoCompleteType{};
  const std::string returnKeyLabel{};
  const int numberOfLines{0};
  const bool disableFullscreenUI{false};
  const std::string textBreakStrategy{};
  const SharedColor underlineColorAndroid{};
  const std::string inlineImageLeft{};
  const int inlineImagePadding{0};
  const std::string importantForAutofill{};
  const bool showSoftInputOnFocus{false};
  const std::string autoCapitalize{};
  const bool autoCorrect{false};
  const bool autoFocus{false};
  const bool allowFontScaling{false};
  const Float maxFontSizeMultiplier{0.0};
  const bool editable{false};
  const std::string keyboardType{};
  const std::string returnKeyType{};
  const int maxLength{0};
  const bool multiline{false};
  const std::string placeholder{};
  const SharedColor placeholderTextColor{};
  const bool secureTextEntry{false};
  const SharedColor selectionColor{};
  const AndroidTextInputSelectionStruct selection{};
  const std::string value{};
  const std::string defaultValue{};
  const bool selectTextOnFocus{false};
  const bool blurOnSubmit{false};
  const bool caretHidden{false};
  const bool contextMenuHidden{false};
  const SharedColor textShadowColor{};
  const Float textShadowRadius{0.0};
  const std::string textDecorationLine{};
  const std::string fontStyle{};
  const AndroidTextInputTextShadowOffsetStruct textShadowOffset{};
  const Float lineHeight{0.0};
  const std::string textTransform{};
  const int color{0};
  const Float letterSpacing{0.0};
  const Float fontSize{0.0};
  const std::string textAlign{};
  const bool includeFontPadding{false};
  const std::string fontWeight{};
  const std::string fontFamily{};
  const std::string textAlignVertical{};
  const SharedColor cursorColor{};
  const int mostRecentEventCount{0};
  const std::string text{};

  /*
   * Contains all prop values that affect visual representation of the
   * paragraph.
   */
  ParagraphAttributes const paragraphAttributes{};

  /**
   * Auxiliary information to detect if these props are set or not.
   * See AndroidTextInputComponentDescriptor for usage.
   * TODO T63008435: can these, and this feature, be removed entirely?
   */
  const bool hasPadding{};
  const bool hasPaddingHorizontal{};
  const bool hasPaddingVertical{};
  const bool hasPaddingLeft{};
  const bool hasPaddingTop{};
  const bool hasPaddingRight{};
  const bool hasPaddingBottom{};
  const bool hasPaddingStart{};
  const bool hasPaddingEnd{};

#if ABI42_0_0RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const;
#endif
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
