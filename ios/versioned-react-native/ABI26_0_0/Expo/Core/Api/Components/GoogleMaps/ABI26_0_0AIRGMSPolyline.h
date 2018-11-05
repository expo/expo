//
//  ABI26_0_0AIRGMSPolyline.h
//  AirMaps
//
//  Created by Guilherme Pontes 04/05/2017.
//

#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI26_0_0/UIView+ReactABI26_0_0.h>

@class ABI26_0_0AIRGoogleMapPolyline;

@interface ABI26_0_0AIRGMSPolyline : GMSPolyline
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, copy) ABI26_0_0RCTBubblingEventBlock onPress;
@end
