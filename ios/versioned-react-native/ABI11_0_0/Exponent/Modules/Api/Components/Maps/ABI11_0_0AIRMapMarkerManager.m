/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0AIRMapMarkerManager.h"

#import "ABI11_0_0RCTUIManager.h"
#import "ABI11_0_0RCTConvert+CoreLocation.h"
#import "UIView+ReactABI11_0_0.h"
#import "ABI11_0_0AIRMapMarker.h"

@interface ABI11_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI11_0_0AIRMapMarkerManager

ABI11_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI11_0_0AIRMapMarker *marker = [ABI11_0_0AIRMapMarker new];
    UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
    // setting this to NO allows the parent MapView to continue receiving marker selection events
    tapGestureRecognizer.cancelsTouchesInView = NO;
    [marker addGestureRecognizer:tapGestureRecognizer];
    marker.bridge = self.bridge;
    return marker;
}

ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
//ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI11_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)

ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI11_0_0RCTBubblingEventBlock)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI11_0_0RCTDirectEventBlock)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI11_0_0RCTDirectEventBlock)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI11_0_0RCTDirectEventBlock)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI11_0_0RCTDirectEventBlock)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI11_0_0RCTDirectEventBlock)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI11_0_0RCTDirectEventBlock)


ABI11_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI11_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI11_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI11_0_0Tag];
        if (![view isKindOfClass:[ABI11_0_0AIRMapMarker class]]) {
            ABI11_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI11_0_0AIRMap, got: %@", view);
        } else {
            [(ABI11_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI11_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI11_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI11_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI11_0_0Tag];
        if (![view isKindOfClass:[ABI11_0_0AIRMapMarker class]]) {
            ABI11_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI11_0_0AIRMap, got: %@", view);
        } else {
            [(ABI11_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

#pragma mark - Events

- (void)_handleTap:(UITapGestureRecognizer *)recognizer {
    ABI11_0_0AIRMapMarker *marker = (ABI11_0_0AIRMapMarker *)recognizer.view;
    if (!marker) return;

    if (marker.selected) {
        CGPoint touchPoint = [recognizer locationInView:marker.map.calloutView];
        if ([marker.map.calloutView hitTest:touchPoint withEvent:nil]) {

            // the callout got clicked, not the marker
            id event = @{
                    @"action": @"callout-press",
            };

            if (marker.onCalloutPress) marker.onCalloutPress(event);
            if (marker.calloutView && marker.calloutView.onPress) marker.calloutView.onPress(event);
            if (marker.map.onCalloutPress) marker.map.onCalloutPress(event);
            return;
        }
    }

    // the actual marker got clicked
    id event = @{
            @"action": @"marker-press",
            @"id": marker.identifier ?: @"unknown",
            @"coordinate": @{
                    @"latitude": @(marker.coordinate.latitude),
                    @"longitude": @(marker.coordinate.longitude)
            }
    };

    if (marker.onPress) marker.onPress(event);
    if (marker.map.onMarkerPress) marker.map.onMarkerPress(event);
}

@end
