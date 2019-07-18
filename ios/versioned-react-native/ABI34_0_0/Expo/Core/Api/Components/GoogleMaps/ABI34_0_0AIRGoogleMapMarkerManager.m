//
//  ABI34_0_0AIRGoogleMapMarkerManager.m
//  AirMaps
//
//  Created by Gil Birman on 9/2/16.
//

#ifdef ABI34_0_0HAVE_GOOGLE_MAPS

#import "ABI34_0_0AIRGoogleMapMarkerManager.h"
#import "ABI34_0_0AIRGoogleMapMarker.h"
#import <MapKit/MapKit.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUIManager.h>
#import "ABI34_0_0RCTConvert+AirMap.h"

@implementation ABI34_0_0AIRGoogleMapMarkerManager

ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI34_0_0AIRGoogleMapMarker *marker = [ABI34_0_0AIRGoogleMapMarker new];
//  UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
//  // setting this to NO allows the parent MapView to continue receiving marker selection events
//  tapGestureRecognizer.cancelsTouchesInView = NO;
//  [marker addGestureRecognizer:tapGestureRecognizer];
  marker.bridge = self.bridge;
  marker.isAccessibilityElement = YES;
  marker.accessibilityElementsHidden = NO;
  return marker;
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(rotation, CLLocationDegrees)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI34_0_0RCTBubblingEventBlock)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(icon, iconSrc, NSString)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(anchor, CGPoint)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(calloutAnchor, CGPoint)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(tracksViewChanges, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(tracksInfoWindowChanges, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI34_0_0RCTDirectEventBlock)

ABI34_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI34_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI34_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI34_0_0Tag];
    if (![view isKindOfClass:[ABI34_0_0AIRGoogleMapMarker class]]) {
      ABI34_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI34_0_0AIRMap, got: %@", view);
    } else {
      [(ABI34_0_0AIRGoogleMapMarker *) view showCalloutView];
    }
  }];
}

ABI34_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI34_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI34_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI34_0_0Tag];
    if (![view isKindOfClass:[ABI34_0_0AIRGoogleMapMarker class]]) {
      ABI34_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI34_0_0AIRMap, got: %@", view);
    } else {
      [(ABI34_0_0AIRGoogleMapMarker *) view hideCalloutView];
    }
  }];
}

ABI34_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ReactABI34_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI34_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI34_0_0Tag];
        if (![view isKindOfClass:[ABI34_0_0AIRGoogleMapMarker class]]) {
            ABI34_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI34_0_0AIRMap, got: %@", view);
        } else {
            ABI34_0_0AIRGoogleMapMarker* marker = (ABI34_0_0AIRGoogleMapMarker *) view;
            
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

ABI34_0_0RCT_EXPORT_METHOD(redraw:(nonnull NSNumber *)ReactABI34_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI34_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI34_0_0Tag];
    if (![view isKindOfClass:[ABI34_0_0AIRGoogleMapMarker class]]) {
      ABI34_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI34_0_0AIRMap, got: %@", view);
    } else {
      [(ABI34_0_0AIRGoogleMapMarker *) view redraw];
    }
  }];
}
@end

#endif
