// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXConstants.h"
#import "EXKernel.h"
#import "EXDisabledDevMenu.h"
#import "EXDisabledRedBox.h"
#import "EXKernelModule.h"
#import "EXKernelModuleProvider.h"
#import "EXLinkingManager.h"

NSArray<id<RCTBridgeModule>> *(^EXKernelModuleProvider)(NSDictionary *) = ^NSArray<id<RCTBridgeModule>> *(NSDictionary *launchOptions) {
  // Keep these in sync with EXVersionManager::extraModulesWithParams: as needed
  EXDisabledDevMenu *disabledDevMenu = [[EXDisabledDevMenu alloc] init];
  EXKernelModule *kernel = [[EXKernelModule alloc] init];
  kernel.delegate = [EXKernel sharedInstance];
  EXLinkingManager *linkingManager = [[EXLinkingManager alloc] initWithInitialUrl:[EXKernel initialUrlFromLaunchOptions:launchOptions]];
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