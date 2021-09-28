/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0React/ABI43_0_0RCTModuleData.h>
#import <ABI43_0_0cxxreact/ABI43_0_0NativeModule.h>

namespace ABI43_0_0facebook {
namespace ABI43_0_0React {

class ABI43_0_0RCTNativeModule : public NativeModule {
 public:
  ABI43_0_0RCTNativeModule(ABI43_0_0RCTBridge *bridge, ABI43_0_0RCTModuleData *moduleData);

  std::string getName() override;
  std::string getSyncMethodName(unsigned int methodId) override;
  std::vector<MethodDescriptor> getMethods() override;
  folly::dynamic getConstants() override;
  void invoke(unsigned int methodId, folly::dynamic &&params, int callId)
      override;
  MethodCallResult callSerializableNativeHook(
      unsigned int ABI43_0_0ReactMethodId,
      folly::dynamic &&params) override;

 private:
  __weak ABI43_0_0RCTBridge *m_bridge;
  ABI43_0_0RCTModuleData *m_moduleData;
};

} // namespace ABI43_0_0React
} // namespace ABI43_0_0facebook
