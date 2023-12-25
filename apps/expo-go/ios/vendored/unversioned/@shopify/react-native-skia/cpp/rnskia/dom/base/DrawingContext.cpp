#include "DrawingContext.h"

#include "ConcatablePaint.h"
#include "JsiDomNode.h"
#include "PaintProps.h"

#include <numeric>

namespace RNSkia {

DrawingContext::DrawingContext(std::shared_ptr<SkPaint> paint) {
  _declarationContext = std::make_unique<DeclarationContext>();
  paint->setAntiAlias(true);
  _paints.push_back(paint);
}

DrawingContext::DrawingContext()
    : DrawingContext(std::make_shared<SkPaint>()) {}

bool DrawingContext::saveAndConcat(
    PaintProps *paintProps,
    const std::vector<std::shared_ptr<JsiDomNode>> &children,
    std::shared_ptr<SkPaint> paintCache) {

  if (paintCache) {
    _paints.push_back(paintCache);
    return true;
  }

  ConcatablePaint paint(_declarationContext.get(), paintProps, children);
  if (!paint.isEmpty()) {
    save();
    paint.concatTo(getPaint());
    return true;
  }

  return false;
}

void DrawingContext::save() {
  // Copy paint and push
  _paints.push_back(std::make_shared<SkPaint>(*getPaint()));
}

void DrawingContext::restore() { _paints.pop_back(); }

SkCanvas *DrawingContext::getCanvas() { return _canvas; }

void DrawingContext::setCanvas(SkCanvas *canvas) { _canvas = canvas; }

std::shared_ptr<SkPaint> DrawingContext::getPaint() {
  return _paints[_paints.size() - 1];
}

} // namespace RNSkia
