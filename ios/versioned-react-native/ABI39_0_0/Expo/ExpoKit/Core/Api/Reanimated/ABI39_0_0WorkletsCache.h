#pragma once

#include <stdio.h>
#include <unordered_map>
#include <ABI39_0_0jsi/ABI39_0_0jsi.h>
#include <memory>

namespace ABI39_0_0reanimated
{

using namespace ABI39_0_0facebook;

class FrozenObject;

class WorkletsCache {
  std::unordered_map<long long, std::shared_ptr<jsi::Function>> worklets;
public:
  std::shared_ptr<jsi::Function> getFunction(jsi::Runtime & rt, std::shared_ptr<ABI39_0_0reanimated::FrozenObject> frozenObj);
};

} // namespace ABI39_0_0reanimated
