/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTModuleData.h>
#import <ABI49_0_0cxxreact/ABI49_0_0NativeModule.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

class ABI49_0_0RCTNativeModule : public NativeModule {
 public:
  ABI49_0_0RCTNativeModule(ABI49_0_0RCTBridge *bridge, ABI49_0_0RCTModuleData *moduleData);

  std::string getName() override;
  std::string getSyncMethodName(unsigned int methodId) override;
  std::vector<MethodDescriptor> getMethods() override;
  folly::dynamic getConstants() override;
  void invoke(unsigned int methodId, folly::dynamic &&params, int callId)
      override;
  MethodCallResult callSerializableNativeHook(
      unsigned int ABI49_0_0ReactMethodId,
      folly::dynamic &&params) override;

 private:
  __weak ABI49_0_0RCTBridge *m_bridge;
  ABI49_0_0RCTModuleData *m_moduleData;
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
