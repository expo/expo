#pragma once

#include <chrono>
#include <memory>
#include <mutex>
#include <utility>
#include <vector>

#include <ABI47_0_0jsi/ABI47_0_0jsi.h>

#include <JsiHostObject.h>
#include <ABI47_0_0RNSkView.h>

namespace ABI47_0_0RNSkia {

using namespace ABI47_0_0facebook;
using namespace ABI47_0_0RNJsi;
using namespace std::chrono;

class ABI47_0_0RNSkInfoObject : public JsiHostObject {
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
        touchObj.setProperty(runtime, "type", (double)t.type);
        touchObj.setProperty(runtime, "timestamp", (double)t.timestamp / 1000.0);
        touchObj.setProperty(runtime, "id", (double)t.id);
        touches.setValueAtIndex(runtime, n, touchObj);
      }
      ops.setValueAtIndex(runtime, i, touches);
    }
    return ops;
  }

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(ABI47_0_0RNSkInfoObject, width),
                              JSI_EXPORT_PROP_GET(ABI47_0_0RNSkInfoObject, height),
                              JSI_EXPORT_PROP_GET(ABI47_0_0RNSkInfoObject, timestamp),
                              JSI_EXPORT_PROP_GET(ABI47_0_0RNSkInfoObject, touches))

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

  void updateTouches(std::vector<ABI47_0_0RNSkTouchInfo>& touches) {
    std::lock_guard<std::mutex> lock(_mutex);
    // Add timestamp
    auto ms = std::chrono::duration_cast<milliseconds>(
        system_clock::now().time_since_epoch()).count();
    
    for(size_t i=0; i<touches.size(); i++) {
      touches.at(i).timestamp = ms;
    }
    _currentTouches.push_back(std::move(touches));
  }

  ABI47_0_0RNSkInfoObject() : JsiHostObject() {}

private:
  int _width;
  int _height;
  double _timestamp;
  std::vector<std::vector<ABI47_0_0RNSkTouchInfo>> _currentTouches;
  std::vector<std::vector<ABI47_0_0RNSkTouchInfo>> _touchesCache;
  std::mutex _mutex;
};
} // namespace ABI47_0_0RNSkia
