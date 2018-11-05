/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI28_0_0AIRMapMarkerManager.h"

#import <ReactABI28_0_0/ABI28_0_0RCTConvert+CoreLocation.h>
#import <ReactABI28_0_0/ABI28_0_0RCTUIManager.h>
#import <ReactABI28_0_0/UIView+ReactABI28_0_0.h>
#import "ABI28_0_0AIRMapMarker.h"

@interface ABI28_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI28_0_0AIRMapMarkerManager

ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI28_0_0AIRMapMarker *marker = [ABI28_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    return marker;
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
//ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI28_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI28_0_0RCTBubblingEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI28_0_0RCTDirectEventBlock)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI28_0_0RCTDirectEventBlock)


ABI28_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI28_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI28_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI28_0_0Tag];
        if (![view isKindOfClass:[ABI28_0_0AIRMapMarker class]]) {
            ABI28_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI28_0_0AIRMap, got: %@", view);
        } else {
            [(ABI28_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI28_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI28_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI28_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI28_0_0Tag];
        if (![view isKindOfClass:[ABI28_0_0AIRMapMarker class]]) {
            ABI28_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI28_0_0AIRMap, got: %@", view);
        } else {
            [(ABI28_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

@end
