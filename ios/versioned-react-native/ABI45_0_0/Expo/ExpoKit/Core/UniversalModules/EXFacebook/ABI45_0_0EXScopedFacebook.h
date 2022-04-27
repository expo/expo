// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI45_0_0EXFacebook/ABI45_0_0EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <ABI45_0_0EXFacebook/ABI45_0_0EXFacebook.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXAppLifecycleListener.h>
#import <ABI45_0_0EXManifests/ABI45_0_0EXManifestsManifest.h>

@interface ABI45_0_0EXScopedFacebook : ABI45_0_0EXFacebook <ABI45_0_0EXAppLifecycleListener>

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(ABI45_0_0EXManifestsManifest *)manifest;

@end
#endif
