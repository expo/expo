/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI35_0_0/ABI35_0_0RCTModuleData.h>
#import <cxxReactABI35_0_0/ABI35_0_0NativeModule.h>

namespace ABI35_0_0facebook {
namespace ReactABI35_0_0 {

class ABI35_0_0RCTNativeModule : public NativeModule {
 public:
  ABI35_0_0RCTNativeModule(ABI35_0_0RCTBridge *bridge, ABI35_0_0RCTModuleData *moduleData);

  std::string getName() override;
  std::vector<MethodDescriptor> getMethods() override;
  folly::dynamic getConstants() override;
  void invoke(unsigned int methodId, folly::dynamic &&params, int callId) override;
  MethodCallResult callSerializableNativeHook(unsigned int ReactABI35_0_0MethodId, folly::dynamic &&params) override;

 private:
  __weak ABI35_0_0RCTBridge *m_bridge;
  ABI35_0_0RCTModuleData *m_moduleData;
};

}
}
