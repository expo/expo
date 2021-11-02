// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<EXFacebook/EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <EXFacebook/EXFacebook.h>
#import <ExpoModulesCore/EXAppLifecycleListener.h>
#import <EXManifests/EXManifestsManifest.h>

@interface EXScopedFacebook : EXFacebook <EXAppLifecycleListener>

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(EXManifestsManifest *)manifest;

@end
#endif
