// Copyright © 2026-present 650 Industries, Inc. (aka Expo)

#pragma once

namespace expo {
/**
 * A cpp version of the `expo.modules.kotlin.jni.ReturnType` enum.
 */
enum class ReturnType {
  UNKNOWN = 0,
  DOUBLE = 1 << 0,
  INT = 1 << 1,
  LONG = 1 << 2,
  STRING = 1 << 3,
  BOOLEAN = 1 << 4,
  FLOAT = 1 << 5,
  WRITEABLE_ARRAY = 1 << 6,
  WRITEABLE_MAP = 1 << 7,
  JS_MODULE = 1 << 8,
  SHARED_OBJECT = 1 << 9,
  JS_TYPED_ARRAY = 1 << 10,
  JS_ARRAY_BUFFER = 1 << 11,
  ARRAY_BUFFER = 1 << 12,
  NATIVE_ARRAY_BUFFER = 1 << 13,
  MAP = 1 << 14,
  COLLECTION = 1 << 15,
  DOUBLE_ARRAY = 1 << 16,
  INT_ARRAY = 1 << 17,
  LONG_ARRAY = 1 << 18,
  FLOAT_ARRAY = 1 << 19,
  BOOLEAN_ARRAY = 1 << 20,
};

} // namespace expo
