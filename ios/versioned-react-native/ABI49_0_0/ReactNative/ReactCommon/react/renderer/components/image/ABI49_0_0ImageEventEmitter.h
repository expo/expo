/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI49_0_0React/ABI49_0_0renderer/components/view/ViewEventEmitter.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class ImageEventEmitter : public ViewEventEmitter {
 public:
  using ViewEventEmitter::ViewEventEmitter;

  void onLoadStart() const;
  void onLoad() const;
  void onLoadEnd() const;
  void onProgress(double) const;
  void onError() const;
  void onPartialLoad() const;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
