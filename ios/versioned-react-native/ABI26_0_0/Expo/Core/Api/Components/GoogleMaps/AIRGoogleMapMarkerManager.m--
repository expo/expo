//
//  ABI26_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI26_0_0AIRGoogleMapMarkerManager.h"
#import "ABI26_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUIManager.h>
#import "ABI26_0_0RCTConvert+AirMap.h"

@implementation ABI26_0_0AIRGoogleMapMarkerManager

ABI26_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI26_0_0AIRGoogleMapMarker *marker = [ABI26_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI26_0_0RCTBubblingEventBlock)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI26_0_0RCTDirectEventBlock)

ABI26_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI26_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI26_0_0Tag];
    if (![view isKindOfClass:[ABI26_0_0AIRGoogleMapMarker class]]) {
      ABI26_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI26_0_0AIRMap, got: %@", view);
    } else {
      [(ABI26_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI26_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI26_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI26_0_0Tag];
    if (![view isKindOfClass:[ABI26_0_0AIRGoogleMapMarker class]]) {
      ABI26_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI26_0_0AIRMap, got: %@", view);
    } else {
      [(ABI26_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
