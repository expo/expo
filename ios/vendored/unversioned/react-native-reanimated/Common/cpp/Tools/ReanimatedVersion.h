#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <string>
#include "JSLogger.h"

using namespace facebook;

namespace reanimated {

std::string getReanimatedCppVersion();

bool matchVersion(const std::string &, const std::string &);
void checkJSVersion(jsi::Runtime &, const std::shared_ptr<JSLogger> &);

}; // namespace reanimated
