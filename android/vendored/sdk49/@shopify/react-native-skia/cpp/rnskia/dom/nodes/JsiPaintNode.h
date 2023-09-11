#pragma once

#include "JsiDomDeclarationNode.h"
#include "PaintProps.h"

#include <memory>

namespace RNSkia {

class JsiPaintNode : public JsiDomDeclarationNode,
                     public JsiDomNodeCtor<JsiPaintNode> {
public:
  explicit JsiPaintNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDeclarationNode(context, "skPaint", DeclarationType::Paint) {}

  void decorate(DeclarationContext *context) override {
    auto paint = std::make_shared<SkPaint>();
    paint->setAntiAlias(true);

    if (_paintProps->getOpacity()->isSet()) {
      paint->setAlphaf(paint->getAlphaf() *
                       _paintProps->getOpacity()->value().getAsNumber());
    }

    if (_paintProps->getColor()->isSet()) {
      auto currentOpacity = paint->getAlphaf();
      paint->setShader(nullptr);
      paint->setColor(*_paintProps->getColor()->getDerivedValue());
      paint->setAlphaf(paint->getAlphaf() * currentOpacity);
    }

    if (_paintProps->getStrokeWidth()->isSet()) {
      paint->setStrokeWidth(
          _paintProps->getStrokeWidth()->value().getAsNumber());
    }

    if (_paintProps->getBlendMode()->isSet()) {
      paint->setBlendMode(*_paintProps->getBlendMode()->getDerivedValue());
    }

    if (_paintProps->getStyle()->isSet()) {
      auto styleValue = _paintProps->getStyle()->value().getAsString();
      if (styleValue == "stroke") {
        paint->setStyle(SkPaint::Style::kStroke_Style);
      } else if (styleValue == "fill") {
        paint->setStyle(SkPaint::Style::kFill_Style);
      } else {
        throw std::runtime_error(
            styleValue + " is not a valud value for the style property.");
      }
    }

    if (_paintProps->getStrokeJoin()->isSet()) {
      paint->setStrokeJoin(*_paintProps->getStrokeJoin()->getDerivedValue());
    }

    if (_paintProps->getStrokeCap()->isSet()) {
      paint->setStrokeCap(*_paintProps->getStrokeCap()->getDerivedValue());
    }

    if (_paintProps->getStrokeMiter()->isSet()) {
      paint->setStrokeMiter(
          _paintProps->getStrokeMiter()->value().getAsNumber());
    }

    if (_paintProps->getAntiAlias()->isSet()) {
      paint->setAntiAlias(_paintProps->getAntiAlias()->value().getAsBool());
    }

    context->save();
    decorateChildren(context);

    auto imageFilter = context->getImageFilters()->popAsOne();
    auto colorFilter = context->getColorFilters()->popAsOne();
    auto shader = context->getShaders()->pop();
    auto maskFilter = context->getMaskFilters()->pop();
    auto pathEffect = context->getPathEffects()->popAsOne();

    context->restore();

    if (imageFilter) {
      paint->setImageFilter(imageFilter);
    }

    if (colorFilter) {
      paint->setColorFilter(colorFilter);
    }

    if (shader) {
      paint->setShader(shader);
    }

    if (maskFilter) {
      paint->setMaskFilter(maskFilter);
    }

    if (pathEffect) {
      paint->setPathEffect(pathEffect);
    }

    context->getPaints()->push(paint);
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);

    _paintProps = container->defineProperty<PaintProps>();
  }

private:
  PaintProps *_paintProps;
};

} // namespace RNSkia
