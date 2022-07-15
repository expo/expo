/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI46_0_0AIRMapMarkerManager.h"

#import <ABI46_0_0React/ABI46_0_0RCTConvert+CoreLocation.h>
#import <ABI46_0_0React/ABI46_0_0RCTUIManager.h>
#import <ABI46_0_0React/ABI46_0_0UIView+React.h>
#import "ABI46_0_0AIRMapMarker.h"

@interface ABI46_0_0AIRMapMarkerManager () <MKMapViewDelegate>

@end

@implementation ABI46_0_0AIRMapMarkerManager

ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
    ABI46_0_0AIRMapMarker *marker = [ABI46_0_0AIRMapMarker new];
    [marker addTapGestureRecognizer];
    marker.bridge = self.bridge;
    marker.isAccessibilityElement = YES;
    marker.accessibilityElementsHidden = NO;
    return marker;
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(identifier, NSString)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
//ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(reuseIdentifier, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(title, NSString)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(description, subtitle, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(coordinate, CLLocationCoordinate2D)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(centerOffset, CGPoint)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(calloutOffset, CGPoint)
ABI46_0_0RCT_REMAP_VIEW_PROPERTY(image, imageSrc, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(pinColor, UIColor)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(draggable, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, NSInteger)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, double)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(isPreselected, BOOL)

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI46_0_0RCTBubblingEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onSelect, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onDeselect, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onCalloutPress, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onDragStart, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onDrag, ABI46_0_0RCTDirectEventBlock)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onDragEnd, ABI46_0_0RCTDirectEventBlock)


ABI46_0_0RCT_EXPORT_METHOD(showCallout:(nonnull NSNumber *)ABI46_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI46_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI46_0_0ReactTag];
        if (![view isKindOfClass:[ABI46_0_0AIRMapMarker class]]) {
            ABI46_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI46_0_0AIRMap, got: %@", view);
        } else {
            [(ABI46_0_0AIRMapMarker *) view showCalloutView];
        }
    }];
}

ABI46_0_0RCT_EXPORT_METHOD(hideCallout:(nonnull NSNumber *)ABI46_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI46_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI46_0_0ReactTag];
        if (![view isKindOfClass:[ABI46_0_0AIRMapMarker class]]) {
            ABI46_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI46_0_0AIRMap, got: %@", view);
        } else {
            [(ABI46_0_0AIRMapMarker *) view hideCalloutView];
        }
    }];
}

ABI46_0_0RCT_EXPORT_METHOD(redrawCallout:(nonnull NSNumber *)ABI46_0_0ReactTag)
{
    [self.bridge.uiManager addUIBlock:^(__unused ABI46_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        id view = viewRegistry[ABI46_0_0ReactTag];
        if (![view isKindOfClass:[ABI46_0_0AIRMapMarker class]]) {
            ABI46_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI46_0_0AIRMap, got: %@", view);
        } else {
            //no need to do anything here
        }
    }];
}

@end
