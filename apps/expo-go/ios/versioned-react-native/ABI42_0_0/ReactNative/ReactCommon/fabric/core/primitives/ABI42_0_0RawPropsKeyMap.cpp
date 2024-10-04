/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI42_0_0RawPropsKeyMap.h"

#include <algorithm>
#include <cassert>
#include <cstdlib>
#include <cstring>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

bool RawPropsKeyMap::hasSameName(Item const &lhs, Item const &rhs) noexcept {
  return lhs.length == rhs.length &&
      (std::memcmp(lhs.name, rhs.name, lhs.length) == 0);
}

bool RawPropsKeyMap::shouldFirstOneBeBeforeSecondOne(
    Item const &lhs,
    Item const &rhs) noexcept {
  if (lhs.length != rhs.length) {
    return lhs.length < rhs.length;
  }

  return std::memcmp(lhs.name, rhs.name, rhs.length) < 0;
}

void RawPropsKeyMap::insert(
    RawPropsKey const &key,
    RawPropsValueIndex value) noexcept {
  auto item = Item{};
  item.value = value;
  key.render(item.name, &item.length);
  items_.push_back(item);
}

void RawPropsKeyMap::reindex() noexcept {
  // Sorting `items_` by property names length and then lexicographically.
  // Note, sort algorithm must be stable.
  std::stable_sort(
      items_.begin(),
      items_.end(),
      &RawPropsKeyMap::shouldFirstOneBeBeforeSecondOne);

  // Filtering out duplicating keys.
  // If some `*Props` object requests a prop more than once, only the first
  // request will be fulfilled. E.g. `TextInputProps` class has a sub-property
  // `backgroundColor` twice, the first time as part of `ViewProps` base-class
  // and the second as part of `BaseTextProps` base-class. In this
  // configuration, the only one which comes first (from `ViewProps`, which
  // appear first) will be assigned.
  items_.erase(
      std::unique(items_.begin(), items_.end(), &RawPropsKeyMap::hasSameName),
      items_.end());

  buckets_.resize(kPropNameLengthHardCap);

  auto length = RawPropsPropNameLength{0};
  for (auto i = 0; i < items_.size(); i++) {
    auto &item = items_[i];
    if (item.length != length) {
      for (auto j = length; j < item.length; j++) {
        buckets_[j] = i;
      }
      length = item.length;
    }
  }

  for (auto j = length; j < buckets_.size(); j++) {
    buckets_[j] = items_.size();
  }
}

RawPropsValueIndex RawPropsKeyMap::at(
    char const *name,
    RawPropsPropNameLength length) noexcept {
  assert(length > 0);
  assert(length < kPropNameLengthHardCap);
  // 1. Find the bucket.
  auto lower = int{buckets_[length - 1]};
  auto upper = int{buckets_[length]} - 1;
  assert(lower - 1 <= upper);

  // 2. Binary search in the bucket.
  while (lower <= upper) {
    auto median = (lower + upper) / 2;
    auto condition = std::memcmp(items_[median].name, name, length);
    if (condition < 0) {
      lower = median + 1;
    } else if (condition == 0) {
      return items_[median].value;
    } else /* if (condition > 0) */ {
      upper = median - 1;
    }
  }

  return kRawPropsValueIndexEmpty;
}

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
