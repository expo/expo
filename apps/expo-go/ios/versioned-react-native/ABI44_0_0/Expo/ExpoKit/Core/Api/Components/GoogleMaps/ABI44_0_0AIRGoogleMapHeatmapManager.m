//
//  ABI44_0_0AIRGoogleMapHeatmapManager.m
//
//  Created by David Cako on 29 April 2018.
//

#import "ABI44_0_0AIRGoogleMapHeatmapManager.h"
#import "ABI44_0_0AIRGoogleMapHeatmap.h"
#import "ABI44_0_0AIRGoogleMap.h"
#import <ABI44_0_0React/ABI44_0_0RCTBridge.h>
#import <ABI44_0_0React/ABI44_0_0UIView+React.h>

@interface ABI44_0_0AIRGoogleMapHeatmapManager()

@end

@implementation ABI44_0_0AIRGoogleMapHeatmapManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI44_0_0AIRGoogleMapHeatmap *heatmap = [ABI44_0_0AIRGoogleMapHeatmap new];
  return heatmap;
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(points, NSArray<NSDictionary *>)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(radius, NSUInteger)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSDictionary *)

@end