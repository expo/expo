// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI48_0_0EXFacebook/ABI48_0_0EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <ABI48_0_0EXFacebook/ABI48_0_0EXFacebook.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXAppLifecycleListener.h>
#import <ABI48_0_0EXManifests/ABI48_0_0EXManifestsManifest.h>

@interface ABI48_0_0EXScopedFacebook : ABI48_0_0EXFacebook <ABI48_0_0EXAppLifecycleListener>

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(ABI48_0_0EXManifestsManifest *)manifest;

@end
#endif
