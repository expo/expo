#pragma once

#import <React/RCTBridge+Private.h>
#import <React/RCTBridge.h>
#import <ReactCommon/RCTTurboModule.h>

#include <functional>
#include <memory>
#include <string>

#include "DisplayLink.h"
#include "RNSkPlatformContext.h"
#include "ViewScreenshotService.h"

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
  RNSkiOSPlatformContext(jsi::Runtime *runtime, RCTBridge *bridge)
      : RNSkPlatformContext(runtime, bridge.jsCallInvoker,
                            [[UIScreen mainScreen] scale]) {

    // We need to make sure we invalidate when modules are freed
    CFNotificationCenterAddObserver(
        CFNotificationCenterGetLocalCenter(), this, &handleNotification,
        (__bridge CFStringRef)RCTBridgeWillInvalidateModulesNotification, NULL,
        CFNotificationSuspensionBehaviorDeliverImmediately);

    // Create screenshot manager
    _screenshotService =
        [[ViewScreenshotService alloc] initWithUiManager:bridge.uiManager];
  }

  ~RNSkiOSPlatformContext() {
    CFNotificationCenterRemoveEveryObserver(
        CFNotificationCenterGetLocalCenter(), this);
    stopDrawLoop();
  }

  void startDrawLoop() override;
  void stopDrawLoop() override;

  void runOnMainThread(std::function<void()>) override;

  sk_sp<SkImage> takeScreenshotFromViewTag(size_t tag) override;

  virtual void performStreamOperation(
      const std::string &sourceUri,
      const std::function<void(std::unique_ptr<SkStreamAsset>)> &op) override;

  void raiseError(const std::exception &err) override;
  sk_sp<SkSurface> makeOffscreenSurface(int width, int height) override;

  void willInvalidateModules() {
    // We need to do some house-cleaning here!
    invalidate();
  }

private:
  DisplayLink *_displayLink;
  ViewScreenshotService *_screenshotService;
};

static void handleNotification(CFNotificationCenterRef center, void *observer,
                               CFStringRef name, const void *object,
                               CFDictionaryRef userInfo) {
  (static_cast<RNSkiOSPlatformContext *>(observer))->willInvalidateModules();
}

} // namespace RNSkia
