#pragma once

#include "JsiDomDeclarationNode.h"
#include "PaintProps.h"

#include <memory>

namespace RNSkia {

// TODO: implement feature: A paint node has its own paint not inherited,
//       and when found the drawing node should render an extra time for
//       each paint node in its children.

class JsiPaintNode : public JsiBaseDomDeclarationNode,
                     public JsiDomNodeCtor<JsiPaintNode> {
public:
  explicit JsiPaintNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiBaseDomDeclarationNode(context, "skPaint") {}

  /**
   Returns a pointer to the local paint context in the paint node. This is a
   special case for declaration nodes since the Paint node has a bit different
   semantic than other declaration nodes.
   */
  DrawingContext *getDrawingContext() { return _localContext.get(); }

  /**
   We need to override the decorate node call to avoid letting children
   decorate before we have created our child context.
   */
  void decorateContext(DrawingContext *context) override {
    // A paint node should have its own local paint
    if (_localContext == nullptr) {
      _localContext = context->inheritContext("PaintNode");
    }

    // ...and it should be a totally new paint, not inheriting from parent
    // paint.
    if (_localContext->isChanged()) {
      auto paint = std::make_shared<SkPaint>();
      paint->setAntiAlias(true);
      _localContext->setMutablePaint(paint);
    }

    // Let's decorate paint props
    _paintProps->decorate(_localContext.get());

    // Materialize children who will now only change the paint node's paint
    for (auto &child : getChildren()) {
      auto decl = std::dynamic_pointer_cast<JsiBaseDomDeclarationNode>(child);
      if (decl != nullptr) {
        decl->decorateContext(_localContext.get());
      }
    }
  }

  std::shared_ptr<const SkPaint> getPaint() {
    return _localContext->getPaint();
  }

protected:
  void decorate(DrawingContext *context) override {}

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);

    _paintProps = container->defineProperty<PaintProps>();
    _opacityProp = container->defineProperty<NodeProp>("opacity");
  }

private:
  NodeProp *_opacityProp;
  PaintProps *_paintProps;

  std::shared_ptr<DrawingContext> _localContext;
};

} // namespace RNSkia
