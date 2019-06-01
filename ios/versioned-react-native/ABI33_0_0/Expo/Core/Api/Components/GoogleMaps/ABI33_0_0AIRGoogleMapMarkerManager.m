//
//  ABI33_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#ifdef ABI33_0_0HAVE_GOOGLE_MAPS

#import "ABI33_0_0AIRGoogleMapMarkerManager.h"
#import "ABI33_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI33_0_0/ABI33_0_0RCTUIManager.h>
#import "ABI33_0_0RCTConvert+AirMap.h"

@implementation ABI33_0_0AIRGoogleMapMarkerManager

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI33_0_0AIRGoogleMapMarker *marker = [ABI33_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  marker.isAccessibilityElement = YES;
  marker.accessibilityElementsHidden = NO;
  return marker;
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI33_0_0RCTBubblingEventBlock)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(icon, iconSrc, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(calloutAnchor, CGPoint)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI33_0_0RCTDirectEventBlock)

ABI33_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI33_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMapMarker class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRMap, got: %@", view);
    } else {
      [(ABI33_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI33_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMapMarker class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRMap, got: %@", view);
    } else {
      [(ABI33_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ReactABI33_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI33_0_0Tag];
        if (![view isKindOfClass:[ABI33_0_0AIRGoogleMapMarker class]]) {
            ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRMap, got: %@", view);
        } else {
            ABI33_0_0AIRGoogleMapMarker* marker = (ABI33_0_0AIRGoogleMapMarker *) view;
            
            [NSTimer scheduledTimerWithTimeInterval:0.0
                                             target:[NSBlockOperation blockOperationWithBlock:^{
                [marker hideCalloutView];
                [marker showCalloutView];
            }]
                                           selector:@selector(main)
                                           userInfo:nil
                                            repeats:NO
             ];
        }
    }];
}

ABI33_0_0RCT_EXPORT_METHOD(redraw:(nonnull NSNumber *)ReactABI33_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0AIRGoogleMapMarker class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRMap, got: %@", view);
    } else {
      [(ABI33_0_0AIRGoogleMapMarker *) view redraw];
    }
  }];
}
@end

#endif
