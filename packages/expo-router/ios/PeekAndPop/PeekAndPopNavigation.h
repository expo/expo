//
//  PeekAndPopNavigation.h
//  ScreensWrapper
//
//  Created by Jakub Tkacz on 04/06/2025.
//

#ifndef UbaxMath_h
#define UbaxMath_h

@class PeekAndPopNavigation;

@interface PeekAndPopNavigation:NSObject

- (void)updatePreloadedView:(int)tag withUiResponder:(UIResponder *)responder;
- (void)pushPreloadedView:(UIResponder *)responder;

@end

#endif /* UbaxMath_h */
