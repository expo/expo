// Copyright 2004-present Facebook. All Rights Reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/***
 * This is a bridge file for Audience Network Unity SDK.
 *
 * Please refer to FBInterstitialAd.h and FBAdExtraHint.h for full documentation of the API.
 *
 * This file may be used to build your own Audience Network iOS SDK wrapper,
 * but note that we don't support customisations of the Audience Network codebase.
 *
 ***/

#import <FBAudienceNetwork/FBAdBridgeCommon.h>

FB_EXTERN_C_BEGIN

FB_EXPORT int32_t FBInterstitialAdBridgeCreate(char const *placementID);
FB_EXPORT int32_t FBInterstitialAdBridgeLoad(int32_t uniqueId);
FB_EXPORT int32_t FBInterstitialAdBridgeLoadWithBidPayload(int32_t uniqueId, char *bidPayload);

FB_EXPORT bool FBInterstitialAdBridgeIsValid(int32_t uniqueId);
FB_EXPORT char const *FBInterstitialAdBridgeGetPlacementId(int32_t uniqueId);
FB_EXPORT bool FBInterstitialAdBridgeShow(int32_t uniqueId);
FB_EXPORT void FBInterstitialAdBridgeSetExtraHints(int32_t uniqueId, char const *extraHints);
FB_EXPORT void FBInterstitialAdBridgeRelease(int32_t uniqueId);

FB_EXPORT void FBInterstitialAdBridgeOnLoad(int32_t uniqueId, FBAdBridgeCallback callback);
FB_EXPORT void FBInterstitialAdBridgeOnImpression(int32_t uniqueId, FBAdBridgeCallback callback);
FB_EXPORT void FBInterstitialAdBridgeOnClick(int32_t uniqueId, FBAdBridgeCallback callback);
FB_EXPORT void FBInterstitialAdBridgeOnError(int32_t uniqueId, FBAdBridgeErrorCallback callback);
FB_EXPORT void FBInterstitialAdBridgeOnDidClose(int32_t uniqueId, FBAdBridgeCallback callback);
FB_EXPORT void FBInterstitialAdBridgeOnWillClose(int32_t uniqueId, FBAdBridgeCallback callback);

FB_EXTERN_C_END
