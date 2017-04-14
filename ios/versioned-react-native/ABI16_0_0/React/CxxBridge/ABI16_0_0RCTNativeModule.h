/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI16_0_0/ABI16_0_0RCTModuleData.h>
#import <cxxReactABI16_0_0/ABI16_0_0NativeModule.h>

namespace facebook {
namespace ReactABI16_0_0 {

class ABI16_0_0RCTNativeModule : public NativeModule {
 public:
  ABI16_0_0RCTNativeModule(ABI16_0_0RCTBridge *bridge, ABI16_0_0RCTModuleData *moduleData);

  std::string getName() override;
  std::vector<MethodDescriptor> getMethods() override;
  folly::dynamic getConstants() override;
  bool supportsWebWorkers() override;
  void invoke(ExecutorToken token, unsigned int methodId, folly::dynamic &&params) override;
  MethodCallResult callSerializableNativeHook(ExecutorToken token, unsigned int ReactABI16_0_0MethodId,
                                              folly::dynamic &&params) override;

 private:
  __weak ABI16_0_0RCTBridge *m_bridge;
  ABI16_0_0RCTModuleData *m_moduleData;
};

}
}
