//
//  ABI27_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI27_0_0AIRGoogleMapMarkerManager.h"
#import "ABI27_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI27_0_0/ABI27_0_0RCTUIManager.h>
#import "ABI27_0_0RCTConvert+AirMap.h"

@implementation ABI27_0_0AIRGoogleMapMarkerManager

ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI27_0_0AIRGoogleMapMarker *marker = [ABI27_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI27_0_0RCTBubblingEventBlock)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI27_0_0RCTDirectEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI27_0_0RCTDirectEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI27_0_0RCTDirectEventBlock)

ABI27_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI27_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI27_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI27_0_0Tag];
    if (![view isKindOfClass:[ABI27_0_0AIRGoogleMapMarker class]]) {
      ABI27_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI27_0_0AIRMap, got: %@", view);
    } else {
      [(ABI27_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI27_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI27_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI27_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI27_0_0Tag];
    if (![view isKindOfClass:[ABI27_0_0AIRGoogleMapMarker class]]) {
      ABI27_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI27_0_0AIRMap, got: %@", view);
    } else {
      [(ABI27_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
