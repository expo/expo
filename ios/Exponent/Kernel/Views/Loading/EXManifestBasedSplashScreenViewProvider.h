// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXSplashScreen/EXSplashScreenViewProvider.h>
#import "EXSplashScreenConfig.h"

NS_ASSUME_NONNULL_BEGIN

@interface EXManifestBasedSplashScreenViewProvider : NSObject <EXSplashScreenViewProvider>

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithConfig:(EXSplashScreenConfig *)config;

@end

NS_ASSUME_NONNULL_END
