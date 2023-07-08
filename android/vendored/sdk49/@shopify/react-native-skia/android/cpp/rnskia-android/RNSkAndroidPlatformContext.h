#pragma once

#include <exception>
#include <functional>
#include <memory>
#include <string>

#include <JniPlatformContext.h>
#include <RNSkPlatformContext.h>
#include <SkiaOpenGLRenderer.h>

namespace RNSkia {
namespace jsi = facebook::jsi;

class RNSkAndroidPlatformContext : public RNSkPlatformContext {
public:
  RNSkAndroidPlatformContext(
      JniPlatformContext *jniPlatformContext, jsi::Runtime *runtime,
      std::shared_ptr<facebook::react::CallInvoker> jsCallInvoker)
      : RNSkPlatformContext(runtime, jsCallInvoker,
                            jniPlatformContext->getPixelDensity()),
        _jniPlatformContext(jniPlatformContext) {
    // Hook onto the notify draw loop callback in the platform context
    jniPlatformContext->setOnNotifyDrawLoop(
        [this]() { notifyDrawLoop(false); });
  }

  ~RNSkAndroidPlatformContext() { stopDrawLoop(); }

  void performStreamOperation(
      const std::string &sourceUri,
      const std::function<void(std::unique_ptr<SkStreamAsset>)> &op) override {
    _jniPlatformContext->performStreamOperation(sourceUri, op);
  }

  void raiseError(const std::exception &err) override {
    _jniPlatformContext->raiseError(err);
  }

  sk_sp<SkSurface> makeOffscreenSurface(int width, int height) override {
    return MakeOffscreenGLSurface(width, height);
  }

  void runOnMainThread(std::function<void()> task) override {
    _jniPlatformContext->runTaskOnMainThread(task);
  }

  sk_sp<SkImage> takeScreenshotFromViewTag(size_t tag) override {
    return _jniPlatformContext->takeScreenshotFromViewTag(tag);
  }

  void startDrawLoop() override { _jniPlatformContext->startDrawLoop(); }

  void stopDrawLoop() override { _jniPlatformContext->stopDrawLoop(); }

private:
  JniPlatformContext *_jniPlatformContext;
};

} // namespace RNSkia
