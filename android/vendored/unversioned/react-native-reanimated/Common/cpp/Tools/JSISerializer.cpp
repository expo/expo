#include "JSISerializer.h"

#include <cxxabi.h>
#include <iostream>
#include <sstream>

const std::vector<std::string> SUPPORTED_ERROR_TYPES = {
    "Error",
    "AggregateError",
    "EvalError",
    "RangeError",
    "ReferenceError",
    "SyntaxError",
    "TypeError",
    "URIError",
    "InternalError"};

const std::vector<std::string> SUPPORTED_INDEXED_COLLECTION_TYPES = {
    "Int8Array",
    "Uint8Array",
    "Uint8ClampedArray",
    "Int16Array",
    "Uint16Array",
    "Int32Array",
    "Uint32Array",
    "BigInt64Array",
    "BigUint64Array",
    "Float32Array",
    "Float64Array",
};

const std::vector<std::string> SUPPORTED_STRUCTURED_DATA_TYPES = {
    "ArrayBuffer",
    "SharedArrayBuffer",
    "DataView",
    "Atomics",
    "JSON",
};

const std::vector<std::string> SUPPORTED_MANAGING_MEMORY_TYPES = {
    "WeakRef",
    "FinalizationRegistry",
};

const std::vector<std::string> SUPPORTED_ABSTRACTION_OBJECT_TYPES = {
    "Iterator",
    "AsyncIterator",
    "Promise",
    "GeneratorFunction",
    "AsyncGeneratorFunction",
    "Generator",
    "AsyncGenerator",
    "AsyncFunction",
};

const std::vector<std::string> SUPPORTED_REFLECTION_TYPES = {
    "Reflect",
    "Proxy",
};

static inline std::string getObjectTypeName(
    jsi::Runtime &rt,
    const jsi::Object &object) {
  return object.getPropertyAsObject(rt, "constructor")
      .getProperty(rt, "name")
      .toString(rt)
      .utf8(rt);
}

static inline bool isInstanceOf(
    jsi::Runtime &rt,
    const jsi::Object &object,
    const std::string &type) {
  return getObjectTypeName(rt, object) == type;
}

static inline bool isInstanceOfAny(
    jsi::Runtime &rt,
    const jsi::Object &object,
    const std::vector<std::string> &supportedTypes) {
  auto instanceType = getObjectTypeName(rt, object);

  return std::find(
             supportedTypes.begin(), supportedTypes.end(), instanceType) !=
      supportedTypes.end();
}

JSISerializer::JSISerializer(jsi::Runtime &rt)
    : rt_(rt),
      visitedNodes_(rt_.global()
                        .getPropertyAsFunction(rt_, "Set")
                        .callAsConstructor(rt_)
                        .asObject(rt_)) {}

std::string JSISerializer::stringifyWithName(const jsi::Object &object) {
  std::stringstream ss;
  ss << '[' << getObjectTypeName(rt_, object) << ']';

  return ss.str();
}

std::string JSISerializer::stringifyArray(const jsi::Array &arr) {
  std::stringstream ss;
  ss << '[';

  for (size_t i = 0, length = arr.size(rt_); i < length; i++) {
    jsi::Value element = arr.getValueAtIndex(rt_, i);
    ss << stringifyJSIValueRecursively(element);
    if (i != length - 1) {
      ss << ", ";
    }
  }

  ss << ']';

  return ss.str();
}

std::string JSISerializer::stringifyFunction(const jsi::Function &func) {
  std::stringstream ss;
  auto kind = (func.isHostFunction(rt_) ? "jsi::HostFunction" : "Function");
  auto name = func.getProperty(rt_, "name").toString(rt_).utf8(rt_);
  name = name.empty() ? "anonymous" : name;

  ss << '[' << kind << ' ' << name << ']';
  return ss.str();
}

std::string JSISerializer::stringifyHostObject(jsi::HostObject &hostObject) {
  int status = -1;
  char *hostObjClassName =
      abi::__cxa_demangle(typeid(hostObject).name(), NULL, NULL, &status);
  if (status != 0) {
    return "[jsi::HostObject]";
  }

  std::stringstream ss;
  ss << "[jsi::HostObject(" << hostObjClassName << ") ";
  std::free(hostObjClassName);

  auto props = hostObject.getPropertyNames(rt_);
  auto propsCount = props.size();
  auto lastKey = props.back().utf8(rt_);

  if (propsCount > 0) {
    ss << '{';
    for (const auto &key : props) {
      auto formattedKey = key.utf8(rt_);
      auto value = hostObject.get(rt_, key);
      ss << '"' << formattedKey << '"' << ": "
         << stringifyJSIValueRecursively(value);
      if (formattedKey != lastKey) {
        ss << ", ";
      }
    }
    ss << '}';
  }
  ss << ']';

  return ss.str();
}

std::string JSISerializer::stringifyObject(const jsi::Object &object) {
  std::stringstream ss;
  ss << '{';

  auto props = object.getPropertyNames(rt_);

  for (size_t i = 0, propsCount = props.size(rt_); i < propsCount; i++) {
    jsi::String propName = props.getValueAtIndex(rt_, i).toString(rt_);
    ss << '"' << propName.utf8(rt_) << '"' << ": "
       << stringifyJSIValueRecursively(object.getProperty(rt_, propName));
    if (i != propsCount - 1) {
      ss << ", ";
    }
  }

  ss << '}';

  return ss.str();
}

std::string JSISerializer::stringifyError(const jsi::Object &object) {
  std::stringstream ss;
  ss << '[' << object.getProperty(rt_, "name").toString(rt_).utf8(rt_) << ": "
     << object.getProperty(rt_, "message").toString(rt_).utf8(rt_) << ']';
  return ss.str();
}

std::string JSISerializer::stringifySet(const jsi::Object &object) {
  std::stringstream ss;
  jsi::Function arrayFrom = rt_.global()
                                .getPropertyAsObject(rt_, "Array")
                                .getPropertyAsFunction(rt_, "from");
  jsi::Object result = arrayFrom.call(rt_, object).asObject(rt_);

  if (!result.isArray(rt_)) {
    return "[Set]";
  }

  auto arr = result.asArray(rt_);
  ss << "Set {";

  for (size_t i = 0, length = arr.size(rt_); i < length; i++) {
    ss << stringifyJSIValueRecursively(arr.getValueAtIndex(rt_, i));
    if (i != length - 1) {
      ss << ", ";
    }
  }

  ss << '}';

  return ss.str();
}

std::string JSISerializer::stringifyMap(const jsi::Object &object) {
  std::stringstream ss;
  jsi::Function arrayFrom = rt_.global()
                                .getPropertyAsObject(rt_, "Array")
                                .getPropertyAsFunction(rt_, "from");
  jsi::Object result = arrayFrom.call(rt_, object).asObject(rt_);

  if (!result.isArray(rt_)) {
    return "[Map]";
  }

  auto arr = result.asArray(rt_);
  ss << "Map {";

  for (size_t i = 0, length = arr.size(rt_); i < length; i++) {
    auto pair = arr.getValueAtIndex(rt_, i).asObject(rt_).getArray(rt_);
    auto key = pair.getValueAtIndex(rt_, 0);
    auto value = pair.getValueAtIndex(rt_, 1);
    ss << stringifyJSIValueRecursively(key) << ": "
       << stringifyJSIValueRecursively(value);
    if (i != length - 1) {
      ss << ", ";
    }
  }

  ss << '}';

  return ss.str();
}

std::string JSISerializer::stringifyRecursiveType(const jsi::Object &object) {
  auto type = getObjectTypeName(rt_, object);

  if (type == "Array") {
    return "[...]";
  }
  if (type == "Object") {
    return "{...}";
  }
  return "...";
}

std::string JSISerializer::stringifyWithToString(const jsi::Object &object) {
  return object.getPropertyAsFunction(rt_, "toString")
      .callWithThis(rt_, object)
      .toString(rt_)
      .utf8(rt_);
}

std::string JSISerializer::stringifyJSIValueRecursively(
    const jsi::Value &value,
    bool isTopLevel) {
  if (value.isBool() || value.isNumber()) {
    return value.toString(rt_).utf8(rt_);
  }
  if (value.isString()) {
    return isTopLevel ? value.getString(rt_).utf8(rt_)
                      : '"' + value.getString(rt_).utf8(rt_) + '"';
  }
  if (value.isSymbol()) {
    return value.getSymbol(rt_).toString(rt_);
  }
#if REACT_NATIVE_MINOR_VERSION >= 71
  if (value.isBigInt()) {
    return value.getBigInt(rt_).toString(rt_).utf8(rt_) + 'n';
  }
#endif
  if (value.isUndefined()) {
    return "undefined";
  }
  if (value.isNull()) {
    return "null";
  }
  if (value.isObject()) {
    jsi::Object object = value.asObject(rt_);

    if (hasBeenVisited(object)) {
      return stringifyRecursiveType(object);
    }
    markAsVisited(object);

    if (object.isArray(rt_)) {
      return stringifyArray(object.getArray(rt_));
    }
    if (object.isFunction(rt_)) {
      return stringifyFunction(object.getFunction(rt_));
    }
    if (object.isHostObject(rt_)) {
      return stringifyHostObject(*object.getHostObject(rt_));
    }
    if (isInstanceOfAny(rt_, object, SUPPORTED_ERROR_TYPES)) {
      return stringifyError(object);
    }
    if (isInstanceOfAny(rt_, object, SUPPORTED_INDEXED_COLLECTION_TYPES) ||
        isInstanceOfAny(rt_, object, SUPPORTED_STRUCTURED_DATA_TYPES) ||
        isInstanceOfAny(rt_, object, SUPPORTED_MANAGING_MEMORY_TYPES) ||
        isInstanceOfAny(rt_, object, SUPPORTED_ABSTRACTION_OBJECT_TYPES) ||
        isInstanceOfAny(rt_, object, SUPPORTED_REFLECTION_TYPES) ||
        isInstanceOf(rt_, object, "Intl") ||
        isInstanceOf(rt_, object, "WeakMap") ||
        isInstanceOf(rt_, object, "WeakSet")) {
      // TODO: Consider extending this log info
      return stringifyWithName(object);
    }
    if (isInstanceOf(rt_, object, "Date") ||
        isInstanceOf(rt_, object, "RegExp")) {
      return stringifyWithToString(object);
    }
    if (isInstanceOf(rt_, object, "Map")) {
      return stringifyMap(object);
    }
    if (isInstanceOf(rt_, object, "Set")) {
      return stringifySet(object);
    }
    return stringifyObject(object);
  }

  throw std::runtime_error("[Reanimated] Unsupported value type.");
}

std::string stringifyJSIValue(jsi::Runtime &rt, const jsi::Value &value) {
  JSISerializer serializer(rt);

  return serializer.stringifyJSIValueRecursively(value, true);
}
