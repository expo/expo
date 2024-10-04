#include "DevMenuWorkletsCache.h"
#include "DevMenuFrozenObject.h"
#include "DevMenuShareableValue.h"

#include <string>
#include <utility>

using namespace facebook;

namespace devmenureanimated {

jsi::Value eval(jsi::Runtime &rt, const char *code) {
  return rt.global().getPropertyAsFunction(rt, "eval").call(rt, code);
}

jsi::Function function(jsi::Runtime &rt, const std::string &code) {
  return eval(rt, ("(" + code + ")").c_str()).getObject(rt).getFunction(rt);
}

std::shared_ptr<jsi::Function> WorkletsCache::getFunction(
    jsi::Runtime &rt,
    std::shared_ptr<FrozenObject> frozenObj) {
  long long workletHash =
      ValueWrapper::asNumber(frozenObj->map["__workletHash"]->valueContainer);
  if (worklets.count(workletHash) == 0) {
    auto codeBuffer = std::make_shared<const jsi::StringBuffer>(
        "(" +
        ValueWrapper::asString(frozenObj->map["asString"]->valueContainer) +
        ")");
    auto func = rt.evaluateJavaScript(
                      codeBuffer,
                      ValueWrapper::asString(
                          frozenObj->map["__location"]->valueContainer))
                    .asObject(rt)
                    .asFunction(rt);
    worklets[workletHash] = std::make_shared<jsi::Function>(std::move(func));
  }
  return worklets[workletHash];
}

} // namespace devmenureanimated
