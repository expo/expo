#pragma once

namespace reanimated {

struct HostFunctionHandler {
  std::shared_ptr<jsi::Function> pureFunction;
  std::string functionName;
  HostFunctionHandler(std::shared_ptr<jsi::Function> f, jsi::Runtime &rt) {
    pureFunction = f;
    functionName = f->getProperty(rt, "name").asString(rt).utf8(rt);
  }
  
  std::shared_ptr<jsi::Function> get() {
    return pureFunction;
  }
};

}
