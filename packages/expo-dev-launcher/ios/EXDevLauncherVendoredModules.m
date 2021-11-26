//
//  EXDevLauncherVendoredModules.m
//  DoubleConversion
//
//  Created by andrew on 2021-11-26.
//

#import "EXDevLauncherVendoredModules.h"

#import "RNSVGCircleManager.h"
#import "RNSVGClipPathManager.h"
#import "RNSVGDefsManager.h"
#import "RNSVGEllipseManager.h"
#import "RNSVGForeignObjectManager.h"
#import "RNSVGGroupManager.h"
#import "RNSVGImageManager.h"
#import "RNSVGLinearGradientManager.h"
#import "RNSVGLineManager.h"
#import "RNSVGMarkerManager.h"
#import "RNSVGMaskManager.h"
#import "RNSVGNodeManager.h"
#import "RNSVGPathManager.h"
#import "RNSVGPatternManager.h"
#import "RNSVGRadialGradientManager.h"
#import "RNSVGRectManager.h"
#import "RNSVGRenderableManager.h"
#import "RNSVGSvgViewManager.h"
#import "RNSVGSymbolManager.h"
#import "RNSVGTextManager.h"
#import "RNSVGTextPathManager.h"
#import "RNSVGTSpanManager.h"
#import "RNSVGUseManager.h"

@import EXDevMenu;

@implementation EXDevLauncherVendoredModules


+ (NSArray<id<RCTBridgeModule>> *)vendoredModules
{
  NSMutableArray *modules = [[DevMenuVendoredModulesUtils vendoredModules] mutableCopy];
  
  [modules addObject:[RNSVGCircleManager new]];
  [modules addObject:[RNSVGClipPathManager new]];
  [modules addObject:[RNSVGDefsManager new]];
  [modules addObject:[RNSVGEllipseManager new]];
  [modules addObject:[RNSVGForeignObjectManager new]];
  [modules addObject:[RNSVGGroupManager new]];
  [modules addObject:[RNSVGImageManager new]];
  [modules addObject:[RNSVGLinearGradientManager new]];
  [modules addObject:[RNSVGLineManager new]];
  [modules addObject:[RNSVGMarkerManager new]];
  [modules addObject:[RNSVGMaskManager new]];
  [modules addObject:[RNSVGNodeManager new]];
  [modules addObject:[RNSVGPathManager new]];
  [modules addObject:[RNSVGPatternManager new]];
  [modules addObject:[RNSVGRadialGradientManager new]];
  [modules addObject:[RNSVGRectManager new]];
  [modules addObject:[RNSVGRenderableManager new]];
  [modules addObject:[RNSVGSvgViewManager new]];
  [modules addObject:[RNSVGSymbolManager new]];
  [modules addObject:[RNSVGTextManager new]];
  [modules addObject:[RNSVGTextPathManager new]];
  [modules addObject:[RNSVGTSpanManager new]];
  [modules addObject:[RNSVGUseManager new]];
  
  
  
  return modules;
}

@end
