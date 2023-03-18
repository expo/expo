//
//  ABI48_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#ifdef ABI48_0_0HAVE_GOOGLE_MAPS

#import "ABI48_0_0AIRGoogleMapMarkerManager.h"
#import "ABI48_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ABI48_0_0React/ABI48_0_0RCTUIManager.h>
#import "ABI48_0_0RCTConvert+AirMap.h"

@implementation ABI48_0_0AIRGoogleMapMarkerManager

ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI48_0_0AIRGoogleMapMarker *marker = [ABI48_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  marker.isAccessibilityElement = YES;
  marker.accessibilityElementsHidden = NO;
  return marker;
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI48_0_0RCTBubblingEventBlock)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(icon, iconSrc, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI48_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(calloutAnchor, CGPoint)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(flat, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI48_0_0RCTDirectEventBlock)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI48_0_0RCTDirectEventBlock)

ABI48_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI48_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI48_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI48_0_0ReactTag];
    if (![view isKindOfClass:[ABI48_0_0AIRGoogleMapMarker class]]) {
      ABI48_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI48_0_0AIRMap, got: %@", view);
    } else {
      [(ABI48_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI48_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI48_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI48_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI48_0_0ReactTag];
    if (![view isKindOfClass:[ABI48_0_0AIRGoogleMapMarker class]]) {
      ABI48_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI48_0_0AIRMap, got: %@", view);
    } else {
      [(ABI48_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}

ABI48_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI48_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI48_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI48_0_0ReactTag];
        if (![view isKindOfClass:[ABI48_0_0AIRGoogleMapMarker class]]) {
            ABI48_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI48_0_0AIRMap, got: %@", view);
        } else {
            ABI48_0_0AIRGoogleMapMarker* marker = (ABI48_0_0AIRGoogleMapMarker *) view;
            
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

ABI48_0_0RCT_EXPORT_METHOD(redraw:(nonnull NSNumber *)ABI48_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI48_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI48_0_0ReactTag];
    if (![view isKindOfClass:[ABI48_0_0AIRGoogleMapMarker class]]) {
      ABI48_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI48_0_0AIRMap, got: %@", view);
    } else {
      [(ABI48_0_0AIRGoogleMapMarker *) view redraw];
    }
  }];
}
@end

#endif
