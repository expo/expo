//
//  ABI28_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI28_0_0AIRGoogleMapMarkerManager.h"
#import "ABI28_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUIManager.h>
#import "ABI28_0_0RCTConvert+AirMap.h"

@implementation ABI28_0_0AIRGoogleMapMarkerManager

ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI28_0_0AIRGoogleMapMarker *marker = [ABI28_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI28_0_0RCTBubblingEventBlock)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI28_0_0RCTDirectEventBlock)

ABI28_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI28_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI28_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI28_0_0Tag];
    if (![view isKindOfClass:[ABI28_0_0AIRGoogleMapMarker class]]) {
      ABI28_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI28_0_0AIRMap, got: %@", view);
    } else {
      [(ABI28_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI28_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI28_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI28_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI28_0_0Tag];
    if (![view isKindOfClass:[ABI28_0_0AIRGoogleMapMarker class]]) {
      ABI28_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI28_0_0AIRMap, got: %@", view);
    } else {
      [(ABI28_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
