// Include the cxx-generated header first — it defines FfiValue, ValueKind,
// RuntimeHandle, and the rust_invoke_host_fn declaration.
#include "expo-rust-jsi/src/bridge.rs.h"
#include "jsi_shim.h"
#include <stdexcept>

namespace expo {
namespace rust_jsi {

// ---- HandleTable implementation ----

HandleTable& HandleTable::instance() {
  static HandleTable instance;
  return instance;
}

uint64_t HandleTable::store(std::shared_ptr<void> obj) {
  std::lock_guard<std::mutex> lock(mutex_);
  uint64_t handle = next_handle_++;
  table_[handle] = std::move(obj);
  return handle;
}

std::shared_ptr<void> HandleTable::get(uint64_t handle) {
  std::lock_guard<std::mutex> lock(mutex_);
  auto it = table_.find(handle);
  if (it == table_.end()) {
    return nullptr;
  }
  return it->second;
}

void HandleTable::release(uint64_t handle) {
  std::lock_guard<std::mutex> lock(mutex_);
  table_.erase(handle);
}

// ---- C++ functions callable from Rust (value constructors) ----

FfiValue jsi_make_undefined() {
  FfiValue v;
  v.kind = ValueKind::Undefined;
  v.bool_val = false;
  v.number_val = 0.0;
  v.handle = 0;
  return v;
}

FfiValue jsi_make_null() {
  FfiValue v;
  v.kind = ValueKind::Null;
  v.bool_val = false;
  v.number_val = 0.0;
  v.handle = 0;
  return v;
}

FfiValue jsi_make_bool(bool val) {
  FfiValue v;
  v.kind = ValueKind::Boolean;
  v.bool_val = val;
  v.number_val = 0.0;
  v.handle = 0;
  return v;
}

FfiValue jsi_make_number(double val) {
  FfiValue v;
  v.kind = ValueKind::Number;
  v.bool_val = false;
  v.number_val = val;
  v.handle = 0;
  return v;
}

FfiValue jsi_make_string(rust::Str val) {
  FfiValue v;
  v.kind = ValueKind::String;
  v.bool_val = false;
  v.number_val = 0.0;
  v.string_val = rust::String(val.data(), val.size());
  v.handle = 0;
  return v;
}

// ---- JSI-dependent implementations ----
// These are only compiled when building with the full React Native JSI headers.

#ifndef EXPO_RUST_JSI_STANDALONE

using namespace facebook::jsi;

// Helper to get runtime from handle
static Runtime& rt_from_handle(const RuntimeHandle& h) {
  return *reinterpret_cast<Runtime*>(h.ptr);
}

// ---- Value conversion ----

FfiValue jsi_value_to_ffi(Runtime& rt, const Value& value) {
  if (value.isUndefined()) {
    return jsi_make_undefined();
  }
  if (value.isNull()) {
    return jsi_make_null();
  }
  if (value.isBool()) {
    return jsi_make_bool(value.getBool());
  }
  if (value.isNumber()) {
    return jsi_make_number(value.getNumber());
  }
  if (value.isString()) {
    auto str = value.getString(rt).utf8(rt);
    return jsi_make_string(rust::Str(str.data(), str.size()));
  }
  if (value.isObject()) {
    Object obj = value.getObject(rt);
    if (obj.isArray(rt)) {
      auto arr = std::make_shared<Object>(std::move(obj));
      FfiValue v;
      v.kind = ValueKind::Array;
      v.bool_val = false;
      v.number_val = 0.0;
      v.handle = HandleTable::instance().store(arr);
      return v;
    }
    auto stored = std::make_shared<Object>(std::move(obj));
    FfiValue v;
    v.kind = ValueKind::Object;
    v.bool_val = false;
    v.number_val = 0.0;
    v.handle = HandleTable::instance().store(stored);
    return v;
  }
  return jsi_make_undefined();
}

Value ffi_to_jsi_value(Runtime& rt, const FfiValue& value) {
  switch (value.kind) {
    case ValueKind::Undefined:
      return Value::undefined();
    case ValueKind::Null:
      return Value::null();
    case ValueKind::Boolean:
      return Value(value.bool_val);
    case ValueKind::Number:
      return Value(value.number_val);
    case ValueKind::String: {
      auto str = std::string(value.string_val.data(), value.string_val.size());
      return Value(rt, String::createFromUtf8(rt, str));
    }
    case ValueKind::Object:
    case ValueKind::Array: {
      auto obj = HandleTable::instance().get(value.handle);
      if (obj) {
        return Value(rt, *std::static_pointer_cast<Object>(obj));
      }
      return Value::undefined();
    }
  }
  return Value::undefined();
}

// ---- Object operations ----

FfiValue jsi_create_object(const RuntimeHandle& rth) {
  auto& rt = rt_from_handle(rth);
  auto obj = std::make_shared<Object>(rt.createObject());
  FfiValue v;
  v.kind = ValueKind::Object;
  v.bool_val = false;
  v.number_val = 0.0;
  v.handle = HandleTable::instance().store(obj);
  return v;
}

void jsi_object_set_property(const RuntimeHandle& rth, uint64_t obj_handle,
                             rust::Str name, const FfiValue& value) {
  auto& rt = rt_from_handle(rth);
  auto obj = std::static_pointer_cast<Object>(HandleTable::instance().get(obj_handle));
  if (!obj) return;

  auto prop_name = std::string(name.data(), name.size());
  obj->setProperty(rt, prop_name.c_str(), ffi_to_jsi_value(rt, value));
}

FfiValue jsi_object_get_property(const RuntimeHandle& rth, uint64_t obj_handle,
                                 rust::Str name) {
  auto& rt = rt_from_handle(rth);
  auto obj = std::static_pointer_cast<Object>(HandleTable::instance().get(obj_handle));
  if (!obj) return jsi_make_undefined();

  auto prop_name = std::string(name.data(), name.size());
  return jsi_value_to_ffi(rt, obj->getProperty(rt, prop_name.c_str()));
}

// ---- Array operations ----

FfiValue jsi_create_array(const RuntimeHandle& rth, uint32_t length) {
  auto& rt = rt_from_handle(rth);
  auto arr = std::make_shared<Object>(rt.createArray(length));
  FfiValue v;
  v.kind = ValueKind::Array;
  v.bool_val = false;
  v.number_val = 0.0;
  v.handle = HandleTable::instance().store(arr);
  return v;
}

void jsi_array_set_value(const RuntimeHandle& rth, uint64_t arr_handle,
                         uint32_t index, const FfiValue& value) {
  auto& rt = rt_from_handle(rth);
  auto obj = std::static_pointer_cast<Object>(HandleTable::instance().get(arr_handle));
  if (!obj) return;
  obj->getArray(rt).setValueAtIndex(rt, index, ffi_to_jsi_value(rt, value));
}

FfiValue jsi_array_get_value(const RuntimeHandle& rth, uint64_t arr_handle,
                             uint32_t index) {
  auto& rt = rt_from_handle(rth);
  auto obj = std::static_pointer_cast<Object>(HandleTable::instance().get(arr_handle));
  if (!obj) return jsi_make_undefined();
  return jsi_value_to_ffi(rt, obj->getArray(rt).getValueAtIndex(rt, index));
}

uint32_t jsi_array_length(const RuntimeHandle& rth, uint64_t arr_handle) {
  auto& rt = rt_from_handle(rth);
  auto obj = std::static_pointer_cast<Object>(HandleTable::instance().get(arr_handle));
  if (!obj) return 0;
  return static_cast<uint32_t>(obj->getArray(rt).length(rt));
}

// ---- Host function creation ----

FfiValue jsi_create_host_function(const RuntimeHandle& rth, rust::Str name,
                                  uint32_t param_count, uint64_t callback_id) {
  auto& rt = rt_from_handle(rth);
  auto fn_name = std::string(name.data(), name.size());

  auto host_fn = Function::createFromHostFunction(
      rt,
      PropNameID::forAscii(rt, fn_name.data(), fn_name.size()),
      static_cast<unsigned int>(param_count),
      [callback_id, rth](Runtime& rt, const Value& /*thisVal*/,
                          const Value* args, size_t count) -> Value {
        // Convert JSI args to FfiValue vector
        std::vector<FfiValue> ffi_args;
        ffi_args.reserve(count);
        for (size_t i = 0; i < count; i++) {
          ffi_args.push_back(jsi_value_to_ffi(rt, args[i]));
        }

        // Call into Rust
        rust::Slice<const FfiValue> args_slice(ffi_args.data(), ffi_args.size());
        FfiValue result = rust_invoke_host_fn(callback_id, rth, args_slice);

        return ffi_to_jsi_value(rt, result);
      });

  auto stored = std::make_shared<Object>(std::move(host_fn));
  FfiValue v;
  v.kind = ValueKind::Object;
  v.bool_val = false;
  v.number_val = 0.0;
  v.handle = HandleTable::instance().store(stored);
  return v;
}

void jsi_object_set_host_function(const RuntimeHandle& rth, uint64_t obj_handle,
                                  rust::Str name, uint64_t fn_handle) {
  auto& rt = rt_from_handle(rth);
  auto obj = std::static_pointer_cast<Object>(HandleTable::instance().get(obj_handle));
  if (!obj) return;

  auto fn_obj = std::static_pointer_cast<Object>(HandleTable::instance().get(fn_handle));
  if (!fn_obj) return;

  auto prop_name = std::string(name.data(), name.size());
  obj->setProperty(rt, prop_name.c_str(), Value(rt, *fn_obj));
}

void jsi_throw_error(const RuntimeHandle& rth, rust::Str message) {
  auto& rt = rt_from_handle(rth);
  auto msg = std::string(message.data(), message.size());
  throw JSError(rt, msg);
}

// ---- Promise creation ----

FfiValue jsi_create_promise(const RuntimeHandle& rth) {
  auto& rt = rt_from_handle(rth);

  // We'll store resolve and reject handles here (captured by the lambda)
  uint64_t resolve_handle = 0;
  uint64_t reject_handle = 0;

  // Create the Promise executor (the function passed to new Promise(...))
  auto executor = Function::createFromHostFunction(
      rt,
      PropNameID::forAscii(rt, "promiseExecutor", 15),
      2, // (resolve, reject)
      [&resolve_handle, &reject_handle](Runtime& rt, const Value& /*thisVal*/,
                                         const Value* args, size_t count) -> Value {
        if (count >= 2) {
          // Store resolve function
          auto resolve_fn = std::make_shared<Object>(args[0].getObject(rt));
          resolve_handle = HandleTable::instance().store(resolve_fn);

          // Store reject function
          auto reject_fn = std::make_shared<Object>(args[1].getObject(rt));
          reject_handle = HandleTable::instance().store(reject_fn);
        }
        return Value::undefined();
      });

  // Get the Promise constructor and call new Promise(executor)
  Value promise_ctor_val = rt.global().getProperty(rt, "Promise");
  if (!promise_ctor_val.isObject()) {
    return jsi_make_undefined();
  }
  Object promise_ctor = promise_ctor_val.getObject(rt);
  Value promise_val = promise_ctor.callAsConstructor(rt, executor);

  // Store the promise object
  auto promise_obj = std::make_shared<Object>(promise_val.getObject(rt));
  uint64_t promise_handle = HandleTable::instance().store(promise_obj);

  // Return an object with { promise, resolve, reject } handles encoded
  // We pack them into a single FfiValue using an object
  auto result_obj = std::make_shared<Object>(rt.createObject());
  result_obj->setProperty(rt, "promise",
    Value(static_cast<double>(promise_handle)));
  result_obj->setProperty(rt, "resolve",
    Value(static_cast<double>(resolve_handle)));
  result_obj->setProperty(rt, "reject",
    Value(static_cast<double>(reject_handle)));

  FfiValue v;
  v.kind = ValueKind::Object;
  v.bool_val = false;
  v.number_val = 0.0;
  v.handle = HandleTable::instance().store(result_obj);
  return v;
}

void jsi_call_function(const RuntimeHandle& rth, uint64_t fn_handle,
                       const FfiValue& arg) {
  auto& rt = rt_from_handle(rth);
  auto fn_obj = std::static_pointer_cast<Object>(HandleTable::instance().get(fn_handle));
  if (!fn_obj) return;

  auto fn = fn_obj->getFunction(rt);
  fn.call(rt, ffi_to_jsi_value(rt, arg));
}

// ---- RustHostObject implementation ----

RustHostObject::RustHostObject(void* rust_ctx,
                               RustPropertyGetter getter,
                               RustPropertySetter setter,
                               std::vector<std::string> property_names)
    : rust_ctx_(rust_ctx),
      getter_(getter),
      setter_(setter),
      property_names_(std::move(property_names)) {}

RustHostObject::~RustHostObject() = default;

Value RustHostObject::get(Runtime& rt, const PropNameID& name) {
  if (!getter_) return Value::undefined();

  auto prop_name = name.utf8(rt);
  try {
    FfiValue result = getter_(rust_ctx_, prop_name.data(), prop_name.size());
    return ffi_to_jsi_value(rt, result);
  } catch (...) {
    return Value::undefined();
  }
}

void RustHostObject::set(Runtime& rt, const PropNameID& name, const Value& value) {
  if (!setter_) return;

  auto prop_name = name.utf8(rt);
  try {
    FfiValue ffi_val = jsi_value_to_ffi(rt, value);
    setter_(rust_ctx_, prop_name.data(), prop_name.size(), ffi_val);
  } catch (...) {
    // Silently ignore setter errors at the boundary
  }
}

std::vector<PropNameID> RustHostObject::getPropertyNames(Runtime& rt) {
  std::vector<PropNameID> names;
  names.reserve(property_names_.size());
  for (const auto& name : property_names_) {
    names.push_back(PropNameID::forAscii(rt, name.data(), name.size()));
  }
  return names;
}

// ---- Module registration ----

void jsi_register_module(const RuntimeHandle& rth, rust::Str name,
                         uint64_t obj_handle) {
  auto& rt = rt_from_handle(rth);

  Value expo_val = rt.global().getProperty(rt, "expo");
  if (!expo_val.isObject()) {
    throw std::runtime_error("expo global not found - is expo-modules-core initialized?");
  }

  Object expo_obj = expo_val.getObject(rt);
  Value modules_val = expo_obj.getProperty(rt, "modules");
  if (!modules_val.isObject()) {
    throw std::runtime_error("expo.modules not found");
  }

  Object modules_obj = modules_val.getObject(rt);
  auto module_name = std::string(name.data(), name.size());

  auto obj = std::static_pointer_cast<Object>(HandleTable::instance().get(obj_handle));
  if (obj) {
    modules_obj.setProperty(rt, module_name.c_str(), Value(rt, *obj));
  }
}

#else
// Standalone stubs for compilation without React Native
FfiValue jsi_create_object(const RuntimeHandle&) { return jsi_make_undefined(); }
void jsi_object_set_property(const RuntimeHandle&, uint64_t, rust::Str, const FfiValue&) {}
FfiValue jsi_object_get_property(const RuntimeHandle&, uint64_t, rust::Str) {
  return jsi_make_undefined();
}
FfiValue jsi_create_array(const RuntimeHandle&, uint32_t) { return jsi_make_undefined(); }
void jsi_array_set_value(const RuntimeHandle&, uint64_t, uint32_t, const FfiValue&) {}
FfiValue jsi_array_get_value(const RuntimeHandle&, uint64_t, uint32_t) {
  return jsi_make_undefined();
}
uint32_t jsi_array_length(const RuntimeHandle&, uint64_t) { return 0; }
void jsi_register_module(const RuntimeHandle&, rust::Str, uint64_t) {}
FfiValue jsi_create_host_function(const RuntimeHandle&, rust::Str, uint32_t, uint64_t) {
  return jsi_make_undefined();
}
void jsi_object_set_host_function(const RuntimeHandle&, uint64_t, rust::Str, uint64_t) {}
void jsi_throw_error(const RuntimeHandle&, rust::Str) {}
FfiValue jsi_create_promise(const RuntimeHandle&) { return jsi_make_undefined(); }
void jsi_call_function(const RuntimeHandle&, uint64_t, const FfiValue&) {}
#endif

} // namespace rust_jsi
} // namespace expo
