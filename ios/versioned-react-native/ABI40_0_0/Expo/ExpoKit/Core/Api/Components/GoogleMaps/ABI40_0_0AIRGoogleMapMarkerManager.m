//
//  ABI40_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#ifdef ABI40_0_0HAVE_GOOGLE_MAPS

#import "ABI40_0_0AIRGoogleMapMarkerManager.h"
#import "ABI40_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ABI40_0_0React/ABI40_0_0RCTUIManager.h>
#import "ABI40_0_0RCTConvert+AirMap.h"

@implementation ABI40_0_0AIRGoogleMapMarkerManager

ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI40_0_0AIRGoogleMapMarker *marker = [ABI40_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  marker.isAccessibilityElement = YES;
  marker.accessibilityElementsHidden = NO;
  return marker;
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI40_0_0RCTBubblingEventBlock)
ABI40_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI40_0_0RCT_REMAP_VIEW_PROPERTY(icon, iconSrc, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI40_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI40_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(calloutAnchor, CGPoint)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(flat, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI40_0_0RCTDirectEventBlock)

ABI40_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI40_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI40_0_0ReactTag];
    if (![view isKindOfClass:[ABI40_0_0AIRGoogleMapMarker class]]) {
      ABI40_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI40_0_0AIRMap, got: %@", view);
    } else {
      [(ABI40_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI40_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI40_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI40_0_0ReactTag];
    if (![view isKindOfClass:[ABI40_0_0AIRGoogleMapMarker class]]) {
      ABI40_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI40_0_0AIRMap, got: %@", view);
    } else {
      [(ABI40_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}

ABI40_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI40_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI40_0_0ReactTag];
        if (![view isKindOfClass:[ABI40_0_0AIRGoogleMapMarker class]]) {
            ABI40_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI40_0_0AIRMap, got: %@", view);
        } else {
            ABI40_0_0AIRGoogleMapMarker* marker = (ABI40_0_0AIRGoogleMapMarker *) view;
            
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

ABI40_0_0RCT_EXPORT_METHOD(redraw:(nonnull NSNumber *)ABI40_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI40_0_0ReactTag];
    if (![view isKindOfClass:[ABI40_0_0AIRGoogleMapMarker class]]) {
      ABI40_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI40_0_0AIRMap, got: %@", view);
    } else {
      [(ABI40_0_0AIRGoogleMapMarker *) view redraw];
    }
  }];
}
@end

#endif
