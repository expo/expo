#pragma once

#import <ABI49_0_0React/ABI49_0_0RCTBridge+Private.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0ReactCommon/ABI49_0_0RCTTurboModule.h>

#include <functional>
#include <memory>
#include <string>

#include "ABI49_0_0DisplayLink.h"
#include "ABI49_0_0RNSkPlatformContext.h"
#include "ABI49_0_0ViewScreenshotService.h"

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {
class CallInvoker;
}
} // namespace ABI49_0_0facebook

namespace ABI49_0_0RNSkia {

namespace jsi = ABI49_0_0facebook::jsi;

static void handleNotification(CFNotificationCenterRef center, void *observer,
                               CFStringRef name, const void *object,
                               CFDictionaryRef userInfo);

class ABI49_0_0RNSkiOSPlatformContext : public ABI49_0_0RNSkPlatformContext {
public:
  ABI49_0_0RNSkiOSPlatformContext(jsi::Runtime *runtime, ABI49_0_0RCTBridge *bridge)
      : ABI49_0_0RNSkPlatformContext(runtime, bridge.jsCallInvoker,
                            [[UIScreen mainScreen] scale]) {

    // We need to make sure we invalidate when modules are freed
    CFNotificationCenterAddObserver(
        CFNotificationCenterGetLocalCenter(), this, &handleNotification,
        (__bridge CFStringRef)ABI49_0_0RCTBridgeWillInvalidateModulesNotification, NULL,
        CFNotificationSuspensionBehaviorDeliverImmediately);

    // Create screenshot manager
    _screenshotService =
        [[ABI49_0_0ViewScreenshotService alloc] initWithUiManager:bridge.uiManager];
  }

  ~ABI49_0_0RNSkiOSPlatformContext() {
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
  ABI49_0_0DisplayLink *_displayLink;
  ABI49_0_0ViewScreenshotService *_screenshotService;
};

static void handleNotification(CFNotificationCenterRef center, void *observer,
                               CFStringRef name, const void *object,
                               CFDictionaryRef userInfo) {
  (static_cast<ABI49_0_0RNSkiOSPlatformContext *>(observer))->willInvalidateModules();
}

} // namespace ABI49_0_0RNSkia
