
#pragma once

#include "DrawingContext.h"
#include "JsiDomNode.h"

#include <memory>
#include <string>

namespace ABI48_0_0RNSkia {

class JsiBaseDomDeclarationNode : public JsiDomNode {
public:
  JsiBaseDomDeclarationNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context,
                            const char *type)
      : JsiDomNode(context, type) {}

  JSI_PROPERTY_GET(declarationType) {
    return jsi::String::createFromUtf8(runtime, std::string(getType()));
  }

  JSI_EXPORT_PROPERTY_GETTERS(JSI_EXPORT_PROP_GET(JsiBaseDomDeclarationNode,
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
  virtual void decorateContext(DrawingContext *context) {
#if SKIA_DOM_DEBUG
    printDebugInfo("Begin Materialize " + std::string(getType()));
#endif
    // Materialize children first so that any inner nodes get the opportunity
    // to calculate their state before this node continues.
    for (auto &child : getChildren()) {
      if (child->getNodeClass() == JsiDomNodeClass::DeclarationNode) {
        std::static_pointer_cast<JsiBaseDomDeclarationNode>(child)
            ->decorateContext(context);
      }
    }

    // decorate drawing context
    decorate(context);

#if SKIA_DOM_DEBUG
    printDebugInfo("End / Commit Materialize " + std::string(getType()));
#endif
  }

  JsiDomNodeClass getNodeClass() override {
    return JsiDomNodeClass::DeclarationNode;
  }

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
   Override to implement materialization
   */
  virtual void decorate(DrawingContext *context) = 0;

  /**
   Validates that only declaration nodes can be children
   */
  void addChild(std::shared_ptr<JsiDomNode> child) override {
    if (std::dynamic_pointer_cast<JsiBaseDomDeclarationNode>(child) ==
        nullptr) {
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
    if (std::dynamic_pointer_cast<JsiBaseDomDeclarationNode>(child) ==
        nullptr) {
      getContext()->raiseError(std::runtime_error(
          "Cannot add a child of type \"" + std::string(child->getType()) +
          "\" to a \"" + std::string(getType()) + "\"."));
    }
    JsiDomNode::insertChildBefore(child, before);
  }
};

template <typename T, typename ST>
class JsiDomDeclarationNode : public JsiBaseDomDeclarationNode {
public:
  JsiDomDeclarationNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context,
                        const char *type)
      : JsiBaseDomDeclarationNode(context, type) {}

  bool isChanged(DrawingContext *context) {
    return getCurrent() == nullptr || context->isChanged() ||
           getPropsContainer()->isChanged();
  }

  /**
   Returns the inner element
   */
  ST getCurrent() { return _current; }

  /**
   Clears the current
   */
  void clearCurrent() { _current = nullptr; }

protected:
  /**
   Sets the current value
   */
  void setCurrent(ST c) { _current = c; }

  /**
   Returns a required child image filter by index
   */
  ST requireChild(size_t index) {
    auto filter = optionalChild(index);
    if (filter == nullptr) {
      throw std::runtime_error("Expected child node at index " +
                               std::to_string(index) + " in node " + getType());
    }
    return filter;
  }

  /**
   Returns an optional child image filter by index
   */
  ST optionalChild(size_t index) {
    if (index >= getChildren().size()) {
      return nullptr;
    }

    auto child = getChildren()[index];
    // Support all types here!! ImageFilters, ColorFilters
    // package/src/dom/nodes/paint/ImageFilters.ts#80
    return resolve(child);
  }

  /**
   Returns child as inner type or nullptr
   */
  virtual ST resolve(std::shared_ptr<JsiDomNode> child) = 0;

  /**
   Sets or composes the image filter
   */
  virtual void set(DrawingContext *context, ST imageFilter) = 0;

  void removeChild(std::shared_ptr<JsiDomNode> child) override {
    JsiBaseDomDeclarationNode::removeChild(child);
    clearCurrent();
  }

  void addChild(std::shared_ptr<JsiDomNode> child) override {
    JsiBaseDomDeclarationNode::addChild(child);
    clearCurrent();
  }

  void insertChildBefore(std::shared_ptr<JsiDomNode> child,
                         std::shared_ptr<JsiDomNode> before) override {
    JsiBaseDomDeclarationNode::insertChildBefore(child, before);
    clearCurrent();
  }

private:
  ST _current;
};

} // namespace ABI48_0_0RNSkia
