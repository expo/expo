/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <ReactABI18_0_0/ABI18_0_0RCTModuleData.h>
#import <cxxReactABI18_0_0/ABI18_0_0NativeModule.h>

namespace facebook {
namespace ReactABI18_0_0 {

class ABI18_0_0RCTNativeModule : public NativeModule {
 public:
  ABI18_0_0RCTNativeModule(ABI18_0_0RCTBridge *bridge, ABI18_0_0RCTModuleData *moduleData);

  std::string getName() override;
  std::vector<MethodDescriptor> getMethods() override;
  folly::dynamic getConstants() override;
  void invoke(unsigned int methodId, folly::dynamic &&params) override;
  MethodCallResult callSerializableNativeHook(unsigned int ReactABI18_0_0MethodId, folly::dynamic &&params) override;

 private:
  __weak ABI18_0_0RCTBridge *m_bridge;
  ABI18_0_0RCTModuleData *m_moduleData;
  MethodCallResult invokeInner(unsigned int methodId, const folly::dynamic &&params);
};

}
}
