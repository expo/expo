#pragma once

#include "WorkletRuntimeRegistry.h"

#include <jsi/jsi.h>

#include <memory>

namespace reanimated {

class WorkletRuntimeCollector : public jsi::HostObject {
  // When worklet runtime is created, we inject an instance of this class as a
  // `jsi::HostObject` into the global object. When worklet runtime is
  // terminated, the object is garbage-collected, which runs the C++ destructor.
  // In the destructor, we unregister the worklet runtime from the registry.

 public:
  explicit WorkletRuntimeCollector(jsi::Runtime &runtime) : runtime_(runtime) {
    WorkletRuntimeRegistry::registerRuntime(runtime_);
  }

  ~WorkletRuntimeCollector() {
    WorkletRuntimeRegistry::unregisterRuntime(runtime_);
  }

  static void install(jsi::Runtime &rt) {
    auto collector = std::make_shared<WorkletRuntimeCollector>(rt);
    auto object = jsi::Object::createFromHostObject(rt, collector);
    rt.global().setProperty(rt, "__workletRuntimeCollector", object);
  }

 private:
  jsi::Runtime &runtime_;
};

} // namespace reanimated
