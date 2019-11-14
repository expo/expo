//
//  GADUnifiedNativeAd+ConfirmationClick.h
//  Google Mobile Ads SDK
//
//  Copyright 2017 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GADUnifiedNativeAd.h>
#import <GoogleMobileAds/GADUnifiedNativeAdUnconfirmedClickDelegate.h>

@interface GADUnifiedNativeAd (ConfirmedClick)

/// Unconfirmed click delegate.
@property(nonatomic, weak, nullable) id<GADUnifiedNativeAdUnconfirmedClickDelegate>
    unconfirmedClickDelegate;

/// Registers a view that will confirm the click.
- (void)registerClickConfirmingView:(nullable UIView *)view;

/// Cancels the unconfirmed click. Call this method when the user fails to confirm the click.
/// Calling this method causes the SDK to stop tracking clicks on the registered click confirming
/// view and invokes the -nativeAdDidCancelUnconfirmedClick: delegate method. If no unconfirmed
/// click is in progress, this method has no effect.
- (void)cancelUnconfirmedClick;

@end
