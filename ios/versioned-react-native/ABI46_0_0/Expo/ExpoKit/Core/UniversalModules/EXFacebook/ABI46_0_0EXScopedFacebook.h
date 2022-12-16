// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI46_0_0EXFacebook/ABI46_0_0EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <ABI46_0_0EXFacebook/ABI46_0_0EXFacebook.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXAppLifecycleListener.h>
#import <ABI46_0_0EXManifests/ABI46_0_0EXManifestsManifest.h>

@interface ABI46_0_0EXScopedFacebook : ABI46_0_0EXFacebook <ABI46_0_0EXAppLifecycleListener>

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(ABI46_0_0EXManifestsManifest *)manifest;

@end
#endif
