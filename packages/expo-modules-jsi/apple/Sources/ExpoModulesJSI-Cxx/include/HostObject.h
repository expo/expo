// Copyright 2025-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#include <string>
#include <vector>

#include "CppError.h"
#include "HostObjectCallbacks.h"
#include "IRuntimeCompat.h"

namespace jsi = facebook::jsi;

namespace expo {

class JSI_EXPORT HostObject : public jsi::HostObject {
public:

  explicit HostObject(HostObjectCallbacks callbacks) : jsi::HostObject(), _callbacks(callbacks) {}

  virtual ~HostObject() {
    _callbacks.dealloc();
  }

  inline jsi::Value get(jsi::Runtime &runtime, const jsi::PropNameID &name) override {
    auto result = _callbacks.get(name.utf8(runtime).c_str());
    // If the Swift getter stored a pending error, rethrow its JSError directly
    // to preserve all properties (message, code, stack, etc.).
    if (auto *error = CppError::getCurrent()) {
      throw error->release();
    }
    return result;
  }

  inline void set(jsi::Runtime &runtime, const jsi::PropNameID &name, const jsi::Value &value) override {
    // For read-only host objects (no Swift setter), `_callbacks.set` throws a
    // `jsi::JSError` directly and the `CppError` check below is never reached.
    // For writable host objects, a throwing Swift setter routes its error through
    // `CppError`'s thread-local slot, which we drain and rethrow here.
    _callbacks.set(runtime, name.utf8(runtime).c_str(), value);
    if (auto *error = CppError::getCurrent()) {
      throw error->release();
    }
  }

  inline std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &runtime) override {
    return _callbacks.getPropertyNames();
  }

  inline static jsi::Object makeObject(jsi::IRuntime &runtime, HostObjectCallbacks callbacks) {
    return jsi::Object::createFromHostObject(runtime, std::make_shared<HostObject>(callbacks));
  }

private:
  HostObjectCallbacks _callbacks;

}; // class HostObject

} // namespace expo

#endif // __cplusplus
