#pragma once

#include <fbjni/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>
#include <react/jni/CxxModuleWrapper.h>
#include <react/jni/JMessageQueueThread.h>

#include <memory>

#include "UIScheduler.h"

namespace reanimated {

using namespace facebook;

class AndroidUIScheduler : public jni::HybridClass<AndroidUIScheduler> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/swmansion/reanimated/AndroidUIScheduler;";
  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jhybridobject> jThis);
  static void registerNatives();

  std::shared_ptr<UIScheduler> getUIScheduler() {
    return uiScheduler_;
  }

  void scheduleTriggerOnUI();

 private:
  friend HybridBase;

  void triggerUI();

  jni::global_ref<AndroidUIScheduler::javaobject> javaPart_;
  std::shared_ptr<UIScheduler> uiScheduler_;

  explicit AndroidUIScheduler(
      jni::alias_ref<AndroidUIScheduler::jhybridobject> jThis);
};

} // namespace reanimated
