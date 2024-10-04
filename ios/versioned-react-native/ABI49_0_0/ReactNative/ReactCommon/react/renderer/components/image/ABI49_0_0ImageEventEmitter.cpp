/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI49_0_0ImageEventEmitter.h"

namespace ABI49_0_0facebook::ABI49_0_0React {

void ImageEventEmitter::onLoadStart() const {
  dispatchEvent("loadStart");
}

void ImageEventEmitter::onLoad() const {
  dispatchEvent("load");
}

void ImageEventEmitter::onLoadEnd() const {
  dispatchEvent("loadEnd");
}

void ImageEventEmitter::onProgress(double progress) const {
  dispatchEvent("progress", [=](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "progress", progress);
    return payload;
  });
}

void ImageEventEmitter::onError() const {
  dispatchEvent("error");
}

void ImageEventEmitter::onPartialLoad() const {
  dispatchEvent("partialLoad");
}

} // namespace ABI49_0_0facebook::ABI49_0_0React
