#pragma once

// When building as part of Expo/React Native, these come from the build system.
// For standalone compilation, we provide minimal forward declarations.
#ifdef EXPO_RUST_JSI_STANDALONE
#include "jsi_types.h"
#else
#include <jsi/jsi.h>
#endif

#include "rust/cxx.h"
#include <memory>
#include <string>
#include <vector>
#include <functional>
#include <cstdint>

namespace expo {
namespace rust_jsi {

// Forward declarations for Rust-side types
struct RustModuleDescriptor;
struct RustFunctionDescriptor;
struct RustValue;

// ---- Value wrapper for crossing the FFI boundary ----

enum class ValueKind : uint8_t {
  Undefined = 0,
  Null = 1,
  Boolean = 2,
  Number = 3,
  String = 4,
  Object = 5,
  Array = 6,
};

// A serialized JSI value that can cross the Rust/C++ boundary safely.
// For simple types, the value is stored inline. For strings, we copy.
// For objects/arrays, we hold an opaque handle (index into a table).
struct FfiValue {
  ValueKind kind;
  bool bool_val;
  double number_val;
  rust::String string_val;
  uint64_t handle; // opaque handle for objects/arrays

  FfiValue();
  static FfiValue make_undefined();
  static FfiValue make_null();
  static FfiValue make_bool(bool v);
  static FfiValue make_number(double v);
  static FfiValue make_string(rust::Str s);
};

// ---- Runtime handle ----
// Opaque wrapper around jsi::Runtime* for safe passing through cxx
struct RuntimeHandle {
  void* ptr; // jsi::Runtime*

  RuntimeHandle() : ptr(nullptr) {}
  explicit RuntimeHandle(void* p) : ptr(p) {}
};

// ---- C++ functions callable from Rust ----

// Create values
FfiValue jsi_make_undefined();
FfiValue jsi_make_null();
FfiValue jsi_make_bool(bool val);
FfiValue jsi_make_number(double val);
FfiValue jsi_make_string(rust::Str val);

// Object operations (require runtime handle)
FfiValue jsi_create_object(const RuntimeHandle& rt);
void jsi_object_set_property(const RuntimeHandle& rt, uint64_t obj_handle,
                             rust::Str name, const FfiValue& value);
FfiValue jsi_object_get_property(const RuntimeHandle& rt, uint64_t obj_handle,
                                 rust::Str name);

// Array operations
FfiValue jsi_create_array(const RuntimeHandle& rt, uint32_t length);
void jsi_array_set_value(const RuntimeHandle& rt, uint64_t arr_handle,
                         uint32_t index, const FfiValue& value);
FfiValue jsi_array_get_value(const RuntimeHandle& rt, uint64_t arr_handle,
                             uint32_t index);
uint32_t jsi_array_length(const RuntimeHandle& rt, uint64_t arr_handle);

// Register a module onto the expo.modules global
void jsi_register_module(const RuntimeHandle& rt, rust::Str name,
                         uint64_t obj_handle);

// ---- Rust callback types (implemented in Rust, called from C++) ----

// Called when JS accesses a property on a Rust-backed HostObject
using RustPropertyGetter = FfiValue(*)(void* ctx, rust::Str name);
using RustPropertySetter = void(*)(void* ctx, rust::Str name, const FfiValue& value);
using RustFunctionCall = FfiValue(*)(void* ctx, const RuntimeHandle& rt,
                                     const FfiValue* args, uint32_t arg_count);

// ---- HostObject backed by Rust ----

#ifndef EXPO_RUST_JSI_STANDALONE
class RustHostObject : public facebook::jsi::HostObject {
public:
  RustHostObject(void* rust_ctx,
                 RustPropertyGetter getter,
                 RustPropertySetter setter,
                 std::vector<std::string> property_names);
  ~RustHostObject() override;

  facebook::jsi::Value get(facebook::jsi::Runtime& rt,
                           const facebook::jsi::PropNameID& name) override;
  void set(facebook::jsi::Runtime& rt,
           const facebook::jsi::PropNameID& name,
           const facebook::jsi::Value& value) override;
  std::vector<facebook::jsi::PropNameID> getPropertyNames(
      facebook::jsi::Runtime& rt) override;

private:
  void* rust_ctx_;
  RustPropertyGetter getter_;
  RustPropertySetter setter_;
  std::vector<std::string> property_names_;
};

// Conversion between jsi::Value and FfiValue
FfiValue jsi_value_to_ffi(facebook::jsi::Runtime& rt,
                          const facebook::jsi::Value& value);
facebook::jsi::Value ffi_to_jsi_value(facebook::jsi::Runtime& rt,
                                       const FfiValue& value);
#endif

// ---- Handle table for tracking JSI objects across FFI ----

class HandleTable {
public:
  static HandleTable& instance();

  uint64_t store(std::shared_ptr<void> obj);
  std::shared_ptr<void> get(uint64_t handle);
  void release(uint64_t handle);

private:
  HandleTable() = default;
  std::unordered_map<uint64_t, std::shared_ptr<void>> table_;
  uint64_t next_handle_ = 1;
  std::mutex mutex_;
};

} // namespace rust_jsi
} // namespace expo
