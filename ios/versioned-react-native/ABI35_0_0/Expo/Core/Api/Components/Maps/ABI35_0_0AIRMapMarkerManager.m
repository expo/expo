/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI35_0_0AIRMapMarkerManager.h"

#import <ReactABI35_0_0/ABI35_0_0RCTConvert+CoreLocation.h>
#import <ReactABI35_0_0/ABI35_0_0RCTUIManager.h>
#import <ReactABI35_0_0/UIView+ReactABI35_0_0.h>
#import "ABI35_0_0AIRMapMarker.h"

@interface ABI35_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI35_0_0AIRMapMarkerManager

ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI35_0_0AIRMapMarker *marker = [ABI35_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI35_0_0RCTBubblingEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI35_0_0RCTDirectEventBlock)


ABI35_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI35_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI35_0_0Tag];
        if (![view isKindOfClass:[ABI35_0_0AIRMapMarker class]]) {
            ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0AIRMap, got: %@", view);
        } else {
            [(ABI35_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI35_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI35_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI35_0_0Tag];
        if (![view isKindOfClass:[ABI35_0_0AIRMapMarker class]]) {
            ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0AIRMap, got: %@", view);
        } else {
            [(ABI35_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI35_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ReactABI35_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI35_0_0Tag];
        if (![view isKindOfClass:[ABI35_0_0AIRMapMarker class]]) {
            ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
