// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI44_0_0EXFirebaseCore/ABI44_0_0EXFirebaseCore.h>)
#import <UIKit/UIKit.h>
#import <ABI44_0_0EXFirebaseCore/ABI44_0_0EXFirebaseCore.h>
#import <ABI44_0_0EXManifests/ABI44_0_0EXManifestsManifest.h>
#import "ABI44_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXScopedFirebaseCore : ABI44_0_0EXFirebaseCore

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(ABI44_0_0EXManifestsManifest *)manifest constantsBinding:(ABI44_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
