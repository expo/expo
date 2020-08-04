// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>

@interface ABI37_0_0EXFontLoader : ABI37_0_0UMExportedModule <ABI37_0_0UMModuleRegistryConsumer>

- (instancetype)initWithFontFamilyPrefix:(NSString *)prefix;

@end
