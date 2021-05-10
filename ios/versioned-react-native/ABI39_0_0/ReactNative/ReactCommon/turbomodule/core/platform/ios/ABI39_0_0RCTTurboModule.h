/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <memory>

#import <Foundation/Foundation.h>

#import <ABI39_0_0React/ABI39_0_0RCTBridge.h>
#import <ABI39_0_0React/ABI39_0_0RCTBridgeModule.h>
#import <ABI39_0_0React/ABI39_0_0RCTModuleMethod.h>
#import <ABI39_0_0ReactCommon/ABI39_0_0CallInvoker.h>
#import <ABI39_0_0ReactCommon/ABI39_0_0TurboModule.h>
#import <ABI39_0_0ReactCommon/ABI39_0_0TurboModuleUtils.h>
#import <string>
#import <unordered_map>

#define ABI39_0_0RCT_IS_TURBO_MODULE_CLASS(klass) \
  ((ABI39_0_0RCTTurboModuleEnabled() && [(klass) conformsToProtocol:@protocol(ABI39_0_0RCTTurboModule)]))
#define ABI39_0_0RCT_IS_TURBO_MODULE_INSTANCE(module) ABI39_0_0RCT_IS_TURBO_MODULE_CLASS([(module) class])

typedef int MethodCallId;

/**
 * This interface exists to allow the application to collect performance
 * metrics of the TurboModule system. By implementing each function, you can
 * hook into various stages of TurboModule creation and method dispatch (both async and sync).
 *
 * Note:
 *  - TurboModule async method invocations can interleave, so methodCallId should be used as a unique id for a method
 *    call.
 */
@protocol ABI39_0_0RCTTurboModulePerformanceLogger
// Create TurboModule JS Object
- (void)createTurboModuleStart:(const char *)moduleName;
- (void)createTurboModuleEnd:(const char *)moduleName;
- (void)createTurboModuleCacheHit:(const char *)moduleName;
- (void)getCppTurboModuleFromTMMDelegateStart:(const char *)moduleName;
- (void)getCppTurboModuleFromTMMDelegateEnd:(const char *)moduleName;
- (void)getTurboModuleFromABI39_0_0RCTTurboModuleStart:(const char *)moduleName;
- (void)getTurboModuleFromABI39_0_0RCTTurboModuleEnd:(const char *)moduleName;
- (void)getTurboModuleFromABI39_0_0RCTCxxModuleStart:(const char *)moduleName;
- (void)getTurboModuleFromABI39_0_0RCTCxxModuleEnd:(const char *)moduleName;
- (void)getTurboModuleFromTMMDelegateStart:(const char *)moduleName;
- (void)getTurboModuleFromTMMDelegateEnd:(const char *)moduleName;

// Create ABI39_0_0RCTTurboModule object
- (void)createABI39_0_0RCTTurboModuleStart:(const char *)moduleName;
- (void)createABI39_0_0RCTTurboModuleEnd:(const char *)moduleName;
- (void)createABI39_0_0RCTTurboModuleCacheHit:(const char *)moduleName;
- (void)getABI39_0_0RCTTurboModuleClassStart:(const char *)moduleName;
- (void)getABI39_0_0RCTTurboModuleClassEnd:(const char *)moduleName;
- (void)getABI39_0_0RCTTurboModuleInstanceStart:(const char *)moduleName;
- (void)getABI39_0_0RCTTurboModuleInstanceEnd:(const char *)moduleName;
- (void)setupABI39_0_0RCTTurboModuleDispatch:(const char *)moduleName;
- (void)setupABI39_0_0RCTTurboModuleStart:(const char *)moduleName;
- (void)setupABI39_0_0RCTTurboModuleEnd:(const char *)moduleName;
- (void)attachABI39_0_0RCTBridgeToABI39_0_0RCTTurboModuleStart:(const char *)moduleName;
- (void)attachABI39_0_0RCTBridgeToABI39_0_0RCTTurboModuleEnd:(const char *)moduleName;
- (void)attachMethodQueueToABI39_0_0RCTTurboModuleStart:(const char *)moduleName;
- (void)attachMethodQueueToABI39_0_0RCTTurboModuleEnd:(const char *)moduleName;
- (void)registerABI39_0_0RCTTurboModuleForFrameUpdatesStart:(const char *)moduleName;
- (void)registerABI39_0_0RCTTurboModuleForFrameUpdatesEnd:(const char *)moduleName;
- (void)dispatchDidInitializeModuleNotificationForABI39_0_0RCTTurboModuleStart:(const char *)moduleName;
- (void)dispatchDidInitializeModuleNotificationForABI39_0_0RCTTurboModuleEnd:(const char *)moduleName;

// Sync method invocation
- (void)syncMethodCallStart:(const char *)moduleName
                 methodName:(const char *)methodName
               methodCallId:(MethodCallId)methodCallId;
- (void)syncMethodCallEnd:(const char *)moduleName
               methodName:(const char *)methodName
             methodCallId:(MethodCallId)methodCallId;
- (void)syncMethodCallArgumentConversionStart:(const char *)moduleName
                                   methodName:(const char *)methodName
                                 methodCallId:(MethodCallId)methodCallId;
- (void)syncMethodCallArgumentConversionEnd:(const char *)moduleName
                                 methodName:(const char *)methodName
                               methodCallId:(MethodCallId)methodCallId;
- (void)syncABI39_0_0RCTTurboModuleMethodCallStart:(const char *)moduleName
                               methodName:(const char *)methodName
                             methodCallId:(MethodCallId)methodCallId;
- (void)syncABI39_0_0RCTTurboModuleMethodCallEnd:(const char *)moduleName
                             methodName:(const char *)methodName
                           methodCallId:(MethodCallId)methodCallId;
- (void)syncMethodCallReturnConversionStart:(const char *)moduleName
                                 methodName:(const char *)methodName
                               methodCallId:(MethodCallId)methodCallId;
- (void)syncMethodCallReturnConversionEnd:(const char *)moduleName
                               methodName:(const char *)methodName
                             methodCallId:(MethodCallId)methodCallId;

// Async method invocation
- (void)asyncMethodCallStart:(const char *)moduleName
                  methodName:(const char *)methodName
                methodCallId:(MethodCallId)methodCallId;
- (void)asyncMethodCallEnd:(const char *)moduleName
                methodName:(const char *)methodName
              methodCallId:(MethodCallId)methodCallId;
- (void)asyncMethodCallArgumentConversionStart:(const char *)moduleName
                                    methodName:(const char *)methodName
                                  methodCallId:(MethodCallId)methodCallId;
- (void)asyncMethodCallArgumentConversionEnd:(const char *)moduleName
                                  methodName:(const char *)methodName
                                methodCallId:(MethodCallId)methodCallId;
- (void)asyncABI39_0_0RCTTurboModuleMethodCallDispatch:(const char *)moduleName
                                   methodName:(const char *)methodName
                                 methodCallId:(MethodCallId)methodCallId;
- (void)asyncABI39_0_0RCTTurboModuleMethodCallStart:(const char *)moduleName
                                methodName:(const char *)methodName
                              methodCallId:(MethodCallId)methodCallId;
- (void)asyncABI39_0_0RCTTurboModuleMethodCallEnd:(const char *)moduleName
                              methodName:(const char *)methodName
                            methodCallId:(MethodCallId)methodCallId;
@end

namespace ABI39_0_0facebook {
namespace ABI39_0_0React {

class Instance;

/**
 * ObjC++ specific TurboModule base class.
 */
class JSI_EXPORT ObjCTurboModule : public TurboModule {
 public:
  ObjCTurboModule(
      const std::string &name,
      id<ABI39_0_0RCTTurboModule> instance,
      std::shared_ptr<CallInvoker> jsInvoker,
      std::shared_ptr<CallInvoker> nativeInvoker,
      id<ABI39_0_0RCTTurboModulePerformanceLogger> perfLogger);

  jsi::Value invokeObjCMethod(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind valueKind,
      const std::string &methodName,
      SEL selector,
      const jsi::Value *args,
      size_t count);

  id<ABI39_0_0RCTTurboModule> instance_;
  std::shared_ptr<CallInvoker> nativeInvoker_;

 protected:
  void setMethodArgConversionSelector(NSString *methodName, int argIndex, NSString *fnName);

 private:
  /**
   * TODO(ramanpreet):
   * Investigate an optimization that'll let us get rid of this NSMutableDictionary.
   */
  NSMutableDictionary<NSString *, NSMutableArray *> *methodArgConversionSelectors_;
  NSDictionary<NSString *, NSArray<NSString *> *> *methodArgumentTypeNames_;
  NSString *getArgumentTypeName(NSString *methodName, int argIndex);
  id<ABI39_0_0RCTTurboModulePerformanceLogger> performanceLogger_;

  /**
   * Required for performance logging async method invocations.
   * This field is static because two nth async method calls from different
   * TurboModules can interleave, and should therefore be treated as two distinct calls.
   */
  static MethodCallId methodCallId_;

  static MethodCallId getNewMethodCallId();

  NSInvocation *getMethodInvocation(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind returnType,
      const char *methodName,
      SEL selector,
      const jsi::Value *args,
      size_t count,
      NSMutableArray *retainedObjectsForInvocation,
      MethodCallId methodCallId);
  jsi::Value performMethodInvocation(
      jsi::Runtime &runtime,
      TurboModuleMethodValueKind returnType,
      const char *methodName,
      NSInvocation *inv,
      NSMutableArray *retainedObjectsForInvocation,
      MethodCallId methodCallId);

  BOOL hasMethodArgConversionSelector(NSString *methodName, int argIndex);
  SEL getMethodArgConversionSelector(NSString *methodName, int argIndex);

  using PromiseInvocationBlock = void (^)(ABI39_0_0RCTPromiseResolveBlock resolveWrapper, ABI39_0_0RCTPromiseRejectBlock rejectWrapper);
  jsi::Value
  createPromise(jsi::Runtime &runtime, std::shared_ptr<ABI39_0_0React::CallInvoker> jsInvoker, PromiseInvocationBlock invoke);
};

} // namespace ABI39_0_0React
} // namespace ABI39_0_0facebook

@protocol ABI39_0_0RCTTurboModule <NSObject>
@optional
/**
 * Used by TurboModules to get access to other TurboModules.
 *
 * Usage:
 * Place `@synthesize turboModuleLookupDelegate = _turboModuleLookupDelegate`
 * in the @implementation section of your TurboModule.
 */
@property (nonatomic, weak) id<ABI39_0_0RCTTurboModuleLookupDelegate> turboModuleLookupDelegate;

@optional
// This should be required, after migration is done.
- (std::shared_ptr<ABI39_0_0facebook::ABI39_0_0React::TurboModule>)
    getTurboModuleWithJsInvoker:(std::shared_ptr<ABI39_0_0facebook::ABI39_0_0React::CallInvoker>)jsInvoker
                  nativeInvoker:(std::shared_ptr<ABI39_0_0facebook::ABI39_0_0React::CallInvoker>)nativeInvoker
                     perfLogger:(id<ABI39_0_0RCTTurboModulePerformanceLogger>)perfLogger;

@end

/**
 * These methods are all implemented by ABI39_0_0RCTCxxBridge, which subclasses ABI39_0_0RCTBridge. Hence, they must only be used in
 * contexts where the concrete class of an ABI39_0_0RCTBridge instance is ABI39_0_0RCTCxxBridge. This happens, for example, when
 * [ABI39_0_0RCTCxxBridgeDelegate jsExecutorFactoryForBridge:(ABI39_0_0RCTBridge *)] is invoked by ABI39_0_0RCTCxxBridge.
 *
 * TODO: Consolidate this extension with the one in ABI39_0_0RCTSurfacePresenter.
 */
@interface ABI39_0_0RCTBridge (ABI39_0_0RCTTurboModule)
- (std::shared_ptr<ABI39_0_0facebook::ABI39_0_0React::CallInvoker>)jsCallInvoker;
- (std::shared_ptr<ABI39_0_0facebook::ABI39_0_0React::CallInvoker>)decorateNativeCallInvoker:
    (std::shared_ptr<ABI39_0_0facebook::ABI39_0_0React::CallInvoker>)nativeInvoker;
@end
