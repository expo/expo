#include "NativeStatePropsGetter.h"
#include "AndroidExpoViewState.h"
#include <react/fabric/StateWrapperImpl.h>

#include <react/renderer/core/ConcreteState.h>

namespace expo {

void NativeStatePropsGetter::registerNatives() {
  javaClassLocal()->registerNatives({
                                      makeNativeMethod("getStateProps", NativeStatePropsGetter::getStateProps),
                                      makeNativeMethod("updateStyleSizeImmediateImpl", NativeStatePropsGetter::updateStyleSizeImmediate),
                                      makeNativeMethod("updateViewSizeImmediateImpl", NativeStatePropsGetter::updateViewSizeImmediate),
                                    });
}

static std::shared_ptr<const react::ConcreteState<AndroidExpoViewState>> concreteStateFrom(
  jni::alias_ref<jobject> stateWrapper
) {
  auto stateWrapperImpl = jni::alias_ref<react::StateWrapperImpl::javaobject>{
    static_cast<react::StateWrapperImpl::javaobject>(stateWrapper.get())
  };
  return std::dynamic_pointer_cast<const react::ConcreteState<AndroidExpoViewState>>(
    stateWrapperImpl->cthis()->getState()
  );
}

void NativeStatePropsGetter::updateStyleSizeImmediate(
  jni::alias_ref<NativeStatePropsGetter::javaobject> self,
  jni::alias_ref<jobject> stateWrapper,
  jdouble styleWidth,
  jdouble styleHeight
) {
  const auto state = concreteStateFrom(stateWrapper);
  if (state == nullptr) {
    return;
  }
  AndroidExpoViewState newState;
  newState._styleWidth = static_cast<float>(styleWidth);
  newState._styleHeight = static_cast<float>(styleHeight);
  state->updateState(std::move(newState), react::EventQueue::UpdateMode::unstable_Immediate);
}

void NativeStatePropsGetter::updateViewSizeImmediate(
  jni::alias_ref<NativeStatePropsGetter::javaobject> self,
  jni::alias_ref<jobject> stateWrapper,
  jdouble width,
  jdouble height
) {
  const auto state = concreteStateFrom(stateWrapper);
  if (state == nullptr) {
    return;
  }
  AndroidExpoViewState newState;
  newState._width = static_cast<float>(width);
  newState._height = static_cast<float>(height);
  state->updateState(std::move(newState), react::EventQueue::UpdateMode::unstable_Immediate);
}

jni::local_ref<jni::JMap<jstring, jobject>> NativeStatePropsGetter::getStateProps(
  jni::alias_ref<NativeStatePropsGetter::javaobject> self,
  jni::alias_ref<jobject> stateWrapper
) {
  auto stateWrapperImpl = jni::alias_ref<react::StateWrapperImpl::javaobject>{
    static_cast<react::StateWrapperImpl::javaobject>(stateWrapper.get())
  };

  const auto &nativeStateWrapper = std::dynamic_pointer_cast<const react::ConcreteState<AndroidExpoViewState>>(
    stateWrapperImpl->cthis()->getState()
  );
  const auto &nativeState = nativeStateWrapper->getData();

  const auto localNativeState = jni::make_local(nativeState.statePropsDiff);
  nativeState.statePropsDiff = nullptr;
  return localNativeState;
}

} // namespace expo
