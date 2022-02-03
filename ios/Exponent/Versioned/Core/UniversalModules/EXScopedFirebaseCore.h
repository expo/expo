// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<EXFirebaseCore/EXFirebaseCore.h>)
#import <UIKit/UIKit.h>
#import <EXFirebaseCore/EXFirebaseCore.h>
#import <EXManifests/EXManifestsManifest.h>
#import "EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXScopedFirebaseCore : EXFirebaseCore

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(EXManifestsManifest *)manifest constantsBinding:(EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
