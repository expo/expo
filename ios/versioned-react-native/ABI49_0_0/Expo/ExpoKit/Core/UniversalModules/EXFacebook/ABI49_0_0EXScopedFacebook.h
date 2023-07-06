// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<ABI49_0_0EXFacebook/ABI49_0_0EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <ABI49_0_0EXFacebook/ABI49_0_0EXFacebook.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXAppLifecycleListener.h>

@class ABI49_0_0EXManifestsManifest;

@interface ABI49_0_0EXScopedFacebook : ABI49_0_0EXFacebook <ABI49_0_0EXAppLifecycleListener>

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(ABI49_0_0EXManifestsManifest *)manifest;

@end
#endif
