/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI33_0_0AIRMapMarkerManager.h"

#import <ReactABI33_0_0/ABI33_0_0RCTConvert+CoreLocation.h>
#import <ReactABI33_0_0/ABI33_0_0RCTUIManager.h>
#import <ReactABI33_0_0/UIView+ReactABI33_0_0.h>
#import "ABI33_0_0AIRMapMarker.h"

@interface ABI33_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI33_0_0AIRMapMarkerManager

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI33_0_0AIRMapMarker *marker = [ABI33_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI33_0_0RCTBubblingEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI33_0_0RCTDirectEventBlock)


ABI33_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI33_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI33_0_0Tag];
        if (![view isKindOfClass:[ABI33_0_0AIRMapMarker class]]) {
            ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRMap, got: %@", view);
        } else {
            [(ABI33_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI33_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI33_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI33_0_0Tag];
        if (![view isKindOfClass:[ABI33_0_0AIRMapMarker class]]) {
            ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRMap, got: %@", view);
        } else {
            [(ABI33_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI33_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ReactABI33_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI33_0_0Tag];
        if (![view isKindOfClass:[ABI33_0_0AIRMapMarker class]]) {
            ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
