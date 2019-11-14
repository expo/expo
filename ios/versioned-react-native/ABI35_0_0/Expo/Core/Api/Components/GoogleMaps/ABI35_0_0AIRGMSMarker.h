//
//  ABI35_0_0AIRGMSMarker.h
//  AirMaps
//
//  Created by Gil Birman on 9/5/16.
//

#ifdef ABI35_0_0HAVE_GOOGLE_MAPS

#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI35_0_0/UIView+ReactABI35_0_0.h>

@class ABI35_0_0AIRGoogleMapMarker;

@interface ABI35_0_0AIRGMSMarker : GMSMarker
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, weak) ABI35_0_0AIRGoogleMapMarker *fakeMarker;
@property (nonatomic, copy) ABI35_0_0RCTBubblingEventBlock onPress;
@end


@protocol ABI35_0_0AIRGMSMarkerDelegate <NSObject>
@required
-(void)didTapMarker;
@end

#endif
