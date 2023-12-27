#pragma once

#include <stdio.h>
#include "ReanimatedHiddenHeaders.h"

namespace ABI44_0_0reanimated {

class ABI44_0_0REAIOSLogger : public LoggerInterface {
 public:
  void log(const char *str) override;
  void log(double d) override;
  void log(int i) override;
  void log(bool b) override;
  virtual ~ABI44_0_0REAIOSLogger() {}
};

} // namespace reanimated
