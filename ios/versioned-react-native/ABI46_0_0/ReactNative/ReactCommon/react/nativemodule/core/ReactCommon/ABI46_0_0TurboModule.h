/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <unordered_map>

#include <ABI46_0_0jsi/ABI46_0_0jsi.h>

#include <ABI46_0_0ReactCommon/ABI46_0_0CallInvoker.h>

namespace ABI46_0_0facebook {
namespace ABI46_0_0React {

/**
 * For now, support the same set of return types as existing impl.
 * This can be improved to support richer typed objects.
 */
enum TurboModuleMethodValueKind {
  VoidKind,
  BooleanKind,
  NumberKind,
  StringKind,
  ObjectKind,
  ArrayKind,
  FunctionKind,
  PromiseKind,
};

/**
 * Base HostObject class for every module to be exposed to JS
 */
class JSI_EXPORT TurboModule : public ABI46_0_0facebook::jsi::HostObject {
 public:
  TurboModule(const std::string &name, std::shared_ptr<CallInvoker> jsInvoker);

  virtual ABI46_0_0facebook::jsi::Value get(
      ABI46_0_0facebook::jsi::Runtime &runtime,
      const ABI46_0_0facebook::jsi::PropNameID &propName) override {
    std::string propNameUtf8 = propName.utf8(runtime);
    auto p = methodMap_.find(propNameUtf8);
    if (p == methodMap_.end()) {
      // Method was not found, let JS decide what to do.
      return jsi::Value::undefined();
    }
    MethodMetadata meta = p->second;
    return jsi::Function::createFromHostFunction(
        runtime,
        propName,
        static_cast<unsigned int>(meta.argCount),
        [this, meta](
            ABI46_0_0facebook::jsi::Runtime &rt,
            const ABI46_0_0facebook::jsi::Value &thisVal,
            const ABI46_0_0facebook::jsi::Value *args,
            size_t count) { return meta.invoker(rt, *this, args, count); });
  }

  const std::string name_;
  std::shared_ptr<CallInvoker> jsInvoker_;

 protected:
  struct MethodMetadata {
    size_t argCount;
    ABI46_0_0facebook::jsi::Value (*invoker)(
        ABI46_0_0facebook::jsi::Runtime &rt,
        TurboModule &turboModule,
        const ABI46_0_0facebook::jsi::Value *args,
        size_t count);
  };

  std::unordered_map<std::string, MethodMetadata> methodMap_;
};

/**
 * An app/platform-specific provider function to get an instance of a module
 * given a name.
 */
using TurboModuleProviderFunctionType =
    std::function<std::shared_ptr<TurboModule>(const std::string &name)>;

} // namespace ABI46_0_0React
} // namespace ABI46_0_0facebook
