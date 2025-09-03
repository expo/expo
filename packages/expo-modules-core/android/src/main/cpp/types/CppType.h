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
  LONG = 1 << 2,
  FLOAT = 1 << 3,
  BOOLEAN = 1 << 4,
  STRING = 1 << 5,
  JS_OBJECT = 1 << 6,
  JS_VALUE = 1 << 7,
  READABLE_ARRAY = 1 << 8,
  READABLE_MAP = 1 << 9,
  UINT8_TYPED_ARRAY = 1 << 10,
  TYPED_ARRAY = 1 << 11,
  PRIMITIVE_ARRAY = 1 << 12,
  ARRAY = 1 << 13,
  LIST = 1 << 14,
  MAP = 1 << 15,
  VIEW_TAG = 1 << 16,
  SHARED_OBJECT_ID = 1 << 17,
  JS_FUNCTION = 1 << 18,
  ANY = 1 << 19,
  NULLABLE = 1 << 20,
  VALUE_OR_UNDEFINED = 1 << 21,
};
} // namespace expo
