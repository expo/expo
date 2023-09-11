#pragma once

#include <fbjni/fbjni.h>
#include <jni.h>
#include <jsi/jsi.h>
#include <react/jni/CxxModuleWrapper.h>
#include <react/jni/JMessageQueueThread.h>
#include <memory>
#include "Scheduler.h"

namespace reanimated {

using namespace facebook;

class AndroidScheduler : public jni::HybridClass<AndroidScheduler> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/swmansion/reanimated/Scheduler;";
  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jhybridobject> jThis);
  static void registerNatives();

  std::shared_ptr<Scheduler> getScheduler() {
    return scheduler_;
  }

  void scheduleOnUI();

 private:
  friend HybridBase;

  void triggerUI();

  jni::global_ref<AndroidScheduler::javaobject> javaPart_;
  std::shared_ptr<Scheduler> scheduler_;

  explicit AndroidScheduler(
      jni::alias_ref<AndroidScheduler::jhybridobject> jThis);
};

} // namespace reanimated
