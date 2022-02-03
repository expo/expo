//
//  ABI43_0_0AIRGoogleMapPolygon.h
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI43_0_0HAVE_GOOGLE_MAPS

#import <GoogleMaps/GoogleMaps.h>
#import <ABI43_0_0React/ABI43_0_0RCTBridge.h>
#import "ABI43_0_0AIRGMSPolygon.h"
#import "ABI43_0_0AIRMapCoordinate.h"

@interface ABI43_0_0AIRGoogleMapPolygon : UIView

@property (nonatomic, weak) ABI43_0_0RCTBridge *bridge;
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, strong) ABI43_0_0AIRGMSPolygon *polygon;
@property (nonatomic, strong) NSArray<ABI43_0_0AIRMapCoordinate *> *coordinates;
@property (nonatomic, strong) NSArray<NSArray<ABI43_0_0AIRMapCoordinate *> *> *holes;
@property (nonatomic, copy) ABI43_0_0RCTBubblingEventBlock onPress;

@property (nonatomic, assign) UIColor *fillColor;
@property (nonatomic, assign) double strokeWidth;
@property (nonatomic, assign) UIColor *strokeColor;
@property (nonatomic, assign) BOOL geodesic;
@property (nonatomic, assign) int zIndex;
@property (nonatomic, assign) BOOL tappable;

@end

#endif
