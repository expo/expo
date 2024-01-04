#include "LayoutAnimations.h"
#include "FeaturesConfig.h"
#include "Logger.h"

namespace reanimated {

LayoutAnimations::LayoutAnimations(
    jni::alias_ref<LayoutAnimations::javaobject> jThis)
    : javaPart_(jni::make_global(jThis)) {}

jni::local_ref<LayoutAnimations::jhybriddata> LayoutAnimations::initHybrid(
    jni::alias_ref<jhybridobject> jThis) {
  return makeCxxInstance(jThis);
}

void LayoutAnimations::setWeakUIRuntime(std::weak_ptr<jsi::Runtime> wrt) {
  this->weakUIRuntime = wrt;
}

void LayoutAnimations::startAnimationForTag(
    int tag,
    alias_ref<JString> type,
    alias_ref<JMap<jstring, jstring>> values) {
  if (auto rt = this->weakUIRuntime.lock()) {
    jsi::Value layoutAnimationRepositoryAsValue =
        rt->global()
            .getPropertyAsObject(*rt, "global")
            .getProperty(*rt, "LayoutAnimationRepository");
    if (!layoutAnimationRepositoryAsValue.isUndefined()) {
      jsi::Function startAnimationForTag =
          layoutAnimationRepositoryAsValue.getObject(*rt).getPropertyAsFunction(
              *rt, "startAnimationForTag");
      jsi::Object target(*rt);

      for (const auto &entry : *values) {
        target.setProperty(
            *rt,
            entry.first->toStdString().c_str(),
            std::stof(entry.second->toStdString()));
      }
      startAnimationForTag.call(
          *rt,
          jsi::Value(tag),
          jsi::String::createFromUtf8(*rt, type->toStdString()),
          target);
    }
  }
}

void LayoutAnimations::removeConfigForTag(int tag) {
  if (auto rt = this->weakUIRuntime.lock()) {
    jsi::Value layoutAnimationRepositoryAsValue =
        rt->global()
            .getPropertyAsObject(*rt, "global")
            .getProperty(*rt, "LayoutAnimationRepository");
    if (!layoutAnimationRepositoryAsValue.isUndefined()) {
      jsi::Function removeConfig =
          layoutAnimationRepositoryAsValue.getObject(*rt).getPropertyAsFunction(
              *rt, "removeConfig");
      removeConfig.call(*rt, jsi::Value(tag));
    }
  }
}

void LayoutAnimations::notifyAboutProgress(
    const jsi::Value &progress,
    int tag) {
  if (auto rt = this->weakUIRuntime.lock()) {
    static const auto method =
        javaPart_->getClass()
            ->getMethod<void(JMap<JString, JObject>::javaobject, int)>(
                "notifyAboutProgress");
    method(
        javaPart_.get(),
        JNIHelper::ConvertToPropsMap(*rt, progress.asObject(*rt)).get(),
        tag);
  }
}

void LayoutAnimations::notifyAboutEnd(int tag, int cancelled) {
  static const auto method =
      javaPart_->getClass()->getMethod<void(int, int)>("notifyAboutEnd");
  method(javaPart_.get(), tag, cancelled);
}

bool LayoutAnimations::isLayoutAnimationEnabled() {
  return FeaturesConfig::isLayoutAnimationEnabled();
}

void LayoutAnimations::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", LayoutAnimations::initHybrid),
      makeNativeMethod(
          "startAnimationForTag", LayoutAnimations::startAnimationForTag),
      makeNativeMethod(
          "removeConfigForTag", LayoutAnimations::removeConfigForTag),
      makeNativeMethod(
          "isLayoutAnimationEnabled",
          LayoutAnimations::isLayoutAnimationEnabled),
  });
}

}; // namespace reanimated
