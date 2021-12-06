//
//  ABI44_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#ifdef ABI44_0_0HAVE_GOOGLE_MAPS

#import "ABI44_0_0AIRGoogleMapMarkerManager.h"
#import "ABI44_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ABI44_0_0React/ABI44_0_0RCTUIManager.h>
#import "ABI44_0_0RCTConvert+AirMap.h"

@implementation ABI44_0_0AIRGoogleMapMarkerManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI44_0_0AIRGoogleMapMarker *marker = [ABI44_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  marker.isAccessibilityElement = YES;
  marker.accessibilityElementsHidden = NO;
  return marker;
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI44_0_0RCTBubblingEventBlock)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(icon, iconSrc, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI44_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(calloutAnchor, CGPoint)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(flat, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI44_0_0RCTDirectEventBlock)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI44_0_0RCTDirectEventBlock)

ABI44_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI44_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI44_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI44_0_0ReactTag];
    if (![view isKindOfClass:[ABI44_0_0AIRGoogleMapMarker class]]) {
      ABI44_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI44_0_0AIRMap, got: %@", view);
    } else {
      [(ABI44_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI44_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI44_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI44_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI44_0_0ReactTag];
    if (![view isKindOfClass:[ABI44_0_0AIRGoogleMapMarker class]]) {
      ABI44_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI44_0_0AIRMap, got: %@", view);
    } else {
      [(ABI44_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}

ABI44_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI44_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI44_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI44_0_0ReactTag];
        if (![view isKindOfClass:[ABI44_0_0AIRGoogleMapMarker class]]) {
            ABI44_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI44_0_0AIRMap, got: %@", view);
        } else {
            ABI44_0_0AIRGoogleMapMarker* marker = (ABI44_0_0AIRGoogleMapMarker *) view;
            
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

ABI44_0_0RCT_EXPORT_METHOD(redraw:(nonnull NSNumber *)ABI44_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI44_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI44_0_0ReactTag];
    if (![view isKindOfClass:[ABI44_0_0AIRGoogleMapMarker class]]) {
      ABI44_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI44_0_0AIRMap, got: %@", view);
    } else {
      [(ABI44_0_0AIRGoogleMapMarker *) view redraw];
    }
  }];
}
@end

#endif
