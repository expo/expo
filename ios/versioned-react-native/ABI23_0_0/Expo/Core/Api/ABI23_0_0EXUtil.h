// Copyright 2016-present 650 Industries. All rights reserved.

#import "ABI23_0_0EXScopedBridgeModule.h"
#import "ABI23_0_0EXScopedModuleRegistry.h"

@protocol ABI23_0_0EXUtilScopedModuleDelegate

- (void)updatesModuleDidSelectReload:(id)scopedUpdatesModule;

@end

@interface ABI23_0_0EXUtil : ABI23_0_0EXScopedBridgeModule

+ (NSString *)escapedResourceName:(NSString *)name;
- (UIViewController *)currentViewController;

@end

@protocol ABI23_0_0EXUtilService

- (UIViewController *)currentViewController;

@end

ABI23_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI23_0_0EXUtil, util)
