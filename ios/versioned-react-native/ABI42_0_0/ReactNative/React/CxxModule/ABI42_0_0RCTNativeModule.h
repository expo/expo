/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTModuleData.h>
#import <ABI42_0_0cxxreact/ABI42_0_0NativeModule.h>

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

class ABI42_0_0RCTNativeModule : public NativeModule {
 public:
  ABI42_0_0RCTNativeModule(ABI42_0_0RCTBridge *bridge, ABI42_0_0RCTModuleData *moduleData);

  std::string getName() override;
  std::vector<MethodDescriptor> getMethods() override;
  folly::dynamic getConstants() override;
  void invoke(unsigned int methodId, folly::dynamic &&params, int callId)
      override;
  MethodCallResult callSerializableNativeHook(
      unsigned int ABI42_0_0ReactMethodId,
      folly::dynamic &&params) override;

 private:
  __weak ABI42_0_0RCTBridge *m_bridge;
  ABI42_0_0RCTModuleData *m_moduleData;
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
