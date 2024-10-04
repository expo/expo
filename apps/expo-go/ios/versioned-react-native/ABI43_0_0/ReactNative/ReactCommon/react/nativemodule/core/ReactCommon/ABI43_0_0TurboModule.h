/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <unordered_map>

#include <ABI43_0_0jsi/ABI43_0_0jsi.h>

#include <ABI43_0_0ReactCommon/ABI43_0_0CallInvoker.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

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
class JSI_EXPORT TurboModule : public ABI43_0_0facebook::jsi::HostObject {
 public:
  TurboModule(const std::string &name, std::shared_ptr<CallInvoker> jsInvoker);
  virtual ~TurboModule();

  virtual ABI43_0_0facebook::jsi::Value get(
      ABI43_0_0facebook::jsi::Runtime &runtime,
      const ABI43_0_0facebook::jsi::PropNameID &propName) override;

  const std::string name_;
  std::shared_ptr<CallInvoker> jsInvoker_;

 protected:
  struct MethodMetadata {
    size_t argCount;
    ABI43_0_0facebook::jsi::Value (*invoker)(
        ABI43_0_0facebook::jsi::Runtime &rt,
        TurboModule &turboModule,
        const ABI43_0_0facebook::jsi::Value *args,
        size_t count);
  };

  std::unordered_map<std::string, MethodMetadata> methodMap_;
};

/**
 * An app/platform-specific provider function to get an instance of a module
 * given a name.
 */
using TurboModuleProviderFunctionType = std::function<std::shared_ptr<
    TurboModule>(const std::string &name, const jsi::Value *schema)>;

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
