//
//  LOTScene.m
//  LottieAnimator
//
//  Created by Brandon Withrow on 12/14/15.
//  Copyright © 2015 Brandon Withrow. All rights reserved.
//

#import "LOTComposition.h"
#import "LOTLayer.h"
#import "LOTAssetGroup.h"
#import "LOTLayerGroup.h"
#import "LOTAnimationCache.h"

@implementation LOTComposition

# pragma mark - Convenience Initializers

+ (nullable instancetype)animationNamed:(nonnull NSString *)animationName {
  return [self animationNamed:animationName inBundle:[NSBundle mainBundle]];
}

+ (nullable instancetype)animationNamed:(nonnull NSString *)animationName inBundle:(nonnull NSBundle *)bundle {
  if (!animationName) {
    return nil;
  }
  NSArray *components = [animationName componentsSeparatedByString:@"."];
  animationName = components.firstObject;
  
  LOTComposition *comp = [[LOTAnimationCache sharedCache] animationForKey:animationName];
  if (comp) {
    return comp;
  }
  
  NSError *error;
  NSString *filePath = [bundle pathForResource:animationName ofType:@"json"];
  NSData *jsonData = [[NSData alloc] initWithContentsOfFile:filePath];
  
  if (@available(iOS 9.0, *)) {
    if (!jsonData) {
      jsonData = [[NSDataAsset alloc] initWithName:animationName bundle:bundle].data;
    }
  }
  
  NSDictionary  *JSONObject = jsonData ? [NSJSONSerialization JSONObjectWithData:jsonData
                                                                         options:0 error:&error] : nil;
  if (JSONObject && !error) {
    LOTComposition *laScene = [[self alloc] initWithJSON:JSONObject withAssetBundle:bundle];
    [[LOTAnimationCache sharedCache] addAnimation:laScene forKey:animationName];
    laScene.cacheKey = animationName;
    return laScene;
  }
  NSLog(@"%s: Animation Not Found", __PRETTY_FUNCTION__);
  return nil;
}

+ (nullable instancetype)animationWithFilePath:(nonnull NSString *)filePath {
  NSString *animationName = filePath;
  
  LOTComposition *comp = [[LOTAnimationCache sharedCache] animationForKey:animationName];
  if (comp) {
    return comp;
  }
  
  NSError *error;
  NSData *jsonData = [[NSData alloc] initWithContentsOfFile:filePath];
  NSDictionary  *JSONObject = jsonData ? [NSJSONSerialization JSONObjectWithData:jsonData
                                                                         options:0 error:&error] : nil;
  if (JSONObject && !error) {
    LOTComposition *laScene = [[self alloc] initWithJSON:JSONObject withAssetBundle:[NSBundle mainBundle]];
    laScene.rootDirectory = [filePath stringByDeletingLastPathComponent];
    [[LOTAnimationCache sharedCache] addAnimation:laScene forKey:animationName];
    laScene.cacheKey = animationName;
    return laScene;
  }
  
  NSLog(@"%s: Animation Not Found", __PRETTY_FUNCTION__);
  return nil;
}

+ (nonnull instancetype)animationFromJSON:(nonnull NSDictionary *)animationJSON {
  return [self animationFromJSON:animationJSON inBundle:[NSBundle mainBundle]];
}

+ (nonnull instancetype)animationFromJSON:(nullable NSDictionary *)animationJSON inBundle:(nullable NSBundle *)bundle {
  return [[self alloc] initWithJSON:animationJSON withAssetBundle:bundle];
}

#pragma mark - Initializer

- (instancetype _Nonnull)initWithJSON:(NSDictionary * _Nullable)jsonDictionary
                      withAssetBundle:(NSBundle * _Nullable)bundle {
  self = [super init];
  if (self) {
    if (jsonDictionary) {
      [self _mapFromJSON:jsonDictionary withAssetBundle:bundle];
    }
  }
  return self;
}

#pragma mark - Internal Methods

- (void)_mapFromJSON:(NSDictionary *)jsonDictionary
     withAssetBundle:(NSBundle *)bundle {
  NSNumber *width = jsonDictionary[@"w"];
  NSNumber *height = jsonDictionary[@"h"];
  if (width && height) {
    CGRect bounds = CGRectMake(0, 0, width.floatValue, height.floatValue);
    _compBounds = bounds;
  }
  
  _startFrame = [jsonDictionary[@"ip"] copy];
  _endFrame = [jsonDictionary[@"op"] copy];
  _framerate = [jsonDictionary[@"fr"] copy];
  
  if (_startFrame && _endFrame && _framerate) {
    NSInteger frameDuration = (_endFrame.integerValue - _startFrame.integerValue) - 1;
    NSTimeInterval timeDuration = frameDuration / _framerate.floatValue;
    _timeDuration = timeDuration;
  }
  
  NSArray *assetArray = jsonDictionary[@"assets"];
  if (assetArray.count) {
    _assetGroup = [[LOTAssetGroup alloc] initWithJSON:assetArray withAssetBundle:bundle withFramerate:_framerate];
  }
  
  NSArray *layersJSON = jsonDictionary[@"layers"];
  if (layersJSON) {
    _layerGroup = [[LOTLayerGroup alloc] initWithLayerJSON:layersJSON
                                            withAssetGroup:_assetGroup
                                             withFramerate:_framerate];
  }
  
  [_assetGroup finalizeInitializationWithFramerate:_framerate];
}
  
- (void)setRootDirectory:(NSString *)rootDirectory {
    _rootDirectory = rootDirectory;
    self.assetGroup.rootDirectory = rootDirectory;
}
  
@end
