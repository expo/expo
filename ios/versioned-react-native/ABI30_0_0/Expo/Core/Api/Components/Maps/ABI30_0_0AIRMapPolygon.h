//
// Created by Leland Richardson on 12/27/15.
// Copyright (c) 2015 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <MapKit/MapKit.h>
#import <UIKit/UIKit.h>

#import <ReactABI30_0_0/ABI30_0_0RCTComponent.h>
#import <ReactABI30_0_0/ABI30_0_0RCTView.h>
#import "ABI30_0_0AIRMapCoordinate.h"
#import "ABI30_0_0AIRMap.h"
#import "ABI30_0_0RCTConvert+AirMap.h"



@interface ABI30_0_0AIRMapPolygon: MKAnnotationView <MKOverlay>

@property (nonatomic, weak) ABI30_0_0AIRMap *map;

@property (nonatomic, strong) MKPolygon *polygon;
@property (nonatomic, strong) MKPolygonRenderer *renderer;
@property (nonatomic, strong) NSArray<MKPolygon *> *interiorPolygons;

@property (nonatomic, strong) NSArray<ABI30_0_0AIRMapCoordinate *> *coordinates;
@property (nonatomic, strong) NSArray<NSArray<ABI30_0_0AIRMapCoordinate *> *> *holes;
@property (nonatomic, strong) UIColor *fillColor;
@property (nonatomic, strong) UIColor *strokeColor;
@property (nonatomic, assign) CGFloat strokeWidth;
@property (nonatomic, assign) CGFloat miterLimit;
@property (nonatomic, assign) CGLineCap lineCap;
@property (nonatomic, assign) CGLineJoin lineJoin;
@property (nonatomic, assign) CGFloat lineDashPhase;
@property (nonatomic, strong) NSArray <NSNumber *> *lineDashPattern;
@property (nonatomic, copy) ABI30_0_0RCTBubblingEventBlock onPress;

#pragma mark MKOverlay protocol

@property(nonatomic, readonly) CLLocationCoordinate2D coordinate;
@property(nonatomic, readonly) MKMapRect boundingMapRect;
- (BOOL)intersectsMapRect:(MKMapRect)mapRect;
- (BOOL)canReplaceMapContent;

@end
