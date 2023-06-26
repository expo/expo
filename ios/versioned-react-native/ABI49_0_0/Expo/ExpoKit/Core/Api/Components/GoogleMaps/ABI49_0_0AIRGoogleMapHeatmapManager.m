//
//  ABI49_0_0AIRGoogleMapHeatmapManager.m
//
//  Created by David Cako on 29 April 2018.
//

#import "ABI49_0_0AIRGoogleMapHeatmapManager.h"
#import "ABI49_0_0AIRGoogleMapHeatmap.h"
#import "ABI49_0_0AIRGoogleMap.h"
#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import <ABI49_0_0React/ABI49_0_0UIView+React.h>

@interface ABI49_0_0AIRGoogleMapHeatmapManager()

@end

@implementation ABI49_0_0AIRGoogleMapHeatmapManager

ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI49_0_0AIRGoogleMapHeatmap *heatmap = [ABI49_0_0AIRGoogleMapHeatmap new];
  return heatmap;
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(points, NSArray<NSDictionary *>)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(radius, NSUInteger)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSDictionary *)

@end