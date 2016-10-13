// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel.h"
#import "EXKernelModule.h"
#import "EXKernelModuleProvider.h"
#import "EXVersions.h"

NSArray<id<RCTBridgeModule>> *(^EXKernelModuleProvider)(void) = ^NSArray<id<RCTBridgeModule>> * {
  // Keep these in sync with EXVersionManager::versionedModulesForKernelWithParams: as needed
  EXKernelModule *kernel = [[EXKernelModule alloc] initWithVersions:[EXVersions sharedInstance].versions[@"sdkVersions"]];
  kernel.delegate = [EXKernel sharedInstance];
  
  return @[kernel];
};
