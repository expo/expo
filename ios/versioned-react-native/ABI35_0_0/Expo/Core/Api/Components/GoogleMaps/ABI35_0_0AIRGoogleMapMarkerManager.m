//
//  ABI35_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#ifdef ABI35_0_0HAVE_GOOGLE_MAPS

#import "ABI35_0_0AIRGoogleMapMarkerManager.h"
#import "ABI35_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI35_0_0/ABI35_0_0RCTUIManager.h>
#import "ABI35_0_0RCTConvert+AirMap.h"

@implementation ABI35_0_0AIRGoogleMapMarkerManager

ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI35_0_0AIRGoogleMapMarker *marker = [ABI35_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  marker.isAccessibilityElement = YES;
  marker.accessibilityElementsHidden = NO;
  return marker;
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI35_0_0RCTBubblingEventBlock)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(icon, iconSrc, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(calloutAnchor, CGPoint)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI35_0_0RCTDirectEventBlock)

ABI35_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI35_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI35_0_0Tag];
    if (![view isKindOfClass:[ABI35_0_0AIRGoogleMapMarker class]]) {
      ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0AIRMap, got: %@", view);
    } else {
      [(ABI35_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI35_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI35_0_0Tag];
    if (![view isKindOfClass:[ABI35_0_0AIRGoogleMapMarker class]]) {
      ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0AIRMap, got: %@", view);
    } else {
      [(ABI35_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ReactABI35_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI35_0_0Tag];
        if (![view isKindOfClass:[ABI35_0_0AIRGoogleMapMarker class]]) {
            ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0AIRMap, got: %@", view);
        } else {
            ABI35_0_0AIRGoogleMapMarker* marker = (ABI35_0_0AIRGoogleMapMarker *) view;
            
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

ABI35_0_0RCT_EXPORT_METHOD(redraw:(nonnull NSNumber *)ReactABI35_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI35_0_0Tag];
    if (![view isKindOfClass:[ABI35_0_0AIRGoogleMapMarker class]]) {
      ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0AIRMap, got: %@", view);
    } else {
      [(ABI35_0_0AIRGoogleMapMarker *) view redraw];
    }
  }];
}
@end

#endif
