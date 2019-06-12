/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI33_0_0ImageEventEmitter.h"

namespace facebook {
namespace ReactABI33_0_0 {

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
  dispatchEvent("progress", [=](ABI33_0_0jsi::Runtime &runtime) {
    auto payload = ABI33_0_0jsi::Object(runtime);
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

} // namespace ReactABI33_0_0
} // namespace facebook
