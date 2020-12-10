#pragma once

#include "ABI39_0_0LoggerInterface.h"
#include <stdio.h>

namespace ABI39_0_0reanimated {

class ABI39_0_0REAIOSLogger : public LoggerInterface {
  public:
    void log(const char* str) override;
    void log(double d) override;
    void log(int i) override;
    void log(bool b) override;
    virtual ~ABI39_0_0REAIOSLogger() {}
};

}
