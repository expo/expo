//// Copyright 2025-present 650 Industries. All rights reserved.
//
//#import <ExpoModulesCore/WorkletExecutor.h>
//
//#if WORKLETS_ENABLED
//
//#import "EXJavaScriptSerializable+Private.h"
//#import <ExpoModulesJSI/EXJSIConversions.h>
//#import <worklets/WorkletRuntime/WorkletRuntime.h>
//
//@implementation EXWorkletExecutor
//
//+ (void)schedule:(nonnull EXJavaScriptSerializable *)serializable
//         runtime:(nonnull EXWorkletRuntime *)runtime
//{
//  auto workletRuntime = [runtime getWorkletRuntime];
//  if (!workletRuntime) {
//    return;
//  }
//
//  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>([serializable getSerializable]);
//  if (!worklet) {
//    return;
//  }
//
//  workletRuntime->schedule(worklet);
//}
//
//+ (void)execute:(nonnull EXJavaScriptSerializable *)serializable
//        runtime:(nonnull EXWorkletRuntime *)runtime
//{
//  auto workletRuntime = [runtime getWorkletRuntime];
//  if (!workletRuntime) {
//    return;
//  }
//
//  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>([serializable getSerializable]);
//  if (!worklet) {
//    return;
//  }
//
//  workletRuntime->runSync(worklet);
//}
//
//+ (void)schedule:(nonnull EXJavaScriptSerializable *)serializable
//         runtime:(nonnull EXWorkletRuntime *)runtime
//       arguments:(nonnull NSArray *)arguments
//{
//  auto workletRuntime = [runtime getWorkletRuntime];
//  if (!workletRuntime) {
//    return;
//  }
//
//  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>([serializable getSerializable]);
//  if (!worklet) {
//    return;
//  }
//
//  workletRuntime->schedule([worklet, arguments](jsi::Runtime &rt) {
//    std::vector<jsi::Value> convertedArgs = expo::convertNSArrayToStdVector(rt, arguments);
//
//    auto func = worklet->toJSValue(rt).asObject(rt).asFunction(rt);
//    func.call(
//      rt,
//      (const jsi::Value *)convertedArgs.data(),
//      convertedArgs.size()
//    );
//  });
//}
//
//+ (void)execute:(nonnull EXJavaScriptSerializable *)serializable
//        runtime:(nonnull EXWorkletRuntime *)runtime
//      arguments:(nonnull NSArray *)arguments
//{
//  auto workletRuntime = [runtime getWorkletRuntime];
//  if (!workletRuntime) {
//    return;
//  }
//
//  auto worklet = std::dynamic_pointer_cast<worklets::SerializableWorklet>([serializable getSerializable]);
//  if (!worklet) {
//    return;
//  }
//
//  workletRuntime->executeSync([worklet, arguments](jsi::Runtime &rt) -> jsi::Value {
//    std::vector<jsi::Value> convertedArgs = expo::convertNSArrayToStdVector(rt, arguments);
//
//    auto func = worklet->toJSValue(rt).asObject(rt).asFunction(rt);
//    func.call(
//      rt,
//      (const jsi::Value *)convertedArgs.data(),
//      convertedArgs.size()
//    );
//    return jsi::Value::undefined();
//  });
//}
//
//@end
//
//#else
//
//#import <ExpoModulesCore/EXJavaScriptSerializable.h>
//
//@implementation EXWorkletExecutor
//
//+ (void)schedule:(nonnull EXJavaScriptSerializable *)serializable
//         runtime:(nonnull EXWorkletRuntime *)runtime
//{
//  @throw [NSException exceptionWithName:@"WorkletException"
//                                 reason:@"Worklets integration is disabled"
//                               userInfo:nil];
//}
//
//+ (void)execute:(nonnull EXJavaScriptSerializable *)serializable
//        runtime:(nonnull EXWorkletRuntime *)runtime
//{
//  @throw [NSException exceptionWithName:@"WorkletException"
//                                 reason:@"Worklets integration is disabled"
//                               userInfo:nil];
//}
//
//+ (void)schedule:(nonnull EXJavaScriptSerializable *)serializable
//         runtime:(nonnull EXWorkletRuntime *)runtime
//       arguments:(nonnull NSArray *)arguments
//{
//  @throw [NSException exceptionWithName:@"WorkletException"
//                                 reason:@"Worklets integration is disabled"
//                               userInfo:nil];
//}
//
//+ (void)execute:(nonnull EXJavaScriptSerializable *)serializable
//        runtime:(nonnull EXWorkletRuntime *)runtime
//      arguments:(nonnull NSArray *)arguments
//{
//  @throw [NSException exceptionWithName:@"WorkletException"
//                                 reason:@"Worklets integration is disabled"
//                               userInfo:nil];
//}
//
//@end
//
//#endif
