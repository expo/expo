// Copyright 2015-present 650 Industries. All rights reserved.

#import "FontUtils.h"
#import <React/RCTFont.h>

@implementation FontUtilsObjC

+ (UIFont *)createFont:(NSString *_Nullable)fontFamily
              fontSize:(NSNumber *_Nullable)fontSize
            fontWeight:(NSString *_Nullable)fontWeight {
  return [RCTFont updateFont:nil
                  withFamily:fontFamily
                        size:fontSize
                      weight:fontWeight
                       style:nil
                     variant:nil
             scaleMultiplier:1.0];
}

@end