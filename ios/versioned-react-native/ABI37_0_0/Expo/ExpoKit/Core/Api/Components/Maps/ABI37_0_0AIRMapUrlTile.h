//
//  ABI37_0_0AIRUrlTileOverlay.h
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MapKit/MapKit.h>
#import <UIKit/UIKit.h>

#import <ABI37_0_0React/ABI37_0_0RCTComponent.h>
#import <ABI37_0_0React/ABI37_0_0RCTView.h>
#import "ABI37_0_0AIRMapCoordinate.h"
#import "ABI37_0_0AIRMap.h"
#import "ABI37_0_0RCTConvert+AirMap.h"

@interface ABI37_0_0AIRMapUrlTile : MKAnnotationView <MKOverlay>

@property (nonatomic, weak) ABI37_0_0AIRMap *map;

@property (nonatomic, strong) MKTileOverlay *tileOverlay;
@property (nonatomic, strong) MKTileOverlayRenderer *renderer;
@property (nonatomic, copy) NSString *urlTemplate;
@property NSInteger maximumZ;
@property NSInteger minimumZ;
@property BOOL flipY;
@property BOOL shouldReplaceMapContent;
@property CGFloat tileSize;

#pragma mark MKOverlay protocol

@property(nonatomic, readonly) CLLocationCoordinate2D coordinate;
@property(nonatomic, readonly) MKMapRect boundingMapRect;
//- (BOOL)intersectsMapRect:(MKMapRect)mapRect;
- (BOOL)canReplaceMapContent;

@end
