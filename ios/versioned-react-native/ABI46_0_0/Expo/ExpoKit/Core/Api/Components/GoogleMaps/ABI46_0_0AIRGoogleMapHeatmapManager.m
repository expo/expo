//
//  ABI46_0_0AIRGoogleMapHeatmapManager.m
//
//  Created by David Cako on 29 April 2018.
//

#import "ABI46_0_0AIRGoogleMapHeatmapManager.h"
#import "ABI46_0_0AIRGoogleMapHeatmap.h"
#import "ABI46_0_0AIRGoogleMap.h"
#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>
#import <ABI46_0_0React/ABI46_0_0UIView+React.h>

@interface ABI46_0_0AIRGoogleMapHeatmapManager()

@end

@implementation ABI46_0_0AIRGoogleMapHeatmapManager

ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI46_0_0AIRGoogleMapHeatmap *heatmap = [ABI46_0_0AIRGoogleMapHeatmap new];
  return heatmap;
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(points, NSArray<NSDictionary *>)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(radius, NSUInteger)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSDictionary *)

@end