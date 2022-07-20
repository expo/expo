// Copyright 2022-present 650 Industries. All rights reserved.

#include "ExpoViewProps.h"

namespace expo {

//ExpoViewProps::ExpoViewProps(const ExpoViewProps &other) {
////  this->runtime = other.runtime;
////  this->value = other.value;
////  this->rawProps = other.rawProps;
//}

ExpoViewProps::ExpoViewProps(const react::PropsParserContext &context,
                             const ExpoViewProps &sourceProps,
                             const react::RawProps &rawProps) : ViewProps(context, sourceProps, rawProps) {
  const ExpoRawProps *props = reinterpret_cast<const ExpoRawProps *>(&rawProps);
  jsi::Runtime *runtime = props->runtime_;

  this->value = std::make_shared<jsi::Value>(*runtime, props->value_);

//  this->runtime = static_cast<jsi::Runtime *>(props->runtime_);
//  this->value = std::make_shared<jsi::Value>()
//
//  if (props->value_.isObject()) {
//    jsi::Object obj = props->value_.asObject(*runtime);
//    jsi::Value proxiedProps = obj.getProperty(*runtime, "proxiedProperties");
//
//    if (proxiedProps.isObject()) {
//      this->value = std::make_shared<jsi::Object>(proxiedProps.asObject(*runtime));
//    }
//  }
}

const jsi::Value &ExpoViewProps::getValue() const {
  return *this->value.get();
}

//jsi::Runtime *ExpoViewProps::getRuntime() const {
////  return this->rawProps->runtime_;
//  return this->runtime;
//}

//const jsi::Value ExpoViewProps::getValue() const {
//  return jsi::Value(*this->runtime, this->value);
//  if (!this->rawProps) {
//    return jsi::Value::undefined();
//  }
//  bool isobj = this->rawProps->value_.isObject();
//  bool isstr = this->rawProps->value_.isString();
//
//  return jsi::Value(*this->getRuntime(), this->rawProps->value_);
//}

} // namespace expo
