#pragma once

#include <memory>
#include <stdexcept>

#include "./LoggerInterface.h"

namespace reanimated {

class Logger {
 public:
  template <typename T>
  static void log(T value) {
    if (instance == nullptr) {
      throw std::runtime_error("[Reanimated] No logger specified.");
    }
    instance->log(value);
  }

 private:
  static std::unique_ptr<LoggerInterface> instance;
};

} // namespace reanimated
