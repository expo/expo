#pragma once

#include <react/renderer/components/text/ParagraphShadowNode.h>

namespace facebook::react {

/*
 * A <Paragraph> under its own component name, so that it can mount its own
 * native view. Same pattern as React Native's `SelectableParagraphShadowNode`.
 */
class ExpoSelectableTextShadowNode : public ParagraphShadowNode {
 public:
  using ParagraphShadowNode::ParagraphShadowNode;

  static constexpr ComponentName Name()
  {
    return "ExpoSelectableText";
  }

  static ComponentHandle Handle()
  {
    return ComponentHandle(Name());
  }
};

} // namespace facebook::react
