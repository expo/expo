#pragma once

#include <memory>
#include <string>

#include <fbjni/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>

#include <JniSkiaManager.h>
#include <RNSkAndroidView.h>

#include <android/bitmap.h>

namespace RNSkia {

namespace jsi = facebook::jsi;

class JniSkiaBaseView {
public:
  JniSkiaBaseView(jni::alias_ref<JniSkiaManager::javaobject> skiaManager,
                  std::shared_ptr<RNSkBaseAndroidView> skiaView)
      : _manager(skiaManager->cthis()), _skiaAndroidView(skiaView) {}

  ~JniSkiaBaseView() {}

  std::shared_ptr<RNSkManager> getSkiaManager() {
    return _manager->getSkiaManager();
  }

protected:
  virtual void updateTouchPoints(jni::JArrayDouble touches) {
    _skiaAndroidView->updateTouchPoints(touches);
  }

  virtual void surfaceAvailable(jobject surface, int width, int height) {
    _skiaAndroidView->surfaceAvailable(surface, width, height);
  }

  virtual void surfaceSizeChanged(int width, int height) {
    _skiaAndroidView->surfaceSizeChanged(width, height);
  }

  virtual void surfaceDestroyed() { _skiaAndroidView->surfaceDestroyed(); }

  virtual void setMode(std::string mode) { _skiaAndroidView->setMode(mode); }

  virtual void setDebugMode(bool show) {
    _skiaAndroidView->setShowDebugInfo(show);
  }

  virtual void registerView(int nativeId) {
    getSkiaManager()->registerSkiaView(nativeId,
                                       _skiaAndroidView->getSkiaView());
  }

  virtual void unregisterView() {
    getSkiaManager()->setSkiaView(
        _skiaAndroidView->getSkiaView()->getNativeId(), nullptr);
    getSkiaManager()->unregisterSkiaView(
        _skiaAndroidView->getSkiaView()->getNativeId());
    _skiaAndroidView->viewDidUnmount();
  }

private:
  JniSkiaManager *_manager;
  std::shared_ptr<RNSkBaseAndroidView> _skiaAndroidView;
};

} // namespace RNSkia
