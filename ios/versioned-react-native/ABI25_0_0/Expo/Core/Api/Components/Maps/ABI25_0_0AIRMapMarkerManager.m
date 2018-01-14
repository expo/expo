/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0AIRMapMarkerManager.h"

#import <ReactABI25_0_0/ABI25_0_0RCTConvert+CoreLocation.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUIManager.h>
#import <ReactABI25_0_0/UIView+ReactABI25_0_0.h>
#import "ABI25_0_0AIRMapMarker.h"

@interface ABI25_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI25_0_0AIRMapMarkerManager

ABI25_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI25_0_0AIRMapMarker *marker = [ABI25_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    return marker;
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
//ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI25_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI25_0_0RCTBubblingEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI25_0_0RCTDirectEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI25_0_0RCTDirectEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI25_0_0RCTDirectEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI25_0_0RCTDirectEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI25_0_0RCTDirectEventBlock)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI25_0_0RCTDirectEventBlock)


ABI25_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI25_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI25_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI25_0_0Tag];
        if (![view isKindOfClass:[ABI25_0_0AIRMapMarker class]]) {
            ABI25_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI25_0_0AIRMap, got: %@", view);
        } else {
            [(ABI25_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI25_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI25_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI25_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI25_0_0Tag];
        if (![view isKindOfClass:[ABI25_0_0AIRMapMarker class]]) {
            ABI25_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI25_0_0AIRMap, got: %@", view);
        } else {
            [(ABI25_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

@end
