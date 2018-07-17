//
//  ABI29_0_0AIRGoogleMapPolygon.h
//
//  Created by Nick Italiano on 10/22/16.
//

#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI29_0_0/ABI29_0_0RCTBridge.h>
#import "ABI29_0_0AIRGMSPolygon.h"
#import "ABI29_0_0AIRMapCoordinate.h"

@interface ABI29_0_0AIRGoogleMapPolygon : UIView

@property (nonatomic, weak) ABI29_0_0RCTBridge *bridge;
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, strong) ABI29_0_0AIRGMSPolygon *polygon;
@property (nonatomic, strong) NSArray<ABI29_0_0AIRMapCoordinate *> *coordinates;
@property (nonatomic, strong) NSArray<NSArray<ABI29_0_0AIRMapCoordinate *> *> *holes;
@property (nonatomic, copy) ABI29_0_0RCTBubblingEventBlock onPress;

@property (nonatomic, assign) UIColor *fillColor;
@property (nonatomic, assign) double strokeWidth;
@property (nonatomic, assign) UIColor *strokeColor;
@property (nonatomic, assign) BOOL geodesic;
@property (nonatomic, assign) int zIndex;
@property (nonatomic, assign) BOOL tappable;

@end
