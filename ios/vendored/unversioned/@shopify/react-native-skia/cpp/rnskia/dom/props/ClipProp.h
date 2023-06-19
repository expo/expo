#pragma once

#include "NodeProp.h"

#include "PathProp.h"
#include "RRectProp.h"
#include "RectProp.h"

#include <memory>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkPath.h"

#pragma clang diagnostic pop

namespace RNSkia {

class ClipProp : public BaseDerivedProp {
public:
  explicit ClipProp(PropId name,
                    const std::function<void(BaseNodeProp *)> &onChange)
      : BaseDerivedProp(onChange) {
    _clipProp = defineProperty<NodeProp>(name);
  }

  void updateDerivedValue() override {
    if (_clipProp->isSet()) {
      auto value = _clipProp->value();
      _rect = RectProp::processRect(value);
      _rrect = nullptr;
      _path = nullptr;
      if (!_rect) {
        _path = PathProp::processPath(value);
        if (!_path) {
          _rrect = RRectProp::processRRect(value);
        }
      }
    }
  }

  bool isSet() override { return _clipProp->isSet(); }

  const SkPath *getPath() { return _path.get(); }
  const SkRect *getRect() { return _rect.get(); }
  const SkRRect *getRRect() { return _rrect.get(); }

private:
  NodeProp *_clipProp;

  std::shared_ptr<const SkPath> _path;
  std::shared_ptr<const SkRect> _rect;
  std::shared_ptr<const SkRRect> _rrect;
};

} // namespace RNSkia