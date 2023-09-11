#pragma once

#include "BoxShadowProps.h"
#include "JsiDomDeclarationNode.h"

#include <memory>

namespace ABI48_0_0RNSkia {

class JsiBoxShadowNode : public JsiBaseDomDeclarationNode,
                         public JsiDomNodeCtor<JsiBoxShadowNode> {
public:
  explicit JsiBoxShadowNode(std::shared_ptr<ABI48_0_0RNSkPlatformContext> context)
      : JsiBaseDomDeclarationNode(context, "skBoxShadow") {}

  BoxShadowProps *getBoxShadowProps() { return _boxShadowProps; }

protected:
  void decorate(DrawingContext *context) override {
    // Do nothing, we are just a container for properties
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiBaseDomDeclarationNode::defineProperties(container);
    _boxShadowProps = container->defineProperty<BoxShadowProps>();
  }

private:
  BoxShadowProps *_boxShadowProps;
};

} // namespace ABI48_0_0RNSkia
