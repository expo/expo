#pragma once

#include <chrono>
#include <memory>
#include <mutex>
#include <utility>
#include <vector>

#include <jsi/jsi.h>

#include "JsiHostObject.h"
#include "RNSkView.h"

namespace RNSkia {

namespace jsi = facebook::jsi;

class RNSkInfoObject : public RNJsi::JsiHostObject {
public:
  JSI_PROPERTY_GET(width) { return _width; }
  JSI_PROPERTY_GET(height) { return _height; }
  JSI_PROPERTY_GET(timestamp) { return _timestamp; }

  JSI_PROPERTY_GET(touches) {
    auto ops = jsi::Array(runtime, _touchesCache.size());
    for (size_t i = 0; i < _touchesCache.size(); i++) {
      auto cur = _touchesCache.at(i);
      auto touches = jsi::Array(runtime, cur.size());
      for (size_t n = 0; n < cur.size(); n++) {
        auto touchObj = jsi::Object(runtime);
        auto t = cur.at(n);
        touchObj.setProperty(runtime, "x", t.x);
        touchObj.setProperty(runtime, "y", t.y);
        touchObj.setProperty(runtime, "force", t.force);
        touchObj.setProperty(runtime, "type", static_cast<double>(t.type));
        touchObj.setProperty(runtime, "timestamp",
                             static_cast<double>(t.timestamp / 1000.0));
        touchObj.setProperty(runtime, "id", static_cast<double>(t.id));
        touches.setValueAtIndex(runtime, n, touchObj);
      }
      ops.setValueAtIndex(runtime, i, touches);
    }
    return ops;
  }

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(RNSkInfoObject, width),
                              JSI_EXPORT_PROP_GET(RNSkInfoObject, height),
                              JSI_EXPORT_PROP_GET(RNSkInfoObject, timestamp),
                              JSI_EXPORT_PROP_GET(RNSkInfoObject, touches))

  void beginDrawOperation(int width, int height, double timestamp) {
    _width = width;
    _height = height;
    _timestamp = timestamp;

    // Copy touches so that we can continue to add/receive touch points while
    // in the drawing callback.
    std::lock_guard<std::mutex> lock(_mutex);
    _touchesCache.clear();
    _touchesCache.reserve(_currentTouches.size());
    for (size_t i = 0; i < _currentTouches.size(); ++i) {
      _touchesCache.push_back(_currentTouches.at(i));
    }
    _currentTouches.clear();
  }

  void endDrawOperation() { _touchesCache.clear(); }

  void updateTouches(std::vector<RNSkTouchInfo> &touches) {
    std::lock_guard<std::mutex> lock(_mutex);
    // Add timestamp
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
                  std::chrono::system_clock::now().time_since_epoch())
                  .count();

    for (size_t i = 0; i < touches.size(); i++) {
      touches.at(i).timestamp = ms;
    }
    _currentTouches.push_back(std::move(touches));
  }

  RNSkInfoObject() : JsiHostObject() {}

private:
  int _width;
  int _height;
  double _timestamp;
  std::vector<std::vector<RNSkTouchInfo>> _currentTouches;
  std::vector<std::vector<RNSkTouchInfo>> _touchesCache;
  std::mutex _mutex;
};
} // namespace RNSkia
