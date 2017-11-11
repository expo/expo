/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0AIRMapMarkerManager.h"

#import <ReactABI23_0_0/ABI23_0_0RCTConvert+CoreLocation.h>
#import <ReactABI23_0_0/ABI23_0_0RCTUIManager.h>
#import <ReactABI23_0_0/UIView+ReactABI23_0_0.h>
#import "ABI23_0_0AIRMapMarker.h"

@interface ABI23_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI23_0_0AIRMapMarkerManager

ABI23_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI23_0_0AIRMapMarker *marker = [ABI23_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    return marker;
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
//ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI23_0_0RCTBubblingEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI23_0_0RCTDirectEventBlock)


ABI23_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI23_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI23_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI23_0_0Tag];
        if (![view isKindOfClass:[ABI23_0_0AIRMapMarker class]]) {
            ABI23_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI23_0_0AIRMap, got: %@", view);
        } else {
            [(ABI23_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI23_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI23_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI23_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI23_0_0Tag];
        if (![view isKindOfClass:[ABI23_0_0AIRMapMarker class]]) {
            ABI23_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI23_0_0AIRMap, got: %@", view);
        } else {
            [(ABI23_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

@end
