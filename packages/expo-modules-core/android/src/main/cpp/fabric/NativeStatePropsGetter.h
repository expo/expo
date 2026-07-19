#pragma once

#include "../ExpoHeader.pch"

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

  // Synchronously flushes a shadow-node size state update in the current frame
  // (`UpdateMode::unstable_Immediate`) — the same path iOS uses. This avoids the layout shift an
  // asynchronous `StateWrapper.updateState` causes for matchContents Hosts in Expo UI Compose views
  static void updateStyleSizeImmediate(
    jni::alias_ref<NativeStatePropsGetter::javaobject> self,
    jni::alias_ref<jobject> stateWrapper,
    jdouble styleWidth,
    jdouble styleHeight
  );

  static void updateViewSizeImmediate(
    jni::alias_ref<NativeStatePropsGetter::javaobject> self,
    jni::alias_ref<jobject> stateWrapper,
    jdouble width,
    jdouble height
  );
};

} // namespace expo
