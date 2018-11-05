/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI27_0_0AIRMapMarkerManager.h"

#import <ReactABI27_0_0/ABI27_0_0RCTConvert+CoreLocation.h>
#import <ReactABI27_0_0/ABI27_0_0RCTUIManager.h>
#import <ReactABI27_0_0/UIView+ReactABI27_0_0.h>
#import "ABI27_0_0AIRMapMarker.h"

@interface ABI27_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI27_0_0AIRMapMarkerManager

ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI27_0_0AIRMapMarker *marker = [ABI27_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    return marker;
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
//ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI27_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI27_0_0RCTBubblingEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI27_0_0RCTDirectEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI27_0_0RCTDirectEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI27_0_0RCTDirectEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI27_0_0RCTDirectEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI27_0_0RCTDirectEventBlock)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI27_0_0RCTDirectEventBlock)


ABI27_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI27_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI27_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI27_0_0Tag];
        if (![view isKindOfClass:[ABI27_0_0AIRMapMarker class]]) {
            ABI27_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI27_0_0AIRMap, got: %@", view);
        } else {
            [(ABI27_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI27_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI27_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI27_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI27_0_0Tag];
        if (![view isKindOfClass:[ABI27_0_0AIRMapMarker class]]) {
            ABI27_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI27_0_0AIRMap, got: %@", view);
        } else {
            [(ABI27_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

@end
