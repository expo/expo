//
//  ABI43_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#ifdef ABI43_0_0HAVE_GOOGLE_MAPS

#import "ABI43_0_0AIRGoogleMapMarkerManager.h"
#import "ABI43_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ABI43_0_0React/ABI43_0_0RCTUIManager.h>
#import "ABI43_0_0RCTConvert+AirMap.h"

@implementation ABI43_0_0AIRGoogleMapMarkerManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI43_0_0AIRGoogleMapMarker *marker = [ABI43_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  marker.isAccessibilityElement = YES;
  marker.accessibilityElementsHidden = NO;
  return marker;
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI43_0_0RCTBubblingEventBlock)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(icon, iconSrc, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI43_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(calloutAnchor, CGPoint)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(flat, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI43_0_0RCTDirectEventBlock)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI43_0_0RCTDirectEventBlock)

ABI43_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI43_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI43_0_0ReactTag];
    if (![view isKindOfClass:[ABI43_0_0AIRGoogleMapMarker class]]) {
      ABI43_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI43_0_0AIRMap, got: %@", view);
    } else {
      [(ABI43_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI43_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI43_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI43_0_0ReactTag];
    if (![view isKindOfClass:[ABI43_0_0AIRGoogleMapMarker class]]) {
      ABI43_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI43_0_0AIRMap, got: %@", view);
    } else {
      [(ABI43_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}

ABI43_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI43_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI43_0_0ReactTag];
        if (![view isKindOfClass:[ABI43_0_0AIRGoogleMapMarker class]]) {
            ABI43_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI43_0_0AIRMap, got: %@", view);
        } else {
            ABI43_0_0AIRGoogleMapMarker* marker = (ABI43_0_0AIRGoogleMapMarker *) view;
            
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

ABI43_0_0RCT_EXPORT_METHOD(redraw:(nonnull NSNumber *)ABI43_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI43_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI43_0_0ReactTag];
    if (![view isKindOfClass:[ABI43_0_0AIRGoogleMapMarker class]]) {
      ABI43_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI43_0_0AIRMap, got: %@", view);
    } else {
      [(ABI43_0_0AIRGoogleMapMarker *) view redraw];
    }
  }];
}
@end

#endif
