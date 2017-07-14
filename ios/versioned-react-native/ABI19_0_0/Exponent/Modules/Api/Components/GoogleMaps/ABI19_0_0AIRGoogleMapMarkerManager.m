//
//  ABI19_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI19_0_0AIRGoogleMapMarkerManager.h"
#import "ABI19_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI19_0_0/ABI19_0_0RCTUIManager.h>
#import "ABI19_0_0RCTConvert+AirMap.h"

@implementation ABI19_0_0AIRGoogleMapMarkerManager

ABI19_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI19_0_0AIRGoogleMapMarker *marker = [ABI19_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI19_0_0RCTBubblingEventBlock)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI19_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI19_0_0RCTDirectEventBlock)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI19_0_0RCTDirectEventBlock)

ABI19_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI19_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI19_0_0Tag];
    if (![view isKindOfClass:[ABI19_0_0AIRGoogleMapMarker class]]) {
      ABI19_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI19_0_0AIRMap, got: %@", view);
    } else {
      [(ABI19_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI19_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI19_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI19_0_0Tag];
    if (![view isKindOfClass:[ABI19_0_0AIRGoogleMapMarker class]]) {
      ABI19_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI19_0_0AIRMap, got: %@", view);
    } else {
      [(ABI19_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
