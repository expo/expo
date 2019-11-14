//
//  ABI35_0_0AIRGoogleMapCalloutSubview.h
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI35_0_0HAVE_GOOGLE_MAPS

#import <UIKit/UIKit.h>
#import <ReactABI35_0_0/ABI35_0_0RCTView.h>

@interface ABI35_0_0AIRGoogleMapCalloutSubview : UIView
@property (nonatomic, copy) ABI35_0_0RCTBubblingEventBlock onPress;
@end

#endif
