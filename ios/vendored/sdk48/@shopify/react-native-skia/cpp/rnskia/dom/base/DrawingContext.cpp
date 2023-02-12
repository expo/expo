#include "DrawingContext.h"

namespace ABI48_0_0RNSkia {

DrawingContext::DrawingContext(std::shared_ptr<SkPaint> paint)
    : DrawingContext("root") {
  _paint = paint;
}

DrawingContext::DrawingContext(DrawingContext *parent, const char *source)
    : DrawingContext(source) {
  _parent = parent;
}

std::shared_ptr<DrawingContext>
DrawingContext::inheritContext(const char *source) {
  auto result = std::make_shared<DrawingContext>(this, source);
  _children.push_back(result);
  return result;
}

std::string DrawingContext::getDebugDescription() {
  std::string v = "ctx for " + std::string(_source) + ":";

  if (_paint != nullptr) {
    auto clr = _paint->getColor();
    auto a = SkColorGetA(clr);
    auto r = SkColorGetR(clr);
    auto g = SkColorGetG(clr);
    auto b = SkColorGetB(clr);

    if (r > 0 || g > 0 || b > 0) {
      v += " color:rgba(" + std::to_string(r) + ", " + std::to_string(g) +
           ", " + std::to_string(b) + ", " + std::to_string(a) + ")";
    }

    if (_paint->getMaskFilter() != nullptr) {
      v += " maskFilter:set";
    }
    auto blendMode = _paint->getBlendMode_or(SkBlendMode::kSrc);
    if (blendMode != SkBlendMode::kSrc) {
      v += " blendMode:" + std::to_string(static_cast<size_t>(blendMode));
    }

    auto opacity = _paint->getAlphaf();
    v += " opacity:" + std::to_string(opacity);

    if (_paint->getPathEffect() != nullptr) {
      v += " [PathEffect]";
    }

    if (_paint->getShader() != nullptr) {
      v += " [Shader]";
    }

    if (_paint->getImageFilter() != nullptr) {
      v += " [ImageFilter]";
    }

    if (_paint->getMaskFilter() != nullptr) {
      v += " [MaskFilter]";
    }

    if (_paint->getColorFilter() != nullptr) {
      v += " [ColorFilter]";
    }

  } else {
    v = v + "[inherited] " +
        (_parent != nullptr ? _parent->getDebugDescription() : "");
  }

  v = v + "\n";

  return v;
}

/**
 Invalidate cache
 */
void DrawingContext::markAsChanged() {
  markChildrenAsChanged();
  _paint = nullptr;
  _isChanged = true;
}

/**
 Call to reset invalidate flag after render cycle
 */
void DrawingContext::resetChangedFlag() { _isChanged = false; }

/**
 Dispose and remove the drawing context from its parent.
 */
void DrawingContext::dispose() {
  if (_parent != nullptr) {
    auto position = std::find(_parent->_children.begin(),
                              _parent->_children.end(), shared_from_this());

    if (position != _parent->_children.end()) {
      _parent->_children.erase(position);
    }
    // TODO: This is called from the JS thread so we need somehow to avoid
    // rendering after setting this to null, and we also need to protect this
    // section.
    _parent = nullptr;
  }
}

/**
 Returns true if the current cache is changed
 */
bool DrawingContext::isChanged() { return _isChanged; }

/**
 Get/Sets the canvas object
 */
SkCanvas *DrawingContext::getCanvas() {
  if (_parent != nullptr) {
    return _parent->getCanvas();
  }

  return _canvas;
}

/**
 Sets the canvas
 */
void DrawingContext::setCanvas(SkCanvas *canvas) { _canvas = canvas; }

/**
 Gets the paint object
 */
std::shared_ptr<const SkPaint> DrawingContext::getPaint() {
  if (_paint != nullptr) {
    return _paint;
  }
  return _parent->getPaint();
}

/**
 To be able to mutate and change the paint in a context we need to mutate the
 underlying paint object - otherwise we'll just use the parent paint object
 (to avoid having to create multiple paint objects for nodes that does not
 change the paint).
 */
std::shared_ptr<SkPaint> DrawingContext::getMutablePaint() {
  if (_paint == nullptr) {
    auto parentPaint = _parent->getPaint();
    _paint = std::make_shared<SkPaint>(*parentPaint);
  }
  // Calling the getMutablePaint accessor implies that the paint
  // is about to be mutatet and will therefore invalidate
  // any child contexts to pick up changes from this context as
  // the parent context.
  markChildrenAsChanged();
  return _paint;
}

/**
 Sets the paint in the current sub context
 */
void DrawingContext::setMutablePaint(std::shared_ptr<SkPaint> paint) {
  _paint = paint;
}

float DrawingContext::getScaledWidth() {
  if (_parent != nullptr) {
    return _parent->getScaledWidth();
  }
  return _scaledWidth;
}

float DrawingContext::getScaledHeight() {
  if (_parent != nullptr) {
    return _parent->getScaledHeight();
  }
  return _scaledHeight;
}

DrawingContext *DrawingContext::getParent() { return _parent; }

void DrawingContext::setScaledWidth(float v) { _scaledWidth = v; }
void DrawingContext::setScaledHeight(float v) { _scaledHeight = v; }

void DrawingContext::setRequestRedraw(std::function<void()> &&requestRedraw) {
  if (_parent != nullptr) {
    _parent->setRequestRedraw(std::move(requestRedraw));
  } else {
    _requestRedraw = std::move(requestRedraw);
  }
}

const std::function<void()> &DrawingContext::getRequestRedraw() {
  if (_parent != nullptr) {
    return _parent->getRequestRedraw();
  }
  return _requestRedraw;
}

DrawingContext::DrawingContext(const char *source) { _source = source; }

void DrawingContext::markChildrenAsChanged() {
  for (auto &child : _children) {
    child->markAsChanged();
  }
}

} // namespace ABI48_0_0RNSkia
