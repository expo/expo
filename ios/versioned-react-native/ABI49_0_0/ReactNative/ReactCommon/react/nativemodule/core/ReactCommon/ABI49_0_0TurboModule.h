/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <unordered_map>

#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

#include <ABI49_0_0ReactCommon/ABI49_0_0CallInvoker.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

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
class JSI_EXPORT TurboModule : public ABI49_0_0facebook::jsi::HostObject {
 public:
  TurboModule(std::string name, std::shared_ptr<CallInvoker> jsInvoker);

  // Note: keep this method declared inline to avoid conflicts
  // between RTTI and non-RTTI compilation units
  ABI49_0_0facebook::jsi::Value get(
      ABI49_0_0facebook::jsi::Runtime &runtime,
      const ABI49_0_0facebook::jsi::PropNameID &propName) override {
    {
      std::string propNameUtf8 = propName.utf8(runtime);
      auto p = methodMap_.find(propNameUtf8);
      if (p == methodMap_.end()) {
        // Method was not found, let JS decide what to do.
        return ABI49_0_0facebook::jsi::Value::undefined();
      } else {
        auto moduleMethod = createHostFunction(runtime, propName, p->second);
        // If we have a JS wrapper, cache the result of this lookup
        // We don't cache misses, to allow for methodMap_ to dynamically be
        // extended
        if (jsRepresentation_) {
          jsRepresentation_->lock(runtime).asObject(runtime).setProperty(
              runtime, propName, moduleMethod);
        }
        return moduleMethod;
      }
    }
  }

  std::vector<ABI49_0_0facebook::jsi::PropNameID> getPropertyNames(
      ABI49_0_0facebook::jsi::Runtime &runtime) override {
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
    ABI49_0_0facebook::jsi::Value (*invoker)(
        ABI49_0_0facebook::jsi::Runtime &rt,
        TurboModule &turboModule,
        const ABI49_0_0facebook::jsi::Value *args,
        size_t count);
  };
  std::unordered_map<std::string, MethodMetadata> methodMap_;

  using ArgFactory =
      std::function<void(jsi::Runtime &runtime, std::vector<jsi::Value> &args)>;

  /**
   * Calls ABI49_0_0RCTDeviceEventEmitter.emit to JavaScript, with given event name and
   * an optional list of arguments.
   * If present, argFactory is a callback used to construct extra arguments,
   * e.g.
   *
   *  emitDeviceEvent(rt, "myCustomEvent",
   *    [](jsi::Runtime& rt, std::vector<jsi::Value>& args) {
   *      args.emplace_back(jsi::Value(true));
   *      args.emplace_back(jsi::Value(42));
   *  });
   */
  void emitDeviceEvent(
      jsi::Runtime &runtime,
      const std::string &eventName,
      ArgFactory argFactory = nullptr);

 private:
  friend class TurboCxxModule;
  friend class TurboModuleBinding;
  std::unique_ptr<jsi::WeakObject> jsRepresentation_;

  ABI49_0_0facebook::jsi::Value createHostFunction(
      ABI49_0_0facebook::jsi::Runtime &runtime,
      const ABI49_0_0facebook::jsi::PropNameID &propName,
      const MethodMetadata &meta);
};

/**
 * An app/platform-specific provider function to get an instance of a module
 * given a name.
 */
using TurboModuleProviderFunctionType =
    std::function<std::shared_ptr<TurboModule>(const std::string &name)>;

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
