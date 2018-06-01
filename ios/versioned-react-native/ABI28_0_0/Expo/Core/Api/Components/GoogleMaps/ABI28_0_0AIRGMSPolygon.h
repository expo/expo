//
//  ABI28_0_0AIRGMSPolygon.h
//  AirMaps
//
//  Created by Gerardo Pacheco 02/05/2017.
//

#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI28_0_0/UIView+ReactABI28_0_0.h>

@class ABI28_0_0AIRGoogleMapPolygon;

@interface ABI28_0_0AIRGMSPolygon : GMSPolygon
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, copy) ABI28_0_0RCTBubblingEventBlock onPress;
@end
