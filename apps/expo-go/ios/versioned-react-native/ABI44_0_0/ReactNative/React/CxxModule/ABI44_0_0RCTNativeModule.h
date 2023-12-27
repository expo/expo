/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI44_0_0React/ABI44_0_0RCTModuleData.h>
#import <ABI44_0_0cxxreact/ABI44_0_0NativeModule.h>

namespace ABI44_0_0facebook {
namespace ABI44_0_0React {

class ABI44_0_0RCTNativeModule : public NativeModule {
 public:
  ABI44_0_0RCTNativeModule(ABI44_0_0RCTBridge *bridge, ABI44_0_0RCTModuleData *moduleData);

  std::string getName() override;
  std::string getSyncMethodName(unsigned int methodId) override;
  std::vector<MethodDescriptor> getMethods() override;
  folly::dynamic getConstants() override;
  void invoke(unsigned int methodId, folly::dynamic &&params, int callId)
      override;
  MethodCallResult callSerializableNativeHook(
      unsigned int ABI44_0_0ReactMethodId,
      folly::dynamic &&params) override;

 private:
  __weak ABI44_0_0RCTBridge *m_bridge;
  ABI44_0_0RCTModuleData *m_moduleData;
};

} // namespace ABI44_0_0React
} // namespace ABI44_0_0facebook
