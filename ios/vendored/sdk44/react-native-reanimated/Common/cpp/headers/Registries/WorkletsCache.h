#pragma once

#include <ABI44_0_0jsi/ABI44_0_0jsi.h>
#include <stdio.h>
#include <memory>
#include <unordered_map>

namespace ABI44_0_0reanimated {

using namespace ABI44_0_0facebook;

class FrozenObject;

class WorkletsCache {
 private:
  std::unordered_map<long long, std::shared_ptr<jsi::Function>> worklets;

 public:
  std::shared_ptr<jsi::Function> getFunction(
      jsi::Runtime &rt,
      std::shared_ptr<ABI44_0_0reanimated::FrozenObject> frozenObj);
};

} // namespace reanimated
