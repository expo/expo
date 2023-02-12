//
// Created by Christian Falch on 24/08/2021.
//

#pragma once

#include <chrono>
#include <string>

#include <RNSkLog.h>

namespace RNSkia {

using namespace std::chrono;

class RNSkMeasureTime {
public:
  RNSkMeasureTime(const std::string &name)
      : _name(name), _start(high_resolution_clock::now()){}

  ~RNSkMeasureTime() {
    auto stop = high_resolution_clock::now();
    auto duration = duration_cast<milliseconds>(stop - _start).count();
    RNSkLogger::logToConsole("%s: %lld ms\n", _name.c_str(), duration);
  }

private:
  std::string _name;
  time_point<steady_clock> _start;
};

}; // namespace RNSkia
