// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI24_0_0EXScopedBridgeModule.h"
#import "ABI24_0_0EXScopedModuleRegistry.h"

@protocol ABI24_0_0EXUtilScopedModuleDelegate

- (void)updatesModuleDidSelectReload:(id)scopedUpdatesModule;

@end

@interface ABI24_0_0EXUtil : ABI24_0_0EXScopedBridgeModule

+ (NSString *)escapedResourceName:(NSString *)name;
- (UIViewController *)currentViewController;

@end

@protocol ABI24_0_0EXUtilService

- (UIViewController *)currentViewController;

@end

ABI24_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI24_0_0EXUtil, util)
