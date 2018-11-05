#import "ABI28_0_0AIRMapCallout.h"

#import <MapKit/MapKit.h>
#import <UIKit/UIKit.h>

#import "ABI28_0_0RCTConvert+AirMap.h"
#import <ReactABI28_0_0/ABI28_0_0RCTComponent.h>
#import "ABI28_0_0AIRMap.h"
#import "ABI28_0_0AIRMapOverlayRenderer.h"

@class ABI28_0_0RCTBridge;

@interface ABI28_0_0AIRMapOverlay : UIView <MKOverlay>

@property (nonatomic, strong) ABI28_0_0AIRMapOverlayRenderer *renderer;
@property (nonatomic, weak) ABI28_0_0AIRMap *map;
@property (nonatomic, weak) ABI28_0_0RCTBridge *bridge;

@property (nonatomic, strong) NSString *name;
@property (nonatomic, copy) NSString *imageSrc;
@property (nonatomic, strong, readonly) UIImage *overlayImage;
@property (nonatomic, copy) NSArray *boundsRect;
@property (nonatomic, assign) NSInteger rotation;
@property (nonatomic, assign) CGFloat transparency;
@property (nonatomic, assign) NSInteger zIndex;

@property (nonatomic, copy) ABI28_0_0RCTBubblingEventBlock onPress;

#pragma mark MKOverlay protocol

@property(nonatomic, readonly) CLLocationCoordinate2D coordinate;
@property(nonatomic, readonly) MKMapRect boundingMapRect;
- (BOOL)intersectsMapRect:(MKMapRect)mapRect;
- (BOOL)canReplaceMapContent;

@end
