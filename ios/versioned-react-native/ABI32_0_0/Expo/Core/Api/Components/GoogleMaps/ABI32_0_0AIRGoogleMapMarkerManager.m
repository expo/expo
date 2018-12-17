//
//  ABI32_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI32_0_0AIRGoogleMapMarkerManager.h"
#import "ABI32_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI32_0_0/ABI32_0_0RCTUIManager.h>
#import "ABI32_0_0RCTConvert+AirMap.h"

@implementation ABI32_0_0AIRGoogleMapMarkerManager

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI32_0_0AIRGoogleMapMarker *marker = [ABI32_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI32_0_0RCTBubblingEventBlock)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(calloutAnchor, CGPoint)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI32_0_0RCTDirectEventBlock)

ABI32_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI32_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0AIRGoogleMapMarker class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI32_0_0AIRMap, got: %@", view);
    } else {
      [(ABI32_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI32_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI32_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0AIRGoogleMapMarker class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI32_0_0AIRMap, got: %@", view);
    } else {
      [(ABI32_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}

ABI32_0_0RCT_EXPORT_METHOD(redraw:(nonnull NSNumber *)ReactABI32_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0AIRGoogleMapMarker class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI32_0_0AIRMap, got: %@", view);
    } else {
      [(ABI32_0_0AIRGoogleMapMarker *) view redraw];
    }
  }];
}
@end
