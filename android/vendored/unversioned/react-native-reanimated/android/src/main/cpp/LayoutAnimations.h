#pragma once

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <memory>
#include "JNIHelper.h"

namespace reanimated {

using namespace facebook::jni;
using namespace facebook;

class LayoutAnimations : public jni::HybridClass<LayoutAnimations> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/swmansion/reanimated/layoutReanimation/LayoutAnimations;";
  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jhybridobject> jThis);
  static void registerNatives();

  void startAnimationForTag(
      int tag,
      alias_ref<JString> type,
      alias_ref<JMap<jstring, jstring>> values);
  void removeConfigForTag(int tag);
  bool isLayoutAnimationEnabled();

  void setWeakUIRuntime(std::weak_ptr<jsi::Runtime> wrt);

  void notifyAboutProgress(const jsi::Value &progress, int tag);
  void notifyAboutEnd(int tag, int cancelled);

 private:
  friend HybridBase;
  jni::global_ref<LayoutAnimations::javaobject> javaPart_;
  std::weak_ptr<jsi::Runtime> weakUIRuntime;

  explicit LayoutAnimations(
      jni::alias_ref<LayoutAnimations::jhybridobject> jThis);
};

}; // namespace reanimated
