// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/BridgelessJSCallInvoker.h>
#import <ExpoModulesCore/EXAppContextProtocol.h>
#import <ExpoModulesCore/EXJSIInstaller.h>

#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>

namespace jsi = facebook::jsi;

/**
 Property name used to define the modules host object in the main object of the
 Expo JS runtime.
 */
static NSString *modulesHostObjectPropertyName = @"modules";

@implementation EXJavaScriptRuntimeManager {
  std::shared_ptr<jsi::Runtime> _runtime;
}

- (nonnull instancetype)initWithRuntime:(nonnull void *)runtime
{
  if (self = [super init]) {
    // Make shared pointer that points to the runtime but doesn't own it, thus doesn't release it.
    _runtime = std::shared_ptr<jsi::Runtime>(std::shared_ptr<jsi::Runtime>(), reinterpret_cast<jsi::Runtime *>(runtime));
  }
  return self;
}

@end
