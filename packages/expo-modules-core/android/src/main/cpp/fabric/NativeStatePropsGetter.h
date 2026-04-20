#pragma once

#include <fbjni/fbjni.h>
#include <react/fabric/CoreComponentsRegistry.h>
#include <react/fabric/StateWrapperImpl.h>

namespace jni = facebook::jni;
namespace react = facebook::react;

namespace expo {

class NativeStatePropsGetter : public jni::JavaClass<NativeStatePropsGetter> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/jni/fabric/NativeStatePropsGetter;";
  static auto constexpr TAG = "NativeStatePropsGetter";

  static void registerNatives();

  static jni::local_ref<jni::JMap<jstring, jobject>> getStateProps(
    jni::alias_ref<NativeStatePropsGetter::javaobject> self,
    jni::alias_ref<jobject> stateWrapper
  );
};

} // namespace expo
