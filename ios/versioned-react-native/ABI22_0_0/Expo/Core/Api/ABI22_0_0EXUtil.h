// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI22_0_0EXScopedBridgeModule.h"
#import "ABI22_0_0EXScopedModuleRegistry.h"

@protocol ABI22_0_0EXUtilScopedModuleDelegate

- (void)updatesModuleDidSelectReload:(id)scopedUpdatesModule;

@end

@interface ABI22_0_0EXUtil : ABI22_0_0EXScopedBridgeModule

+ (NSString *)escapedResourceName:(NSString *)name;
- (UIViewController *)currentViewController;

@end

@protocol ABI22_0_0EXUtilService

- (UIViewController *)currentViewController;

@end

ABI22_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI22_0_0EXUtil, util)
