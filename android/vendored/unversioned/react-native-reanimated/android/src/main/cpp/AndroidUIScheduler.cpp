#include "AndroidUIScheduler.h"

#include <android/log.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <memory>
#include <string>

namespace reanimated {

using namespace facebook;
using namespace react;

class UISchedulerWrapper : public UIScheduler {
 private:
  jni::global_ref<AndroidUIScheduler::javaobject> androidUiScheduler_;

 public:
  explicit UISchedulerWrapper(
      jni::global_ref<AndroidUIScheduler::javaobject> androidUiScheduler)
      : androidUiScheduler_(androidUiScheduler) {}

  void scheduleOnUI(std::function<void()> job) override {
    UIScheduler::scheduleOnUI(job);
    if (!scheduledOnUI_) {
      scheduledOnUI_ = true;
      androidUiScheduler_->cthis()->scheduleTriggerOnUI();
    }
  }

  ~UISchedulerWrapper() {}
};

AndroidUIScheduler::AndroidUIScheduler(
    jni::alias_ref<AndroidUIScheduler::javaobject> jThis)
    : javaPart_(jni::make_global(jThis)),
      uiScheduler_(
          std::make_shared<UISchedulerWrapper>(jni::make_global(jThis))) {}

jni::local_ref<AndroidUIScheduler::jhybriddata> AndroidUIScheduler::initHybrid(
    jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

void AndroidUIScheduler::triggerUI() {
  uiScheduler_->triggerUI();
}

void AndroidUIScheduler::scheduleTriggerOnUI() {
  static const auto method =
      javaPart_->getClass()->getMethod<void()>("scheduleTriggerOnUI");
  method(javaPart_.get());
}

void AndroidUIScheduler::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", AndroidUIScheduler::initHybrid),
      makeNativeMethod("triggerUI", AndroidUIScheduler::triggerUI),
  });
}

} // namespace reanimated
