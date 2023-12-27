// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI43_0_0EXFirebaseCore/ABI43_0_0EXFirebaseCore.h>)
#import <UIKit/UIKit.h>
#import <ABI43_0_0EXFirebaseCore/ABI43_0_0EXFirebaseCore.h>
#import <ABI43_0_0EXManifests/ABI43_0_0EXManifestsManifest.h>
#import "ABI43_0_0EXConstantsBinding.h"

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0EXScopedFirebaseCore : ABI43_0_0EXFirebaseCore

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(ABI43_0_0EXManifestsManifest *)manifest constantsBinding:(ABI43_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
