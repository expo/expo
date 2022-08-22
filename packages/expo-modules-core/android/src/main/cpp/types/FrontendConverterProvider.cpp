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
  RegisterConverter(CppType::FLOAT, FloatFrontendConverter);
  RegisterConverter(CppType::DOUBLE, DoubleFrontendConverter);
  RegisterConverter(CppType::BOOLEAN, BooleanFrontendConverter);
  RegisterConverter(CppType::TYPED_ARRAY, TypedArrayFrontendConverter);
  RegisterConverter(CppType::JS_OBJECT, JavaScriptObjectFrontendConverter);
  RegisterConverter(CppType::JS_VALUE, JavaScriptValueFrontendConverter);
  RegisterConverter(CppType::STRING, StringFrontendConverter);
  RegisterConverter(CppType::READABLE_MAP, ReadableNativeMapArrayFrontendConverter);
  RegisterConverter(CppType::READABLE_ARRAY, ReadableNativeArrayFrontendConverter);
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

  // Any
  // We are not using all types here to provide a similar behaviour to the bridge implementation
  registerPolyConverter({
                          CppType::DOUBLE,
                          CppType::READABLE_MAP,
                          CppType::READABLE_ARRAY,
                          CppType::STRING,
                          CppType::BOOLEAN
                        });
}


std::shared_ptr<FrontendConverter> FrontendConverterProvider::obtainConverter(
  jni::local_ref<ExpectedType> expectedType
) {
  CppType combinedType = expectedType->getCombinedTypes();
  auto result = simpleConverters.find(combinedType);
  if (result == simpleConverters.end()) {
    // We don't have a converter for the expected type. That's why we used an UnknownFrontendConverter.
    return simpleConverters.at(CppType::NONE);
  }

  return result->second;
}
} // namespace expo
