/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "ABI35_0_0YGMarker.h"
#include "ABI35_0_0YGConfig.h"

void ABI35_0_0YGConfigSetMarkerCallbacks(
    ABI35_0_0YGConfigRef config,
    ABI35_0_0YGMarkerCallbacks markerCallbacks) {
  config->markerCallbacks = markerCallbacks;
}
