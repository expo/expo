#pragma once

#include "BoxShadowProps.h"
#include "JsiDomDeclarationNode.h"

#include <memory>

namespace RNSkia {

class JsiBoxShadowNode : public JsiDomDeclarationNode,
                         public JsiDomNodeCtor<JsiBoxShadowNode> {
public:
  explicit JsiBoxShadowNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDeclarationNode(context, "skBoxShadow",
                              DeclarationType::Unknown) {}

  BoxShadowProps *getBoxShadowProps() { return _boxShadowProps; }

  void decorate(DeclarationContext *context) override {
    // Do nothing, we are just a container for properties
  }

protected:
  void defineProperties(NodePropsContainer *container) override {
    JsiDomDeclarationNode::defineProperties(container);
    _boxShadowProps = container->defineProperty<BoxShadowProps>();
  }

private:
  BoxShadowProps *_boxShadowProps;
};

} // namespace RNSkia
