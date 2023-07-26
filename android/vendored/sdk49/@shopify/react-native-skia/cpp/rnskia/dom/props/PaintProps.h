#pragma once

#include "BlendModeProp.h"
#include "ColorProp.h"
#include "NodeProp.h"
#include "StrokeProps.h"

#include "JsiSkPaint.h"
#include "third_party/CSSColorParser.h"

#include <memory>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkPaint.h"

#pragma clang diagnostic pop

namespace RNSkia {

class PaintProp : public DerivedProp<SkPaint> {
public:
  explicit PaintProp(PropId name,
                     const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkPaint>(onChange) {
    _paintProp = defineProperty<NodeProp>(name);
  }

  explicit PaintProp(const std::function<void(BaseNodeProp *)> &onChange)
      : PaintProp(JsiPropId::get("paint"), onChange) {}

  void updateDerivedValue() override {
    if (_paintProp->isSet()) {
      if (_paintProp->value().getType() == PropType::HostObject) {
        // Read paint property as Host Object - JsiSkPaint
        auto ptr = _paintProp->value().getAs<JsiSkPaint>();
        if (ptr != nullptr) {
          setDerivedValue(ptr->getObject());
        } else {
          throw std::runtime_error("Expected SkPaint object, got unknown "
                                   "object when reading paint property.");
        }
      } else {
        setDerivedValue(nullptr);
      }
    } else {
      setDerivedValue(nullptr);
    }
  }

private:
  NodeProp *_paintProp;
};

class PaintDrawingContextProp : public DerivedProp<DrawingContext> {
public:
  explicit PaintDrawingContextProp(
      PropId name, const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<DrawingContext>(onChange) {
    _paintProp = defineProperty<NodeProp>(name);
  }

  explicit PaintDrawingContextProp(
      const std::function<void(BaseNodeProp *)> &onChange)
      : PaintDrawingContextProp(JsiPropId::get("paint"), onChange) {}

  void updateDerivedValue() override {
    if (_paintProp->isSet()) {
      if (_paintProp->value().getType() == PropType::HostObject) {
        // Read paint property as Host Object - JsiSkPaint
        auto ptr = _paintProp->value().getAs<JsiSkPaint>();
        if (ptr != nullptr) {
          setDerivedValue(std::make_shared<DrawingContext>(ptr->getObject()));
        } else {
          throw std::runtime_error("Expected SkPaint object, got unknown "
                                   "object when reading paint property.");
        }
      } else {
        setDerivedValue(nullptr);
      }
    } else {
      setDerivedValue(nullptr);
    }
  }

private:
  NodeProp *_paintProp;
};

class PaintProps : public BaseDerivedProp {
public:
  explicit PaintProps(const std::function<void(BaseNodeProp *)> &onChange)
      : BaseDerivedProp(onChange) {
    _color = defineProperty<ColorProp>("color");
    _style = defineProperty<NodeProp>("style");
    _strokeWidth = defineProperty<NodeProp>("strokeWidth");
    _blendMode = defineProperty<BlendModeProp>("blendMode");
    _strokeJoin = defineProperty<StrokeJoinProp>("strokeJoin");
    _strokeCap = defineProperty<StrokeCapProp>("strokeCap");
    _strokeMiter = defineProperty<NodeProp>("strokeMiter");
    _antiAlias = defineProperty<NodeProp>("antiAlias");
    _opacity = defineProperty<NodeProp>("opacity");
  }

  void updateDerivedValue() override {}

  ColorProp *getColor() { return _color; }
  NodeProp *getStyle() { return _style; }
  NodeProp *getStrokeWidth() { return _strokeWidth; }
  BlendModeProp *getBlendMode() { return _blendMode; }
  StrokeJoinProp *getStrokeJoin() { return _strokeJoin; }
  StrokeCapProp *getStrokeCap() { return _strokeCap; }
  NodeProp *getStrokeMiter() { return _strokeMiter; }
  NodeProp *getAntiAlias() { return _antiAlias; }
  NodeProp *getOpacity() { return _opacity; }

private:
  ColorProp *_color;
  NodeProp *_style;
  NodeProp *_strokeWidth;
  BlendModeProp *_blendMode;
  StrokeJoinProp *_strokeJoin;
  StrokeCapProp *_strokeCap;
  NodeProp *_strokeMiter;
  NodeProp *_antiAlias;
  NodeProp *_opacity;
};

} // namespace RNSkia
