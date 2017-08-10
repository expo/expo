//
//  ABI20_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI20_0_0AIRGoogleMapMarkerManager.h"
#import "ABI20_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI20_0_0/ABI20_0_0RCTUIManager.h>
#import "ABI20_0_0RCTConvert+AirMap.h"

@implementation ABI20_0_0AIRGoogleMapMarkerManager

ABI20_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI20_0_0AIRGoogleMapMarker *marker = [ABI20_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI20_0_0RCTBubblingEventBlock)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI20_0_0RCTDirectEventBlock)

ABI20_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI20_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI20_0_0Tag];
    if (![view isKindOfClass:[ABI20_0_0AIRGoogleMapMarker class]]) {
      ABI20_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI20_0_0AIRMap, got: %@", view);
    } else {
      [(ABI20_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI20_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI20_0_0Tag];
    if (![view isKindOfClass:[ABI20_0_0AIRGoogleMapMarker class]]) {
      ABI20_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI20_0_0AIRMap, got: %@", view);
    } else {
      [(ABI20_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
