// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <folly/dynamic.h>
#include <ABI37_0_0jsi/ABI37_0_0jsi.h>
#include <ABI37_0_0React/uimanager/UIManager.h>
#include <ABI37_0_0React/uimanager/primitives.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

/*
 * Exposes UIManager to JavaScript realm.
 */
class UIManagerBinding : public jsi::HostObject {
 public:
  /*
   * Installs UIManagerBinding into JavaScript runtime.
   * Thread synchronization must be enforced externally.
   */
  static void install(
      jsi::Runtime &runtime,
      std::shared_ptr<UIManagerBinding> uiManagerBinding);

  UIManagerBinding(std::unique_ptr<UIManager> uiManager);

  /*
   * Starts ABI37_0_0React Native Surface with given id, moduleName, and props.
   * Thread synchronization must be enforced externally.
   */
  void startSurface(
      jsi::Runtime &runtime,
      SurfaceId surfaceId,
      const std::string &moduleName,
      const folly::dynamic &initalProps) const;

  /*
   * Stops ABI37_0_0React Native Surface with given id.
   * Thread synchronization must be enforced externally.
   */
  void stopSurface(jsi::Runtime &runtime, SurfaceId surfaceId) const;

  /*
   * Delivers raw event data to JavaScript.
   * Thread synchronization must be enforced externally.
   */
  void dispatchEvent(
      jsi::Runtime &runtime,
      const EventTarget *eventTarget,
      const std::string &type,
      const ValueFactory &payloadFactory) const;

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
  jsi::Value get(jsi::Runtime &runtime, const jsi::PropNameID &name) override;

 private:
  std::unique_ptr<UIManager> uiManager_;
  std::unique_ptr<const EventHandler> eventHandler_;
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
