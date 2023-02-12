//
//  ABI46_0_0AIRGoogleMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI46_0_0HAVE_GOOGLE_MAPS

#import "ABI46_0_0AIRGoogleMapCalloutSubviewManager.h"
#import "ABI46_0_0AIRGoogleMapCalloutSubview.h"
#import <ABI46_0_0React/ABI46_0_0RCTView.h>

@implementation ABI46_0_0AIRGoogleMapCalloutSubviewManager
ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI46_0_0AIRGoogleMapCalloutSubview *calloutSubview = [ABI46_0_0AIRGoogleMapCalloutSubview new];
  return calloutSubview;
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI46_0_0RCTBubblingEventBlock)

@end

#endif
