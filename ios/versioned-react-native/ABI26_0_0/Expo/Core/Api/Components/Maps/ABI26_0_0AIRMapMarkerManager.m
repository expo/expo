/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0AIRMapMarkerManager.h"

#import <ReactABI26_0_0/ABI26_0_0RCTConvert+CoreLocation.h>
#import <ReactABI26_0_0/ABI26_0_0RCTUIManager.h>
#import <ReactABI26_0_0/UIView+ReactABI26_0_0.h>
#import "ABI26_0_0AIRMapMarker.h"

@interface ABI26_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI26_0_0AIRMapMarkerManager

ABI26_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI26_0_0AIRMapMarker *marker = [ABI26_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    return marker;
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
//ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI26_0_0RCTBubblingEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI26_0_0RCTDirectEventBlock)


ABI26_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI26_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI26_0_0Tag];
        if (![view isKindOfClass:[ABI26_0_0AIRMapMarker class]]) {
            ABI26_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI26_0_0AIRMap, got: %@", view);
        } else {
            [(ABI26_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI26_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI26_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI26_0_0Tag];
        if (![view isKindOfClass:[ABI26_0_0AIRMapMarker class]]) {
            ABI26_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI26_0_0AIRMap, got: %@", view);
        } else {
            [(ABI26_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

@end
