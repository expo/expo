/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI21_0_0AIRMapMarkerManager.h"

#import <ReactABI21_0_0/ABI21_0_0RCTConvert+CoreLocation.h>
#import <ReactABI21_0_0/ABI21_0_0RCTUIManager.h>
#import <ReactABI21_0_0/UIView+ReactABI21_0_0.h>
#import "ABI21_0_0AIRMapMarker.h"

@interface ABI21_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI21_0_0AIRMapMarkerManager

ABI21_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI21_0_0AIRMapMarker *marker = [ABI21_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    return marker;
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
//ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI21_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI21_0_0RCTBubblingEventBlock)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI21_0_0RCTDirectEventBlock)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI21_0_0RCTDirectEventBlock)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI21_0_0RCTDirectEventBlock)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI21_0_0RCTDirectEventBlock)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI21_0_0RCTDirectEventBlock)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI21_0_0RCTDirectEventBlock)


ABI21_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI21_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI21_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI21_0_0Tag];
        if (![view isKindOfClass:[ABI21_0_0AIRMapMarker class]]) {
            ABI21_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI21_0_0AIRMap, got: %@", view);
        } else {
            [(ABI21_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI21_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI21_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI21_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI21_0_0Tag];
        if (![view isKindOfClass:[ABI21_0_0AIRMapMarker class]]) {
            ABI21_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI21_0_0AIRMap, got: %@", view);
        } else {
            [(ABI21_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

@end
