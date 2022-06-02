//
//  AIRUrlTileOverlay.h
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MapKit/MapKit.h>
#import <UIKit/UIKit.h>

#import <React/RCTComponent.h>
#import <React/RCTView.h>
#import "AIRMapCoordinate.h"
#import "AIRMap.h"
#import "RCTConvert+AirMap.h"
#import "AIRMapUrlTileCachedOverlay.h"

@interface AIRMapUrlTile : MKAnnotationView <MKOverlay> {
	BOOL _urlTemplateSet;
	BOOL _tileSizeSet;
	BOOL _flipYSet;
	BOOL _tileCachePathSet;
	BOOL _tileCacheMaxAgeSet;
	BOOL _maximumNativeZSet;
	BOOL _cachedOverlayCreated;
	BOOL _opacitySet;
}

@property (nonatomic, weak) AIRMap *map;

@property (nonatomic, strong) AIRMapUrlTileCachedOverlay *tileOverlay;
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
