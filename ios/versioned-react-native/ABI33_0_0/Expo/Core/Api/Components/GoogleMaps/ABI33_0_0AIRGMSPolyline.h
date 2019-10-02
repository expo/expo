//
//  ABI33_0_0AIRGMSPolyline.h
//  AirMaps
//
//  Created by Guilherme Pontes 04/05/2017.
//

#ifdef ABI33_0_0HAVE_GOOGLE_MAPS

#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI33_0_0/UIView+ReactABI33_0_0.h>

@class ABI33_0_0AIRGoogleMapPolyline;

@interface ABI33_0_0AIRGMSPolyline : GMSPolyline
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, copy) ABI33_0_0RCTBubblingEventBlock onPress;
@end

#endif
