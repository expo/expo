//
//  ABI22_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI22_0_0AIRGoogleMapMarkerManager.h"
#import "ABI22_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI22_0_0/ABI22_0_0RCTUIManager.h>
#import "ABI22_0_0RCTConvert+AirMap.h"

@implementation ABI22_0_0AIRGoogleMapMarkerManager

ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI22_0_0AIRGoogleMapMarker *marker = [ABI22_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI22_0_0RCTBubblingEventBlock)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI22_0_0RCTDirectEventBlock)

ABI22_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI22_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI22_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI22_0_0Tag];
    if (![view isKindOfClass:[ABI22_0_0AIRGoogleMapMarker class]]) {
      ABI22_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI22_0_0AIRMap, got: %@", view);
    } else {
      [(ABI22_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI22_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI22_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI22_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI22_0_0Tag];
    if (![view isKindOfClass:[ABI22_0_0AIRGoogleMapMarker class]]) {
      ABI22_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI22_0_0AIRMap, got: %@", view);
    } else {
      [(ABI22_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
