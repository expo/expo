/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#pragma once

#include "ABI35_0_0YGMacros.h"

ABI35_0_0YG_EXTERN_C_BEGIN

typedef struct ABI35_0_0YGNode* ABI35_0_0YGNodeRef;
typedef struct ABI35_0_0YGConfig* ABI35_0_0YGConfigRef;

typedef ABI35_0_0YG_ENUM_BEGIN(ABI35_0_0YGMarker){
    ABI35_0_0YGMarkerLayout,
    ABI35_0_0YGMarkerMeasure,
    ABI35_0_0YGMarkerBaselineFn,
} ABI35_0_0YG_ENUM_END(ABI35_0_0YGMarker);

typedef struct {
  int layouts;
  int measures;
  int maxMeasureCache;
  int cachedLayouts;
  int cachedMeasures;
} ABI35_0_0YGMarkerLayoutData;

typedef struct {
  bool _unused;
} ABI35_0_0YGMarkerNoData;

typedef union {
  ABI35_0_0YGMarkerLayoutData* layout;
  ABI35_0_0YGMarkerNoData* noData;
} ABI35_0_0YGMarkerData;

typedef struct {
  // accepts marker type, a node ref, and marker data (depends on marker type)
  // can return a handle or id that Yoga will pass to endMarker
  void* (*startMarker)(ABI35_0_0YGMarker, ABI35_0_0YGNodeRef, ABI35_0_0YGMarkerData);
  // accepts marker type, a node ref, marker data, and marker id as returned by
  // startMarker
  void (*endMarker)(ABI35_0_0YGMarker, ABI35_0_0YGNodeRef, ABI35_0_0YGMarkerData, void* id);
} ABI35_0_0YGMarkerCallbacks;

void ABI35_0_0YGConfigSetMarkerCallbacks(ABI35_0_0YGConfigRef, ABI35_0_0YGMarkerCallbacks);

ABI35_0_0YG_EXTERN_C_END

#ifdef __cplusplus

namespace facebook {
namespace ABI35_0_0yoga {
namespace marker {
namespace detail {

template <ABI35_0_0YGMarker M>
struct MarkerData;

template <>
struct MarkerData<ABI35_0_0YGMarkerLayout> {
  using type = ABI35_0_0YGMarkerLayoutData;
  static type*& get(ABI35_0_0YGMarkerData& d) {
    return d.layout;
  }
};

struct NoMarkerData {
  using type = ABI35_0_0YGMarkerNoData;
  static type*& get(ABI35_0_0YGMarkerData& d) {
    return d.noData;
  }
};

template <>
struct MarkerData<ABI35_0_0YGMarkerMeasure> : NoMarkerData {};

template <>
struct MarkerData<ABI35_0_0YGMarkerBaselineFn> : NoMarkerData {};

} // namespace detail

template <ABI35_0_0YGMarker M>
typename detail::MarkerData<M>::type* data(ABI35_0_0YGMarkerData d) {
  return detail::MarkerData<M>::get(d);
}

} // namespace marker
} // namespace ABI35_0_0yoga
} // namespace facebook

#endif // __cplusplus
