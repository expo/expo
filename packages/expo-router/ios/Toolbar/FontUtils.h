// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface FontUtilsObjC : NSObject

+ (UIFont *)createFont:(NSString *_Nullable)fontFamily
              fontSize:(NSNumber *_Nullable)fontSize
            fontWeight:(NSString *_Nullable)fontWeight;

@end

NS_ASSUME_NONNULL_END