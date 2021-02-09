#pragma once

#include "ABI40_0_0LoggerInterface.h"
#include <stdio.h>

namespace ABI40_0_0reanimated {

class ABI40_0_0REAIOSLogger : public LoggerInterface {
  public:
    void log(const char* str) override;
    void log(double d) override;
    void log(int i) override;
    void log(bool b) override;
    virtual ~ABI40_0_0REAIOSLogger() {}
};

}
