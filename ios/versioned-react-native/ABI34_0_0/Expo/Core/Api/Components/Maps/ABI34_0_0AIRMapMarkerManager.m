/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI34_0_0AIRMapMarkerManager.h"

#import <ReactABI34_0_0/ABI34_0_0RCTConvert+CoreLocation.h>
#import <ReactABI34_0_0/ABI34_0_0RCTUIManager.h>
#import <ReactABI34_0_0/UIView+ReactABI34_0_0.h>
#import "ABI34_0_0AIRMapMarker.h"

@interface ABI34_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI34_0_0AIRMapMarkerManager

ABI34_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI34_0_0AIRMapMarker *marker = [ABI34_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI34_0_0RCTBubblingEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI34_0_0RCTDirectEventBlock)


ABI34_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ReactABI34_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI34_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI34_0_0Tag];
        if (![view isKindOfClass:[ABI34_0_0AIRMapMarker class]]) {
            ABI34_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI34_0_0AIRMap, got: %@", view);
        } else {
            [(ABI34_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI34_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ReactABI34_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI34_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI34_0_0Tag];
        if (![view isKindOfClass:[ABI34_0_0AIRMapMarker class]]) {
            ABI34_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI34_0_0AIRMap, got: %@", view);
        } else {
            [(ABI34_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI34_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ReactABI34_0_0Tag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI34_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ReactABI34_0_0Tag];
        if (![view isKindOfClass:[ABI34_0_0AIRMapMarker class]]) {
            ABI34_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI34_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
