// Copyright 2019-present 650 Industries. All rights reserved.

#ifdef RN_TURBO_MODULE_ENABLED

#import <UMReactNativeAdapter/UMNativeModulesProxySpec.h>

namespace facebook {
  namespace react {

    static facebook::jsi::Value __hostFunction_UMNativeModulesProxySpecJSI_callMethod(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule &>(turboModule)
      .invokeObjCMethod(
                        rt, PromiseKind, "callMethod", @selector(callMethod:methodNameOrKey:arguments:resolver:rejecter:), args, count);
    }

    static facebook::jsi::Value __hostFunction_UMNativeModulesProxySpecJSI_getConstants(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule &>(turboModule).invokeObjCMethod(rt, ObjectKind, "getConstants", @selector(getConstants), args, count);
    }

    UMNativeModulesProxySpecJSI::UMNativeModulesProxySpecJSI(id<RCTTurboModule> instance, std::shared_ptr<JSCallInvoker> jsInvoker)
    : ObjCTurboModule("NativeUnimoduleProxy", instance, jsInvoker) {
      methodMap_["callMethod"] = MethodMetadata {3, __hostFunction_UMNativeModulesProxySpecJSI_callMethod};
      methodMap_["getConstants"] = MethodMetadata {0, __hostFunction_UMNativeModulesProxySpecJSI_getConstants};
    }

  } // namespace react
} // namespace facebook

#endif
