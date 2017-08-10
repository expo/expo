/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI20_0_0AIRMapMarkerManager.h"

#import <ReactABI20_0_0/ABI20_0_0RCTConvert+CoreLocation.h>
#import <ReactABI20_0_0/ABI20_0_0RCTUIManager.h>
#import <ReactABI20_0_0/UIView+ReactABI20_0_0.h>
#import "ABI20_0_0AIRMapMarker.h"

@interface ABI20_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI20_0_0AIRMapMarkerManager

ABI20_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI20_0_0AIRMapMarker *marker = [ABI20_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    return marker;
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
//ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI20_0_0RCTBubblingEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI20_0_0RCTDirectEventBlock)


ABI20_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI20_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI20_0_0Tag];
        if (![view isKindOfClass:[ABI20_0_0AIRMapMarker class]]) {
            ABI20_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI20_0_0AIRMap, got: %@", view);
        } else {
            [(ABI20_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI20_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI20_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI20_0_0Tag];
        if (![view isKindOfClass:[ABI20_0_0AIRMapMarker class]]) {
            ABI20_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI20_0_0AIRMap, got: %@", view);
        } else {
            [(ABI20_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

@end
