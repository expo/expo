//
//  ABI15_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI15_0_0AIRGoogleMapMarkerManager.h"
#import "ABI15_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI15_0_0/ABI15_0_0RCTConvert+MapKit.h>
#import <ReactABI15_0_0/ABI15_0_0RCTUIManager.h>

@implementation ABI15_0_0AIRGoogleMapMarkerManager

ABI15_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI15_0_0AIRGoogleMapMarker *marker = [ABI15_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI15_0_0RCTBubblingEventBlock)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI15_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI15_0_0RCTDirectEventBlock)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI15_0_0RCTDirectEventBlock)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI15_0_0RCTDirectEventBlock)

ABI15_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI15_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI15_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI15_0_0Tag];
    if (![view isKindOfClass:[ABI15_0_0AIRGoogleMapMarker class]]) {
      ABI15_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI15_0_0AIRMap, got: %@", view);
    } else {
      [(ABI15_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI15_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI15_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI15_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI15_0_0Tag];
    if (![view isKindOfClass:[ABI15_0_0AIRGoogleMapMarker class]]) {
      ABI15_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI15_0_0AIRMap, got: %@", view);
    } else {
      [(ABI15_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
