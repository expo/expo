// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "../ExpoHeader.pch"

#include "JSDecorator.h"

namespace jni = facebook::jni;

namespace expo {

class JSDecoratorsBridgingObject;

class JSObjectDecorator : public JSDecorator {
public:
  void registerObject(
    jni::alias_ref<jstring> name,
    jni::alias_ref<jni::HybridClass<JSDecoratorsBridgingObject>::javaobject> jsDecoratorsBridgingObject
  );

  void decorate(
    jsi::Runtime &runtime,
    jsi::Object &jsObject
  ) override;

private:
  std::unordered_map<std::string, std::vector<std::unique_ptr<JSDecorator>>> objects;
};

} // namespace expo
