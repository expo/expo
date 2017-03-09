/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI15_0_0/ABI15_0_0RCTModuleData.h>
#import <cxxReactABI15_0_0/ABI15_0_0NativeModule.h>

namespace facebook {
namespace ReactABI15_0_0 {

class ABI15_0_0RCTNativeModule : public NativeModule {
 public:
  ABI15_0_0RCTNativeModule(ABI15_0_0RCTBridge *bridge, ABI15_0_0RCTModuleData *moduleData);

  std::string getName() override;
  std::vector<MethodDescriptor> getMethods() override;
  folly::dynamic getConstants() override;
  bool supportsWebWorkers() override;
  void invoke(ExecutorToken token, unsigned int methodId, folly::dynamic &&params) override;
  MethodCallResult callSerializableNativeHook(ExecutorToken token, unsigned int ReactABI15_0_0MethodId,
                                              folly::dynamic &&params) override;

 private:
  __weak ABI15_0_0RCTBridge *m_bridge;
  ABI15_0_0RCTModuleData *m_moduleData;
};

}
}
