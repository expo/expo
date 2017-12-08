/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI24_0_0AIRMapMarkerManager.h"

#import <ReactABI24_0_0/ABI24_0_0RCTConvert+CoreLocation.h>
#import <ReactABI24_0_0/ABI24_0_0RCTUIManager.h>
#import <ReactABI24_0_0/UIView+ReactABI24_0_0.h>
#import "ABI24_0_0AIRMapMarker.h"

@interface ABI24_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI24_0_0AIRMapMarkerManager

ABI24_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI24_0_0AIRMapMarker *marker = [ABI24_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    return marker;
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
//ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI24_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI24_0_0RCTBubblingEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI24_0_0RCTDirectEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI24_0_0RCTDirectEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI24_0_0RCTDirectEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI24_0_0RCTDirectEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI24_0_0RCTDirectEventBlock)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI24_0_0RCTDirectEventBlock)


ABI24_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI24_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI24_0_0Tag];
        if (![view isKindOfClass:[ABI24_0_0AIRMapMarker class]]) {
            ABI24_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI24_0_0AIRMap, got: %@", view);
        } else {
            [(ABI24_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI24_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI24_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI24_0_0Tag];
        if (![view isKindOfClass:[ABI24_0_0AIRMapMarker class]]) {
            ABI24_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI24_0_0AIRMap, got: %@", view);
        } else {
            [(ABI24_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

@end
