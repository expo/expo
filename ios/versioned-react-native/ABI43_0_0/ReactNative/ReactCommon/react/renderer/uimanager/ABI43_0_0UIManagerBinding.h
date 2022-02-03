/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <ABI43_0_0jsi/ABI43_0_0jsi.h>
#include <ABI43_0_0React/ABI43_0_0renderer/core/RawValue.h>
#include <ABI43_0_0React/ABI43_0_0renderer/uimanager/UIManager.h>
#include <ABI43_0_0React/ABI43_0_0renderer/uimanager/primitives.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

/*
 * Exposes UIManager to JavaScript realm.
 */
class UIManagerBinding : public jsi::HostObject {
 public:
  /*
   * Installs UIManagerBinding into JavaScript runtime if needed.
   * Creates and sets `UIManagerBinding` into the global namespace.
   * In case if the global namespace already has a `UIManagerBinding` installed,
   * returns that.
   * Thread synchronization must be enforced externally.
   */
  static std::shared_ptr<UIManagerBinding> createAndInstallIfNeeded(
      jsi::Runtime &runtime);

  ~UIManagerBinding();

  /*
   * Establish a relationship between `UIManager` and `UIManagerBinding` by
   * setting internal pointers to each other.
   * Must be called on JavaScript thread or during VM destruction.
   */
  void attach(std::shared_ptr<UIManager> const &uiManager);

  /*
   * Starts ABI43_0_0React Native Surface with given id, moduleName, and props.
   * Thread synchronization must be enforced externally.
   */
  void startSurface(
      jsi::Runtime &runtime,
      SurfaceId surfaceId,
      std::string const &moduleName,
      folly::dynamic const &initalProps) const;

  /*
   * Stops ABI43_0_0React Native Surface with given id.
   * Thread synchronization must be enforced externally.
   */
  void stopSurface(jsi::Runtime &runtime, SurfaceId surfaceId) const;

  /*
   * Delivers raw event data to JavaScript.
   * Thread synchronization must be enforced externally.
   */
  void dispatchEvent(
      jsi::Runtime &runtime,
      EventTarget const *eventTarget,
      std::string const &type,
      ValueFactory const &payloadFactory) const;

  /*
   * Invalidates the binding and underlying UIManager.
   * Allows to save some resources and prevents UIManager's delegate to be
   * called.
   * Calling public methods of this class after calling this method is UB.
   * Can be called on any thread.
   */
  void invalidate() const;

  /*
   * `jsi::HostObject` specific overloads.
   */
  jsi::Value get(jsi::Runtime &runtime, jsi::PropNameID const &name) override;

 private:
  std::shared_ptr<UIManager> uiManager_;
  std::unique_ptr<EventHandler const> eventHandler_;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
