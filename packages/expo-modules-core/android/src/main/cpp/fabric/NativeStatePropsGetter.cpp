#include "NativeStatePropsGetter.h"
#include "AndroidExpoViewState.h"

#include <react/renderer/core/ConcreteState.h>

namespace expo {

void NativeStatePropsGetter::registerNatives() {
  javaClassLocal()->registerNatives({
                                      makeNativeMethod("getStateProps", NativeStatePropsGetter::getStateProps),
                                    });
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
