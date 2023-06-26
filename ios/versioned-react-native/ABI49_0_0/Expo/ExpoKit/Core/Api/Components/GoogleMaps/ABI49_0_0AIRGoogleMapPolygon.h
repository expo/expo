//
//  ABI49_0_0AIRGoogleMapPolygon.h
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI49_0_0HAVE_GOOGLE_MAPS

#import <GoogleMaps/GoogleMaps.h>
#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import "ABI49_0_0AIRGMSPolygon.h"
#import "ABI49_0_0AIRMapCoordinate.h"

@interface ABI49_0_0AIRGoogleMapPolygon : UIView

@property (nonatomic, weak) ABI49_0_0RCTBridge *bridge;
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, strong) ABI49_0_0AIRGMSPolygon *polygon;
@property (nonatomic, strong) NSArray<ABI49_0_0AIRMapCoordinate *> *coordinates;
@property (nonatomic, strong) NSArray<NSArray<ABI49_0_0AIRMapCoordinate *> *> *holes;
@property (nonatomic, copy) ABI49_0_0RCTBubblingEventBlock onPress;

@property (nonatomic, strong) UIColor *fillColor;
@property (nonatomic, assign) double strokeWidth;
@property (nonatomic, strong) UIColor *strokeColor;
@property (nonatomic, assign) BOOL geodesic;
@property (nonatomic, assign) int zIndex;
@property (nonatomic, assign) BOOL tappable;

@end

#endif
