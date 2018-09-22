//
//  LOTAsset.h
//  Pods
//
//  Created by Brandon Withrow on 2/16/17.
//
//

#import <Foundation/Foundation.h>
#import <CoreGraphics/CoreGraphics.h>

NS_ASSUME_NONNULL_BEGIN

@class LOTLayerGroup;
@class LOTLayer;
@class LOTAssetGroup;

@interface LOTAsset : NSObject

- (instancetype)initWithJSON:(NSDictionary *)jsonDictionary
              withAssetGroup:(LOTAssetGroup * _Nullable)assetGroup
             withAssetBundle:(NSBundle *_Nonnull)bundle
               withFramerate:(NSNumber *)framerate;

@property (nonatomic, readonly, nullable) NSString *referenceID;
@property (nonatomic, readonly, nullable) NSNumber *assetWidth;
@property (nonatomic, readonly, nullable) NSNumber *assetHeight;

@property (nonatomic, readonly, nullable) NSString *imageName;
@property (nonatomic, readonly, nullable) NSString *imageDirectory;

@property (nonatomic, readonly, nullable) LOTLayerGroup *layerGroup;

@property (nonatomic, readwrite) NSString *rootDirectory;
@property (nonatomic, readonly) NSBundle *assetBundle;
@end

NS_ASSUME_NONNULL_END
