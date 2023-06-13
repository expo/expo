#pragma once

#include <jsi/jsi.h>

#include <memory>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

namespace RNJsi {

namespace jsi = facebook::jsi;

enum struct PropType {
  Undefined = 0,
  Null = 1, // Keep undefined / null constant so that we can do checks faster
  Bool = 2,
  Number = 3,
  String = 4,
  Object = 5,
  HostObject = 6,
  HostFunction = 7,
  Array = 8
};

using PropId = const char *;

class JsiPropId {
public:
  static const char *get(const std::string &name) { return _get(name); }

  static const char *get(const std::string &&name) {
    return _get(std::move(name));
  }

private:
  static const char *_get(const std::string &name) {
    if (_impls().count(name) == 0) {
      // Alloc string
      char *impl = new char[name.size() + 1];
      strncpy(impl, name.c_str(), name.size() + 1);
      _impls().emplace(name, impl);
    }
    return _impls().at(name);
  }

  static std::unordered_map<std::string, PropId> &_impls() {
    static std::unordered_map<std::string, PropId> impls;
    return impls;
  }
};

/**
 This is a class that deep copies values from JS to C++.
 */
class JsiValue {
public:
  /**
   Default constructor for an empty JsiValue
   */
  JsiValue();

  /**
   Constructs an instance of the JsiValue object with a current value
   */
  JsiValue(jsi::Runtime &runtime, const jsi::Value &value);

  /**
   Updates the current value from the Javascript value. This function will
   perform a deep copy of the javascript value.
   */
  void setCurrent(jsi::Runtime &runtime, const jsi::Value &value);

  /**
   Returns the type of value contained in this JsiValue
   */
  PropType getType() const { return _type; }

  /**
   Returns true if the value is undefined or null.
   */
  bool isUndefinedOrNull() const { return _type <= PropType::Null; }

  /**
   Returns true if the value is undefined.
   */
  bool isUndefined() const { return _type == PropType::Undefined; }

  /**
   Returns true if the value is null.
   */
  bool isNull() const { return _type == PropType::Null; }

  /**
   Returns the bool value. Requires that the underlying type is bool
   */
  bool getAsBool() const;

  /**
   Returns the numeric value. Requires that the underlying type is number
   */
  double getAsNumber() const;

  /**
   Returns the string value. Requires that the underlying type is string
   */
  const std::string &getAsString() const;

  /**
   Returns the array value. Requires that the underlying type is array
   */
  const std::vector<JsiValue> &getAsArray() const;

  /**
   Returns an inner value by name. Requires that the underlying type is Object
   */
  const JsiValue &getValue(PropId name) const;

  /**
   Returns true if the underlying type is Object and the property name exists.
   */
  bool hasValue(PropId name) const;

  /**
   Returns the names of the properties stored in this value
   */
  std::vector<PropId> getKeys() const;

  /**
   Returns the host object value. Requires that the underlying type is Host
   Object
   */
  std::shared_ptr<jsi::HostObject> getAsHostObject() const;

  /**
   Returns a dynamic cast of the host object value. Requires that the underlying
   type is Host Object
   */
  template <typename T> std::shared_ptr<T> getAs() const {
    if (_type != PropType::HostObject) {
      throw std::runtime_error("Expected type host object, got " +
                               getTypeAsString(_type));
    }
    return std::dynamic_pointer_cast<T>(_hostObject);
  }

  /**
   Returns the host function. Requires that the type is HostFunction
   */
  jsi::HostFunctionType getAsHostFunction() const;

  /**
   Returns a callable HostFunction representing the undderlying js function.
   Requires that the type is Function
   */
  const jsi::HostFunctionType getAsFunction() const;

  /**
   Returns a string representation of the value
   */
  std::string asString() const;

  /**
   Converts the underlying value back to a JS value
   */
  jsi::Value getAsJsiValue(jsi::Runtime &runtime) const;

  /**
   Returns a string representing the type.
   */
  static std::string getTypeAsString(PropType type);

  /**
   Implements the equals operator
   */
  bool operator==(const JsiValue &other) const;

  /**
   Implements the inequals operator
   */
  bool operator!=(const JsiValue &other) const;

protected:
  const std::unordered_map<PropId, JsiValue> &getProps() const {
    return _props;
  }

  bool boolValue() const { return _boolValue; }
  double numberValue() const { return _numberValue; }
  std::string stringValue() const { return _stringValue; }
  std::shared_ptr<jsi::HostObject> hostObject() const { return _hostObject; }
  jsi::HostFunctionType hostFunction() const { return _hostFunction; }
  std::vector<JsiValue> array() const { return _array; }
  std::unordered_map<PropId, JsiValue> props() const { return _props; }
  const std::vector<PropId> &keysCache() const { return _keysCache; }

private:
  void setObject(jsi::Runtime &runtime, const jsi::Value &value);
  jsi::Object getObject(jsi::Runtime &runtime) const;

  void setFunction(jsi::Runtime &runtime, const jsi::Value &value);
  jsi::Object getHostFunction(jsi::Runtime &runtime) const;

  void setArray(jsi::Runtime &runtime, const jsi::Object &obj);
  jsi::Array getArray(jsi::Runtime &runtime) const;

  void setHostObject(jsi::Runtime &runtime, const jsi::Object &obj);
  jsi::Object getHostObject(jsi::Runtime &runtime) const;

  PropType _type = PropType::Undefined;
  bool _boolValue;
  double _numberValue;
  std::string _stringValue = "";
  std::shared_ptr<jsi::HostObject> _hostObject;
  jsi::HostFunctionType _hostFunction;
  std::vector<JsiValue> _array;
  std::unordered_map<PropId, JsiValue> _props;
  std::vector<PropId> _keysCache;
};

} // namespace RNJsi
