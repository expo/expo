// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI40_0_0EXFacebook/ABI40_0_0EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <ABI40_0_0EXFacebook/ABI40_0_0EXFacebook.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMAppLifecycleListener.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>
#import <ABI40_0_0EXRawManifests/ABI40_0_0EXRawManifestsRawManifest.h>

@interface ABI40_0_0EXScopedFacebook : ABI40_0_0EXFacebook <ABI40_0_0UMAppLifecycleListener, ABI40_0_0UMModuleRegistryConsumer>

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(ABI40_0_0EXRawManifestsRawManifest *)manifest;

@end
#endif
