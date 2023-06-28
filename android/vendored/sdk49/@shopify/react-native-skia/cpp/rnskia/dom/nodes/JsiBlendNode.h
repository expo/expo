#pragma once

#include "JsiDomDeclarationNode.h"

#include <algorithm>
#include <memory>
#include <string>

namespace RNSkia {

class JsiBlendNode : public JsiDomDeclarationNode,
                     public JsiDomNodeCtor<JsiBlendNode> {
public:
  explicit JsiBlendNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDeclarationNode(context, "skBlend",
                              DeclarationType::ImageFilter) {}

  void decorate(DeclarationContext *context) override {

    // No need to do anything if there are no children here
    if (getChildren().size() == 0) {
      return;
    }

    decorateChildren(context);

    // Blend mode
    auto blendMode = *_blendProp->getDerivedValue();

    // Shader
    auto shader = context->getShaders()->popAsOne(
        [blendMode](sk_sp<SkShader> inner, sk_sp<SkShader> outer) {
          return SkShaders::Blend(blendMode, outer, inner);
        });

    if (shader != nullptr) {
      context->getShaders()->push(shader);
    }

    auto imageFilter =
        context->getImageFilters()->Declaration<sk_sp<SkImageFilter>>::popAsOne(
            [blendMode](sk_sp<SkImageFilter> inner,
                        sk_sp<SkImageFilter> outer) {
              return SkImageFilters::Blend(blendMode, outer, inner);
            });
    if (imageFilter != nullptr) {
      context->getImageFilters()->push(imageFilter);
    }
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);
    _blendProp = container->defineProperty<BlendModeProp>("mode");
    _blendProp->require();
  }

  /**
   Validates that only declaration nodes can be children
   */
  void addChild(std::shared_ptr<JsiDomNode> child) override {
    JsiDomDeclarationNode::addChild(child);
    // Verify declaration of either shader or image filter
    verifyChild(child);
  }

  /**
   Validates that only declaration nodes can be children
   */
  void insertChildBefore(std::shared_ptr<JsiDomNode> child,
                         std::shared_ptr<JsiDomNode> before) override {
    JsiDomDeclarationNode::insertChildBefore(child, before);
    // Verify declaration of either shader or image filter
    verifyChild(child);
  }

private:
  void verifyChild(std::shared_ptr<JsiDomNode> child) {
    if (child->getNodeClass() != NodeClass::DeclarationNode ||
        (std::static_pointer_cast<JsiDomDeclarationNode>(child)
                 ->getDeclarationType() != DeclarationType::Shader &&
         std::static_pointer_cast<JsiDomDeclarationNode>(child)
                 ->getDeclarationType() != DeclarationType::ImageFilter)) {
      // We'll raise an error when other children are added.
      std::runtime_error("Blend nodes only supports either shaders or image "
                         "filters as children, got " +
                         std::string(child->getType()) + ".");
    }
  }

  BlendModeProp *_blendProp;
};

} // namespace RNSkia
