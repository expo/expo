#pragma once

#include "ExpoViewComponentDescriptor.h"
#include "AndroidExpoViewProps.h"
#include "AndroidExpoViewState.h"
#include "../types/FrontendConverter.h"

namespace react = facebook::react;

namespace expo {

class AndroidExpoViewComponentDescriptor
  : public ExpoViewComponentDescriptor<ExpoViewShadowNode<AndroidExpoViewProps, AndroidExpoViewState>> {
public:
  using Base = ExpoViewComponentDescriptor<ExpoViewShadowNode<AndroidExpoViewProps, AndroidExpoViewState>>;
  using ExpoShadowNode = ExpoViewShadowNode<AndroidExpoViewProps, AndroidExpoViewState>;

  using Base::ExpoViewComponentDescriptor;

  void setStateProps(
    const std::unordered_map<
      std::string,
      std::shared_ptr<FrontendConverter>
    > &stateProps
  );

  react::Props::Shared cloneProps(
    const react::PropsParserContext &context,
    const react::Props::Shared &props,
    react::RawProps rawProps
  ) const override;

  void adopt(react::ShadowNode &shadowNode) const override;

private:
  std::unordered_map<
    std::string,
    std::shared_ptr<FrontendConverter>
  > stateProps_;

  std::function<bool(const std::string &)> filterObjectKeys_ = [this](const std::string &key) {
    return stateProps_.find(key) != stateProps_.end();
  };
};

} // expo
