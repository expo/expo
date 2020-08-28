#pragma once

#include "ABI39_0_0LoggerInterface.h"
#include <memory>

namespace ABI39_0_0reanimated
{

class Logger {
  public:
  template<typename T>
    static void log(T value) {
      if (instance == nullptr) {
        throw std::runtime_error("no logger specified");
      }
      instance->log(value);
    };
  private:
    static std::unique_ptr<LoggerInterface> instance;
};

}
