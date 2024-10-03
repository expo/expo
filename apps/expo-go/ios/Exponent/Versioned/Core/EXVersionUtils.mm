// Copyright 2023-present 650 Industries. All rights reserved.

#import <React/RCTUIManager.h>
#import <React/JSCExecutorFactory.h>
#import <React/RCTJSIExecutorRuntimeInstaller.h>
#import <reacthermes/HermesExecutorFactory.h>

#import "EXVersionUtils.h"

namespace react = facebook::react;

@implementation EXVersionUtils

+ (nonnull void *)versionedJsExecutorFactoryForBridge:(nonnull RCTBridge *)bridge
                                               engine:(nonnull NSString *)jsEngine
{
  [bridge moduleForClass:[RCTUIManager class]];

  if ([jsEngine isEqualToString:@"hermes"]) {
    return new react::HermesExecutorFactory(react::RCTJSIExecutorRuntimeInstaller(nullptr));
  }
  return new react::JSCExecutorFactory(react::RCTJSIExecutorRuntimeInstaller(nullptr));
}

@end
