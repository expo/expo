
#pragma once

#include <jsi/jsi.h>

namespace RNJsi
{
using namespace facebook;

/**
 Implements a simple wrapper class for JSI primitives like numbers and boolean values. Objects,
 strings and arrays are stored as values inside a property holder. The class also provides a method
 for comparing values that will compare numbers, booleans and strings.
 */
class JsiSimpleValueWrapper
{
private:
  enum ValueType {
    NonInitialized,
    Undefined,
    Null,
    Bool,
    Number,
    JsiValue
  };

public:
    JsiSimpleValueWrapper(jsi::Runtime& runtime) :
      _type(ValueType::NonInitialized),
      _propNameId(jsi::PropNameID::forUtf8(runtime, "value"))
    {}

    jsi::Value getCurrent(jsi::Runtime &runtime)
    {
      switch (_type)
      {
          case ValueType::NonInitialized:
              return nullptr;
          case ValueType::Undefined:
            return jsi::Value::undefined();
          case ValueType::Null:
            return jsi::Value::null();
          case ValueType::Bool:
            return _boolValue;
          case ValueType::Number:
            return _numberValue;
          case ValueType::JsiValue:
            if (_valueHolder == nullptr) {
                return jsi::Value::undefined();
            }
            return _valueHolder->getProperty(runtime, _propNameId);
      }
    }

    void setCurrent(jsi::Runtime &runtime, const jsi::Value &value)
    {
      if(value.isNumber()) {
        _type = ValueType::Number;
        _numberValue = value.asNumber();
      } else if(value.isBool()) {
        _type = ValueType::Bool;
        _boolValue = value.getBool();
      } else if(value.isUndefined()) {
        _type = ValueType::Undefined;
      } else if(value.isNull()) {
        _type = ValueType::Null;
      } else {
        _type = ValueType::JsiValue;
        // Save as javascript object - we don't want to have to copy strings, objects and values
        if(_valueHolder == nullptr) {
            _valueHolder = std::make_shared<jsi::Object>(runtime);
        }
        _valueHolder->setProperty(runtime, _propNameId, value);
      }
    }

    bool equals(jsi::Runtime& runtime, const jsi::Value &value) {
      if (_type == ValueType::NonInitialized) {
          return false;
      }
      if(value.isNumber() && _type == ValueType::Number) {
        return _numberValue == value.asNumber();
      } else if(value.isBool() && _type == ValueType::Bool) {
        return _boolValue == value.getBool();
      } else if(value.isUndefined()) {
        return _type == ValueType::Undefined;
      } else if(value.isNull()) {
        return _type == ValueType::Null;
      } else if(value.isString()) {
          auto current = getCurrent(runtime);
          if (current.isString()) {
              return jsi::String::strictEquals(runtime, value.asString(runtime), current.asString(runtime));
          }
          return false;
      }
      return false;
    }

private:
    jsi::PropNameID _propNameId;
    std::shared_ptr<jsi::Object> _valueHolder;

    bool _boolValue;
    double _numberValue;

    ValueType _type;
};
}
