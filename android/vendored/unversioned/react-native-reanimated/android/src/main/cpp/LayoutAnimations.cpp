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

void LayoutAnimations::setAnimationStartingBlock(
    AnimationStartingBlock animationStartingBlock) {
  this->animationStartingBlock_ = animationStartingBlock;
}

void LayoutAnimations::startAnimationForTag(
    int tag,
    int type,
    alias_ref<JMap<jstring, jstring>> values) {
  this->animationStartingBlock_(tag, type, values);
}

void LayoutAnimations::progressLayoutAnimation(
    int tag,
    const jni::local_ref<JNIHelper::PropsMap> &updates,
    bool isSharedTransition) {
  static const auto method =
      javaPart_->getClass()
          ->getMethod<void(int, JMap<JString, JObject>::javaobject, bool)>(
              "progressLayoutAnimation");
  method(javaPart_.get(), tag, updates.get(), isSharedTransition);
}

void LayoutAnimations::endLayoutAnimation(int tag, bool removeView) {
  static const auto method =
      javaPart_->getClass()->getMethod<void(int, bool)>("endLayoutAnimation");
  method(javaPart_.get(), tag, removeView);
}

void LayoutAnimations::setHasAnimationBlock(
    HasAnimationBlock hasAnimationBlock) {
  this->hasAnimationBlock_ = hasAnimationBlock;
}

void LayoutAnimations::setShouldAnimateExitingBlock(
    ShouldAnimateExitingBlock shouldAnimateExitingBlock) {
  this->shouldAnimateExitingBlock_ = shouldAnimateExitingBlock;
}

#ifndef NDEBUG
void LayoutAnimations::setCheckDuplicateSharedTag(
    CheckDuplicateSharedTag checkDuplicateSharedTag) {
  checkDuplicateSharedTag_ = checkDuplicateSharedTag;
}

void LayoutAnimations::checkDuplicateSharedTag(int viewTag, int screenTag) {
  checkDuplicateSharedTag_(viewTag, screenTag);
}
#endif

bool LayoutAnimations::hasAnimationForTag(int tag, int type) {
  return hasAnimationBlock_(tag, type);
}

bool LayoutAnimations::shouldAnimateExiting(int tag, bool shouldAnimate) {
  return shouldAnimateExitingBlock_(tag, shouldAnimate);
}

void LayoutAnimations::setClearAnimationConfigBlock(
    ClearAnimationConfigBlock clearAnimationConfigBlock) {
  this->clearAnimationConfigBlock_ = clearAnimationConfigBlock;
}

void LayoutAnimations::clearAnimationConfigForTag(int tag) {
  clearAnimationConfigBlock_(tag);
}

void LayoutAnimations::setCancelAnimationForTag(
    CancelAnimationBlock cancelAnimationBlock) {
  this->cancelAnimationBlock_ = cancelAnimationBlock;
}

void LayoutAnimations::cancelAnimationForTag(int tag) {
  this->cancelAnimationBlock_(tag);
}

bool LayoutAnimations::isLayoutAnimationEnabled() {
  return FeaturesConfig::isLayoutAnimationEnabled();
}

void LayoutAnimations::setFindPrecedingViewTagForTransition(
    FindPrecedingViewTagForTransitionBlock
        findPrecedingViewTagForTransitionBlock) {
  findPrecedingViewTagForTransitionBlock_ =
      findPrecedingViewTagForTransitionBlock;
}

int LayoutAnimations::findPrecedingViewTagForTransition(int tag) {
  return findPrecedingViewTagForTransitionBlock_(tag);
}

void LayoutAnimations::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", LayoutAnimations::initHybrid),
      makeNativeMethod(
          "startAnimationForTag", LayoutAnimations::startAnimationForTag),
      makeNativeMethod(
          "hasAnimationForTag", LayoutAnimations::hasAnimationForTag),
      makeNativeMethod(
          "shouldAnimateExiting", LayoutAnimations::shouldAnimateExiting),
      makeNativeMethod(
          "clearAnimationConfigForTag",
          LayoutAnimations::clearAnimationConfigForTag),
      makeNativeMethod(
          "cancelAnimationForTag", LayoutAnimations::cancelAnimationForTag),
      makeNativeMethod(
          "isLayoutAnimationEnabled",
          LayoutAnimations::isLayoutAnimationEnabled),
      makeNativeMethod(
          "findPrecedingViewTagForTransition",
          LayoutAnimations::findPrecedingViewTagForTransition),
#ifndef NDEBUG
      makeNativeMethod(
          "checkDuplicateSharedTag", LayoutAnimations::checkDuplicateSharedTag),
#endif
  });
}
}; // namespace reanimated
