/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "ABI34_0_0YGMarker.h"
#include "ABI34_0_0YGConfig.h"

void ABI34_0_0YGConfigSetMarkerCallbacks(
    ABI34_0_0YGConfigRef config,
    ABI34_0_0YGMarkerCallbacks markerCallbacks) {
  config->markerCallbacks = markerCallbacks;
}
