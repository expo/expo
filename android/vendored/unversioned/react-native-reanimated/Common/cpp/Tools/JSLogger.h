#ifdef DEBUG

#pragma once

#include "JSScheduler.h"

#include <memory>
#include <string>

namespace reanimated {

class JSLogger {
 public:
  explicit JSLogger(const std::shared_ptr<JSScheduler> &jsScheduler)
      : jsScheduler_(jsScheduler) {}
  void warnOnJS(const std::string &warning) const;

 private:
  const std::shared_ptr<JSScheduler> jsScheduler_;
};

} // namespace reanimated

#endif // DEBUG
