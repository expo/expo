#pragma once

#define CHECK_SPEED 0

#include "./Logger.h"
#include <memory>
#include <functional>
#include <string>

namespace reanimated
{

class SpeedChecker {
public:
  static void checkSpeed(std::string tag, std::function<void()> fun) {
#if CHECK_SPEED
    auto start = std::chrono::system_clock::now();
#endif
    fun();
#if CHECK_SPEED
    auto end = std::chrono::system_clock::now();
    std::chrono::duration<double> elapsed_seconds = end-start;
    tag += " " + std::to_string(elapsed_seconds.count()) + "s";
    Logger::log(tag.c_str());
#endif
  }
};

}
