#pragma once

#include <algorithm>

namespace ABI49_0_0reanimated {
namespace collection {

template <class CollectionType, class ValueType>
inline bool contains(CollectionType &collection, const ValueType &value) {
  return collection.find(value) != collection.end();
}

} // namespace collection
} // namespace reanimated
