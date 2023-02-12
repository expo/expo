//
//  ABI48_0_0AIRGMSPolyline.h
//  AirMaps
//
//  Created by Guilherme Pontes 04/05/2017.
//

#ifdef ABI48_0_0HAVE_GOOGLE_MAPS

#import <GoogleMaps/GoogleMaps.h>
#import <ABI48_0_0React/ABI48_0_0UIView+React.h>

@class ABI48_0_0AIRGoogleMapPolyline;

@interface ABI48_0_0AIRGMSPolyline : GMSPolyline
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, copy) ABI48_0_0RCTBubblingEventBlock onPress;
@end

#endif
