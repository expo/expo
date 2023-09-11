/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <memory>

#import <Foundation/Foundation.h>

#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>
#import <ABI48_0_0React/ABI48_0_0RCTModuleMethod.h>
#import <ABI48_0_0ReactCommon/ABI48_0_0CallInvoker.h>
#import <ABI48_0_0ReactCommon/ABI48_0_0TurboModule.h>
#import <string>
#import <unordered_map>

#define ABI48_0_0RCT_IS_TURBO_MODULE_CLASS(klass) \
  ((ABI48_0_0RCTTurboModuleEnabled() && [(klass) conformsToProtocol:@protocol(ABI48_0_0RCTTurboModule)]))
#define ABI48_0_0RCT_IS_TURBO_MODULE_INSTANCE(module) ABI48_0_0RCT_IS_TURBO_MODULE_CLASS([(module) class])

namespace ABI48_0_0facebook {
namespace ABI48_0_0React {

class CallbackWrapper;
class Instance;

typedef std::weak_ptr<CallbackWrapper> (
    ^ABI48_0_0RCTRetainJSCallback)(jsi::Function &&callback, jsi::Runtime &runtime, std::shared_ptr<CallInvoker> jsInvoker);

/**
 * ObjC++ specific TurboModule base class.
 */
class JSI_EXPORT ObjCTurboModule : public TurboModule {
 public:
  // TODO(T65603471): Should we unify this with a Fabric abstraction?
  struct InitParams {
    std::string moduleName;
    id<ABI48_0_0RCTTurboModule> instance;
    std::shared_ptr<CallInvoker> jsInvoker;
    std::shared_ptr<CallInvoker> nativeInvoker;
    bool isSyncModule;
    ABI48_0_0RCTRetainJSCallback retainJSCallback;
  };

  ObjCTurboModule(const InitParams &params);

  jsi::Value invokeObjCMethod(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind valueKind,
      const std::string &methodName,
      SEL selector,
      const jsi::Value *args,
      size_t count);

  id<ABI48_0_0RCTTurboModule> instance_;
  std::shared_ptr<CallInvoker> nativeInvoker_;

 protected:
  void setMethodArgConversionSelector(NSString *methodName, int argIndex, NSString *fnName);

 private:
  // Does the NativeModule dispatch async methods to the JS thread?
  const bool isSyncModule_;

  ABI48_0_0RCTRetainJSCallback retainJSCallback_;

  /**
   * TODO(ramanpreet):
   * Investigate an optimization that'll let us get rid of this NSMutableDictionary.
   */
  NSMutableDictionary<NSString *, NSMutableArray *> *methodArgConversionSelectors_;
  NSDictionary<NSString *, NSArray<NSString *> *> *methodArgumentTypeNames_;

  bool isMethodSync(TurboModuleMethodValueKind returnType);
  BOOL hasMethodArgConversionSelector(NSString *methodName, int argIndex);
  SEL getMethodArgConversionSelector(NSString *methodName, int argIndex);
  NSString *getArgumentTypeName(NSString *methodName, int argIndex);
  NSInvocation *getMethodInvocation(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind returnType,
      const char *methodName,
      SEL selector,
      const jsi::Value *args,
      size_t count,
      NSMutableArray *retainedObjectsForInvocation);
  jsi::Value performMethodInvocation(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind returnType,
      const char *methodName,
      NSInvocation *inv,
      NSMutableArray *retainedObjectsForInvocation);

  using PromiseInvocationBlock = void (^)(ABI48_0_0RCTPromiseResolveBlock resolveWrapper, ABI48_0_0RCTPromiseRejectBlock rejectWrapper);
  jsi::Value createPromise(jsi::Runtime &runtime, std::string methodName, PromiseInvocationBlock invoke);
};

} // namespace ABI48_0_0React
} // namespace ABI48_0_0facebook

@protocol ABI48_0_0RCTTurboModule <NSObject>
- (std::shared_ptr<ABI48_0_0facebook::ABI48_0_0React::TurboModule>)getTurboModule:
    (const ABI48_0_0facebook::ABI48_0_0React::ObjCTurboModule::InitParams &)params;
@end

/**
 * These methods are all implemented by ABI48_0_0RCTCxxBridge, which subclasses ABI48_0_0RCTBridge. Hence, they must only be used in
 * contexts where the concrete class of an ABI48_0_0RCTBridge instance is ABI48_0_0RCTCxxBridge. This happens, for example, when
 * [ABI48_0_0RCTCxxBridgeDelegate jsExecutorFactoryForBridge:(ABI48_0_0RCTBridge *)] is invoked by ABI48_0_0RCTCxxBridge.
 *
 * TODO: Consolidate this extension with the one in ABI48_0_0RCTSurfacePresenter.
 */
@interface ABI48_0_0RCTBridge (ABI48_0_0RCTTurboModule)
- (std::shared_ptr<ABI48_0_0facebook::ABI48_0_0React::CallInvoker>)jsCallInvoker;
- (std::shared_ptr<ABI48_0_0facebook::ABI48_0_0React::CallInvoker>)decorateNativeCallInvoker:
    (std::shared_ptr<ABI48_0_0facebook::ABI48_0_0React::CallInvoker>)nativeInvoker;
@end
