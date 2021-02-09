/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef FB_SONARKIT_ENABLED

#include "SKStateUpdateCPPWrapper.h"

SKStateUpdateCPPWrapper::SKStateUpdateCPPWrapper(
    id<FlipperStateUpdateListener> controller) {
  delegate_ = controller;
}

void SKStateUpdateCPPWrapper::onUpdate() {
  if (!delegate_) {
    return;
  }
  [delegate_ onUpdate];
}

#endif
