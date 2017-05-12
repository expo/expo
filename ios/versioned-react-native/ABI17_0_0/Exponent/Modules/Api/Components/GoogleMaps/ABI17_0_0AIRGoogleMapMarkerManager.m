//
//  ABI17_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI17_0_0AIRGoogleMapMarkerManager.h"
#import "ABI17_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI17_0_0/ABI17_0_0RCTUIManager.h>
#import "ABI17_0_0RCTConvert+AirMap.h"

@implementation ABI17_0_0AIRGoogleMapMarkerManager

ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI17_0_0AIRGoogleMapMarker *marker = [ABI17_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI17_0_0RCTBubblingEventBlock)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI17_0_0RCTDirectEventBlock)

ABI17_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI17_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI17_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI17_0_0Tag];
    if (![view isKindOfClass:[ABI17_0_0AIRGoogleMapMarker class]]) {
      ABI17_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI17_0_0AIRMap, got: %@", view);
    } else {
      [(ABI17_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI17_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI17_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI17_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI17_0_0Tag];
    if (![view isKindOfClass:[ABI17_0_0AIRGoogleMapMarker class]]) {
      ABI17_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI17_0_0AIRMap, got: %@", view);
    } else {
      [(ABI17_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
