#pragma once

#include <memory>
#include "./DevMenuLoggerInterface.h"

namespace devmenureanimated {

class Logger {
 public:
  template <typename T>
  static void log(T value) {
    if (instance == nullptr) {
      throw std::runtime_error("no logger specified");
    }
    instance->log(value);
  }

 private:
  static std::unique_ptr<LoggerInterface> instance;
};

} // namespace devmenureanimated
