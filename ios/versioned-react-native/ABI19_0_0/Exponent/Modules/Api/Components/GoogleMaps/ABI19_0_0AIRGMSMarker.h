//
//  ABI19_0_0AIRGMSMarker.h
//  AirMaps
//
//  Created by Gil Birman on 9/5/16.
//

#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI19_0_0/UIView+ReactABI19_0_0.h>

@class ABI19_0_0AIRGoogleMapMarker;

@interface ABI19_0_0AIRGMSMarker : GMSMarker
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, weak) ABI19_0_0AIRGoogleMapMarker *fakeMarker;
@property (nonatomic, copy) ABI19_0_0RCTBubblingEventBlock onPress;
@end


@protocol ABI19_0_0AIRGMSMarkerDelegate <NSObject>
@required
-(void)didTapMarker;
@end
