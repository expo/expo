//
//  ABI24_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI24_0_0AIRGoogleMapMarkerManager.h"
#import "ABI24_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI24_0_0/ABI24_0_0RCTUIManager.h>
#import "ABI24_0_0RCTConvert+AirMap.h"

@implementation ABI24_0_0AIRGoogleMapMarkerManager

ABI24_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI24_0_0AIRGoogleMapMarker *marker = [ABI24_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI24_0_0RCTBubblingEventBlock)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI24_0_0RCTDirectEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI24_0_0RCTDirectEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI24_0_0RCTDirectEventBlock)

ABI24_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI24_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI24_0_0Tag];
    if (![view isKindOfClass:[ABI24_0_0AIRGoogleMapMarker class]]) {
      ABI24_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI24_0_0AIRMap, got: %@", view);
    } else {
      [(ABI24_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI24_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI24_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI24_0_0Tag];
    if (![view isKindOfClass:[ABI24_0_0AIRGoogleMapMarker class]]) {
      ABI24_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI24_0_0AIRMap, got: %@", view);
    } else {
      [(ABI24_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
