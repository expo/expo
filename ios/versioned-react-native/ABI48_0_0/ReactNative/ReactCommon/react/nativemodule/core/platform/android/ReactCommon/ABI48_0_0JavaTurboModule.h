/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <string>
#include <unordered_set>

#include <ABI48_0_0ReactCommon/ABI48_0_0CallInvoker.h>
#include <ABI48_0_0ReactCommon/ABI48_0_0TurboModule.h>
#include <ABI48_0_0jsi/ABI48_0_0jsi.h>
#include <ABI48_0_0React/bridging/ABI48_0_0CallbackWrapper.h>
#include <ABI48_0_0React/ABI48_0_0jni/JCallback.h>

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

struct JTurboModule : jni::JavaClass<JTurboModule> {
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/ABI48_0_0React/turbomodule/core/interfaces/TurboModule;";
};

using JSCallbackRetainer = std::function<std::weak_ptr<CallbackWrapper>(
    jsi::Function &&callback,
    jsi::Runtime &runtime,
    const std::shared_ptr<CallInvoker> &jsInvoker)>;

class JSI_EXPORT JavaTurboModule : public TurboModule {
 public:
  // TODO(T65603471): Should we unify this with a Fabric abstraction?
  struct InitParams {
    std::string moduleName;
    jni::alias_ref<JTurboModule> instance;
    std::shared_ptr<CallInvoker> jsInvoker;
    std::shared_ptr<CallInvoker> nativeInvoker;
    JSCallbackRetainer retainJSCallback;
  };

  JavaTurboModule(const InitParams &params);
  virtual ~JavaTurboModule();

  jsi::Value invokeJavaMethod(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind valueKind,
      const std::string &methodName,
      const std::string &methodSignature,
      const jsi::Value *args,
      size_t argCount,
      jmethodID &cachedMethodID);

 private:
  jni::global_ref<JTurboModule> instance_;
  std::shared_ptr<CallInvoker> nativeInvoker_;
  JSCallbackRetainer retainJSCallback_;
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook
