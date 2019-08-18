/*
 *  Copyright (c) 2014, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import <Bolts/BFCancellationToken.h>
#import <Bolts/BFCancellationTokenRegistration.h>
#import <Bolts/BFCancellationTokenSource.h>
#import <Bolts/BFExecutor.h>
#import <Bolts/BFGeneric.h>
#import <Bolts/BFTask.h>
#import <Bolts/BFTaskCompletionSource.h>

#if __has_include(<Bolts/BFAppLink.h>) && TARGET_OS_IPHONE && !TARGET_OS_WATCH && !TARGET_OS_TV
#import <Bolts/BFAppLink.h>
#import <Bolts/BFAppLinkNavigation.h>
#import <Bolts/BFAppLinkResolving.h>
#import <Bolts/BFAppLinkReturnToRefererController.h>
#import <Bolts/BFAppLinkReturnToRefererView.h>
#import <Bolts/BFAppLinkTarget.h>
#import <Bolts/BFMeasurementEvent.h>
#import <Bolts/BFURL.h>
#import <Bolts/BFWebViewAppLinkResolver.h>
#endif


NS_ASSUME_NONNULL_BEGIN

/**
 A string containing the version of the Bolts Framework used by the current application.
 */
extern NSString *const BoltsFrameworkVersionString;

NS_ASSUME_NONNULL_END
