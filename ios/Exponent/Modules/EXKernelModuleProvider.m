// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXConstants.h"
#import "EXKernel.h"
#import "EXDisabledDevMenu.h"
#import "EXDisabledRedBox.h"
#import "EXKernelModule.h"
#import "EXKernelModuleProvider.h"
#import "EXLinkingManager.h"

NSString * const kEXKernelLaunchUrlDefaultsKey = @"EXKernelLaunchUrlDefaultsKey";

NSArray<id<RCTBridgeModule>> *(^EXKernelModuleProvider)(NSDictionary *) = ^NSArray<id<RCTBridgeModule>> *(NSDictionary *launchOptions) {
  NSURL *initialKernelUrl;

  // used by appetize - override the kernel initial url if there's something in NSUserDefaults
  NSString *kernelInitialUrlDefaultsValue = [[NSUserDefaults standardUserDefaults] stringForKey:kEXKernelLaunchUrlDefaultsKey];
  if (kernelInitialUrlDefaultsValue) {
    initialKernelUrl = [NSURL URLWithString:kernelInitialUrlDefaultsValue];
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:kEXKernelLaunchUrlDefaultsKey];
    [[NSUserDefaults standardUserDefaults] synchronize];
  } else {
    initialKernelUrl = [EXKernel initialUrlFromLaunchOptions:launchOptions];
  }

  // Keep these in sync with EXVersionManager::extraModulesWithParams: as needed
  EXDisabledDevMenu *disabledDevMenu = [[EXDisabledDevMenu alloc] init];
  EXKernelModule *kernel = [[EXKernelModule alloc] init];
  kernel.delegate = [EXKernel sharedInstance];
  EXLinkingManager *linkingManager = [[EXLinkingManager alloc] initWithInitialUrl:initialKernelUrl];
  EXConstants *constants = [[EXConstants alloc] initWithProperties:@{ @"deviceId": [EXKernel deviceInstallUUID] }];
  
  NSMutableArray *modules = [@[disabledDevMenu, kernel, linkingManager, constants] mutableCopy];
  
#if DEBUG
  // enable redbox only for debug builds
#else
  EXDisabledRedBox *disabledRedBox = [[EXDisabledRedBox alloc] init];
  [modules addObject:disabledRedBox];
#endif
  
  return modules;
};