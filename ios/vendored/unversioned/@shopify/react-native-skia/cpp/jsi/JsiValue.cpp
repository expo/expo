#include "JsiValue.h"

namespace RNJsi {

JsiValue::JsiValue() : _type(PropType::Undefined) {}

JsiValue::JsiValue(jsi::Runtime &runtime, const jsi::Value &value)
    : JsiValue() {
  setCurrent(runtime, value);
}

void JsiValue::setCurrent(jsi::Runtime &runtime, const jsi::Value &value) {
  _stringValue = "";
  _hostObject = nullptr;
  _hostFunction = nullptr;
  _props.clear();
  _array.clear();
  _keysCache.clear();

  if (value.isNumber()) {
    _type = PropType::Number;
    _numberValue = value.asNumber();
  } else if (value.isBool()) {
    _type = PropType::Bool;
    _boolValue = value.getBool();
  } else if (value.isString()) {
    _type = PropType::String;
    _stringValue = value.asString(runtime).utf8(runtime);
  } else if (value.isUndefined()) {
    _type = PropType::Undefined;
  } else if (value.isNull()) {
    _type = PropType::Null;
  } else if (value.isObject()) {
    setObject(runtime, value);
  } else {
    throw std::runtime_error("Could not store jsi::Value of provided type");
  }
}

bool JsiValue::getAsBool() const {
  if (_type != PropType::Bool) {
    throw std::runtime_error("Expected type bool, got " +
                             getTypeAsString(_type));
  }
  return _boolValue;
}

double JsiValue::getAsNumber() const {
  if (_type != PropType::Number) {
    throw std::runtime_error("Expected type number, got " +
                             getTypeAsString(_type));
  }
  return _numberValue;
}

const std::string &JsiValue::getAsString() const {
  if (_type == PropType::Number) {
    return std::move(std::to_string(_numberValue));
  }

  if (_type != PropType::String) {
    throw std::runtime_error("Expected type string, got " +
                             getTypeAsString(_type));
  }
  return _stringValue;
}

const std::vector<JsiValue> &JsiValue::getAsArray() const {
  if (_type != PropType::Array) {
    throw std::runtime_error("Expected type array, got " +
                             getTypeAsString(_type));
  }
  return _array;
}

const JsiValue &JsiValue::getValue(PropId name) const {
  if (_type != PropType::Object) {
    throw std::runtime_error("Expected type object, got " +
                             getTypeAsString(_type));
  }
  return _props.at(name);
}

bool JsiValue::hasValue(PropId name) const {
  if (_type != PropType::Object) {
    throw std::runtime_error("Expected type object, got " +
                             getTypeAsString(_type));
  }
  return _props.count(name) > 0;
}

std::vector<PropId> JsiValue::getKeys() const {
  if (_type != PropType::Object) {
    throw std::runtime_error("Expected type object, got " +
                             getTypeAsString(_type));
  }
  return _keysCache;
}

std::shared_ptr<jsi::HostObject> JsiValue::getAsHostObject() const {
  if (_type != PropType::HostObject) {
    throw std::runtime_error("Expected type host object, got " +
                             getTypeAsString(_type));
  }
  return _hostObject;
}

jsi::HostFunctionType JsiValue::getAsHostFunction() const {
  if (_type != PropType::HostFunction) {
    throw std::runtime_error("Expected type host function, got " +
                             getTypeAsString(_type));
  }
  return _hostFunction;
}

const jsi::HostFunctionType JsiValue::getAsFunction() const {
  return getAsHostFunction();
}

std::string JsiValue::asString() const {
  switch (_type) {
  case PropType::Null:
    return "(null)";
  case PropType::Undefined:
    return "(undefined)";
  case PropType::Number:
    return std::to_string(_numberValue);
  case PropType::Bool:
    return std::to_string(_boolValue);
  case PropType::String:
    return _stringValue;
  case PropType::Object:
    return "[Object]";
  case PropType::Array:
    return "[Array]";
  case PropType::HostObject:
    return "[HostObject]";
  case PropType::HostFunction:
    return "[HostFunction]";
  }
}

jsi::Value JsiValue::getAsJsiValue(jsi::Runtime &runtime) const {
  switch (_type) {
  case PropType::Undefined:
    return jsi::Value::undefined();
  case PropType::Null:
    return jsi::Value::null();
  case PropType::Number:
    return _numberValue;
  case PropType::Bool:
    return _boolValue;
  case PropType::String:
    return jsi::String::createFromUtf8(runtime, _stringValue);
  case PropType::Object:
    return getObject(runtime);
  case PropType::Array:
    return getArray(runtime);
  case PropType::HostObject:
    return getHostObject(runtime);
  case PropType::HostFunction:
    return getHostFunction(runtime);
  }
}

std::string JsiValue::getTypeAsString(PropType type) {
  switch (type) {
  case PropType::Undefined:
    return "undefined";
  case PropType::Null:
    return "null";
  case PropType::Number:
    return "number";
  case PropType::Bool:
    return "boolean";
  case PropType::String:
    return "string";
  case PropType::Object:
    return "object";
  case PropType::Array:
    return "array";
  case PropType::HostObject:
    return "hostobject";
  case PropType::HostFunction:
    return "hostfunction";
  }
}

void JsiValue::setObject(jsi::Runtime &runtime, const jsi::Value &value) {
  auto obj = value.asObject(runtime);
  if (obj.isFunction(runtime)) {
    setFunction(runtime, value);
  } else if (obj.isArray(runtime)) {
    setArray(runtime, obj);
  } else if (obj.isHostObject(runtime)) {
    setHostObject(runtime, obj);
  } else {
    _type = PropType::Object;
    // Read object keys
    auto keys = obj.getPropertyNames(runtime);
    size_t size = keys.size(runtime);
    _keysCache.clear();
    _keysCache.reserve(size);
    _props.clear();
    _props.reserve(size);

    for (size_t i = 0; i < size; ++i) {
      auto key = JsiPropId::get(
          keys.getValueAtIndex(runtime, i).asString(runtime).utf8(runtime));
      try {
        _props.try_emplace(key, runtime, obj.getProperty(runtime, key));
        _keysCache.push_back(key);
      } catch (jsi::JSError e) {
        throw jsi::JSError(runtime,
                           "Could not set property for key " +
                               std::string(key) + ":\n" + e.getMessage(),
                           e.getStack());
      }
    }
  }
}

jsi::Object JsiValue::getObject(jsi::Runtime &runtime) const {
  assert(_type == PropType::Object);
  auto obj = jsi::Object(runtime);
  for (auto &p : _props) {
    obj.setProperty(runtime, p.first, p.second.getAsJsiValue(runtime));
  }
  return obj;
}

bool JsiValue::operator!=(const JsiValue &other) const {
  return !(this->operator==(other));
}

bool JsiValue::operator==(const JsiValue &other) const {

  if (other.getType() != getType()) {
    return false;
  }

  switch (_type) {
  case PropType::Null:
  case PropType::Undefined:
    return true;
  case PropType::Number:
    return _numberValue == other.getAsNumber();
  case PropType::Bool:
    return _boolValue == other.getAsBool();
  case PropType::String:
    return _stringValue == other.getAsString();
  case PropType::Object: {
    if (_props.size() != other.getProps().size()) {
      return false;
    }
    for (auto &p : _props) {
      auto t = p.second.operator==(other.getValue(p.first));
      if (!t) {
        return false;
      }
    }
    return true;
  }
  case PropType::Array: {
    auto otherArr = other.getAsArray();
    if (_array.size() != otherArr.size()) {
      return false;
    }
    for (size_t i = 0; i < _array.size(); ++i) {
      if (!_array[i].operator==(otherArr[i])) {
        return false;
      }
    }
    return true;
  }
  case PropType::HostObject:
    return getAsHostObject() == other.getAsHostObject();
  case PropType::HostFunction:
    // Unable to compare host functions
    return false;
  }

  throw std::runtime_error(
      "Wrong type in equals call. Should not happen. File a bug.");

  return false;
}

void JsiValue::setFunction(jsi::Runtime &runtime, const jsi::Value &value) {
  auto func = value.asObject(runtime).asFunction(runtime);
  if (func.isHostFunction(runtime)) {
    _type = PropType::HostFunction;
    _hostFunction = func.getHostFunction(runtime);
  } else {
    _type = PropType::HostFunction;
    auto obj = std::make_shared<jsi::Object>(value.asObject(runtime));
    _hostFunction = [obj](jsi::Runtime &runtime, const jsi::Value &thisValue,
                          const jsi::Value *arguments,
                          size_t count) -> jsi::Value {
      auto func = obj->asFunction(runtime);
      if (thisValue.isNull() || thisValue.isUndefined()) {
        return func.call(runtime, arguments, count);
      } else {
        return func.callWithThis(runtime, thisValue.asObject(runtime),
                                 arguments, count);
      }
    };
  }
}

jsi::Object JsiValue::getHostFunction(jsi::Runtime &runtime) const {
  assert(_type == PropType::HostFunction);
  return jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forUtf8(runtime, "fn"), 0, _hostFunction);
}

void JsiValue::setArray(jsi::Runtime &runtime, const jsi::Object &obj) {
  _type = PropType::Array;
  auto arr = obj.asArray(runtime);
  size_t size = arr.size(runtime);
  _array.reserve(size);
  for (size_t i = 0; i < size; ++i) {
    _array.emplace_back(runtime, arr.getValueAtIndex(runtime, i));
  }
}

jsi::Array JsiValue::getArray(jsi::Runtime &runtime) const {
  assert(_type == PropType::Array);
  jsi::Array arr = jsi::Array(runtime, _array.size());
  for (size_t i = 0; i < _array.size(); ++i) {
    arr.setValueAtIndex(runtime, i, _array[i].getAsJsiValue(runtime));
  }
  return arr;
}

void JsiValue::setHostObject(jsi::Runtime &runtime, const jsi::Object &obj) {
  _type = PropType::HostObject;
  _hostObject = obj.asHostObject(runtime);
}

jsi::Object JsiValue::getHostObject(jsi::Runtime &runtime) const {
  assert(_type == PropType::HostObject);
  return jsi::Object::createFromHostObject(runtime, _hostObject);
}

} // namespace RNJsi
