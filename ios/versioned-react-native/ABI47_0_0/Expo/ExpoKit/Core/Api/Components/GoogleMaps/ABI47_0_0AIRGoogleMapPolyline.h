//
//  ABI47_0_0AIRGoogleMapPolyline.h
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI47_0_0HAVE_GOOGLE_MAPS
#import <UIKit/UIKit.h>
#import <GoogleMaps/GoogleMaps.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import "ABI47_0_0AIRGMSPolyline.h"
#import "ABI47_0_0AIRMapCoordinate.h"
#import "ABI47_0_0AIRGoogleMapMarker.h"

@interface ABI47_0_0AIRGoogleMapPolyline : UIView

@property (nonatomic, weak) ABI47_0_0RCTBridge *bridge;
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, strong) ABI47_0_0AIRGMSPolyline *polyline;
@property (nonatomic, strong) NSArray<ABI47_0_0AIRMapCoordinate *> *coordinates;
@property (nonatomic, copy) ABI47_0_0RCTBubblingEventBlock onPress;

@property (nonatomic, strong) UIColor *strokeColor;
@property (nonatomic, strong) NSArray<UIColor *> *strokeColors;
@property (nonatomic, assign) double strokeWidth;
@property (nonatomic, assign) UIColor *fillColor;
@property (nonatomic, strong) NSArray<NSNumber *> *lineDashPattern;
@property (nonatomic, assign) BOOL geodesic;
@property (nonatomic, assign) NSString *title;
@property (nonatomic, assign) int zIndex;
@property (nonatomic, assign) BOOL tappable;

@end

#endif
