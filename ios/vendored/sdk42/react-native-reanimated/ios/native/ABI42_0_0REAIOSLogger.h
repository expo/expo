#pragma once

#include "ReanimatedHiddenHeaders.h"
#include <stdio.h>

namespace ABI42_0_0reanimated {

class ABI42_0_0REAIOSLogger : public LoggerInterface {
  public:
    void log(const char* str) override;
    void log(double d) override;
    void log(int i) override;
    void log(bool b) override;
    virtual ~ABI42_0_0REAIOSLogger() {}
};

}
