//
//  ABI15_0_0AIRGMSMarker.h
//  AirMaps
//
//  Created by Gil Birman on 9/5/16.
//

#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI15_0_0/UIView+ReactABI15_0_0.h>

@class ABI15_0_0AIRGoogleMapMarker;

@interface ABI15_0_0AIRGMSMarker : GMSMarker
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, weak) ABI15_0_0AIRGoogleMapMarker *fakeMarker;
@property (nonatomic, copy) ABI15_0_0RCTBubblingEventBlock onPress;
@end


@protocol ABI15_0_0AIRGMSMarkerDelegate <NSObject>
@required
-(void)didTapMarker;
@end
