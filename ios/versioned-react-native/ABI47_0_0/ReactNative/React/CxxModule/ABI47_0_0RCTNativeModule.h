/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTModuleData.h>
#import <ABI47_0_0cxxreact/ABI47_0_0NativeModule.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

class ABI47_0_0RCTNativeModule : public NativeModule {
 public:
  ABI47_0_0RCTNativeModule(ABI47_0_0RCTBridge *bridge, ABI47_0_0RCTModuleData *moduleData);

  std::string getName() override;
  std::string getSyncMethodName(unsigned int methodId) override;
  std::vector<MethodDescriptor> getMethods() override;
  folly::dynamic getConstants() override;
  void invoke(unsigned int methodId, folly::dynamic &&params, int callId)
      override;
  MethodCallResult callSerializableNativeHook(
      unsigned int ABI47_0_0ReactMethodId,
      folly::dynamic &&params) override;

 private:
  __weak ABI47_0_0RCTBridge *m_bridge;
  ABI47_0_0RCTModuleData *m_moduleData;
};

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
