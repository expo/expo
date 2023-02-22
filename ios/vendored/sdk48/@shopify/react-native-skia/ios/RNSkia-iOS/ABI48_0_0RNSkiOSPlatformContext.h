#pragma once

#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>

#include <functional>
#include <memory>
#include <string>

#include <ABI48_0_0DisplayLink.h>
#include <ABI48_0_0RNSkPlatformContext.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkStream.h"

#pragma clang diagnostic pop

#include <ABI48_0_0jsi/ABI48_0_0jsi.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {
class CallInvoker;
}
} // namespace ABI48_0_0facebook

namespace ABI48_0_0RNSkia {

namespace jsi = ABI48_0_0facebook::jsi;

static void handleNotification(CFNotificationCenterRef center, void *observer,
                               CFStringRef name, const void *object,
                               CFDictionaryRef userInfo);

class ABI48_0_0RNSkiOSPlatformContext : public ABI48_0_0RNSkPlatformContext {
public:
  ABI48_0_0RNSkiOSPlatformContext(jsi::Runtime *runtime,
                         std::shared_ptr<ABI48_0_0React::CallInvoker> callInvoker)
      : ABI48_0_0RNSkPlatformContext(runtime, callInvoker,
                            [[UIScreen mainScreen] scale]) {
    // We need to make sure we invalidate when modules are freed
    CFNotificationCenterAddObserver(
        CFNotificationCenterGetLocalCenter(), this, &handleNotification,
        (__bridge CFStringRef)ABI48_0_0RCTBridgeWillInvalidateModulesNotification, NULL,
        CFNotificationSuspensionBehaviorDeliverImmediately);
  }

  ~ABI48_0_0RNSkiOSPlatformContext() {
    CFNotificationCenterRemoveEveryObserver(
        CFNotificationCenterGetLocalCenter(), this);
    stopDrawLoop();
  }

  void startDrawLoop() override;
  void stopDrawLoop() override;

  virtual void performStreamOperation(
      const std::string &sourceUri,
      const std::function<void(std::unique_ptr<SkStreamAsset>)> &op) override;

  void raiseError(const std::exception &err) override;

  void willInvalidateModules() {
    // We need to do some house-cleaning here!
    invalidate();
  }

private:
  ABI48_0_0DisplayLink *_displayLink;
};

static void handleNotification(CFNotificationCenterRef center, void *observer,
                               CFStringRef name, const void *object,
                               CFDictionaryRef userInfo) {
  (static_cast<ABI48_0_0RNSkiOSPlatformContext *>(observer))->willInvalidateModules();
}

} // namespace ABI48_0_0RNSkia
