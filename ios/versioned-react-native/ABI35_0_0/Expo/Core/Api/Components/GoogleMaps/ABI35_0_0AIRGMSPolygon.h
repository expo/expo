//
//  ABI35_0_0AIRGMSPolygon.h
//  AirMaps
//
//  Created by Gerardo Pacheco 02/05/2017.
//

#ifdef ABI35_0_0HAVE_GOOGLE_MAPS

#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI35_0_0/UIView+ReactABI35_0_0.h>

@class ABI35_0_0AIRGoogleMapPolygon;

@interface ABI35_0_0AIRGMSPolygon : GMSPolygon
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, copy) ABI35_0_0RCTBubblingEventBlock onPress;
@end

#endif
