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
 * Please refer to FBRewardedVideoAd.h and FBAdExtraHint.h for full documentation of the API.
 *
 * This file may be used to build your own Audience Network iOS SDK wrapper,
 * but note that we don't support customisations of the Audience Network codebase.
 *
 ***/

#import <FBAudienceNetwork/FBAdBridgeCommon.h>

FB_EXTERN_C_BEGIN

FB_EXPORT int32_t FBRewardedVideoAdBridgeCreate(char const *placementID);
FB_EXPORT int32_t FBRewardedVideoAdBridgeCreateWithReward(char const *placementID,
                                                          char const *userID,
                                                          char const *currency);

FB_EXPORT int32_t FBRewardedVideoAdBridgeLoad(int32_t uniqueId);
FB_EXPORT int32_t FBRewardedVideoAdBridgeLoadWithBidPayload(int32_t uniqueId, char *bidPayload);

FB_EXPORT bool FBRewardedVideoAdBridgeIsValid(int32_t uniqueId);
FB_EXPORT char const *FBRewardedVideoAdBridgeGetPlacementId(int32_t uniqueId);
FB_EXPORT bool FBRewardedVideoAdBridgeShow(int32_t uniqueId);
FB_EXPORT bool FBRewardedVideoAdBridgeShowAnimated(int32_t uniqueId, bool isAnimated);
FB_EXPORT void FBRewardedVideoAdBridgeSetExtraHints(int32_t uniqueId, char const *extraHints);
FB_EXPORT void FBRewardedVideoAdBridgeRelease(int32_t uniqueId);

FB_EXPORT void FBRewardedVideoAdBridgeOnLoad(int32_t uniqueId, FBAdBridgeCallback callback);
FB_EXPORT void FBRewardedVideoAdBridgeOnImpression(int32_t uniqueId, FBAdBridgeCallback callback);
FB_EXPORT void FBRewardedVideoAdBridgeOnClick(int32_t uniqueId, FBAdBridgeCallback callback);
FB_EXPORT void FBRewardedVideoAdBridgeOnError(int32_t uniqueId, FBAdBridgeErrorCallback callback);
FB_EXPORT void FBRewardedVideoAdBridgeOnDidClose(int32_t uniqueId, FBAdBridgeCallback callback);
FB_EXPORT void FBRewardedVideoAdBridgeOnWillClose(int32_t uniqueId, FBAdBridgeCallback callback);
FB_EXPORT void FBRewardedVideoAdBridgeOnVideoComplete(int32_t uniqueId, FBAdBridgeCallback callback);
FB_EXPORT void FBRewardedVideoAdBridgeOnServerRewardSuccess(int32_t uniqueId, FBAdBridgeCallback callback);
FB_EXPORT void FBRewardedVideoAdBridgeOnServerRewardFailure(int32_t uniqueId, FBAdBridgeCallback callback);

FB_EXTERN_C_END
