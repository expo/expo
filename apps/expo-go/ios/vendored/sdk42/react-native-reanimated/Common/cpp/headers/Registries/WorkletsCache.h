#pragma once

#include <stdio.h>
#include <unordered_map>
#include <ABI42_0_0jsi/ABI42_0_0jsi.h>
#include <memory>

namespace ABI42_0_0reanimated
{

using namespace ABI42_0_0facebook;

class FrozenObject;

class WorkletsCache {
private:
  std::unordered_map<long long, std::shared_ptr<jsi::Function>> worklets;
public:
  std::shared_ptr<jsi::Function> getFunction(jsi::Runtime & rt, std::shared_ptr<ABI42_0_0reanimated::FrozenObject> frozenObj);
};

} // namespace reanimated
