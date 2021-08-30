//
//  ABI41_0_0AIRGMSMarker.h
//  AirMaps
//
//  Created by Gil Birman on 9/5/16.
//

#ifdef ABI41_0_0HAVE_GOOGLE_MAPS

#import <GoogleMaps/GoogleMaps.h>
#import <ABI41_0_0React/ABI41_0_0UIView+React.h>

@class ABI41_0_0AIRGoogleMapMarker;

@interface ABI41_0_0AIRGMSMarker : GMSMarker
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, weak) ABI41_0_0AIRGoogleMapMarker *fakeMarker;
@property (nonatomic, copy) ABI41_0_0RCTBubblingEventBlock onPress;
@end


@protocol ABI41_0_0AIRGMSMarkerDelegate <NSObject>
@required
-(void)didTapMarker;
@end

#endif
