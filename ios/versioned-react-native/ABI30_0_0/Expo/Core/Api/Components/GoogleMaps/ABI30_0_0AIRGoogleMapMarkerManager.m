//
//  ABI30_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI30_0_0AIRGoogleMapMarkerManager.h"
#import "ABI30_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManager.h>
#import "ABI30_0_0RCTConvert+AirMap.h"

@implementation ABI30_0_0AIRGoogleMapMarkerManager

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI30_0_0AIRGoogleMapMarker *marker = [ABI30_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI30_0_0RCTBubblingEventBlock)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI30_0_0RCTDirectEventBlock)

ABI30_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI30_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI30_0_0Tag];
    if (![view isKindOfClass:[ABI30_0_0AIRGoogleMapMarker class]]) {
      ABI30_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI30_0_0AIRMap, got: %@", view);
    } else {
      [(ABI30_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI30_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI30_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI30_0_0Tag];
    if (![view isKindOfClass:[ABI30_0_0AIRGoogleMapMarker class]]) {
      ABI30_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI30_0_0AIRMap, got: %@", view);
    } else {
      [(ABI30_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
