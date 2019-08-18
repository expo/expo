//
//  LOTScene.h
//  LottieAnimator
//
//  Created by Brandon Withrow on 12/14/15.
//  Copyright © 2015 Brandon Withrow. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreGraphics/CoreGraphics.h>

@class LOTLayerGroup;
@class LOTLayer;
@class LOTAssetGroup;

@interface LOTComposition : NSObject

/// Load animation by name from the default bundle, Images are also loaded from the bundle
+ (nullable instancetype)animationNamed:(nonnull NSString *)animationName NS_SWIFT_NAME(init(name:));

/// Loads animation by name from specified bundle, Images are also loaded from the bundle
+ (nullable instancetype)animationNamed:(nonnull NSString *)animationName
                              inBundle:(nonnull NSBundle *)bundle NS_SWIFT_NAME(init(name:bundle:));

/// Loads an animation from a specific file path. WARNING Do not use a web URL for file path.
+ (nullable instancetype)animationWithFilePath:(nonnull NSString *)filePath NS_SWIFT_NAME(init(filePath:));

/// Creates an animation from the deserialized JSON Dictionary
+ (nonnull instancetype)animationFromJSON:(nonnull NSDictionary *)animationJSON NS_SWIFT_NAME(init(json:));

/// Creates an animation from the deserialized JSON Dictionary, images are loaded from the specified bundle
+ (nonnull instancetype)animationFromJSON:(nullable NSDictionary *)animationJSON
                                 inBundle:(nullable NSBundle *)bundle NS_SWIFT_NAME(init(json:bundle:));

- (instancetype _Nonnull)initWithJSON:(NSDictionary * _Nullable)jsonDictionary
                      withAssetBundle:(NSBundle * _Nullable)bundle;

@property (nonatomic, readonly) CGRect compBounds;
@property (nonatomic, strong, readonly, nullable) NSNumber *startFrame;
@property (nonatomic, strong, readonly, nullable) NSNumber *endFrame;
@property (nonatomic, strong, readonly, nullable) NSNumber *framerate;
@property (nonatomic, readonly) NSTimeInterval timeDuration;
@property (nonatomic, strong, readonly, nullable) LOTLayerGroup *layerGroup;
@property (nonatomic, strong, readonly, nullable) LOTAssetGroup *assetGroup;
@property (nonatomic, strong, readwrite, nullable) NSString *rootDirectory;
@property (nonatomic, strong, readonly, nullable) NSBundle *assetBundle;
@property (nonatomic, copy, nullable) NSString *cacheKey;

@end
