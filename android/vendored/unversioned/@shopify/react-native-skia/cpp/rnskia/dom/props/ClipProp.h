#pragma once

#include "NodeProp.h"

#include "PathProp.h"
#include "RRectProp.h"
#include "RectProp.h"

#include <memory>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include <SkPath.h>

#pragma clang diagnostic pop

namespace RNSkia {

class ClipProp : public BaseDerivedProp {
public:
  explicit ClipProp(PropId name) : BaseDerivedProp() {
    _pathProp = addProperty(std::make_shared<PathProp>(name));
    _rectProp = addProperty(std::make_shared<RectProp>(name));
    _rrectProp = addProperty(std::make_shared<RRectProp>(name));
  }

  void updateDerivedValue() override {
    if (_pathProp->isSet()) {
      _rect = nullptr;
      _rrect = nullptr;
      _path = _pathProp->getDerivedValue();
    } else if (_rrectProp->isSet()) {
      _rect = nullptr;
      _rrect = _rrectProp->getDerivedValue();
      _path = nullptr;
    } else if (_rectProp->isSet()) {
      _rect = _rectProp->getDerivedValue();
      _rrect = nullptr;
      _path = nullptr;
    }
  }

  bool isSet() override {
    return _pathProp->isSet() || _rectProp->isSet() || _rrectProp->isSet();
  }

  const SkPath *getPath() { return _path.get(); }
  const SkRect *getRect() { return _rect.get(); }
  const SkRRect *getRRect() { return _rrect.get(); }

private:
  PathProp *_pathProp;
  RectProp *_rectProp;
  RRectProp *_rrectProp;

  std::shared_ptr<const SkPath> _path;
  std::shared_ptr<const SkRect> _rect;
  std::shared_ptr<const SkRRect> _rrect;
};

} // namespace RNSkia
