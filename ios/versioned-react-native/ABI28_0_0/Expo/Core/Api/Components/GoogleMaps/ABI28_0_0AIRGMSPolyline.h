//
//  ABI28_0_0AIRGMSPolyline.h
//  AirMaps
//
//  Created by Guilherme Pontes 04/05/2017.
//

#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI28_0_0/UIView+ReactABI28_0_0.h>

@class ABI28_0_0AIRGoogleMapPolyline;

@interface ABI28_0_0AIRGMSPolyline : GMSPolyline
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, copy) ABI28_0_0RCTBubblingEventBlock onPress;
@end
