//
//  ABI14_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI14_0_0AIRGoogleMapMarkerManager.h"
#import "ABI14_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI14_0_0/ABI14_0_0RCTConvert+MapKit.h>
#import <ReactABI14_0_0/ABI14_0_0RCTUIManager.h>

@implementation ABI14_0_0AIRGoogleMapMarkerManager

ABI14_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI14_0_0AIRGoogleMapMarker *marker = [ABI14_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI14_0_0RCTBubblingEventBlock)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI14_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI14_0_0RCTDirectEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI14_0_0RCTDirectEventBlock)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI14_0_0RCTDirectEventBlock)

ABI14_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI14_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI14_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI14_0_0Tag];
    if (![view isKindOfClass:[ABI14_0_0AIRGoogleMapMarker class]]) {
      ABI14_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI14_0_0AIRMap, got: %@", view);
    } else {
      [(ABI14_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI14_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI14_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI14_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI14_0_0Tag];
    if (![view isKindOfClass:[ABI14_0_0AIRGoogleMapMarker class]]) {
      ABI14_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI14_0_0AIRMap, got: %@", view);
    } else {
      [(ABI14_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
