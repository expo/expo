
#pragma once

#include <jsi/jsi.h>

namespace RNJsi
{
using namespace facebook;

enum JsiWrapperValueType
{
    NonInitialized,
    Undefined,
    Null,
    Bool,
    Number,
    JsiValue
};

/**
 Implements a simple wrapper class for JSI primitives like numbers and boolean values. Objects,
 strings and arrays are stored as values inside a property holder. The class also provides a method
 for comparing values that will compare numbers, booleans and strings.
 */
class JsiSimpleValueWrapper
{
public:
    JsiSimpleValueWrapper(jsi::Runtime& runtime) :
      _type(JsiWrapperValueType::NonInitialized),
      _propNameId(jsi::PropNameID::forUtf8(runtime, "value"))
    {}

    jsi::Value getCurrent(jsi::Runtime &runtime)
    {
      switch (_type)
      {
          case JsiWrapperValueType::NonInitialized:
              return nullptr;
          case JsiWrapperValueType::Undefined:
            return jsi::Value::undefined();
          case JsiWrapperValueType::Null:
            return jsi::Value::null();
          case JsiWrapperValueType::Bool:
            return _boolValue;
          case JsiWrapperValueType::Number:
            return _numberValue;
          case JsiWrapperValueType::JsiValue:
            if (_valueHolder == nullptr) {
                return jsi::Value::undefined();
            }
            return _valueHolder->getProperty(runtime, _propNameId);
      }
    }

    void setCurrent(jsi::Runtime &runtime, const jsi::Value &value)
    {
      if(value.isNumber()) {
        _type = JsiWrapperValueType::Number;
        _numberValue = value.asNumber();
      } else if(value.isBool()) {
        _type = JsiWrapperValueType::Bool;
        _boolValue = value.getBool();
      } else if(value.isUndefined()) {
        _type = JsiWrapperValueType::Undefined;
      } else if(value.isNull()) {
        _type = JsiWrapperValueType::Null;
      } else {
        _type = JsiWrapperValueType::JsiValue;
        // Save as javascript object - we don't want to have to copy strings, objects and values
        if(_valueHolder == nullptr) {
            _valueHolder = std::make_shared<jsi::Object>(runtime);
        }
        _valueHolder->setProperty(runtime, _propNameId, value);
      }
    }

    bool equals(jsi::Runtime& runtime, const jsi::Value &value) {
      if (_type == JsiWrapperValueType::NonInitialized) {
          return false;
      }
      if(value.isNumber() && _type == JsiWrapperValueType::Number) {
        return _numberValue == value.asNumber();
      } else if(value.isBool() && _type == JsiWrapperValueType::Bool) {
        return _boolValue == value.getBool();
      } else if(value.isUndefined()) {
        return _type == JsiWrapperValueType::Undefined;
      } else if(value.isNull()) {
        return _type == JsiWrapperValueType::Null;
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

    JsiWrapperValueType _type;
};
}
