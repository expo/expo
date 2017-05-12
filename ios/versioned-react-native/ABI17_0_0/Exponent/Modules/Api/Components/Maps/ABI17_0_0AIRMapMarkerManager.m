/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0AIRMapMarkerManager.h"

#import <ReactABI17_0_0/ABI17_0_0RCTConvert+CoreLocation.h>
#import <ReactABI17_0_0/ABI17_0_0RCTUIManager.h>
#import <ReactABI17_0_0/UIView+ReactABI17_0_0.h>
#import "ABI17_0_0AIRMapMarker.h"

@interface ABI17_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI17_0_0AIRMapMarkerManager

ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI17_0_0AIRMapMarker *marker = [ABI17_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    return marker;
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
//ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI17_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI17_0_0RCTBubblingEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI17_0_0RCTDirectEventBlock)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI17_0_0RCTDirectEventBlock)


ABI17_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI17_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI17_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI17_0_0Tag];
        if (![view isKindOfClass:[ABI17_0_0AIRMapMarker class]]) {
            ABI17_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI17_0_0AIRMap, got: %@", view);
        } else {
            [(ABI17_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI17_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI17_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI17_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI17_0_0Tag];
        if (![view isKindOfClass:[ABI17_0_0AIRMapMarker class]]) {
            ABI17_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI17_0_0AIRMap, got: %@", view);
        } else {
            [(ABI17_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

@end
