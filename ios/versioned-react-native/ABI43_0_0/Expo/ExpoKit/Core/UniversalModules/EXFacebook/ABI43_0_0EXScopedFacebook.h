// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI43_0_0EXFacebook/ABI43_0_0EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <ABI43_0_0EXFacebook/ABI43_0_0EXFacebook.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXAppLifecycleListener.h>
#import <ABI43_0_0EXManifests/ABI43_0_0EXManifestsManifest.h>

@interface ABI43_0_0EXScopedFacebook : ABI43_0_0EXFacebook <ABI43_0_0EXAppLifecycleListener>

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(ABI43_0_0EXManifestsManifest *)manifest;

@end
#endif
