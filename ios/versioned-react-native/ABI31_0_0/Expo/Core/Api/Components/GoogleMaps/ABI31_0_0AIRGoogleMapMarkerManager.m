//
//  ABI31_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI31_0_0AIRGoogleMapMarkerManager.h"
#import "ABI31_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI31_0_0/ABI31_0_0RCTUIManager.h>
#import "ABI31_0_0RCTConvert+AirMap.h"

@implementation ABI31_0_0AIRGoogleMapMarkerManager

ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI31_0_0AIRGoogleMapMarker *marker = [ABI31_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI31_0_0RCTBubblingEventBlock)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI31_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(calloutAnchor, CGPoint)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI31_0_0RCTDirectEventBlock)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI31_0_0RCTDirectEventBlock)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI31_0_0RCTDirectEventBlock)

ABI31_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI31_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI31_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI31_0_0Tag];
    if (![view isKindOfClass:[ABI31_0_0AIRGoogleMapMarker class]]) {
      ABI31_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI31_0_0AIRMap, got: %@", view);
    } else {
      [(ABI31_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI31_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI31_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI31_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI31_0_0Tag];
    if (![view isKindOfClass:[ABI31_0_0AIRGoogleMapMarker class]]) {
      ABI31_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI31_0_0AIRMap, got: %@", view);
    } else {
      [(ABI31_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}

ABI31_0_0RCT_EXPORT_METHOD(redraw:(nonnull NSNumber *)ReactABI31_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI31_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI31_0_0Tag];
    if (![view isKindOfClass:[ABI31_0_0AIRGoogleMapMarker class]]) {
      ABI31_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI31_0_0AIRMap, got: %@", view);
    } else {
      [(ABI31_0_0AIRGoogleMapMarker *) view redraw];
    }
  }];
}
@end
