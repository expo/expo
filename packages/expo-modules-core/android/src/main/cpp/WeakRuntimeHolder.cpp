#include "WeakRuntimeHolder.h"
#include "JavaScriptRuntime.h"

namespace expo {
WeakRuntimeHolder::WeakRuntimeHolder(std::weak_ptr<JavaScriptRuntime> runtime)
  : std::weak_ptr<JavaScriptRuntime>(std::move(runtime)) {}

jsi::Runtime &WeakRuntimeHolder::getJSRuntime() {
  auto runtime = lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  return runtime->get();
}

void WeakRuntimeHolder::ensureRuntimeIsValid() {
  assert((!expired()) && "JS Runtime was used after deallocation");
}
} // namespace expo
