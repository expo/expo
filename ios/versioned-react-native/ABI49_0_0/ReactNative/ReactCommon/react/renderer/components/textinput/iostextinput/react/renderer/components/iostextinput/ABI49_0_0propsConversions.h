/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/debug/ABI49_0_0React_native_expect.h>
#include <ABI49_0_0React/ABI49_0_0renderer/components/iostextinput/primitives.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0PropsParserContext.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0propsConversions.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

static TextInputTraits convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    TextInputTraits const &sourceTraits,
    TextInputTraits const &defaultTraits) {
  auto traits = TextInputTraits{};

  traits.multiline = convertRawProp(
      context,
      rawProps,
      "multiline",
      sourceTraits.multiline,
      defaultTraits.multiline);
  traits.autocapitalizationType = convertRawProp(
      context,
      rawProps,
      "autoCapitalize",
      sourceTraits.autocapitalizationType,
      defaultTraits.autocapitalizationType);
  traits.autoCorrect = convertRawProp(
      context,
      rawProps,
      "autoCorrect",
      sourceTraits.autoCorrect,
      defaultTraits.autoCorrect);
  traits.contextMenuHidden = convertRawProp(
      context,
      rawProps,
      "contextMenuHidden",
      sourceTraits.contextMenuHidden,
      defaultTraits.contextMenuHidden);
  traits.editable = convertRawProp(
      context,
      rawProps,
      "editable",
      sourceTraits.editable,
      defaultTraits.editable);
  traits.enablesReturnKeyAutomatically = convertRawProp(
      context,
      rawProps,
      "enablesReturnKeyAutomatically",
      sourceTraits.enablesReturnKeyAutomatically,
      defaultTraits.enablesReturnKeyAutomatically);
  traits.keyboardAppearance = convertRawProp(
      context,
      rawProps,
      "keyboardAppearance",
      sourceTraits.keyboardAppearance,
      defaultTraits.keyboardAppearance);
  traits.spellCheck = convertRawProp(
      context,
      rawProps,
      "spellCheck",
      sourceTraits.spellCheck,
      defaultTraits.spellCheck);
  traits.caretHidden = convertRawProp(
      context,
      rawProps,
      "caretHidden",
      sourceTraits.caretHidden,
      defaultTraits.caretHidden);
  traits.clearButtonMode = convertRawProp(
      context,
      rawProps,
      "clearButtonMode",
      sourceTraits.clearButtonMode,
      defaultTraits.clearButtonMode);
  traits.scrollEnabled = convertRawProp(
      context,
      rawProps,
      "scrollEnabled",
      sourceTraits.scrollEnabled,
      defaultTraits.scrollEnabled);
  traits.secureTextEntry = convertRawProp(
      context,
      rawProps,
      "secureTextEntry",
      sourceTraits.secureTextEntry,
      defaultTraits.secureTextEntry);
  traits.submitBehavior = convertRawProp(
      context,
      rawProps,
      "submitBehavior",
      sourceTraits.submitBehavior,
      defaultTraits.submitBehavior);
  traits.clearTextOnFocus = convertRawProp(
      context,
      rawProps,
      "clearTextOnFocus",
      sourceTraits.clearTextOnFocus,
      defaultTraits.clearTextOnFocus);
  traits.keyboardType = convertRawProp(
      context,
      rawProps,
      "keyboardType",
      sourceTraits.keyboardType,
      defaultTraits.keyboardType);
  traits.showSoftInputOnFocus = convertRawProp(
      context,
      rawProps,
      "showSoftInputOnFocus",
      sourceTraits.showSoftInputOnFocus,
      defaultTraits.showSoftInputOnFocus);
  traits.returnKeyType = convertRawProp(
      context,
      rawProps,
      "returnKeyType",
      sourceTraits.returnKeyType,
      defaultTraits.returnKeyType);
  traits.selectTextOnFocus = convertRawProp(
      context,
      rawProps,
      "selectTextOnFocus",
      sourceTraits.selectTextOnFocus,
      defaultTraits.selectTextOnFocus);
  traits.textContentType = convertRawProp(
      context,
      rawProps,
      "textContentType",
      sourceTraits.textContentType,
      defaultTraits.textContentType);
  traits.passwordRules = convertRawProp(
      context,
      rawProps,
      "passwordRules",
      sourceTraits.passwordRules,
      defaultTraits.passwordRules);

  return traits;
}

inline void fromRawValue(
    const PropsParserContext &context,
    const RawValue &value,
    Selection &result) {
  if (value.hasType<butter::map<std::string, int>>()) {
    auto map = (butter::map<std::string, int>)value;
    for (const auto &pair : map) {
      if (pair.first == "start") {
        result.start = pair.second;
      } else if (pair.first == "end") {
        result.end = pair.second;
      } else {
        LOG(ERROR) << "Unsupported Selection map key: " << pair.first;
        ABI49_0_0React_native_expect(false);
      }
    }
    return;
  }

  ABI49_0_0React_native_expect(value.hasType<std::vector<int>>());
  if (value.hasType<std::vector<int>>()) {
    auto array = (std::vector<int>)value;
    ABI49_0_0React_native_expect(array.size() == 2);
    if (array.size() >= 2) {
      result = {array.at(0), array.at(1)};
    } else {
      result = {0, 0};
      LOG(ERROR) << "Unsupported Selection vector size: " << array.size();
    }
  } else {
    LOG(ERROR) << "Unsupported Selection type";
  }
}
} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
