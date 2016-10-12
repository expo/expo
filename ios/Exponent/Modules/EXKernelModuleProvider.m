// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXConstants.h"
#import "EXKernel.h"
#import "EXDisabledDevMenu.h"
#import "EXDisabledRedBox.h"
#import "EXKernelModule.h"
#import "EXKernelModuleProvider.h"
#import "EXLinkingManager.h"

NSArray<id<RCTBridgeModule>> *(^EXKernelModuleProvider)(void) = ^NSArray<id<RCTBridgeModule>> * {
  // Keep these in sync with EXVersionManager::extraModulesWithParams: as needed
  EXKernelModule *kernel = [[EXKernelModule alloc] init];
  kernel.delegate = [EXKernel sharedInstance];
  
  return @[kernel];
};
