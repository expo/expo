/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI22_0_0AIRMapMarkerManager.h"

#import <ReactABI22_0_0/ABI22_0_0RCTConvert+CoreLocation.h>
#import <ReactABI22_0_0/ABI22_0_0RCTUIManager.h>
#import <ReactABI22_0_0/UIView+ReactABI22_0_0.h>
#import "ABI22_0_0AIRMapMarker.h"

@interface ABI22_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI22_0_0AIRMapMarkerManager

ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI22_0_0AIRMapMarker *marker = [ABI22_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    return marker;
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
//ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI22_0_0RCTBubblingEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI22_0_0RCTDirectEventBlock)


ABI22_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI22_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI22_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI22_0_0Tag];
        if (![view isKindOfClass:[ABI22_0_0AIRMapMarker class]]) {
            ABI22_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI22_0_0AIRMap, got: %@", view);
        } else {
            [(ABI22_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI22_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI22_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI22_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI22_0_0Tag];
        if (![view isKindOfClass:[ABI22_0_0AIRMapMarker class]]) {
            ABI22_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI22_0_0AIRMap, got: %@", view);
        } else {
            [(ABI22_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

@end
