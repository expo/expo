//
//  ABI33_0_0AIRGMSMarker.h
//  AirMaps
//
//  Created by Gil Birman on 9/5/16.
//

#ifdef ABI33_0_0HAVE_GOOGLE_MAPS

#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI33_0_0/UIView+ReactABI33_0_0.h>

@class ABI33_0_0AIRGoogleMapMarker;

@interface ABI33_0_0AIRGMSMarker : GMSMarker
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, weak) ABI33_0_0AIRGoogleMapMarker *fakeMarker;
@property (nonatomic, copy) ABI33_0_0RCTBubblingEventBlock onPress;
@end


@protocol ABI33_0_0AIRGMSMarkerDelegate <NSObject>
@required
-(void)didTapMarker;
@end

#endif
