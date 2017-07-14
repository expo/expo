//
//  ABI19_0_0AIRGMSPolygon.h
//  AirMaps
//
//  Created by Gerardo Pacheco 02/05/2017.
//

#import <GoogleMaps/GoogleMaps.h>
#import "UIView+ReactABI19_0_0.h"

@class ABI19_0_0AIRGoogleMapPolygon;

@interface ABI19_0_0AIRGMSPolygon : GMSPolygon
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, copy) ABI19_0_0RCTBubblingEventBlock onPress;
@end
