// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "FrontendConverterProvider.h"

namespace expo {
std::shared_ptr<FrontendConverterProvider> FrontendConverterProvider::instance() {
  static std::shared_ptr<FrontendConverterProvider> singleton{new FrontendConverterProvider};
  return singleton;
}

void FrontendConverterProvider::createConverters() {
#define RegisterConverter(type, clazz)  simpleConverters.insert({type, std::make_shared<clazz>()})
  RegisterConverter(CppType::NONE, UnknownFrontendConverter);
  RegisterConverter(CppType::INT, IntegerFrontendConverter);
  RegisterConverter(CppType::LONG, LongFrontendConverter);
  RegisterConverter(CppType::FLOAT, FloatFrontendConverter);
  RegisterConverter(CppType::DOUBLE, DoubleFrontendConverter);
  RegisterConverter(CppType::BOOLEAN, BooleanFrontendConverter);
  RegisterConverter(CppType::UINT8_TYPED_ARRAY, ByteArrayFrontendConverter);
  RegisterConverter(CppType::TYPED_ARRAY, TypedArrayFrontendConverter);
  RegisterConverter(CppType::JS_OBJECT, JavaScriptObjectFrontendConverter);
  RegisterConverter(CppType::JS_VALUE, JavaScriptValueFrontendConverter);
  RegisterConverter(CppType::JS_FUNCTION, JavaScriptFunctionFrontendConverter);
  RegisterConverter(CppType::STRING, StringFrontendConverter);
  RegisterConverter(CppType::READABLE_MAP, ReadableNativeMapArrayFrontendConverter);
  RegisterConverter(CppType::READABLE_ARRAY, ReadableNativeArrayFrontendConverter);
  RegisterConverter(CppType::VIEW_TAG, ViewTagFrontendConverter);
  RegisterConverter(CppType::SHARED_OBJECT_ID, SharedObjectIdConverter);
  RegisterConverter(CppType::ANY, AnyFrontendConvert);
#undef RegisterConverter

  auto registerPolyConverter = [this](const std::vector<CppType> &types) {
    std::vector<std::shared_ptr<FrontendConverter>> converters;
    CppType finalType = CppType::NONE;

    for (const auto type: types) {
      finalType = (CppType) ((int) finalType | (int) type);
      converters.push_back(simpleConverters.at(type));
    }

    simpleConverters.insert({finalType, std::make_shared<PolyFrontendConverter>(converters)});
  };

  // Enums
  registerPolyConverter({CppType::STRING, CppType::INT});
}

std::shared_ptr<FrontendConverter> FrontendConverterProvider::obtainConverter(
  jni::local_ref<ExpectedType::javaobject> expectedType
) {
  CppType combinedType = expectedType->getCombinedTypes();
  auto result = simpleConverters.find(combinedType);
  if (result != simpleConverters.end()) {
    return result->second;
  }

  if (combinedType == CppType::NULLABLE) {
    return std::make_shared<NullableFrontendConverter>(expectedType->getFirstType());
  }

  if (combinedType == CppType::PRIMITIVE_ARRAY) {
    return std::make_shared<PrimitiveArrayFrontendConverter>(expectedType->getFirstType());
  }

  if (combinedType == CppType::ARRAY) {
    return std::make_shared<ArrayFrontendConverter>(expectedType->getFirstType());
  }

  if (combinedType == CppType::LIST) {
    return std::make_shared<ListFrontendConverter>(expectedType->getFirstType());
  }

  if (combinedType == CppType::MAP) {
    return std::make_shared<MapFrontendConverter>(expectedType->getFirstType());
  }

  if (combinedType == CppType::VALUE_OR_UNDEFINED) {
    return std::make_shared<ValueOrUndefinedFrontendConverter>(expectedType->getFirstType());
  }

  std::vector<std::shared_ptr<FrontendConverter>> converters;
  auto singleTypes = expectedType->getPossibleTypes();
  size_t size = singleTypes->size();
  for (size_t i = 0; i < size; i++) {
    jni::local_ref<SingleType> singleType = singleTypes->getElement(i);
    converters.push_back(this->obtainConverterForSingleType(singleType));
  }

  if (converters.empty()) {
    // We don't have a converter for the expected type. That's why we used an UnknownFrontendConverter.
    return simpleConverters.at(CppType::NONE);
  }

  return std::make_shared<PolyFrontendConverter>(converters);
}

std::shared_ptr<FrontendConverter> FrontendConverterProvider::obtainConverterForSingleType(
  jni::local_ref<SingleType::javaobject> expectedType
) {
  CppType combinedType = expectedType->getCppType();
  auto result = simpleConverters.find(combinedType);
  if (result != simpleConverters.end()) {
    return result->second;
  }

  if (combinedType == CppType::PRIMITIVE_ARRAY) {
    return std::make_shared<PrimitiveArrayFrontendConverter>(expectedType);
  }

  if (combinedType == CppType::ARRAY) {
    return std::make_shared<ArrayFrontendConverter>(expectedType);
  }

  if (combinedType == CppType::LIST) {
    return std::make_shared<ListFrontendConverter>(expectedType);
  }

  if (combinedType == CppType::MAP) {
    return std::make_shared<MapFrontendConverter>(expectedType);
  }

  // We don't have a converter for the expected type. That's why we used an UnknownFrontendConverter.
  return simpleConverters.at(CppType::NONE);
}
} // namespace expo
