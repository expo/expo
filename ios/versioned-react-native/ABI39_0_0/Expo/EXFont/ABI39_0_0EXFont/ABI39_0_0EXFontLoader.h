// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>

@interface ABI39_0_0EXFontLoader : ABI39_0_0UMExportedModule <ABI39_0_0UMModuleRegistryConsumer>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix;

@end
