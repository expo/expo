//
//  ABI40_0_0AIRGMSPolyline.h
//  AirMaps
//
//  Created by Guilherme Pontes 04/05/2017.
//

#ifdef ABI40_0_0HAVE_GOOGLE_MAPS

#import <GoogleMaps/GoogleMaps.h>
#import <ABI40_0_0React/ABI40_0_0UIView+React.h>

@class ABI40_0_0AIRGoogleMapPolyline;

@interface ABI40_0_0AIRGMSPolyline : GMSPolyline
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, copy) ABI40_0_0RCTBubblingEventBlock onPress;
@end

#endif
