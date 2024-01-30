//
//  AIRGoogleMapManager.h
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#ifdef HAVE_GOOGLE_MAPS

#import <React/RCTViewManager.h>

@interface AIRGoogleMapManager : RCTViewManager

@property (nonatomic, strong) NSDictionary *initialProps;

@property (nonatomic) BOOL isGesture;

@end

#endif
