/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0AIRMapMarkerManager.h"

#import "ABI12_0_0RCTUIManager.h"
#import "ABI12_0_0RCTConvert+CoreLocation.h"
#import "UIView+ReactABI12_0_0.h"
#import "ABI12_0_0AIRMapMarker.h"

@interface ABI12_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI12_0_0AIRMapMarkerManager

ABI12_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI12_0_0AIRMapMarker *marker = [ABI12_0_0AIRMapMarker new];
    UITapGestureRecognizer *tapGestureRecognizer = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(_handleTap:)];
    // setting this to NO allows the parent MapView to continue receiving marker selection events
    tapGestureRecognizer.cancelsTouchesInView = NO;
    [marker addGestureRecognizer:tapGestureRecognizer];
    marker.bridge = self.bridge;
    return marker;
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
//ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI12_0_0RCTBubblingEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI12_0_0RCTDirectEventBlock)


ABI12_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI12_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI12_0_0Tag];
        if (![view isKindOfClass:[ABI12_0_0AIRMapMarker class]]) {
            ABI12_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI12_0_0AIRMap, got: %@", view);
        } else {
            [(ABI12_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI12_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI12_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI12_0_0Tag];
        if (![view isKindOfClass:[ABI12_0_0AIRMapMarker class]]) {
            ABI12_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI12_0_0AIRMap, got: %@", view);
        } else {
            [(ABI12_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

#pragma mark - Events

- (void)_handleTap:(UITapGestureRecognizer *)recognizer {
    ABI12_0_0AIRMapMarker *marker = (ABI12_0_0AIRMapMarker *)recognizer.view;
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
