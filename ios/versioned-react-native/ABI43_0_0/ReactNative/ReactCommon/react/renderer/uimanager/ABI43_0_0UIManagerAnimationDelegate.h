/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ABI43_0_0jsi/ABI43_0_0jsi.h>

#include <ABI43_0_0React/ABI43_0_0renderer/componentregistry/ComponentDescriptorFactory.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/RawValue.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

class UIManagerAnimationDelegate {
 public:
  virtual ~UIManagerAnimationDelegate(){};

  /*
   * Configure a LayoutAnimation.
   * TODO: need SurfaceId here
   */
  virtual void uiManagerDidConfigureNextLayoutAnimation(
      jsi::Runtime &runtime,
      RawValue const &config,
      jsi::Value const &successCallback,
      jsi::Value const &failureCallback) const = 0;

  /**
   * Set ComponentDescriptor registry.
   *
   * @param componentDescriptorRegistry
   */
  virtual void setComponentDescriptorRegistry(
      const SharedComponentDescriptorRegistry &componentDescriptorRegistry) = 0;

  /**
   * Only needed on Android to drive animations.
   */
  virtual bool shouldAnimateFrame() const = 0;

  /**
   * Drop any animations for a given surface.
   */
  virtual void stopSurface(SurfaceId surfaceId) = 0;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
