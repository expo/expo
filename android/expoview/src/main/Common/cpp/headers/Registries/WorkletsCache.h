//
//  WorkletsCache.hpp
//  DoubleConversion
//
//  Created by Szymon Kapala on 01/06/2020.
//

#ifndef WorkletsCache_h
#define WorkletsCache_h

#include <stdio.h>
#include <unordered_map>
#include <jsi/jsi.h>
#include <memory>

namespace reanimated {
 class FrozenObject;
}

using namespace reanimated;
using namespace facebook;

class WorkletsCache {
  std::unordered_map<long long, std::shared_ptr<jsi::Function>> worklets;
public:
  std::shared_ptr<jsi::Function> getFunction(jsi::Runtime & rt, std::shared_ptr<reanimated::FrozenObject> frozenObj);
};


#endif /* WorkletsCache_h */
