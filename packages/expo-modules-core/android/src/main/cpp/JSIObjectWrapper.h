// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <jsi/jsi.h>

#include <memory>

namespace jsi = facebook::jsi;

namespace expo {
/**
 * An interface for classes which wrap jsi::Object.
 */
class JSIObjectWrapper {
public:
  /**
   * @return a pointer to the underlying jsi::Object.
   */
  virtual std::shared_ptr<jsi::Object> get() = 0;
};

/**
 * An interface for classes which wrap jsi::Value.
 */
class JSIValueWrapper {
public:
  /**
   * @return a pointer to the underlying jsi::Value.
   */
  virtual std::shared_ptr<jsi::Value> get() = 0;
};
} // namespace expo
