//
//  ABI41_0_0AIRGoogleMapCalloutSubview.h
//  AirMaps
//
//  Created by Denis Oblogin on 10/8/18.
//
//

#ifdef ABI41_0_0HAVE_GOOGLE_MAPS

#import <UIKit/UIKit.h>
#import <ABI41_0_0React/ABI41_0_0RCTView.h>

@interface ABI41_0_0AIRGoogleMapCalloutSubview : UIView
@property (nonatomic, copy) ABI41_0_0RCTBubblingEventBlock onPress;
@end

#endif
