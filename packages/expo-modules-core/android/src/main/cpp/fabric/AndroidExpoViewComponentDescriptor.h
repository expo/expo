#pragma once

#include "ExpoViewComponentDescriptor.h"
#include "AndroidExpoViewProps.h"
#include "AndroidExpoViewState.h"
#include "../types/FrontendConverter.h"
#include "ExpoViewComponentRegistry.h"

namespace react = facebook::react;

namespace expo {

class AndroidExpoViewComponentDescriptor
  : public ExpoViewComponentDescriptor<ExpoViewShadowNode<AndroidExpoViewProps, AndroidExpoViewState>> {
public:
  using Base = ExpoViewComponentDescriptor<ExpoViewShadowNode<AndroidExpoViewProps, AndroidExpoViewState>>;
  using ExpoShadowNode = ExpoViewShadowNode<AndroidExpoViewProps, AndroidExpoViewState>;

  using Base::ExpoViewComponentDescriptor;

  void setComponentRegistration(std::shared_ptr<ExpoViewComponentRegistration> registration);

  react::Props::Shared cloneProps(
    const react::PropsParserContext &context,
    const react::Props::Shared &props,
    react::RawProps rawProps
  ) const override;

  void adopt(react::ShadowNode &shadowNode) const override;

private:
  std::shared_ptr<ExpoViewComponentRegistration> registration_;
};

} // namespace expo
