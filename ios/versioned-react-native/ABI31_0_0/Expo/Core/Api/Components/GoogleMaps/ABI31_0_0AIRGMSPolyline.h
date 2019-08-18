//
//  ABI31_0_0AIRGMSPolyline.h
//  AirMaps
//
//  Created by Guilherme Pontes 04/05/2017.
//

#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI31_0_0/UIView+ReactABI31_0_0.h>

@class ABI31_0_0AIRGoogleMapPolyline;

@interface ABI31_0_0AIRGMSPolyline : GMSPolyline
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, copy) ABI31_0_0RCTBubblingEventBlock onPress;
@end
