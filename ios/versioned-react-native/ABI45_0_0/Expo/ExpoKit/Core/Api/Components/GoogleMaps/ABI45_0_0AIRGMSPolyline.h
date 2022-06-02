//
//  ABI45_0_0AIRGMSPolyline.h
//  AirMaps
//
//  Created by Guilherme Pontes 04/05/2017.
//

#ifdef ABI45_0_0HAVE_GOOGLE_MAPS

#import <GoogleMaps/GoogleMaps.h>
#import <ABI45_0_0React/ABI45_0_0UIView+React.h>

@class ABI45_0_0AIRGoogleMapPolyline;

@interface ABI45_0_0AIRGMSPolyline : GMSPolyline
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, copy) ABI45_0_0RCTBubblingEventBlock onPress;
@end

#endif
