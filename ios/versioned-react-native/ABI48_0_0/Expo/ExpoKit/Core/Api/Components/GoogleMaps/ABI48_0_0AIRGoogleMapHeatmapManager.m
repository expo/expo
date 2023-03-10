//
//  ABI48_0_0AIRGoogleMapHeatmapManager.m
//
//  Created by David Cako on 29 April 2018.
//

#import "ABI48_0_0AIRGoogleMapHeatmapManager.h"
#import "ABI48_0_0AIRGoogleMapHeatmap.h"
#import "ABI48_0_0AIRGoogleMap.h"
#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0UIView+React.h>

@interface ABI48_0_0AIRGoogleMapHeatmapManager()

@end

@implementation ABI48_0_0AIRGoogleMapHeatmapManager

ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI48_0_0AIRGoogleMapHeatmap *heatmap = [ABI48_0_0AIRGoogleMapHeatmap new];
  return heatmap;
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(points, NSArray<NSDictionary *>)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(radius, NSUInteger)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSDictionary *)

@end