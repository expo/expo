#include "ABI40_0_0WorkletsCache.h"
#include "ABI40_0_0ShareableValue.h"
#include "ABI40_0_0FrozenObject.h"

using namespace ABI40_0_0facebook;

namespace ABI40_0_0reanimated
{

jsi::Value eval(jsi::Runtime &rt, const char *code) {
  return rt.global().getPropertyAsFunction(rt, "eval").call(rt, code);
}

jsi::Function function(jsi::Runtime &rt, const std::string& code) {
  return eval(rt, ("(" + code + ")").c_str()).getObject(rt).getFunction(rt);
}

std::shared_ptr<jsi::Function> WorkletsCache::getFunction(jsi::Runtime &rt, std::shared_ptr<FrozenObject> frozenObj) {
  long long workletHash = frozenObj->map["__workletHash"]->numberValue;
  if (worklets.count(workletHash) == 0) {
    jsi::Function fun = function(rt, frozenObj->map["asString"]->stringValue);
    std::shared_ptr<jsi::Function> funPtr(new jsi::Function(std::move(fun)));
    worklets[workletHash] = funPtr;
  }
  return worklets[workletHash];
}

}
