#pragma once

#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/components/rnpicker/Props.h>
#include <react/renderer/components/view/conversions.h>
#include <react/renderer/core/conversions.h>

namespace facebook::react {
inline folly::dynamic dialogStyleToDynamic(
    const RNCAndroidDialogPickerItemsStyleStruct& style) {
  folly::dynamic values = folly::dynamic::object();

  values["color"] = *style.color;
  values["backgroundColor"] = *style.backgroundColor;
  values["fontFamily"] = style.fontFamily;
  values["fontSize"] = style.fontSize;

  return values;
}

inline folly::dynamic dialogItemsToDynamic(
    const std::vector<RNCAndroidDialogPickerItemsStruct>& items) {
  folly::dynamic values = folly::dynamic::array();

  for (const auto& item : items) {
    folly::dynamic itemValues = folly::dynamic::object();
    itemValues["label"] = item.label;
    itemValues["value"] = item.value;
    itemValues["color"] = *item.color;
    itemValues["fontFamily"] = item.fontFamily;
    itemValues["enabled"] = item.enabled;
    itemValues["style"] = dialogStyleToDynamic(item.style);
    values.push_back(itemValues);
  }

  return values;
}

inline folly::dynamic dialogToDynamic(
    const RNCAndroidDialogPickerProps& props) {
  folly::dynamic values = folly::dynamic::object();
  values["items"] = dialogItemsToDynamic(props.items);
  values["color"] = *props.color; // TODO: seems not to be used anywhere
  values["prompt"] = props.prompt;
  values["selected"] = props.selected;
  values["backgroundColor"] = props.backgroundColor;
  values["dropdownIconColor"] = props.dropdownIconColor;
  values["dropdownIconRippleColor"] = props.dropdownIconRippleColor;
  values["numberOfLines"] = props.numberOfLines;
  values["mode"] = "dialog";

  return values;
}

inline folly::dynamic dropdownStyleToDynamic(
    const RNCAndroidDropdownPickerItemsStyleStruct& style) {
  folly::dynamic values = folly::dynamic::object();

  values["color"] = *style.color;
  values["backgroundColor"] = *style.backgroundColor;
  values["fontFamily"] = style.fontFamily;
  values["fontSize"] = style.fontSize;

  return values;
}

inline folly::dynamic dropdownItemsToDynamic(
    const std::vector<RNCAndroidDropdownPickerItemsStruct>& items) {
  folly::dynamic values = folly::dynamic::array();

  for (const auto& item : items) {
    folly::dynamic itemValues = folly::dynamic::object();
    itemValues["label"] = item.label;
    itemValues["value"] = item.value;
    itemValues["color"] = *item.color;
    itemValues["fontFamily"] = item.fontFamily;
    itemValues["enabled"] = item.enabled;
    itemValues["style"] = dropdownStyleToDynamic(item.style);
    values.push_back(itemValues);
  }

  return values;
}

inline folly::dynamic dropdownToDynamic(
    const RNCAndroidDropdownPickerProps& props) {
  folly::dynamic values = folly::dynamic::object();
  values["items"] = dropdownItemsToDynamic(props.items);
  values["color"] = *props.color; // TODO: seems not to be used anywhere
  values["prompt"] = props.prompt;
  values["selected"] = props.selected;
  values["backgroundColor"] = props.backgroundColor;
  values["dropdownIconColor"] = props.dropdownIconColor;
  values["dropdownIconRippleColor"] = props.dropdownIconRippleColor;
  values["numberOfLines"] = props.numberOfLines;
  values["mode"] = "dropdown";

  return values;
}
} // namespace facebook::react
