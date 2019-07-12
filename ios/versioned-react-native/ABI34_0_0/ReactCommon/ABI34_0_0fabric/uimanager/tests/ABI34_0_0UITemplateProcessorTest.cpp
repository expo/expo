/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <exception>

#include <gtest/gtest.h>
#include <ReactABI34_0_0/uimanager/ComponentDescriptorFactory.h>
#include <ReactABI34_0_0/uimanager/UITemplateProcessor.h>

using namespace facebook::ReactABI34_0_0;

#include <ReactABI34_0_0/components/activityindicator/ActivityIndicatorViewComponentDescriptor.h>
#include <ReactABI34_0_0/components/image/ImageComponentDescriptor.h>
#include <ReactABI34_0_0/components/scrollview/ScrollViewComponentDescriptor.h>
#include <ReactABI34_0_0/components/text/ParagraphComponentDescriptor.h>
#include <ReactABI34_0_0/components/text/RawTextComponentDescriptor.h>
#include <ReactABI34_0_0/components/text/TextComponentDescriptor.h>
#include <ReactABI34_0_0/components/view/ViewComponentDescriptor.h>
#include <ReactABI34_0_0/config/ReactABI34_0_0NativeConfig.h>
#include <ReactABI34_0_0/uimanager/ComponentDescriptorFactory.h>
#include <ReactABI34_0_0/uimanager/ComponentDescriptorRegistry.h>
#include <ReactABI34_0_0/uimanager/ContextContainer.h>

namespace facebook {
namespace ReactABI34_0_0 {

// TODO (T29441913): Codegen this app-specific implementation.
ComponentRegistryFactory getDefaultComponentRegistryFactory() {
  return [](const SharedEventDispatcher &eventDispatcher,
            const SharedContextContainer &contextContainer) {
    auto registry = std::make_shared<ComponentDescriptorRegistry>();
    registry->registerComponentDescriptor(
        std::make_shared<ViewComponentDescriptor>(eventDispatcher));
    registry->registerComponentDescriptor(
        std::make_shared<ImageComponentDescriptor>(
            eventDispatcher, contextContainer));
    registry->registerComponentDescriptor(
        std::make_shared<ScrollViewComponentDescriptor>(eventDispatcher));
    registry->registerComponentDescriptor(
        std::make_shared<ParagraphComponentDescriptor>(
            eventDispatcher, contextContainer));
    registry->registerComponentDescriptor(
        std::make_shared<TextComponentDescriptor>(eventDispatcher));
    registry->registerComponentDescriptor(
        std::make_shared<RawTextComponentDescriptor>(eventDispatcher));
    registry->registerComponentDescriptor(
        std::make_shared<ActivityIndicatorViewComponentDescriptor>(
            eventDispatcher));
    return registry;
  };
}

bool mockSimpleTestValue_;

NativeModuleRegistry buildNativeModuleRegistry();

NativeModuleRegistry buildNativeModuleRegistry() {
  NativeModuleRegistry nMR;
  nMR.registerModule(
      "MobileConfig",
      [&](const std::string &methodName, const folly::dynamic &args) {
        return mockSimpleTestValue_;
      });
  return nMR;
}

class MockReactABI34_0_0NativeConfig : public ReactABI34_0_0NativeConfig {
 public:
  MockReactABI34_0_0NativeConfig() {}
  bool getBool(const std::string &param) const override {
    return mockSimpleTestValue_;
  }

  std::string getString(const std::string &param) const override {
    return "";
  }

  int64_t getInt64(const std::string &param) const override {
    return 0;
  }

  double getDouble(const std::string &param) const override {
    return 0.0;
  }
};

std::shared_ptr<const ReactABI34_0_0NativeConfig> mockReactABI34_0_0NativeConfig_ =
    std::make_shared<const MockReactABI34_0_0NativeConfig>();

} // namespace ReactABI34_0_0
} // namespace facebook

TEST(UITemplateProcessorTest, testSimpleBytecode) {
  auto surfaceId = 11;
  auto componentDescriptorRegistry =
      getDefaultComponentRegistryFactory()(nullptr, nullptr);
  auto nativeModuleRegistry = buildNativeModuleRegistry();

  auto bytecode = R"delim({"version":0.1,"commands":[
    ["createNode",2,"ABI34_0_0RCTView",-1,{"opacity": 0.5, "testId": "root"}],
    ["createNode",4,"ABI34_0_0RCTView",2,{"testId": "child"}],
    ["returnRoot",2]
  ]})delim";

  mockSimpleTestValue_ = true;

  auto root1 = UITemplateProcessor::buildShadowTree(
      bytecode,
      surfaceId,
      folly::dynamic::object(),
      *componentDescriptorRegistry,
      nativeModuleRegistry,
      mockReactABI34_0_0NativeConfig_);
#ifndef NDEBUG
  LOG(INFO) << std::endl << root1->getDebugDescription();
#endif
  auto props1 = std::dynamic_pointer_cast<const ViewProps>(root1->getProps());
  ASSERT_NEAR(props1->opacity, 0.5, 0.001);
  ASSERT_STREQ(props1->testId.c_str(), "root");
  auto children1 = root1->getChildren();
  ASSERT_EQ(children1.size(), 1);
  auto child_props1 =
      std::dynamic_pointer_cast<const ViewProps>(children1.at(0)->getProps());
  ASSERT_STREQ(child_props1->testId.c_str(), "child");
}

TEST(UITemplateProcessorTest, testConditionalBytecode) {
  auto surfaceId = 11;
  auto componentDescriptorRegistry =
      getDefaultComponentRegistryFactory()(nullptr, nullptr);
  auto nativeModuleRegistry = buildNativeModuleRegistry();

  auto bytecode = R"delim({"version":0.1,"commands":[
    ["createNode",2,"ABI34_0_0RCTView",-1,{"testId": "root"}],
    ["loadNativeBool",1,"MobileConfig","getBool",["qe:simple_test"]],
    ["conditional",1,
      [["createNode",4,"ABI34_0_0RCTView",2,{"testId": "cond_true"}]],
      [["createNode",4,"ABI34_0_0RCTView",2,{"testId": "cond_false"}]]
    ],
    ["returnRoot",2]
  ]})delim";

  mockSimpleTestValue_ = true;

  auto root1 = UITemplateProcessor::buildShadowTree(
      bytecode,
      surfaceId,
      folly::dynamic::object(),
      *componentDescriptorRegistry,
      nativeModuleRegistry,
      mockReactABI34_0_0NativeConfig_);
#ifndef NDEBUG
  LOG(INFO) << std::endl << root1->getDebugDescription();
#endif
  auto props1 = std::dynamic_pointer_cast<const ViewProps>(root1->getProps());
  ASSERT_STREQ(props1->testId.c_str(), "root");
  auto children1 = root1->getChildren();
  ASSERT_EQ(children1.size(), 1);
  auto child_props1 =
      std::dynamic_pointer_cast<const ViewProps>(children1.at(0)->getProps());
  ASSERT_STREQ(child_props1->testId.c_str(), "cond_true");

  mockSimpleTestValue_ = false;

  auto root2 = UITemplateProcessor::buildShadowTree(
      bytecode,
      surfaceId,
      folly::dynamic::object(),
      *componentDescriptorRegistry,
      nativeModuleRegistry,
      mockReactABI34_0_0NativeConfig_);
  auto child_props2 = std::dynamic_pointer_cast<const ViewProps>(
      root2->getChildren().at(0)->getProps());
  ASSERT_STREQ(child_props2->testId.c_str(), "cond_false");
}
