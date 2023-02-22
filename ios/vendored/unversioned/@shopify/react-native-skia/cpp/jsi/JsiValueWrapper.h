#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <string>

namespace RNJsi {
namespace jsi = facebook::jsi;

enum JsiWrapperValueType {
  NonInitialized,
  Undefined,
  Null,
  Bool,
  Number,
  String,
  Object,
  Function,
  Array,
  HostObject,
  Unknown
};

/**
 Implements a simple wrapper class for JSI values where the value can be read
 without asking the runtime for any assistance Meaning that we can access
 members without being on the JS thread.
 */
class JsiValueWrapper {
public:
  explicit JsiValueWrapper(jsi::Runtime &runtime)
      : _type(JsiWrapperValueType::Undefined) {}

  JsiValueWrapper(jsi::Runtime &runtime, const jsi::Value &value)
      : JsiValueWrapper(runtime) {
    setCurrent(runtime, value);
  }

  void setCurrent(jsi::Runtime &runtime, const jsi::Value &value) {
    if (value.isNumber()) {
      _type = JsiWrapperValueType::Number;
      _numberValue = value.asNumber();
    } else if (value.isBool()) {
      _type = JsiWrapperValueType::Bool;
      _boolValue = value.getBool();
    } else if (value.isString()) {
      _type = JsiWrapperValueType::String;
      _stringValue = value.asString(runtime).utf8(runtime);
    } else if (value.isUndefined()) {
      _type = JsiWrapperValueType::Undefined;
    } else if (value.isNull()) {
      _type = JsiWrapperValueType::Null;
    } else if (value.isObject()) {
      _type = JsiWrapperValueType::Object;
      _objectValue = std::make_shared<jsi::Object>(value.asObject(runtime));
      if (_objectValue->isFunction(runtime)) {
        _type = JsiWrapperValueType::Function;
        _functionValue =
            std::make_shared<jsi::Function>(_objectValue->asFunction(runtime));
        _objectValue = nullptr;
      } else if (_objectValue->isArray(runtime)) {
        _type = JsiWrapperValueType::Array;
        _arrayValue =
            std::make_shared<jsi::Array>(_objectValue->asArray(runtime));
        _objectValue = nullptr;
      } else if (_objectValue->isHostObject(runtime)) {
        _type = JsiWrapperValueType::HostObject;
        _hostObjectValue = _objectValue->asHostObject(runtime);
        _objectValue = nullptr;
      }
    } else {
      throw std::runtime_error("Could not store jsi::Value of provided type");
    }
    // Save in value holder as well so that we can return current
    if (_valueHolder == nullptr) {
      _valueHolder = std::make_shared<jsi::Object>(runtime);
    }
    _valueHolder->setProperty(runtime, "current", value);
  }

  jsi::Value getCurrent(jsi::Runtime &runtime) {
    if (_valueHolder == nullptr) {
      return jsi::Value::undefined();
    }
    return _valueHolder->getProperty(runtime, "current");
  }

  bool isUndefinedOrNull() { return isUndefined() || isNull(); }

  bool isUndefined() { return _type == JsiWrapperValueType::Undefined; }

  bool isNull() { return _type == JsiWrapperValueType::Null; }

  bool getAsBool() {
    assert(_type == JsiWrapperValueType::Bool);
    return _boolValue;
  }

  double getAsNumber() {
    assert(_type == JsiWrapperValueType::Number);
    return _numberValue;
  }

  const std::string &getAsString() {
    assert(_type == JsiWrapperValueType::String);
    return _stringValue;
  }

  std::shared_ptr<jsi::Function> getAsFunction() {
    assert(_type == JsiWrapperValueType::Function);
    return _functionValue;
  }

  std::shared_ptr<jsi::Array> getAsArray() {
    assert(_type == JsiWrapperValueType::Array);
    return _arrayValue;
  }

  std::shared_ptr<jsi::Object> getAsObject() {
    assert(_type == JsiWrapperValueType::Object);
    return _objectValue;
  }

  std::shared_ptr<jsi::HostObject> getAsHostObject() {
    assert(_type == JsiWrapperValueType::HostObject);
    return _hostObjectValue;
  }

  JsiWrapperValueType getType() { return _type; }

  bool equals(jsi::Runtime &runtime, const jsi::Value &value) {
    if (value.isNumber() && _type == JsiWrapperValueType::Number) {
      return _numberValue == value.asNumber();
    } else if (value.isBool() && _type == JsiWrapperValueType::Bool) {
      return _boolValue == value.getBool();
    } else if (value.isUndefined()) {
      return _type == JsiWrapperValueType::Undefined;
    } else if (value.isNull()) {
      return _type == JsiWrapperValueType::Null;
    } else if (value.isString()) {
      auto current = getCurrent(runtime);
      if (current.isString()) {
        return jsi::String::strictEquals(runtime, value.asString(runtime),
                                         current.asString(runtime));
      }
      return false;
    }
    return false;
  }

private:
  std::shared_ptr<jsi::Object> _valueHolder;

  bool _boolValue;
  double _numberValue;
  std::string _stringValue;
  std::shared_ptr<jsi::Object> _objectValue;
  std::shared_ptr<jsi::Function> _functionValue;
  std::shared_ptr<jsi::Array> _arrayValue;
  std::shared_ptr<jsi::HostObject> _hostObjectValue;

  JsiWrapperValueType _type;
};
} // namespace RNJsi
