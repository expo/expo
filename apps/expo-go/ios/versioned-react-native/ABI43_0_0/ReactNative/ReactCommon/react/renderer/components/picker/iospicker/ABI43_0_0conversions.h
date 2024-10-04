/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0React/ABI43_0_0renderer/components/iospicker/primitives.h>

#include <vector>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

inline void fromRawValue(
    const RawValue &value,
    std::vector<PickerItemsStruct> &items) {
  assert(value.hasType<std::vector<RawValue>>());
  auto array = (std::vector<RawValue>)value;
  items.reserve(array.size());

  for (auto const &val : array) {
    bool check = val.hasType<better::map<std::string, RawValue>>();
    assert(check);
    auto map = (better::map<std::string, RawValue>)val;
    PickerItemsStruct item;

    if (map.find("label") != map.end()) {
      assert(map.at("label").hasType<std::string>());
      item.label = (std::string)map.at("label");
    }
    if (map.find("value") != map.end()) {
      assert(map.at("value").hasType<std::string>());
      item.value = (std::string)map.at("value");
    }
    if (map.find("textColor") != map.end()) {
      assert(map.at("textColor").hasType<int>());
      item.textColor = (int)map.at("textColor");
    }
    items.push_back(item);
  }
}

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
