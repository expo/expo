/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <exception>

#include <glog/logging.h>
#include <gtest/gtest.h>
#include <ABI42_0_0React/uimanager/ComponentDescriptorFactory.h>
#include <ABI42_0_0React/uimanager/UITemplateProcessor.h>

using namespace ABI42_0_0facebook::ABI42_0_0React;

#include <ABI42_0_0React/components/rncore/ComponentDescriptors.h>
#include <ABI42_0_0React/components/scrollview/ScrollViewComponentDescriptor.h>
#include <ABI42_0_0React/components/view/ViewComponentDescriptor.h>
#include <ABI42_0_0React/config/ABI42_0_0ReactNativeConfig.h>
#include <ABI42_0_0React/uimanager/ComponentDescriptorFactory.h>
#include <ABI42_0_0React/uimanager/ComponentDescriptorProviderRegistry.h>
#include <ABI42_0_0React/uimanager/ComponentDescriptorRegistry.h>
#include <ABI42_0_0React/utils/ContextContainer.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

static ComponentRegistryFactory getComponentRegistryFactory() {
  return [](const EventDispatcher::Weak &eventDispatcher,
            const ContextContainer::Shared &contextContainer) {
    ComponentDescriptorProviderRegistry providerRegistry{};
    providerRegistry.add(
        concreteComponentDescriptorProvider<ViewComponentDescriptor>());
    providerRegistry.add(
        concreteComponentDescriptorProvider<ScrollViewComponentDescriptor>());
    providerRegistry.add(concreteComponentDescriptorProvider<
                         ActivityIndicatorViewComponentDescriptor>());
    return providerRegistry.createComponentDescriptorRegistry(
        {eventDispatcher, contextContainer});
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

class MockABI42_0_0ReactNativeConfig : public ABI42_0_0ReactNativeConfig {
 public:
  MockABI42_0_0ReactNativeConfig() {}
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

std::shared_ptr<const ABI42_0_0ReactNativeConfig> mockABI42_0_0ReactNativeConfig_ =
    std::make_shared<const MockABI42_0_0ReactNativeConfig>();

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook

TEST(UITemplateProcessorTest, testSimpleBytecode) {
  auto surfaceId = 11;
  auto eventDispatcher = std::shared_ptr<EventDispatcher const>();
  auto componentDescriptorRegistry =
      getComponentRegistryFactory()(eventDispatcher, nullptr);
  auto nativeModuleRegistry = buildNativeModuleRegistry();

  auto bytecode = R"delim({"version":0.1,"commands":[
    ["createNode",2,"ABI42_0_0RCTView",-1,{"opacity": 0.5, "testId": "root"}],
    ["createNode",4,"ABI42_0_0RCTView",2,{"testId": "child"}],
    ["returnRoot",2]
  ]})delim";

  mockSimpleTestValue_ = true;

  auto root1 = UITemplateProcessor::buildShadowTree(
      bytecode,
      surfaceId,
      folly::dynamic::object(),
      *componentDescriptorRegistry,
      nativeModuleRegistry,
      mockABI42_0_0ReactNativeConfig_);
#ifndef NDEBUG
  LOG(INFO) << std::endl << root1->getDebugDescription();
#endif
  auto props1 = std::dynamic_pointer_cast<const ViewProps>(root1->getProps());
  ABI42_0_0EXPECT_NEAR(props1->opacity, 0.5, 0.001);
  ASSERT_STREQ(props1->testId.c_str(), "root");
  auto children1 = root1->getChildren();
  ABI42_0_0EXPECT_EQ(children1.size(), 1);
  auto child_props1 =
      std::dynamic_pointer_cast<const ViewProps>(children1.at(0)->getProps());
  ASSERT_STREQ(child_props1->testId.c_str(), "child");
}

TEST(UITemplateProcessorTest, testConditionalBytecode) {
  auto surfaceId = 11;
  auto eventDispatcher = std::shared_ptr<EventDispatcher const>();
  auto componentDescriptorRegistry =
      getComponentRegistryFactory()(eventDispatcher, nullptr);
  auto nativeModuleRegistry = buildNativeModuleRegistry();

  auto bytecode = R"delim({"version":0.1,"commands":[
    ["createNode",2,"ABI42_0_0RCTView",-1,{"testId": "root"}],
    ["loadNativeBool",1,"MobileConfig","getBool",["qe:simple_test"]],
    ["conditional",1,
      [["createNode",4,"ABI42_0_0RCTView",2,{"testId": "cond_true"}]],
      [["createNode",4,"ABI42_0_0RCTView",2,{"testId": "cond_false"}]]
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
      mockABI42_0_0ReactNativeConfig_);
#ifndef NDEBUG
  LOG(INFO) << std::endl << root1->getDebugDescription();
#endif
  auto props1 = std::dynamic_pointer_cast<const ViewProps>(root1->getProps());
  ASSERT_STREQ(props1->testId.c_str(), "root");
  auto children1 = root1->getChildren();
  ABI42_0_0EXPECT_EQ(children1.size(), 1);
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
      mockABI42_0_0ReactNativeConfig_);
  auto child_props2 = std::dynamic_pointer_cast<const ViewProps>(
      root2->getChildren().at(0)->getProps());
  ASSERT_STREQ(child_props2->testId.c_str(), "cond_false");
}
