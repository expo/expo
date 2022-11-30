/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <unordered_map>

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>

#include <ABI47_0_0ReactCommon/ABI47_0_0CallInvoker.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

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

class TurboCxxModule;
class TurboModuleBinding;

/**
 * Base HostObject class for every module to be exposed to JS
 */
class JSI_EXPORT TurboModule : public ABI47_0_0facebook::jsi::HostObject {
 public:
  TurboModule(std::string name, std::shared_ptr<CallInvoker> jsInvoker);

  // Note: keep this method declared inline to avoid conflicts
  // between RTTI and non-RTTI compilation units
  ABI47_0_0facebook::jsi::Value get(
      ABI47_0_0facebook::jsi::Runtime &runtime,
      const ABI47_0_0facebook::jsi::PropNameID &propName) override {
    {
      std::string propNameUtf8 = propName.utf8(runtime);
      auto p = methodMap_.find(propNameUtf8);
      if (p == methodMap_.end()) {
        // Method was not found, let JS decide what to do.
        return ABI47_0_0facebook::jsi::Value::undefined();
      } else {
        return get(runtime, propName, p->second);
      }
    }
  }

  std::vector<ABI47_0_0facebook::jsi::PropNameID> getPropertyNames(
      ABI47_0_0facebook::jsi::Runtime &runtime) override {
    std::vector<jsi::PropNameID> result;
    result.reserve(methodMap_.size());
    for (auto it = methodMap_.cbegin(); it != methodMap_.cend(); ++it) {
      result.push_back(jsi::PropNameID::forUtf8(runtime, it->first));
    }
    return result;
  }

 protected:
  const std::string name_;
  std::shared_ptr<CallInvoker> jsInvoker_;

  struct MethodMetadata {
    size_t argCount;
    ABI47_0_0facebook::jsi::Value (*invoker)(
        ABI47_0_0facebook::jsi::Runtime &rt,
        TurboModule &turboModule,
        const ABI47_0_0facebook::jsi::Value *args,
        size_t count);
  };
  std::unordered_map<std::string, MethodMetadata> methodMap_;

 private:
  friend class TurboCxxModule;
  friend class TurboModuleBinding;
  std::unique_ptr<jsi::Object> jsRepresentation_;

  ABI47_0_0facebook::jsi::Value get(
      ABI47_0_0facebook::jsi::Runtime &runtime,
      const ABI47_0_0facebook::jsi::PropNameID &propName,
      const MethodMetadata &meta);
};

/**
 * An app/platform-specific provider function to get an instance of a module
 * given a name.
 */
using TurboModuleProviderFunctionType =
    std::function<std::shared_ptr<TurboModule>(const std::string &name)>;

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
