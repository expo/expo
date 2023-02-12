#pragma once

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>

#include <functional>
#include <unordered_map>
#include <memory>
#include <string>

#define STR_CAT_NX(A, B) A##B
#define STR_CAT(A, B) STR_CAT_NX(A, B)
#define STR_GET get_
#define STR_SET set_

/**
 * Creates a new Host function declaration as a lambda with all deps passed
 * with implicit lambda capture clause
 */
#define JSI_HOST_FUNCTION_LAMBDA                                               \
  [=](jsi::Runtime & runtime, const jsi::Value &thisValue,                     \
      const jsi::Value *arguments, size_t count) -> jsi::Value

/**
 * Creates a new Host function declaration
 */
#define JSI_HOST_FUNCTION(NAME)                                                \
  jsi::Value NAME(jsi::Runtime &runtime, const jsi::Value &thisValue,          \
                  const jsi::Value *arguments, size_t count)

/**
 * Creates a new property setter function declaration
 */
#define JSI_PROPERTY_SET(NAME)                                                 \
  void STR_CAT(STR_SET, NAME)(jsi::Runtime & runtime, const jsi::Value &value)

/**
 * Creates a new property getter function declaration
 */
#define JSI_PROPERTY_GET(NAME)                                                 \
  jsi::Value STR_CAT(STR_GET, NAME)(jsi::Runtime & runtime)

/**
 * Creates a JSI export function declaration
 */
#define JSI_EXPORT_FUNC(CLASS, FUNCTION)                                       \
  {                                                                            \
#FUNCTION, (jsi::Value(JsiHostObject::*)(                                      \
                   jsi::Runtime & runtime, const jsi::Value &thisValue,        \
                   const jsi::Value *arguments, size_t)) &                     \
                   CLASS::FUNCTION                                             \
  }

/**
 * Creates a JSI export functions statement
 */
#define JSI_EXPORT_FUNCTIONS(...)                                              \
  const JsiFunctionMap &getExportedFunctionMap() override {                    \
    static JsiFunctionMap map = {__VA_ARGS__};                                 \
    return map;                                                                \
  }

/**
 * Creates a JSI export getter declaration
 */
#define JSI_EXPORT_PROP_GET(CLASS, FUNCTION)                                   \
  {                                                                            \
#FUNCTION, (jsi::Value(JsiHostObject::*)(jsi::Runtime & runtime)) &            \
                   CLASS::STR_CAT(STR_GET, FUNCTION)                           \
  }

/**
 * Creates a JSI export getters statement
 */
#define JSI_EXPORT_PROPERTY_GETTERS(...)                                       \
  const JsiPropertyGettersMap &getExportedPropertyGettersMap() override {      \
  static JsiPropertyGettersMap map = {__VA_ARGS__};                            \
  return map;                                                                  \
}

/**
 * Creates a JSI export setter declaration
 */
#define JSI_EXPORT_PROP_SET(CLASS, FUNCTION)                                   \
  {                                                                            \
#FUNCTION,                                                                     \
        (void(JsiHostObject::*)(jsi::Runtime & runtime, const jsi::Value &)) & \
            CLASS::STR_CAT(STR_SET, FUNCTION)                                  \
  }

/**
 * Creates a JSI export setters statement
 */
#define JSI_EXPORT_PROPERTY_SETTERS(...)                                       \
  const JsiPropertySettersMap &getExportedPropertySettersMap() override {      \
    static JsiPropertySettersMap map = {__VA_ARGS__};                          \
    return map;                                                                \
  }

namespace ABI47_0_0RNJsi {

using namespace ABI47_0_0facebook;

using JsPropertyType = struct {
  std::function<jsi::Value(jsi::Runtime &)> get;
  std::function<void(jsi::Runtime &, const jsi::Value &)> set;
};

class JsiHostObject;

using JsiFunctionMap = std::unordered_map<std::string,
  jsi::Value (JsiHostObject::*)(jsi::Runtime &, const jsi::Value &, const jsi::Value *, size_t)>;

using JsiPropertyGettersMap = std::unordered_map<std::string,
  jsi::Value (JsiHostObject::*)(jsi::Runtime &)>;

using JsiPropertySettersMap = std::unordered_map<std::string,
  void (JsiHostObject::*)(jsi::Runtime &, const jsi::Value &)>;

using JsiHostFunctionCache =
    std::unordered_map<std::string, std::unique_ptr<jsi::Function>>;

using JsiRuntimeCache =
    std::unordered_map<jsi::Runtime *, JsiHostFunctionCache>;

/**
 * Base class for jsi host objects
 */
class JsiHostObject : public jsi::HostObject {
public:
  JsiHostObject();
  ~JsiHostObject();

protected:
  /**
   Override to return map of name/functions
   */
  virtual const JsiFunctionMap &getExportedFunctionMap() {
    static const JsiFunctionMap empty;
    return empty;
  };

  /**
   Override to get property getters map of name/functions
   */
  virtual const JsiPropertyGettersMap &getExportedPropertyGettersMap() {
    static const JsiPropertyGettersMap empty;
    return empty;
  };

  /**
   Override to get property setters map of name/functions
   */
  virtual const JsiPropertySettersMap &getExportedPropertySettersMap() {
    static const JsiPropertySettersMap empty;
    return empty;
  };

  /**
   * Overridden jsi::HostObject set property method
   * @param rt Runtime
   * @param name Name of value to set
   * @param value Value to set
   */
  void set(jsi::Runtime &rt, const jsi::PropNameID &name,
           const jsi::Value &value) override;

  /**
   * Overridden jsi::HostObject get property method. Returns functions from
   * the map of functions.
   * @param runtime Runtime
   * @param name Name of value to get
   * @return Value
   */
  jsi::Value get(jsi::Runtime &runtime, const jsi::PropNameID &name) override;

  /**
   * Overridden getPropertyNames from jsi::HostObject. Returns all keys in the
   * function and property maps
   * @param runtime Runtime
   * @return List of property names
   */
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &runtime) override;

  /**
   * Installs a function into the function map
   */
  void installFunction(const std::string &name,
                       const jsi::HostFunctionType &function) {
    _funcMap.emplace(name, function);
  }

  /**
   * Installs a property with get/set
   * @param name Name of property to install
   * @param get Getter function
   * @param set Setter function
   */
  void installProperty(
      const std::string &name,
      const std::function<jsi::Value(jsi::Runtime &)> &get,
      const std::function<void(jsi::Runtime &, const jsi::Value &)> &set) {
    _propMap.emplace(name, JsPropertyType{.get = get, .set = set});
  }

  /**
   * Installs a property with only getter
   * @param name Name of property to install
   * @param get Getter function
   */
  void installReadonlyProperty(
      const std::string &name,
      const std::function<jsi::Value(jsi::Runtime &)> &get) {
    _propMap.emplace(name, JsPropertyType{
                               .get = get,
                               .set = [](jsi::Runtime &, const jsi::Value &) {},
                           });
  }

  /**
   * Installs a property which points to a given host object
   * @param name Name of property to install
   * @param hostObject Object to return
   */
  void installReadonlyProperty(const std::string &name,
                               std::shared_ptr<jsi::HostObject> hostObject) {
    _propMap.emplace(name, JsPropertyType{
                               .get =
                                   [hostObject](jsi::Runtime &runtime) {
                                     return jsi::Object::createFromHostObject(
                                         runtime, hostObject);
                                   },
                               .set = [](jsi::Runtime &, const jsi::Value &) {},
                           });
  }

private:
  std::unordered_map<std::string, jsi::HostFunctionType> _funcMap;
  std::unordered_map<std::string, JsPropertyType> _propMap;
  JsiRuntimeCache _cache;
};
} // namespace ABI47_0_0RNJsi
