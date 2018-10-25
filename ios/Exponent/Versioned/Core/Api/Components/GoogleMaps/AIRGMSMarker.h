//
//  AIRGMSMarker.h
//  AirMaps
//
//  Created by Gil Birman on 9/5/16.
//

#import <GoogleMaps/GoogleMaps.h>
#import <React/UIView+React.h>

@class AIRGoogleMapMarker;

@interface AIRGMSMarker : GMSMarker
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, weak) AIRGoogleMapMarker *fakeMarker;
@property (nonatomic, copy) RCTBubblingEventBlock onPress;
@end


@protocol AIRGMSMarkerDelegate <NSObject>
@required
-(void)didTapMarker;
@end
