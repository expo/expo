//
//  EXDevLauncherVendoredModules.m
//  DoubleConversion
//
//  Created by andrew on 2021-11-26.
//

#import "EXDevLauncherVendoredModules.h"

#import "DevLauncherRNSVGCircleManager.h"
#import "DevLauncherRNSVGClipPathManager.h"
#import "DevLauncherRNSVGDefsManager.h"
#import "DevLauncherRNSVGEllipseManager.h"
#import "DevLauncherRNSVGForeignObjectManager.h"
#import "DevLauncherRNSVGGroupManager.h"
#import "DevLauncherRNSVGImageManager.h"
#import "DevLauncherRNSVGLinearGradientManager.h"
#import "DevLauncherRNSVGLineManager.h"
#import "DevLauncherRNSVGMarkerManager.h"
#import "DevLauncherRNSVGMaskManager.h"
#import "DevLauncherRNSVGNodeManager.h"
#import "DevLauncherRNSVGPathManager.h"
#import "DevLauncherRNSVGPatternManager.h"
#import "DevLauncherRNSVGRadialGradientManager.h"
#import "DevLauncherRNSVGRectManager.h"
#import "DevLauncherRNSVGRenderableManager.h"
#import "DevLauncherRNSVGSvgViewManager.h"
#import "DevLauncherRNSVGSymbolManager.h"
#import "DevLauncherRNSVGTextManager.h"
#import "DevLauncherRNSVGTextPathManager.h"
#import "DevLauncherRNSVGTSpanManager.h"
#import "DevLauncherRNSVGUseManager.h"

@import EXDevMenu;

@implementation EXDevLauncherVendoredModules


+ (NSArray<id<RCTBridgeModule>> *)vendoredModules
{
  NSMutableArray *modules = [[DevMenuVendoredModulesUtils vendoredModules] mutableCopy];
  
  [modules addObject:[DevLauncherRNSVGCircleManager new]];
  [modules addObject:[DevLauncherRNSVGClipPathManager new]];
  [modules addObject:[DevLauncherRNSVGDefsManager new]];
  [modules addObject:[DevLauncherRNSVGEllipseManager new]];
  [modules addObject:[DevLauncherRNSVGForeignObjectManager new]];
  [modules addObject:[DevLauncherRNSVGGroupManager new]];
  [modules addObject:[DevLauncherRNSVGImageManager new]];
  [modules addObject:[DevLauncherRNSVGLinearGradientManager new]];
  [modules addObject:[DevLauncherRNSVGLineManager new]];
  [modules addObject:[DevLauncherRNSVGMarkerManager new]];
  [modules addObject:[DevLauncherRNSVGMaskManager new]];
  [modules addObject:[DevLauncherRNSVGNodeManager new]];
  [modules addObject:[DevLauncherRNSVGPathManager new]];
  [modules addObject:[DevLauncherRNSVGPatternManager new]];
  [modules addObject:[DevLauncherRNSVGRadialGradientManager new]];
  [modules addObject:[DevLauncherRNSVGRectManager new]];
  [modules addObject:[DevLauncherRNSVGRenderableManager new]];
  [modules addObject:[DevLauncherRNSVGSvgViewManager new]];
  [modules addObject:[DevLauncherRNSVGSymbolManager new]];
  [modules addObject:[DevLauncherRNSVGTextManager new]];
  [modules addObject:[DevLauncherRNSVGTextPathManager new]];
  [modules addObject:[DevLauncherRNSVGTSpanManager new]];
  [modules addObject:[DevLauncherRNSVGUseManager new]];
  
  
  
  return modules;
}

@end
