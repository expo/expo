#import "AIRMapCallout.h"

#import <MapKit/MapKit.h>
#import <UIKit/UIKit.h>

#import "RCTConvert+AirMap.h"
#import <React/RCTComponent.h>
#import "AIRMap.h"
#import "AIRMapOverlayRenderer.h"

@class RCTBridge;

@interface AIRMapOverlay : UIView <MKOverlay>

@property (nonatomic, strong) AIRMapOverlayRenderer *renderer;
@property (nonatomic, weak) AIRMap *map;
@property (nonatomic, weak) RCTBridge *bridge;

@property (nonatomic, strong) NSString *name;
@property (nonatomic, copy) NSString *imageSrc;
@property (nonatomic, strong, readonly) UIImage *overlayImage;
@property (nonatomic, copy) NSArray *boundsRect;
@property (nonatomic, assign) NSInteger rotation;
@property (nonatomic, assign) CGFloat transparency;
@property (nonatomic, assign) NSInteger zIndex;

@property (nonatomic, copy) RCTBubblingEventBlock onPress;

#pragma mark MKOverlay protocol

@property(nonatomic, readonly) CLLocationCoordinate2D coordinate;
@property(nonatomic, readonly) MKMapRect boundingMapRect;
- (BOOL)intersectsMapRect:(MKMapRect)mapRect;
- (BOOL)canReplaceMapContent;

@end
