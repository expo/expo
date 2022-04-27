//
//  ABI45_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#ifdef ABI45_0_0HAVE_GOOGLE_MAPS

#import "ABI45_0_0AIRGoogleMapMarkerManager.h"
#import "ABI45_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ABI45_0_0React/ABI45_0_0RCTUIManager.h>
#import "ABI45_0_0RCTConvert+AirMap.h"

@implementation ABI45_0_0AIRGoogleMapMarkerManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI45_0_0AIRGoogleMapMarker *marker = [ABI45_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  marker.isAccessibilityElement = YES;
  marker.accessibilityElementsHidden = NO;
  return marker;
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI45_0_0RCTBubblingEventBlock)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(icon, iconSrc, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI45_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(calloutAnchor, CGPoint)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(flat, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI45_0_0RCTDirectEventBlock)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI45_0_0RCTDirectEventBlock)

ABI45_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI45_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI45_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI45_0_0ReactTag];
    if (![view isKindOfClass:[ABI45_0_0AIRGoogleMapMarker class]]) {
      ABI45_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI45_0_0AIRMap, got: %@", view);
    } else {
      [(ABI45_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI45_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI45_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI45_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI45_0_0ReactTag];
    if (![view isKindOfClass:[ABI45_0_0AIRGoogleMapMarker class]]) {
      ABI45_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI45_0_0AIRMap, got: %@", view);
    } else {
      [(ABI45_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}

ABI45_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI45_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI45_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI45_0_0ReactTag];
        if (![view isKindOfClass:[ABI45_0_0AIRGoogleMapMarker class]]) {
            ABI45_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI45_0_0AIRMap, got: %@", view);
        } else {
            ABI45_0_0AIRGoogleMapMarker* marker = (ABI45_0_0AIRGoogleMapMarker *) view;
            
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

ABI45_0_0RCT_EXPORT_METHOD(redraw:(nonnull NSNumber *)ABI45_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI45_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI45_0_0ReactTag];
    if (![view isKindOfClass:[ABI45_0_0AIRGoogleMapMarker class]]) {
      ABI45_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI45_0_0AIRMap, got: %@", view);
    } else {
      [(ABI45_0_0AIRGoogleMapMarker *) view redraw];
    }
  }];
}
@end

#endif
