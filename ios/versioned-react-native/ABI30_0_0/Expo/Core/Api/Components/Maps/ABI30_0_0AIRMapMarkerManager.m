/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI30_0_0AIRMapMarkerManager.h"

#import <ReactABI30_0_0/ABI30_0_0RCTConvert+CoreLocation.h>
#import <ReactABI30_0_0/ABI30_0_0RCTUIManager.h>
#import <ReactABI30_0_0/UIView+ReactABI30_0_0.h>
#import "ABI30_0_0AIRMapMarker.h"

@interface ABI30_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI30_0_0AIRMapMarkerManager

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI30_0_0AIRMapMarker *marker = [ABI30_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    return marker;
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
//ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI30_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI30_0_0RCTBubblingEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI30_0_0RCTDirectEventBlock)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI30_0_0RCTDirectEventBlock)


ABI30_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI30_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI30_0_0Tag];
        if (![view isKindOfClass:[ABI30_0_0AIRMapMarker class]]) {
            ABI30_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI30_0_0AIRMap, got: %@", view);
        } else {
            [(ABI30_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI30_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI30_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI30_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI30_0_0Tag];
        if (![view isKindOfClass:[ABI30_0_0AIRMapMarker class]]) {
            ABI30_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI30_0_0AIRMap, got: %@", view);
        } else {
            [(ABI30_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

@end
