/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI28_0_0/ABI28_0_0RCTModuleData.h>
#import <cxxReactABI28_0_0/ABI28_0_0NativeModule.h>

namespace facebook {
namespace ReactABI28_0_0 {

class ABI28_0_0RCTNativeModule : public NativeModule {
 public:
  ABI28_0_0RCTNativeModule(ABI28_0_0RCTBridge *bridge, ABI28_0_0RCTModuleData *moduleData);

  std::string getName() override;
  std::vector<MethodDescriptor> getMethods() override;
  folly::dynamic getConstants() override;
  void invoke(unsigned int methodId, folly::dynamic &&params, int callId) override;
  MethodCallResult callSerializableNativeHook(unsigned int ReactABI28_0_0MethodId, folly::dynamic &&params) override;

 private:
  __weak ABI28_0_0RCTBridge *m_bridge;
  ABI28_0_0RCTModuleData *m_moduleData;
};

}
}
