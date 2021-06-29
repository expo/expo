#include "WorkletsCache.h"
#include "ShareableValue.h"
#include "FrozenObject.h"

using namespace facebook;

namespace reanimated
{

jsi::Value eval(jsi::Runtime &rt, const char *code) {
  return rt.global().getPropertyAsFunction(rt, "eval").call(rt, code);
}

jsi::Function function(jsi::Runtime &rt, const std::string& code) {
  return eval(rt, ("(" + code + ")").c_str()).getObject(rt).getFunction(rt);
}

std::shared_ptr<jsi::Function> WorkletsCache::getFunction(jsi::Runtime &rt, std::shared_ptr<FrozenObject> frozenObj) {
  long long workletHash = ValueWrapper::asNumber(frozenObj->map["__workletHash"]->valueContainer);
  if (worklets.count(workletHash) == 0) {
    jsi::Function fun = function(
      rt,
      ValueWrapper::asString(frozenObj->map["asString"]->valueContainer)
    );
    std::shared_ptr<jsi::Function> funPtr = std::make_shared<jsi::Function>(std::move(fun));
    worklets[workletHash] = funPtr;
  }
  return worklets[workletHash];
}

}
