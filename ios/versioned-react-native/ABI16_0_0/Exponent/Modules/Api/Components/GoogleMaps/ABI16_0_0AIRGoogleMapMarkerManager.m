//
//  ABI16_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "ABI16_0_0AIRGoogleMapMarkerManager.h"
#import "ABI16_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI16_0_0/ABI16_0_0RCTConvert+MapKit.h>
#import <ReactABI16_0_0/ABI16_0_0RCTUIManager.h>

@implementation ABI16_0_0AIRGoogleMapMarkerManager

ABI16_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI16_0_0AIRGoogleMapMarker *marker = [ABI16_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI16_0_0RCTBubblingEventBlock)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI16_0_0RCTDirectEventBlock)

ABI16_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI16_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI16_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI16_0_0Tag];
    if (![view isKindOfClass:[ABI16_0_0AIRGoogleMapMarker class]]) {
      ABI16_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI16_0_0AIRMap, got: %@", view);
    } else {
      [(ABI16_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI16_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI16_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI16_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI16_0_0Tag];
    if (![view isKindOfClass:[ABI16_0_0AIRGoogleMapMarker class]]) {
      ABI16_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI16_0_0AIRMap, got: %@", view);
    } else {
      [(ABI16_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
