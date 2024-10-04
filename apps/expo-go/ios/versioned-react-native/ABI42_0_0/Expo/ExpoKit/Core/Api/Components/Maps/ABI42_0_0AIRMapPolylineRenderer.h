//
//  ABI42_0_0AIRMapPolylineRenderer.h
//  mapDemo
//
//  Created by IjzerenHein on 13-11-21.
//  Copyright (c) 2017 IjzerenHein. All rights reserved.
//

#import <MapKit/MapKit.h>

@interface ABI42_0_0AIRMapPolylineRenderer : MKOverlayPathRenderer

-(id)initWithOverlay:(id<MKOverlay>)overlay polyline:(MKPolyline*)polyline;
-(id)initWithSnapshot:(MKMapSnapshot*)snapshot overlay:(id<MKOverlay>)overlay polyline:(MKPolyline*)polyline;
-(void)drawWithZoomScale:(MKZoomScale)zoomScale inContext:(CGContextRef)context;

@property (nonatomic, strong) NSArray<UIColor *> *strokeColors;

@end
