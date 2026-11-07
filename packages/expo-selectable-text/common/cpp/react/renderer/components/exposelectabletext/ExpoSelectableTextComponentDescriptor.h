#pragma once

#include <react/renderer/components/exposelectabletext/ExpoSelectableTextShadowNode.h>
#include <react/renderer/components/text/BaseParagraphComponentDescriptor.h>

namespace facebook::react {

class ExpoSelectableTextComponentDescriptor final
    : public BaseParagraphComponentDescriptor<ExpoSelectableTextShadowNode> {
 public:
  using BaseParagraphComponentDescriptor::BaseParagraphComponentDescriptor;
};

} // namespace facebook::react
