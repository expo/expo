#import "DevMenuRNCSafeAreaProviderManager.h"

#import "DevMenuRNCSafeAreaProvider.h"

@implementation DevMenuRNCSafeAreaProviderManager

+ (NSString *)moduleName { return @"RNCSafeAreaProvider"; }

RCT_EXPORT_VIEW_PROPERTY(onInsetsChange, RCTDirectEventBlock)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (UIView *)view
{
  return [DevMenuRNCSafeAreaProvider new];
}

- (NSDictionary *)constantsToExportAsync
{
    UIWindow* window = [[UIApplication sharedApplication] keyWindow];
  if (@available(iOS 11.0, *)) {
    UIEdgeInsets safeAreaInsets = window.safeAreaInsets;
    return @{
      @"initialWindowMetrics": @{
        @"insets": @{
          @"top": @(safeAreaInsets.top),
          @"right": @(safeAreaInsets.right),
          @"bottom": @(safeAreaInsets.bottom),
          @"left": @(safeAreaInsets.left),
        },
        @"frame": @{
          @"x": @(window.frame.origin.x),
          @"y": @(window.frame.origin.y),
          @"width": @(window.frame.size.width),
          @"height": @(window.frame.size.height),
        },
      }
    };
  } else {
    return @{ @"initialWindowMetrics": @{
        @"insets": @{
          @"top": @(20),
          @"right": @(0),
          @"bottom": @(0),
          @"left": @(0),
        },
        @"frame": @{
          @"x": @(window.frame.origin.x),
          @"y": @(window.frame.origin.y),
          @"width": @(window.frame.size.width),
          @"height": @(window.frame.size.height),
        },
      }
    } ;
  }
}


// this method cannot be called from background thread - enforcing dispatch_sync()
        - (NSDictionary *)constantsToExport
 {
   __block NSDictionary *constants;
  
   dispatch_sync(dispatch_get_main_queue(), ^{
     UIWindow* window = [[UIApplication sharedApplication] keyWindow];
     if (@available(iOS 11.0, *)) {
       UIEdgeInsets safeAreaInsets = window.safeAreaInsets;
       constants = @{
         @"initialWindowMetrics": @{
           @"insets": @{
             @"top": @(safeAreaInsets.top),
             @"right": @(safeAreaInsets.right),
             @"bottom": @(safeAreaInsets.bottom),
             @"left": @(safeAreaInsets.left),
           },
           @"frame": @{
             @"x": @(window.frame.origin.x),
             @"y": @(window.frame.origin.y),
             @"width": @(window.frame.size.width),
             @"height": @(window.frame.size.height),
           },
         }
       };
     } else {
       constants = @{ @"initialWindowMetrics": @{
           @"insets": @{
             @"top": @(20),
             @"right": @(0),
             @"bottom": @(0),
             @"left": @(0),
           },
           @"frame": @{
             @"x": @(window.frame.origin.x),
             @"y": @(window.frame.origin.y),
             @"width": @(window.frame.size.width),
             @"height": @(window.frame.size.height),
           },
         }
       } ;
     }
   });
  
  return constants;
}

@end
