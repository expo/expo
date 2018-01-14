//
//  ABI25_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI25_0_0AIRGoogleMapMarkerManager.h"
#import "ABI25_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUIManager.h>
#import "ABI25_0_0RCTConvert+AirMap.h"

@implementation ABI25_0_0AIRGoogleMapMarkerManager

ABI25_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI25_0_0AIRGoogleMapMarker *marker = [ABI25_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI25_0_0RCTBubblingEventBlock)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI25_0_0RCTDirectEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI25_0_0RCTDirectEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI25_0_0RCTDirectEventBlock)

ABI25_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI25_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI25_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI25_0_0Tag];
    if (![view isKindOfClass:[ABI25_0_0AIRGoogleMapMarker class]]) {
      ABI25_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI25_0_0AIRMap, got: %@", view);
    } else {
      [(ABI25_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI25_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI25_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI25_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI25_0_0Tag];
    if (![view isKindOfClass:[ABI25_0_0AIRGoogleMapMarker class]]) {
      ABI25_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI25_0_0AIRMap, got: %@", view);
    } else {
      [(ABI25_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
