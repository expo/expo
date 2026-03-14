// Copyright 2025-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#include <string>
#include <vector>
#include <jsi/jsi.h>

#include "HostObjectCallbacks.h"

namespace jsi = facebook::jsi;

namespace expo {

class JSI_EXPORT HostObject : public jsi::HostObject {
public:

  explicit HostObject(HostObjectCallbacks *callbacks) : jsi::HostObject(), _callbacks(callbacks) {}

  virtual ~HostObject() {
    _callbacks->dealloc();
  }

  inline jsi::Value get(jsi::Runtime &runtime, const jsi::PropNameID &name) override {
    return _callbacks->get(name.utf8(runtime).c_str());
  }

  inline void set(jsi::Runtime &runtime, const jsi::PropNameID &name, const jsi::Value &value) override {
    _callbacks->set(name.utf8(runtime).c_str(), value);
  }

  inline std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &runtime) override {
    return _callbacks->getPropertyNames();
  }

  inline static jsi::Object makeObject(jsi::Runtime &runtime, HostObjectCallbacks *callbacks) {
    return jsi::Object::createFromHostObject(runtime, std::make_shared<HostObject>(callbacks));
  }

private:
  HostObjectCallbacks *_callbacks;

}; // class HostObject

} // namespace expo

#endif // __cplusplus
