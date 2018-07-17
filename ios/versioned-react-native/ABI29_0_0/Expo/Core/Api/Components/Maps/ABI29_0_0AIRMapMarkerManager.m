/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI29_0_0AIRMapMarkerManager.h"

#import <ReactABI29_0_0/ABI29_0_0RCTConvert+CoreLocation.h>
#import <ReactABI29_0_0/ABI29_0_0RCTUIManager.h>
#import <ReactABI29_0_0/UIView+ReactABI29_0_0.h>
#import "ABI29_0_0AIRMapMarker.h"

@interface ABI29_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI29_0_0AIRMapMarkerManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI29_0_0AIRMapMarker *marker = [ABI29_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    return marker;
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
//ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI29_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI29_0_0RCTBubblingEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI29_0_0RCTDirectEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI29_0_0RCTDirectEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI29_0_0RCTDirectEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI29_0_0RCTDirectEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI29_0_0RCTDirectEventBlock)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI29_0_0RCTDirectEventBlock)


ABI29_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI29_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI29_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI29_0_0Tag];
        if (![view isKindOfClass:[ABI29_0_0AIRMapMarker class]]) {
            ABI29_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI29_0_0AIRMap, got: %@", view);
        } else {
            [(ABI29_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI29_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI29_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI29_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI29_0_0Tag];
        if (![view isKindOfClass:[ABI29_0_0AIRMapMarker class]]) {
            ABI29_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI29_0_0AIRMap, got: %@", view);
        } else {
            [(ABI29_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

@end
