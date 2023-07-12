#include "ConcatablePaint.h"

#include "DeclarationContext.h"
#include "JsiDomNode.h"
#include "PaintProps.h"

namespace RNSkia {

ConcatablePaint::ConcatablePaint(
    DeclarationContext *declarationContext, PaintProps *paintProps,
    const std::vector<std::shared_ptr<JsiDomNode>> &children)
    : _declarationContext(declarationContext), _paintProps(paintProps),
      _children(children) {

  auto hasPropertyValues = _paintProps->getColor()->isSet() ||
                           _paintProps->getStrokeWidth()->isSet() ||
                           _paintProps->getBlendMode()->isSet() ||
                           _paintProps->getStyle()->isSet() ||
                           _paintProps->getStrokeJoin()->isSet() ||
                           _paintProps->getStrokeCap()->isSet() ||
                           _paintProps->getStrokeMiter()->isSet() ||
                           _paintProps->getOpacity()->isSet() ||
                           _paintProps->getAntiAlias()->isSet();

  _declarationContext->save();

  for (auto &child : _children) {
    child->decorateContext(_declarationContext);
  }

  _imageFilter = declarationContext->getImageFilters()->popAsOne();
  _colorFilter = declarationContext->getColorFilters()->popAsOne();
  _shader = declarationContext->getShaders()->pop();
  _maskFilter = declarationContext->getMaskFilters()->pop();
  _pathEffect = declarationContext->getPathEffects()->popAsOne();

  _declarationContext->restore();

  _isEmpty = !hasPropertyValues && _imageFilter == nullptr &&
             _colorFilter == nullptr && _shader == nullptr &&
             _maskFilter == nullptr && _pathEffect == nullptr;
}

bool ConcatablePaint::isEmpty() { return _isEmpty; }

void ConcatablePaint::concatTo(std::shared_ptr<SkPaint> paint) {

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
    paint->setStrokeWidth(_paintProps->getStrokeWidth()->value().getAsNumber());
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
      throw std::runtime_error(styleValue +
                               " is not a valud value for the style property.");
    }
  }

  if (_paintProps->getStrokeJoin()->isSet()) {
    paint->setStrokeJoin(*_paintProps->getStrokeJoin()->getDerivedValue());
  }

  if (_paintProps->getStrokeCap()->isSet()) {
    paint->setStrokeCap(*_paintProps->getStrokeCap()->getDerivedValue());
  }

  if (_paintProps->getStrokeMiter()->isSet()) {
    paint->setStrokeMiter(_paintProps->getStrokeMiter()->value().getAsNumber());
  }

  if (_paintProps->getAntiAlias()->isSet()) {
    paint->setAntiAlias(_paintProps->getAntiAlias()->value().getAsBool());
  }

  if (_imageFilter) {
    paint->setImageFilter(_imageFilter);
  }

  if (_colorFilter) {
    paint->setColorFilter(_colorFilter);
  }

  if (_shader) {
    paint->setShader(_shader);
  }

  if (_maskFilter) {
    paint->setMaskFilter(_maskFilter);
  }

  if (_pathEffect) {
    paint->setPathEffect(_pathEffect);
  }
}

} // namespace RNSkia
