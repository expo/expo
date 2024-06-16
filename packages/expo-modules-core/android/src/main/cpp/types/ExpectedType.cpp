// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "ExpectedType.h"

namespace expo {

jni::local_ref<ExpectedType::javaobject> SingleType::getFirstParameterType() {
  static const auto method = getClass()->getMethod<jni::local_ref<ExpectedType::javaobject>()>(
    "getFirstParameterType");
  return method(self());
}

jni::local_ref<ExpectedType::javaobject> SingleType::getSecondParameterType() {
  static const auto method = getClass()->getMethod<jni::local_ref<ExpectedType::javaobject>()>(
    "getSecondParameterType");
  return method(self());
}

CppType SingleType::getCppType() {
  static const auto method = getClass()->getMethod<int()>("getCppType");
  return static_cast<CppType>(method(self()));
}

CppType ExpectedType::getCombinedTypes() {
  static const auto method = getClass()->getMethod<int()>("getCombinedTypes");
  return static_cast<CppType>(method(self()));
}

jni::local_ref<SingleType::javaobject> ExpectedType::getFirstType() {
  static const auto method = getClass()->getMethod<jni::local_ref<SingleType::javaobject>()>(
    "getFirstType");
  return method(self());
}

std::string ExpectedType::getJClassString(bool allowsPrimitives) {
  CppType type = this->getCombinedTypes();
  if (type == CppType::DOUBLE) {
    if (allowsPrimitives) {
      return "D";
    }
    return "java/lang/Double";
  }
  if (type == CppType::BOOLEAN) {
    if (allowsPrimitives) {
      return "Z";
    }
    return "java/lang/Boolean";
  }
  if (type == CppType::INT) {
    if (allowsPrimitives) {
      return "I";
    }
    return "java/lang/Integer";
  }
  if (type == CppType::FLOAT) {
    return "java/lang/Float";
  }
  if (type == CppType::STRING) {
    return "java/lang/String";
  }
  if (type == CppType::JS_OBJECT) {
    return "expo/modules/kotlin/jni/JavaScriptObject";
  }
  if (type == CppType::JS_VALUE) {
    return "expo/modules/kotlin/jni/JavaScriptValue";
  }
  if (type == CppType::READABLE_ARRAY) {
    return "com/facebook/react/bridge/ReadableNativeArray";
  }
  if (type == CppType::READABLE_MAP) {
    return "com/facebook/react/bridge/ReadableNativeMap";
  }
  if (type == CppType::UINT8_TYPED_ARRAY) {
    return "[B";
  }
  if (type == CppType::TYPED_ARRAY) {
    return "expo/modules/kotlin/jni/JavaScriptTypedArray";
  }
  if (type == CppType::PRIMITIVE_ARRAY) {
    auto innerType = this->getFirstType()->getFirstParameterType()->getJClassString(true);
    if (innerType.size() == 1) {
      // is a primitive type
      return "[" + innerType;
    }

    return "[L" + innerType + ";";
  }
  if (type == CppType::LIST) {
    return "java/util/ArrayList";
  }
  return "java/lang/Object";
}

jni::local_ref<jni::JArrayClass<SingleType>::javaobject> ExpectedType::getPossibleTypes() {
  static const auto method = getClass()->getMethod<jni::local_ref<jni::JArrayClass<SingleType>::javaobject>()>(
    "getPossibleTypes");
  return method(self());
}
} // namespace expo
