/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <unordered_set>

#include <ABI37_0_0ReactCommon/ABI37_0_0TurboModule.h>
#include <ABI37_0_0ReactCommon/ABI37_0_0TurboModuleUtils.h>
#include <fb/fbjni.h>
#include <ABI37_0_0jsi/ABI37_0_0jsi.h>
#include <ABI37_0_0React/jni/JCallback.h>

namespace ABI37_0_0facebook {
namespace ABI37_0_0React {

struct JTurboModule : jni::JavaClass<JTurboModule> {
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/ABI37_0_0React/turbomodule/core/interfaces/TurboModule;";
};

class JSI_EXPORT JavaTurboModule : public TurboModule {
 public:
  JavaTurboModule(
      const std::string &name,
      jni::alias_ref<JTurboModule> instance,
      std::shared_ptr<JSCallInvoker> jsInvoker);
  jsi::Value invokeJavaMethod(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind valueKind,
      const std::string &methodName,
      const std::string &methodSignature,
      const jsi::Value *args,
      size_t count);

  /**
   * This dtor must be called from the JS Thread, since it accesses
   * callbackWrappers_, which createJavaCallbackFromJSIFunction also accesses
   * from the JS Thread.
   */
  virtual ~JavaTurboModule();

 private:
  jni::global_ref<JTurboModule> instance_;
  std::unordered_set<std::shared_ptr<CallbackWrapper>> callbackWrappers_;

  /**
   * This method must be called from the JS Thread, since it accesses
   * callbackWrappers_.
   */
  jni::local_ref<JCxxCallbackImpl::JavaPart> createJavaCallbackFromJSIFunction(
      jsi::Function &function,
      jsi::Runtime &rt,
      std::shared_ptr<JSCallInvoker> jsInvoker);
  std::vector<jvalue> convertJSIArgsToJNIArgs(
      JNIEnv *env,
      jsi::Runtime &rt,
      std::string methodName,
      std::vector<std::string> methodArgTypes,
      const jsi::Value *args,
      size_t count,
      std::shared_ptr<JSCallInvoker> jsInvoker,
      TurboModuleMethodValueKind valueKind);
};

} // namespace ABI37_0_0React
} // namespace ABI37_0_0facebook
