#pragma once

#include <RNSkLog.h>
#include <chrono>

#define NUMBER_OF_DURATION_SAMPLES 10

namespace RNSkia {

using namespace std::chrono;
using frame = duration<int32_t, std::ratio<1, 60>>;
using ms = duration<float, std::milli>;

class RNSkTimingInfo {
public:
  RNSkTimingInfo(const std::string &name): _name(std::move(name)) {
    reset();
  }

  ~RNSkTimingInfo() {}

  void reset() {
    _lastDurationIndex = 0;
    _lastDurationsCount = 0;
    _lastDuration = 0;
    _prevFpsTimer = -1;
    _frameCount = 0;
    _lastFrameCount = -1;
    _didSkip = false;
  }
  
  void beginTiming() {
    _start = high_resolution_clock::now();
  }
  
  void stopTiming() {
    time_point<steady_clock> stop = high_resolution_clock::now();
    addLastDuration(duration_cast<milliseconds>(stop - _start).count());
    tick(stop);
    if(_didSkip) {
      _didSkip = false;
      RNSkLogger::logToConsole("%s: Skipped frame. Previous frame time: %lldms", _name.c_str(), _lastDuration);
    }
  }

  void markSkipped() {
    _didSkip = true;
  }

  long getAverage() { return static_cast<long>(_average); }
  long getFps() { return _lastFrameCount; }

  void addLastDuration(long duration) {
    _lastDuration = duration;

    // Average duration
    _lastDurations[_lastDurationIndex++] = _lastDuration;

    if (_lastDurationIndex == NUMBER_OF_DURATION_SAMPLES) {
      _lastDurationIndex = 0;
    }

    if (_lastDurationsCount < NUMBER_OF_DURATION_SAMPLES) {
      _lastDurationsCount++;
    }

    _average = 0;
    for (size_t i = 0; i < _lastDurationsCount; i++) {
      _average = _average + _lastDurations[i];
    }
    _average = _average / _lastDurationsCount;
  }

private:
  
  void tick(time_point<steady_clock> now) {
    auto ms = duration_cast<milliseconds>(now.time_since_epoch()).count();
    
    if(_prevFpsTimer == -1) {
      _prevFpsTimer = ms;
    } else if(ms - _prevFpsTimer >= 1000) {
      _lastFrameCount = _frameCount;
      _prevFpsTimer = ms;
      _frameCount = 0;
    }
    _frameCount++;
  }
  
  double _lastTimeStamp;
  long _lastDurations[NUMBER_OF_DURATION_SAMPLES];
  int _lastDurationIndex;
  int _lastDurationsCount;
  long _lastDuration;
  std::atomic<double> _average;
  time_point<steady_clock> _start;
  long _prevFpsTimer;
  double _frameCount;
  double _lastFrameCount;
  double _didSkip;
  std::string _name;
};

} // namespace RNSkia
