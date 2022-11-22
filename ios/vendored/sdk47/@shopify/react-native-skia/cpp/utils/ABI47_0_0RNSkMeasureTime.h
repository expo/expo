//
// Created by Christian Falch on 24/08/2021.
//

#pragma once

#include <chrono>
#include <string>

#include <ABI47_0_0RNSkLog.h>

namespace ABI47_0_0RNSkia {

using namespace std::chrono;

class ABI47_0_0RNSkMeasureTime {
public:
  ABI47_0_0RNSkMeasureTime(const std::string &name)
      : _name(name), _start(high_resolution_clock::now()){}

  ~ABI47_0_0RNSkMeasureTime() {
    auto stop = high_resolution_clock::now();
    auto duration = duration_cast<milliseconds>(stop - _start).count();
    ABI47_0_0RNSkLogger::logToConsole("%s: %lld ms\n", _name.c_str(), duration);
  }

private:
  std::string _name;
  time_point<steady_clock> _start;
};

}; // namespace ABI47_0_0RNSkia
