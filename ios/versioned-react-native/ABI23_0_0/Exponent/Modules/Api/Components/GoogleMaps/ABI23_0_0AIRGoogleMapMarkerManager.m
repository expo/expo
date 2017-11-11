//
//  ABI23_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI23_0_0AIRGoogleMapMarkerManager.h"
#import "ABI23_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI23_0_0/ABI23_0_0RCTUIManager.h>
#import "ABI23_0_0RCTConvert+AirMap.h"

@implementation ABI23_0_0AIRGoogleMapMarkerManager

ABI23_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI23_0_0AIRGoogleMapMarker *marker = [ABI23_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI23_0_0RCTBubblingEventBlock)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI23_0_0RCTDirectEventBlock)

ABI23_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI23_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI23_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI23_0_0Tag];
    if (![view isKindOfClass:[ABI23_0_0AIRGoogleMapMarker class]]) {
      ABI23_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI23_0_0AIRMap, got: %@", view);
    } else {
      [(ABI23_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI23_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI23_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI23_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI23_0_0Tag];
    if (![view isKindOfClass:[ABI23_0_0AIRGoogleMapMarker class]]) {
      ABI23_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI23_0_0AIRMap, got: %@", view);
    } else {
      [(ABI23_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
