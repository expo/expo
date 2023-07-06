// Copyright 2020-present 650 Industries. All rights reserved.

#if __has_include(<ABI49_0_0EXFirebaseCore/ABI49_0_0EXFirebaseCore.h>)
#import <UIKit/UIKit.h>
#import <ABI49_0_0EXFirebaseCore/ABI49_0_0EXFirebaseCore.h>
#import "ABI49_0_0EXConstantsBinding.h"

@class ABI49_0_0EXManifestsManifest;

NS_ASSUME_NONNULL_BEGIN

@interface ABI49_0_0EXScopedFirebaseCore : ABI49_0_0EXFirebaseCore

- (instancetype)initWithScopeKey:(NSString *)scopeKey manifest:(ABI49_0_0EXManifestsManifest *)manifest constantsBinding:(ABI49_0_0EXConstantsBinding *)constantsBinding;

@end

NS_ASSUME_NONNULL_END
#endif
