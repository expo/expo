//
//  ABI21_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI21_0_0AIRGoogleMapMarkerManager.h"
#import "ABI21_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI21_0_0/ABI21_0_0RCTUIManager.h>
#import "ABI21_0_0RCTConvert+AirMap.h"

@implementation ABI21_0_0AIRGoogleMapMarkerManager

ABI21_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI21_0_0AIRGoogleMapMarker *marker = [ABI21_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI21_0_0RCTBubblingEventBlock)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI21_0_0RCTDirectEventBlock)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI21_0_0RCTDirectEventBlock)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI21_0_0RCTDirectEventBlock)

ABI21_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI21_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI21_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI21_0_0Tag];
    if (![view isKindOfClass:[ABI21_0_0AIRGoogleMapMarker class]]) {
      ABI21_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI21_0_0AIRMap, got: %@", view);
    } else {
      [(ABI21_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI21_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI21_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI21_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI21_0_0Tag];
    if (![view isKindOfClass:[ABI21_0_0AIRGoogleMapMarker class]]) {
      ABI21_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI21_0_0AIRMap, got: %@", view);
    } else {
      [(ABI21_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
