//
//  ABI29_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI29_0_0AIRGoogleMapMarkerManager.h"
#import "ABI29_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUIManager.h>
#import "ABI29_0_0RCTConvert+AirMap.h"

@implementation ABI29_0_0AIRGoogleMapMarkerManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI29_0_0AIRGoogleMapMarker *marker = [ABI29_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI29_0_0RCTBubblingEventBlock)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI29_0_0RCTDirectEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI29_0_0RCTDirectEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI29_0_0RCTDirectEventBlock)

ABI29_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI29_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI29_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI29_0_0Tag];
    if (![view isKindOfClass:[ABI29_0_0AIRGoogleMapMarker class]]) {
      ABI29_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI29_0_0AIRMap, got: %@", view);
    } else {
      [(ABI29_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI29_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI29_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI29_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI29_0_0Tag];
    if (![view isKindOfClass:[ABI29_0_0AIRGoogleMapMarker class]]) {
      ABI29_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI29_0_0AIRMap, got: %@", view);
    } else {
      [(ABI29_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
