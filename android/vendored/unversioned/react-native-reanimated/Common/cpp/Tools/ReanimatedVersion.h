#pragma once

#include <jsi/jsi.h>
#include <string>

using namespace facebook;

namespace reanimated {

std::string getReanimatedCppVersion();

#ifdef DEBUG
bool matchVersion(const std::string &, const std::string &);
void checkJSVersion(jsi::Runtime &);
#endif // DEBUG

}; // namespace reanimated
