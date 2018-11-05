/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI31_0_0/ABI31_0_0RCTModuleData.h>
#import <cxxReactABI31_0_0/ABI31_0_0NativeModule.h>

namespace facebook {
namespace ReactABI31_0_0 {

class ABI31_0_0RCTNativeModule : public NativeModule {
 public:
  ABI31_0_0RCTNativeModule(ABI31_0_0RCTBridge *bridge, ABI31_0_0RCTModuleData *moduleData);

  std::string getName() override;
  std::vector<MethodDescriptor> getMethods() override;
  folly::dynamic getConstants() override;
  void invoke(unsigned int methodId, folly::dynamic &&params, int callId) override;
  MethodCallResult callSerializableNativeHook(unsigned int ReactABI31_0_0MethodId, folly::dynamic &&params) override;

 private:
  __weak ABI31_0_0RCTBridge *m_bridge;
  ABI31_0_0RCTModuleData *m_moduleData;
};

}
}
