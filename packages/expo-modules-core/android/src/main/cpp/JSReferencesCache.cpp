#include "JSReferencesCache.h"

namespace expo {
JSReferencesCache::JSReferencesCache(jsi::Runtime &runtime) {
  jsObjectRegistry.emplace(
    JSKeys::PROMISE,
    std::make_unique<jsi::Object>(
      runtime.global().getPropertyAsFunction(runtime, "Promise")
    )
  );
}

jsi::PropNameID &JSReferencesCache::getPropNameID(
  jsi::Runtime &runtime,
  const std::string &name
) {
  auto propName = propNameIDRegistry.find(name);

  if (propName == propNameIDRegistry.end()) {
    auto propNameID = std::make_unique<jsi::PropNameID>(jsi::PropNameID::forAscii(runtime, name));
    auto [result, _] = propNameIDRegistry.emplace(name, std::move(propNameID));
    return *result->second;
  }
  return *propName->second;
}
} // namespace expo
