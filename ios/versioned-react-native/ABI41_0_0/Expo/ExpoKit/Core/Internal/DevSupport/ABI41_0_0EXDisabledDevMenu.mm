// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI41_0_0EXDisabledDevMenu.h"

@implementation ABI41_0_0EXDisabledDevMenu

+ (NSString *)moduleName { return @"ABI41_0_0RCTDevMenu"; }

ABI41_0_0RCT_NOT_IMPLEMENTED(- (void)show)
ABI41_0_0RCT_NOT_IMPLEMENTED(- (void)reload)

// Stub out methods that are called but don't need to do anything
- (void)addItem:(NSString *)title handler:(dispatch_block_t)handler {}
- (void)addItem:(ABI41_0_0RCTDevMenuItem *)item {}

@end
