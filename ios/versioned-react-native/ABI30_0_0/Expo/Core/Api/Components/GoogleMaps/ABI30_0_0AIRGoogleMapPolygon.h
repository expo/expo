//
//  ABI30_0_0AIRGoogleMapPolygon.h
//
//  Created by Nick Italiano on 10/22/16.
//

#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>
#import "ABI30_0_0AIRGMSPolygon.h"
#import "ABI30_0_0AIRMapCoordinate.h"

@interface ABI30_0_0AIRGoogleMapPolygon : UIView

@property (nonatomic, weak) ABI30_0_0RCTBridge *bridge;
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, strong) ABI30_0_0AIRGMSPolygon *polygon;
@property (nonatomic, strong) NSArray<ABI30_0_0AIRMapCoordinate *> *coordinates;
@property (nonatomic, strong) NSArray<NSArray<ABI30_0_0AIRMapCoordinate *> *> *holes;
@property (nonatomic, copy) ABI30_0_0RCTBubblingEventBlock onPress;

@property (nonatomic, assign) UIColor *fillColor;
@property (nonatomic, assign) double strokeWidth;
@property (nonatomic, assign) UIColor *strokeColor;
@property (nonatomic, assign) BOOL geodesic;
@property (nonatomic, assign) int zIndex;
@property (nonatomic, assign) BOOL tappable;

@end
