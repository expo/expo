//
//  ABI27_0_0AIRGoogleMapOverlay.h
//
//  Created by Taro Matsuzawa on 5/3/17.
//

#import <Foundation/Foundation.h>
#import <GoogleMaps/GoogleMaps.h>
#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import "ABI27_0_0AIRMapCoordinate.h"
#import "ABI27_0_0AIRGoogleMap.h"

@interface ABI27_0_0AIRGoogleMapOverlay : UIView

@property (nonatomic, strong) GMSGroundOverlay *overlay;
@property (nonatomic, copy) NSString *imageSrc;
@property (nonatomic, strong, readonly) UIImage *overlayImage;
@property (nonatomic, copy) NSArray *boundsRect;
@property (nonatomic, readonly) GMSCoordinateBounds *overlayBounds;

@property (nonatomic, weak) ABI27_0_0RCTBridge *bridge;

@end
