// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {

/**
 * A base interface for all decorators.
 * Used decorators should be retained by the object that is decorated.
 * The decorator should only be used by a single object.
 */
class JSDecorator {
public:
  virtual ~JSDecorator() = default;

  virtual void decorate(
    jsi::Runtime &runtime,
    jsi::Object &jsObject
  ) = 0;
};

} // namespace expo
