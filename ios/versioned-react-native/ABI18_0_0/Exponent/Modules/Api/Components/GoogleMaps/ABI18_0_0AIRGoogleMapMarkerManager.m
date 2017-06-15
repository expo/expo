//
//  ABI18_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI18_0_0AIRGoogleMapMarkerManager.h"
#import "ABI18_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI18_0_0/ABI18_0_0RCTUIManager.h>
#import "ABI18_0_0RCTConvert+AirMap.h"

@implementation ABI18_0_0AIRGoogleMapMarkerManager

ABI18_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI18_0_0AIRGoogleMapMarker *marker = [ABI18_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI18_0_0RCTBubblingEventBlock)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI18_0_0RCTDirectEventBlock)

ABI18_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI18_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI18_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI18_0_0Tag];
    if (![view isKindOfClass:[ABI18_0_0AIRGoogleMapMarker class]]) {
      ABI18_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI18_0_0AIRMap, got: %@", view);
    } else {
      [(ABI18_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI18_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI18_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI18_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI18_0_0Tag];
    if (![view isKindOfClass:[ABI18_0_0AIRGoogleMapMarker class]]) {
      ABI18_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI18_0_0AIRMap, got: %@", view);
    } else {
      [(ABI18_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
