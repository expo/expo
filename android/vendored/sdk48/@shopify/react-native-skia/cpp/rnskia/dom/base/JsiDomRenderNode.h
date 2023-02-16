
#pragma once

#include "ClipProp.h"
#include "DrawingContext.h"
#include "JsiDomDeclarationNode.h"
#include "JsiDomNode.h"
#include "LayerProp.h"
#include "MatrixProp.h"
#include "PaintProps.h"
#include "PointProp.h"
#include "RRectProp.h"
#include "RectProp.h"
#include "TransformProp.h"

#include <memory>
#include <string>

namespace RNSkia {

class JsiDomRenderNode : public JsiDomNode {
public:
  JsiDomRenderNode(std::shared_ptr<RNSkPlatformContext> context,
                   const char *type)
      : JsiDomNode(context, type) {}

  void render(DrawingContext *context) {
#if SKIA_DOM_DEBUG
    printDebugInfo("Begin Render");
#endif

    // Ensure we have a local drawing context inheriting from the parent context
    if (_localContext == nullptr) {
      _localContext = context->inheritContext(getType());
    }

    auto shouldTransform = _matrixProp->isSet() || _transformProp->isSet();
    auto shouldSave =
        shouldTransform || _clipProp->isSet() || _layerProp->isSet();

    // Handle matrix/transforms
    if (shouldSave) {
      // Save canvas state
      if (_layerProp->isSet()) {
        if (_layerProp->isBool()) {
#if SKIA_DOM_DEBUG
          printDebugInfo("canvas->saveLayer()");
#endif
          _localContext->getCanvas()->saveLayer(
              SkCanvas::SaveLayerRec(nullptr, nullptr, nullptr, 0));
        } else {
#if SKIA_DOM_DEBUG
          printDebugInfo("canvas->saveLayer(paint)");
#endif
          _localContext->getCanvas()->saveLayer(SkCanvas::SaveLayerRec(
              nullptr, _layerProp->getDerivedValue().get(), nullptr, 0));
        }
      } else {
#if SKIA_DOM_DEBUG
        printDebugInfo("canvas->save()");
#endif
        _localContext->getCanvas()->save();
      }

      if (_originProp->isSet()) {
#if SKIA_DOM_DEBUG
        printDebugInfo("canvas->translate(origin)");
#endif
        // Handle origin
        _localContext->getCanvas()->translate(
            _originProp->getDerivedValue()->x(),
            _originProp->getDerivedValue()->y());
      }

      if (shouldTransform) {
#if SKIA_DOM_DEBUG
        printDebugInfo(
            "canvas->concat(" +
            std::string(_matrixProp->isSet() ? "matrix" : "transform") +
            std::string(")"));
#endif
        auto matrix = _matrixProp->isSet() ? _matrixProp->getDerivedValue()
                                           : _transformProp->getDerivedValue();

        // Concat canvas' matrix with our matrix
        _localContext->getCanvas()->concat(*matrix);
      }

      // Clipping
      if (_clipProp->isSet()) {
        auto invert = _invertClip->isSet() && _invertClip->value().getAsBool();
        clip(context, _localContext->getCanvas(), invert);
      }

      if (_originProp->isSet()) {
#if SKIA_DOM_DEBUG
        printDebugInfo("canvas->translate(-origin)");
#endif
        // Handle origin
        _localContext->getCanvas()->translate(
            -_originProp->getDerivedValue()->x(),
            -_originProp->getDerivedValue()->y());
      }
    }

    // Let any local paint props decorate the context
    _paintProps->decorate(_localContext.get());

    // Now let's make sure the local context is resolved correctly - ie. that
    // all children of type declaration (except paint) is given the opportunity
    // to decorate the context.
    materializeDeclarations();

    // Render the node
    renderNode(_localContext.get());

    // Restore if needed
    if (shouldSave) {
#if SKIA_DOM_DEBUG
      printDebugInfo("canvas->restore()");
#endif
      _localContext->getCanvas()->restore();
    }

#if SKIA_DOM_DEBUG
    printDebugInfo("End Render");
#endif
  }

  /**
   Override reset (last thing that happens in the render cycle) to also reset
   the changed flag on the local drawing context if necessary.
   */
  void resetPendingChanges() override {
    JsiDomNode::resetPendingChanges();
    _localContext->resetChangedFlag();
  }

  /**
   Signal from the JS side that the node is removed from the dom.
   */
  void dispose() override {
    JsiDomNode::dispose();

    // Clear local drawing context
    if (_localContext != nullptr) {
      _localContext->dispose();
      _localContext = nullptr;
    }
  }

  JsiDomNodeClass getNodeClass() override {
    return JsiDomNodeClass::RenderNode;
  }

protected:
  /**
   Invalidates and marks then context as changed.
   */
  void invalidateContext() override {
    if (_localContext != nullptr) {
      _localContext->markAsChanged();
    }
  }

  /**
   Override to implement rendering where the current state of the drawing
   context is correctly set.
   */
  virtual void renderNode(DrawingContext *context) = 0;

  /**
   Define common properties for all render nodes
   */
  void defineProperties(NodePropsContainer *container) override {
    JsiDomNode::defineProperties(container);

    _paintProps = container->defineProperty<PaintProps>();

    _matrixProp = container->defineProperty<MatrixProp>("matrix");
    _transformProp = container->defineProperty<TransformProp>("transform");
    _originProp = container->defineProperty<PointProp>("origin");
    _clipProp = container->defineProperty<ClipProp>("clip");
    _invertClip = container->defineProperty<NodeProp>("invertClip");
    _layerProp = container->defineProperty<LayerProp>("layer");
  }

private:
  /**
   Clips the canvas depending on the clip property
   */
  void clip(DrawingContext *context, SkCanvas *canvas, bool invert) {
    auto op = invert ? SkClipOp::kDifference : SkClipOp::kIntersect;
    if (_clipProp->getRect() != nullptr) {
#if SKIA_DOM_DEBUG
      printDebugInfo("canvas->clipRect()");
#endif
      canvas->clipRect(*_clipProp->getRect(), op, true);
    } else if (_clipProp->getRRect() != nullptr) {
#if SKIA_DOM_DEBUG
      printDebugInfo("canvas->clipRRect()");
#endif
      canvas->clipRRect(*_clipProp->getRRect(), op, true);
    } else if (_clipProp->getPath() != nullptr) {
#if SKIA_DOM_DEBUG
      printDebugInfo("canvas->clipPath()");
#endif
      canvas->clipPath(*_clipProp->getPath(), op, true);
    }
  }

  /**
   Loops through all declaration nodes and gives each one of them the
   opportunity to decorate the context
   */
  void materializeDeclarations() {
    for (auto &child : getChildren()) {
      if (child->getNodeClass() == JsiDomNodeClass::DeclarationNode) {
        std::static_pointer_cast<JsiBaseDomDeclarationNode>(child)
            ->decorateContext(_localContext.get());
      }
    }
  }

  PointProp *_originProp;
  MatrixProp *_matrixProp;
  TransformProp *_transformProp;
  NodeProp *_invertClip;
  ClipProp *_clipProp;
  LayerProp *_layerProp;
  PaintProps *_paintProps;

  std::shared_ptr<DrawingContext> _localContext;
};

} // namespace RNSkia
