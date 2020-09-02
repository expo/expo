//
//  ABI39_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#ifdef ABI39_0_0HAVE_GOOGLE_MAPS

#import "ABI39_0_0AIRGoogleMapMarkerManager.h"
#import "ABI39_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ABI39_0_0React/ABI39_0_0RCTUIManager.h>
#import "ABI39_0_0RCTConvert+AirMap.h"

@implementation ABI39_0_0AIRGoogleMapMarkerManager

ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI39_0_0AIRGoogleMapMarker *marker = [ABI39_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  marker.isAccessibilityElement = YES;
  marker.accessibilityElementsHidden = NO;
  return marker;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI39_0_0RCTBubblingEventBlock)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(icon, iconSrc, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI39_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(calloutAnchor, CGPoint)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(flat, BOOL)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI39_0_0RCTDirectEventBlock)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI39_0_0RCTDirectEventBlock)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI39_0_0RCTDirectEventBlock)

ABI39_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI39_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI39_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI39_0_0ReactTag];
    if (![view isKindOfClass:[ABI39_0_0AIRGoogleMapMarker class]]) {
      ABI39_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI39_0_0AIRMap, got: %@", view);
    } else {
      [(ABI39_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI39_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI39_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI39_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI39_0_0ReactTag];
    if (![view isKindOfClass:[ABI39_0_0AIRGoogleMapMarker class]]) {
      ABI39_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI39_0_0AIRMap, got: %@", view);
    } else {
      [(ABI39_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}

ABI39_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI39_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI39_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI39_0_0ReactTag];
        if (![view isKindOfClass:[ABI39_0_0AIRGoogleMapMarker class]]) {
            ABI39_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI39_0_0AIRMap, got: %@", view);
        } else {
            ABI39_0_0AIRGoogleMapMarker* marker = (ABI39_0_0AIRGoogleMapMarker *) view;
            
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

ABI39_0_0RCT_EXPORT_METHOD(redraw:(nonnull NSNumber *)ABI39_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI39_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ABI39_0_0ReactTag];
    if (![view isKindOfClass:[ABI39_0_0AIRGoogleMapMarker class]]) {
      ABI39_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI39_0_0AIRMap, got: %@", view);
    } else {
      [(ABI39_0_0AIRGoogleMapMarker *) view redraw];
    }
  }];
}
@end

#endif
