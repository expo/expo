// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

namespace expo {
/**
 * A cpp version of the `expo.modules.kotlin.jni.CppType` enum.
 * Used to determine which representation of the js value should be sent to the Kotlin.
 */
enum CppType {
  NONE = 0,
  DOUBLE = 1 << 0,
  INT = 1 << 1,
  FLOAT = 1 << 2,
  BOOLEAN = 1 << 3,
  STRING = 1 << 4,
  JS_OBJECT = 1 << 5,
  JS_VALUE = 1 << 6,
  READABLE_ARRAY = 1 << 7,
  READABLE_MAP = 1 << 8,
  TYPED_ARRAY = 1 << 9,
  PRIMITIVE_ARRAY = 1 << 10,
  LIST = 1 << 11,
  MAP = 1 << 12
};
} // namespace expo
