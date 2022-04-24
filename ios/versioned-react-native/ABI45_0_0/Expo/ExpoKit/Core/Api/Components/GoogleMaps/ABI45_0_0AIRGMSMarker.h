//
//  ABI45_0_0AIRGMSMarker.h
//  AirMaps
//
//  Created by Gil Birman on 9/5/16.
//

#ifdef ABI45_0_0HAVE_GOOGLE_MAPS

#import <GoogleMaps/GoogleMaps.h>
#import <ABI45_0_0React/ABI45_0_0UIView+React.h>

@class ABI45_0_0AIRGoogleMapMarker;

@interface ABI45_0_0AIRGMSMarker : GMSMarker
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, weak) ABI45_0_0AIRGoogleMapMarker *fakeMarker;
@property (nonatomic, copy) ABI45_0_0RCTBubblingEventBlock onPress;
@end


@protocol ABI45_0_0AIRGMSMarkerDelegate <NSObject>
@required
-(void)didTapMarker;
@end

#endif
