// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>

@interface ABI40_0_0EXFontLoader : ABI40_0_0UMExportedModule <ABI40_0_0UMModuleRegistryConsumer>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix;

@end
