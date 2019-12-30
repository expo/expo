//
//  ABI36_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#ifdef ABI36_0_0HAVE_GOOGLE_MAPS

#import "ABI36_0_0AIRGoogleMapMarkerManager.h"
#import "ABI36_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ABI36_0_0React/ABI36_0_0RCTUIManager.h>
#import "ABI36_0_0RCTConvert+AirMap.h"

@implementation ABI36_0_0AIRGoogleMapMarkerManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI36_0_0AIRGoogleMapMarker *marker = [ABI36_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  marker.isAccessibilityElement = YES;
  marker.accessibilityElementsHidden = NO;
  return marker;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI36_0_0RCTBubblingEventBlock)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(icon, iconSrc, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI36_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(calloutAnchor, CGPoint)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(flat, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI36_0_0RCTDirectEventBlock)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI36_0_0RCTDirectEventBlock)

ABI36_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI36_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI36_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI36_0_0ReactTag];
    if (![view isKindOfClass:[ABI36_0_0AIRGoogleMapMarker class]]) {
      ABI36_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI36_0_0AIRMap, got: %@", view);
    } else {
      [(ABI36_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI36_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI36_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI36_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI36_0_0ReactTag];
    if (![view isKindOfClass:[ABI36_0_0AIRGoogleMapMarker class]]) {
      ABI36_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI36_0_0AIRMap, got: %@", view);
    } else {
      [(ABI36_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}

ABI36_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI36_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI36_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI36_0_0ReactTag];
        if (![view isKindOfClass:[ABI36_0_0AIRGoogleMapMarker class]]) {
            ABI36_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI36_0_0AIRMap, got: %@", view);
        } else {
            ABI36_0_0AIRGoogleMapMarker* marker = (ABI36_0_0AIRGoogleMapMarker *) view;
            
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

ABI36_0_0RCT_EXPORT_METHOD(redraw:(nonnull NSNumber *)ABI36_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI36_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI36_0_0ReactTag];
    if (![view isKindOfClass:[ABI36_0_0AIRGoogleMapMarker class]]) {
      ABI36_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI36_0_0AIRMap, got: %@", view);
    } else {
      [(ABI36_0_0AIRGoogleMapMarker *) view redraw];
    }
  }];
}
@end

#endif
