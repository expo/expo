// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXScopedBridgeModule.h"
#import "ABI21_0_0EXScopedModuleRegistry.h"

@protocol ABI21_0_0EXUtilScopedModuleDelegate

- (void)updatesModuleDidSelectReload:(id)scopedUpdatesModule;

@end

@interface ABI21_0_0EXUtil : ABI21_0_0EXScopedBridgeModule

+ (NSString *)escapedResourceName:(NSString *)name;
- (UIViewController *)currentViewController;

@end

@protocol ABI21_0_0EXUtilService

- (UIViewController *)currentViewController;

@end

ABI21_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI21_0_0EXUtil, util)
