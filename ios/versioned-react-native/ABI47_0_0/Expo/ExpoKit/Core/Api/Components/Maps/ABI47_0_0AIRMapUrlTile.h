//
//  ABI47_0_0AIRUrlTileOverlay.h
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MapKit/MapKit.h>
#import <UIKit/UIKit.h>

#import <ABI47_0_0React/ABI47_0_0RCTComponent.h>
#import <ABI47_0_0React/ABI47_0_0RCTView.h>
#import "ABI47_0_0AIRMapCoordinate.h"
#import "ABI47_0_0AIRMap.h"
#import "ABI47_0_0RCTConvert+AirMap.h"
#import "ABI47_0_0AIRMapUrlTileCachedOverlay.h"

@interface ABI47_0_0AIRMapUrlTile : MKAnnotationView <MKOverlay> {
	BOOL _urlTemplateSet;
	BOOL _tileSizeSet;
	BOOL _flipYSet;
	BOOL _tileCachePathSet;
	BOOL _tileCacheMaxAgeSet;
	BOOL _maximumNativeZSet;
	BOOL _cachedOverlayCreated;
	BOOL _opacitySet;
}

@property (nonatomic, weak) ABI47_0_0AIRMap *map;

@property (nonatomic, strong) ABI47_0_0AIRMapUrlTileCachedOverlay *tileOverlay;
@property (nonatomic, strong) MKTileOverlayRenderer *renderer;
@property (nonatomic, copy) NSString *urlTemplate;
@property NSInteger maximumZ;
@property NSInteger maximumNativeZ;
@property NSInteger minimumZ;
@property BOOL flipY;
@property BOOL shouldReplaceMapContent;
@property NSInteger tileSize;
@property (nonatomic, copy) NSString *tileCachePath;
@property NSInteger tileCacheMaxAge;
@property BOOL offlineMode;
@property CGFloat opacity;

- (void)updateProperties;
- (void)update;

#pragma mark MKOverlay protocol

@property(nonatomic, readonly) CLLocationCoordinate2D coordinate;
@property(nonatomic, readonly) MKMapRect boundingMapRect;
//- (BOOL)intersectsMapRect:(MKMapRect)mapRect;
- (BOOL)canReplaceMapContent;

@end
