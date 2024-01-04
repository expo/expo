#include "JSLogger.h"
#include <memory>

namespace reanimated {

void JSLogger::warnOnJS(const std::string &warning) const {
#ifndef NDEBUG
  jsScheduler_->scheduleOnJS([warning](jsi::Runtime &rt) {
    auto console = rt.global().getPropertyAsObject(rt, "console");
    auto warn = console.getPropertyAsFunction(rt, "warn");
    warn.call(rt, jsi::String::createFromUtf8(rt, warning));
  });
#endif // NDEBUG
}

} // namespace reanimated
