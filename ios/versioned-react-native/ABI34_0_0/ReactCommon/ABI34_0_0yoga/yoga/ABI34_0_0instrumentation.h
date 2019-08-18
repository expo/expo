/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "ABI34_0_0YGConfig.h"
#include "ABI34_0_0YGMarker.h"
#include "ABI34_0_0YGNode.h"

namespace facebook {
namespace ABI34_0_0yoga {
namespace marker {

template <ABI34_0_0YGMarker MarkerType>
class MarkerSection {
private:
  using Data = detail::MarkerData<MarkerType>;

public:
  MarkerSection(ABI34_0_0YGNodeRef node) : MarkerSection{node, node->getConfig()} {}
  ~MarkerSection() {
    if (endMarker_) {
      endMarker_(MarkerType, node_, markerData(&data), userData_);
    }
  }

  typename Data::type data = {};

  template <typename Ret, typename... Args>
  static Ret wrap(ABI34_0_0YGNodeRef node, Ret (*fn)(Args...), Args... args) {
    MarkerSection<MarkerType> section{node};
    return fn(std::forward<Args>(args)...);
  }

private:
  decltype(ABI34_0_0YGMarkerCallbacks{}.endMarker) endMarker_;
  ABI34_0_0YGNodeRef node_;
  void* userData_;

  MarkerSection(ABI34_0_0YGNodeRef node, ABI34_0_0YGConfigRef config)
      : MarkerSection{node, config ? &config->markerCallbacks : nullptr} {}
  MarkerSection(ABI34_0_0YGNodeRef node, ABI34_0_0YGMarkerCallbacks* callbacks)
      : endMarker_{callbacks ? callbacks->endMarker : nullptr},
        node_{node},
        userData_{
            callbacks && callbacks->startMarker
                ? callbacks->startMarker(MarkerType, node, markerData(&data))
                : nullptr} {}

  static ABI34_0_0YGMarkerData markerData(typename Data::type* d) {
    ABI34_0_0YGMarkerData markerData = {};
    Data::get(markerData) = d;
    return markerData;
  }
};

} // namespace marker
} // namespace ABI34_0_0yoga
} // namespace facebook
