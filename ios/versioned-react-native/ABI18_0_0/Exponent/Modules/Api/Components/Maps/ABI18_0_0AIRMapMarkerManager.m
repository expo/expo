/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI18_0_0AIRMapMarkerManager.h"

#import <ReactABI18_0_0/ABI18_0_0RCTConvert+CoreLocation.h>
#import <ReactABI18_0_0/ABI18_0_0RCTUIManager.h>
#import <ReactABI18_0_0/UIView+ReactABI18_0_0.h>
#import "ABI18_0_0AIRMapMarker.h"

@interface ABI18_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI18_0_0AIRMapMarkerManager

ABI18_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI18_0_0AIRMapMarker *marker = [ABI18_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    return marker;
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
//ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI18_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI18_0_0RCTBubblingEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI18_0_0RCTDirectEventBlock)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI18_0_0RCTDirectEventBlock)


ABI18_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI18_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI18_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI18_0_0Tag];
        if (![view isKindOfClass:[ABI18_0_0AIRMapMarker class]]) {
            ABI18_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI18_0_0AIRMap, got: %@", view);
        } else {
            [(ABI18_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI18_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI18_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI18_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI18_0_0Tag];
        if (![view isKindOfClass:[ABI18_0_0AIRMapMarker class]]) {
            ABI18_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI18_0_0AIRMap, got: %@", view);
        } else {
            [(ABI18_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

@end
