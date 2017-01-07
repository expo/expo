//
//  ABI13_0_0AIRUrlTileOverlay.h
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <MapKit/MapKit.h>
#import <UIKit/UIKit.h>

#import <ReactABI13_0_0/ABI13_0_0RCTConvert+MapKit.h>
#import <ReactABI13_0_0/ABI13_0_0RCTComponent.h>
#import <ReactABI13_0_0/ABI13_0_0RCTView.h>
#import "ABI13_0_0AIRMapCoordinate.h"
#import "ABI13_0_0AIRMap.h"

@interface ABI13_0_0AIRMapUrlTile : MKAnnotationView <MKOverlay>

@property (nonatomic, weak) ABI13_0_0AIRMap *map;

@property (nonatomic, strong) MKTileOverlay *tileOverlay;
@property (nonatomic, strong) MKTileOverlayRenderer *renderer;

@property (nonatomic, copy) NSString *urlTemplate;

#pragma mark MKOverlay protocol

@property(nonatomic, readonly) CLLocationCoordinate2D coordinate;
@property(nonatomic, readonly) MKMapRect boundingMapRect;
//- (BOOL)intersectsMapRect:(MKMapRect)mapRect;
- (BOOL)canReplaceMapContent;

@end
