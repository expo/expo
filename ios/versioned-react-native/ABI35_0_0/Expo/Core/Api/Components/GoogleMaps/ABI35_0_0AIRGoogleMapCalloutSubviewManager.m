//
//  ABI35_0_0AIRGoogleMapCalloutSubviewManager.m
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI35_0_0HAVE_GOOGLE_MAPS

#import "ABI35_0_0AIRGoogleMapCalloutSubviewManager.h"
#import "ABI35_0_0AIRGoogleMapCalloutSubview.h"
#import <ReactABI35_0_0/ABI35_0_0RCTView.h>

@implementation ABI35_0_0AIRGoogleMapCalloutSubviewManager
ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI35_0_0AIRGoogleMapCalloutSubview *calloutSubview = [ABI35_0_0AIRGoogleMapCalloutSubview new];
  return calloutSubview;
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI35_0_0RCTBubblingEventBlock)

@end

#endif
