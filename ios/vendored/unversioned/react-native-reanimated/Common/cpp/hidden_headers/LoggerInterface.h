#pragma once

#include <string>

namespace reanimated {

class LoggerInterface {
 public:
  virtual void log(const char *str) = 0;
  virtual void log(const std::string &str) = 0;
  virtual void log(double d) = 0;
  virtual void log(int i) = 0;
  virtual void log(bool b) = 0;
  virtual ~LoggerInterface() = default;
};

} // namespace reanimated
