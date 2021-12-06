// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI44_0_0EXFacebook/ABI44_0_0EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <ABI44_0_0EXFacebook/ABI44_0_0EXFacebook.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXAppLifecycleListener.h>
#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsManifest.h>

@interface ABI44_0_0EXScopedFacebook : ABI44_0_0EXFacebook <ABI44_0_0EXAppLifecycleListener>

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(ABI44_0_0EXManifestsManifest *)manifest;

@end
#endif
