// Copyright 2016-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIColor.h>
#import <EXSplashSCreen/EXSplashScreenViewProvider.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * This class is responsible for reading SplashScreen configuration from manifest.
 * It provides also default config for SplshScreen in case no specific options are provided.
 */
@interface EXSplashScreenConfig : NSObject

- (instancetype)init NS_UNAVAILABLE;

+ (instancetype)fromManifest:(NSDictionary *)manifest;

@property (nonatomic, nullable, readonly) NSString *imageUrl;
@property (nonatomic, readonly) EXSplashScreenImageResizeMode resizeMode;
@property (nonatomic, nonnull, readonly) UIColor *backgroundColor;

@end

NS_ASSUME_NONNULL_END
