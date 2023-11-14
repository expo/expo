#pragma once

#include <jsi/jsi.h>
#include <string>

using namespace facebook;

namespace reanimated {

std::string getReanimatedCppVersion();

#ifndef NDEBUG
bool matchVersion(const std::string &, const std::string &);
void checkJSVersion(jsi::Runtime &);
#endif // NDEBUG

}; // namespace reanimated
