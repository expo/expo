// Copyright 2018-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <jsi/jsi.h>
#import <ReactCommon/RCTTurboModule.h>

#import <ExpoModulesCore/EXNativeModulesProxy.h>

using namespace facebook;
using namespace react;

namespace expo {

class JSI_EXPORT ExpoModulesProxySpec : public TurboModule {
public:
  ExpoModulesProxySpec(std::shared_ptr<CallInvoker> callInvoker, EXNativeModulesProxy *nativeModulesProxy);

  EXNativeModulesProxy *nativeModulesProxy;
};

} // namespace expo

#endif
