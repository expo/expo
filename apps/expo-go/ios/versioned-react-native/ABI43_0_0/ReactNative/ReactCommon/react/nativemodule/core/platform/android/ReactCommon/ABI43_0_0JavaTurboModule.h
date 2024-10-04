/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <unordered_set>

#include <ABI43_0_0ReactCommon/ABI43_0_0TurboModule.h>
#include <ABI43_0_0ReactCommon/ABI43_0_0TurboModuleUtils.h>
#include <fbjni/fbjni.h>
#include <ABI43_0_0jsi/ABI43_0_0jsi.h>
#include <ABI43_0_0React/ABI43_0_0jni/JCallback.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

struct JNIArgs {
  JNIArgs(size_t count) : args_(count) {}
  std::vector<jvalue> args_;
  std::vector<jobject> globalRefs_;
};

struct JTurboModule : jni::JavaClass<JTurboModule> {
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/ABI43_0_0React/turbomodule/core/interfaces/TurboModule;";
};

class JSI_EXPORT JavaTurboModule : public TurboModule {
 public:
  // TODO(T65603471): Should we unify this with a Fabric abstraction?
  struct InitParams {
    std::string moduleName;
    jni::alias_ref<JTurboModule> instance;
    std::shared_ptr<CallInvoker> jsInvoker;
    std::shared_ptr<CallInvoker> nativeInvoker;
  };

  JavaTurboModule(const InitParams &params);
  virtual ~JavaTurboModule();
  jsi::Value invokeJavaMethod(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind valueKind,
      const std::string &methodName,
      const std::string &methodSignature,
      const jsi::Value *args,
      size_t argCount);

  static void enablePromiseAsyncDispatch(bool enable);

 private:
  jni::global_ref<JTurboModule> instance_;
  std::shared_ptr<CallInvoker> nativeInvoker_;

  /**
   * Experiments
   */
  static bool isPromiseAsyncDispatchEnabled_;

  JNIArgs convertJSIArgsToJNIArgs(
      JNIEnv *env,
      jsi::Runtime &rt,
      std::string methodName,
      std::vector<std::string> methodArgTypes,
      const jsi::Value *args,
      size_t count,
      std::shared_ptr<CallInvoker> jsInvoker,
      TurboModuleMethodValueKind valueKind);
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
