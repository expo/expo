#pragma once

#import <React/RCTBridge.h>

#include <functional>
#include <memory>
#include <string>

#include <DisplayLink.h>
#include <RNSkPlatformContext.h>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkStream.h"

#pragma clang diagnostic pop

#include <jsi/jsi.h>

namespace facebook {
namespace react {
class CallInvoker;
}
} // namespace facebook

namespace RNSkia {

namespace jsi = facebook::jsi;

static void handleNotification(CFNotificationCenterRef center, void *observer,
                               CFStringRef name, const void *object,
                               CFDictionaryRef userInfo);

class RNSkiOSPlatformContext : public RNSkPlatformContext {
public:
  RNSkiOSPlatformContext(jsi::Runtime *runtime,
                         std::shared_ptr<react::CallInvoker> callInvoker)
      : RNSkPlatformContext(runtime, callInvoker,
                            [[UIScreen mainScreen] scale]) {
    // We need to make sure we invalidate when modules are freed
    CFNotificationCenterAddObserver(
        CFNotificationCenterGetLocalCenter(), this, &handleNotification,
        (__bridge CFStringRef)RCTBridgeWillInvalidateModulesNotification, NULL,
        CFNotificationSuspensionBehaviorDeliverImmediately);
  }

  ~RNSkiOSPlatformContext() {
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
  DisplayLink *_displayLink;
};

static void handleNotification(CFNotificationCenterRef center, void *observer,
                               CFStringRef name, const void *object,
                               CFDictionaryRef userInfo) {
  (static_cast<RNSkiOSPlatformContext *>(observer))->willInvalidateModules();
}

} // namespace RNSkia
