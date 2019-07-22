//
//  ABI34_0_0AIRGMSPolyline.h
//  AirMaps
//
//  Created by Guilherme Pontes 04/05/2017.
//

#ifdef ABI34_0_0HAVE_GOOGLE_MAPS

#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI34_0_0/UIView+ReactABI34_0_0.h>

@class ABI34_0_0AIRGoogleMapPolyline;

@interface ABI34_0_0AIRGMSPolyline : GMSPolyline
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, copy) ABI34_0_0RCTBubblingEventBlock onPress;
@end

#endif
