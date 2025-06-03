
#pragma once

#include "PeekAndPopPreviewShadowNode.h"
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>

namespace facebook::react
{

  class PeekAndPopPreviewComponentDescriptor final
      : public ConcreteComponentDescriptor<PeekAndPopPreviewShadowNode>
  {
  public:
    using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
    void adopt(ShadowNode &shadowNode) const override
    {
      react_native_assert(dynamic_cast<PeekAndPopPreviewShadowNode *>(&shadowNode));
      const auto peekAndPopPreviewShadowNode = dynamic_cast<PeekAndPopPreviewShadowNode *>(&shadowNode);
      const auto state = peekAndPopPreviewShadowNode->getStateData();

      peekAndPopPreviewShadowNode->setSize({state.getWidth(), state.getHeight()});

      ConcreteComponentDescriptor::adopt(shadowNode);
    }
  };

} // namespace facebook::react
