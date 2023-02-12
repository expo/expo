#pragma once

#include <memory>
#include <string>

#include <fbjni/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>

#include <JniSkiaManager.h>
#include <RNSkAndroidView.h>

namespace RNSkia {

namespace jsi = facebook::jsi;

class JniSkiaBaseView {
public:
  JniSkiaBaseView(jni::alias_ref<JniSkiaManager::javaobject> skiaManager,
                  std::shared_ptr<RNSkBaseAndroidView> skiaView)
      : _manager(skiaManager->cthis()), _skiaView(skiaView) {}

  ~JniSkiaBaseView() {}

  std::shared_ptr<RNSkManager> getSkiaManager() {
    return _manager->getSkiaManager();
  }

protected:
  virtual void updateTouchPoints(jni::JArrayDouble touches) {
    _skiaView->updateTouchPoints(touches);
  }

  virtual void surfaceAvailable(jobject surface, int width, int height) {
    _skiaView->surfaceAvailable(surface, width, height);
  }

  virtual void surfaceSizeChanged(int width, int height) {
    _skiaView->surfaceSizeChanged(width, height);
  }

  virtual void surfaceDestroyed() { _skiaView->surfaceDestroyed(); }

  virtual void setMode(std::string mode) { _skiaView->setMode(mode); }

  virtual void setDebugMode(bool show) { _skiaView->setShowDebugInfo(show); }

  virtual void registerView(int nativeId) {
    getSkiaManager()->registerSkiaView(nativeId, _skiaView->getSkiaView());
  }

  virtual void unregisterView() {
    getSkiaManager()->setSkiaView(_skiaView->getSkiaView()->getNativeId(),
                                  nullptr);
    getSkiaManager()->unregisterSkiaView(
        _skiaView->getSkiaView()->getNativeId());
    _skiaView->viewDidUnmount();
  }

private:
  JniSkiaManager *_manager;
  std::shared_ptr<RNSkBaseAndroidView> _skiaView;
};

} // namespace RNSkia
