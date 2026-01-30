//// Copyright 2025-present 650 Industries. All rights reserved.
//
//#import <ExpoModulesCore/EXWorkletRuntime.h>
//
//@implementation EXWorkletRuntime {
//#if WORKLETS_ENABLED
//  std::weak_ptr<worklets::WorkletRuntime> _workletRuntime;
//#endif
//}
//
//#if WORKLETS_ENABLED
//
//- (nonnull instancetype)initWithWorkletRuntime:(std::shared_ptr<worklets::WorkletRuntime> &)workletRuntime
//                                   callInvoker:(std::shared_ptr<react::CallInvoker>)callInvoker
//{
//  if (self = [super initWithRuntime:workletRuntime->getJSIRuntime() callInvoker:callInvoker]) {
//    _workletRuntime = workletRuntime;
//  }
//
//  return self;
//}
//
//- (std::shared_ptr<worklets::WorkletRuntime>)getWorkletRuntime
//{
//  return _workletRuntime.lock();
//}
//
//#endif
//
//@end
