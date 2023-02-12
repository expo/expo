// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI47_0_0EXFacebook/ABI47_0_0EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <ABI47_0_0EXFacebook/ABI47_0_0EXFacebook.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXAppLifecycleListener.h>
#import <ABI47_0_0EXManifests/ABI47_0_0EXManifestsManifest.h>

@interface ABI47_0_0EXScopedFacebook : ABI47_0_0EXFacebook <ABI47_0_0EXAppLifecycleListener>

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(ABI47_0_0EXManifestsManifest *)manifest;

@end
#endif
