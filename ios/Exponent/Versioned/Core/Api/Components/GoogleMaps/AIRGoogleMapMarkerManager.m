//
//  AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#import "AIRGoogleMapMarkerManager.h"
#import "AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <React/RCTUIManager.h>
#import "RCTConvert+AirMap.h"

@implementation AIRGoogleMapMarkerManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  AIRGoogleMapMarker *marker = [AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  return marker;
}

RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)
RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
RCT_EXPORT_VIEW_PROPERTY(title, NSString)
RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
RCT_EXPORT_VIEW_PROPERTY(opacity, double)
RCT_EXPORT_VIEW_PROPERTY(onDragStart, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDrag, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onDragEnd, RCTDirectEventBlock)

RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)reactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[reactTag];
    if (![view isKindOfClass:[AIRGoogleMapMarker class]]) {
      RCTLogError(@"Invalid view returned from registry, expecting AIRMap, got: %@", view);
    } else {
      [(AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)reactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[reactTag];
    if (![view isKindOfClass:[AIRGoogleMapMarker class]]) {
      RCTLogError(@"Invalid view returned from registry, expecting AIRMap, got: %@", view);
    } else {
      [(AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}
@end
