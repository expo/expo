#pragma once

#include <algorithm>

namespace reanimated {
namespace collection {

template <class CollectionType, class ValueType>
inline bool contains(const CollectionType &collection, const ValueType &value) {
  return collection.find(value) != collection.end();
}

} // namespace collection
} // namespace reanimated
