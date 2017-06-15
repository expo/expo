//
//  ABI18_0_0AIRGMSMarker.h
//  AirMaps
//
//  Created by Gil Birman on 9/5/16.
//

#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI18_0_0/UIView+ReactABI18_0_0.h>

@class ABI18_0_0AIRGoogleMapMarker;

@interface ABI18_0_0AIRGMSMarker : GMSMarker
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, weak) ABI18_0_0AIRGoogleMapMarker *fakeMarker;
@property (nonatomic, copy) ABI18_0_0RCTBubblingEventBlock onPress;
@end


@protocol ABI18_0_0AIRGMSMarkerDelegate <NSObject>
@required
-(void)didTapMarker;
@end
