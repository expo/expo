// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI41_0_0EXFacebook/ABI41_0_0EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <ABI41_0_0EXFacebook/ABI41_0_0EXFacebook.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMAppLifecycleListener.h>
#import <ABI41_0_0EXManifests/ABI41_0_0EXManifestsManifest.h>

@interface ABI41_0_0EXScopedFacebook : ABI41_0_0EXFacebook <ABI41_0_0UMAppLifecycleListener>

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(ABI41_0_0EXManifestsManifest *)manifest;

@end
#endif
