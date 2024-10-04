/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

/*
 * Exposes StubErrorUtils to JavaScript realm.
 */
class StubErrorUtils : public jsi::HostObject {
 public:
  static std::shared_ptr<StubErrorUtils> createAndInstallIfNeeded(
      jsi::Runtime &runtime) {
    auto errorUtilsModuleName = "ErrorUtils";
    auto errorUtilsValue =
        runtime.global().getProperty(runtime, errorUtilsModuleName);

    if (errorUtilsValue.isUndefined()) {
      auto stubErrorUtils = std::make_shared<StubErrorUtils>();
      auto object = jsi::Object::createFromHostObject(runtime, stubErrorUtils);
      runtime.global().setProperty(
          runtime, errorUtilsModuleName, std::move(object));
      return stubErrorUtils;
    }

    auto stubErrorUtilsObject = errorUtilsValue.asObject(runtime);
    return stubErrorUtilsObject.getHostObject<StubErrorUtils>(runtime);
  }

  /*
   * `jsi::HostObject` specific overloads.
   */
  jsi::Value get(jsi::Runtime &runtime, jsi::PropNameID const &name) override {
    auto propertyName = name.utf8(runtime);

    if (propertyName == "reportFatalError") {
      return jsi::Function::createFromHostFunction(
          runtime,
          name,
          1,
          [this](
              jsi::Runtime &runtime,
              jsi::Value const &,
              jsi::Value const *arguments,
              size_t) noexcept -> jsi::Value {
            reportFatalCallCount_++;
            return jsi::Value::undefined();
          });
    }

    return jsi::Value::undefined();
  }

  int getReportFatalCallCount() const {
    return reportFatalCallCount_;
  }

 private:
  int reportFatalCallCount_;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
