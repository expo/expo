
#pragma once

#include "DrawingContext.h"
#include "JsiDomNode.h"

#include <memory>
#include <string>

namespace RNSkia {

enum DeclarationType {
  Unknown = 0,
  Paint = 1,
  Shader = 2,
  ImageFilter = 3,
  ColorFilter = 4,
  PathEffect = 5,
  MaskFilter = 6,
};

class JsiDomDeclarationNode : public JsiDomNode {
public:
  JsiDomDeclarationNode(std::shared_ptr<RNSkPlatformContext> context,
                        const char *type, DeclarationType declarationType)
      : JsiDomNode(context, type, NodeClass::DeclarationNode),
        _declarationType(declarationType) {}

  JSI_PROPERTY_GET(declarationType) {
    // FIXME: Shouldn't this be the declaration type instead? It has been
    return jsi::String::createFromUtf8(runtime, std::string(getType()));
  }

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(JsiDomDeclarationNode,
                                                  declarationType),
                              JSI_EXPORT_PROP_GET(JsiDomNode, type))

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiDomNode, addChild),
                       JSI_EXPORT_FUNC(JsiDomNode, removeChild),
                       JSI_EXPORT_FUNC(JsiDomNode, insertChildBefore),
                       JSI_EXPORT_FUNC(JsiDomNode, setProps),
                       JSI_EXPORT_FUNC(JsiDomNode, setProp),
                       JSI_EXPORT_FUNC(JsiDomNode, dispose),
                       JSI_EXPORT_FUNC(JsiDomNode, children))

  /**
   Called when rendering the tree to create all derived values from all nodes.
   */
  void decorateContext(DeclarationContext *context) override {
    JsiDomNode::decorateContext(context);

#if SKIA_DOM_DEBUG
    printDebugInfo("Begin decorate " + std::string(getType()));
#endif

    // decorate drawing context
    decorate(context);

#if SKIA_DOM_DEBUG
    printDebugInfo("End / Commit decorate " + std::string(getType()));
#endif
  }

  DeclarationType getDeclarationType() { return _declarationType; }

  /**
   Override to implement materialization
   */
  virtual void decorate(DeclarationContext *context) = 0;

protected:
  /**
   Invalidates and marks then context as changed. The implementation in the
   declaration node is to pass the call upwards to the parent node
   */
  void invalidateContext() override {
    if (getParent() != nullptr) {
      getParent()->invalidateContext();
    }
  }

  /**
   A property changed
   */
  void onPropertyChanged(BaseNodeProp *prop) override { invalidateContext(); }

  /**
   Validates that only declaration nodes can be children
   */
  void addChild(std::shared_ptr<JsiDomNode> child) override {
    if (child->getNodeClass() != NodeClass::DeclarationNode) {
      getContext()->raiseError(std::runtime_error(
          "Cannot add a child of type \"" + std::string(child->getType()) +
          "\" to a \"" + std::string(getType()) + "\"."));
    }
    JsiDomNode::addChild(child);
  }

  /**
   Validates that only declaration nodes can be children
   */
  void insertChildBefore(std::shared_ptr<JsiDomNode> child,
                         std::shared_ptr<JsiDomNode> before) override {
    if (child->getNodeClass() != NodeClass::DeclarationNode) {
      getContext()->raiseError(std::runtime_error(
          "Cannot add a child of type \"" + std::string(child->getType()) +
          "\" to a \"" + std::string(getType()) + "\"."));
    }
    JsiDomNode::insertChildBefore(child, before);
  }

private:
  /**
   Type of declaration
   */
  DeclarationType _declarationType;
};

} // namespace RNSkia
