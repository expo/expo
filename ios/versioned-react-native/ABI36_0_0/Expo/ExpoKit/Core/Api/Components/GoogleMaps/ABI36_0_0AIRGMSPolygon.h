//
//  ABI36_0_0AIRGMSPolygon.h
//  AirMaps
//
//  Created by Gerardo Pacheco 02/05/2017.
//

#ifdef ABI36_0_0HAVE_GOOGLE_MAPS

#import <GoogleMaps/GoogleMaps.h>
#import <ABI36_0_0React/ABI36_0_0UIView+React.h>

@class ABI36_0_0AIRGoogleMapPolygon;

@interface ABI36_0_0AIRGMSPolygon : GMSPolygon
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, copy) ABI36_0_0RCTBubblingEventBlock onPress;
@end

#endif
