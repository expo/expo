// Copyright 2015-present 650 Industries. All rights reserved.

#if __has_include(<EXFacebook/EXFacebook.h>)
#import <Foundation/Foundation.h>
#import <EXFacebook/EXFacebook.h>
#import <UMCore/UMAppLifecycleListener.h>
#import <EXUpdates/EXUpdatesRawManifest.h>

@interface EXScopedFacebook : EXFacebook <UMAppLifecycleListener>

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(EXUpdatesRawManifest *)manifest;

@end
#endif
