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
 * Please refer to FBAdView.h and FBAdExtraHint.h for full documentation of the API.
 *
 * This file may be used to build your own Audience Network iOS SDK wrapper,
 * but note that we don't support customisations of the Audience Network codebase.
 *
 ***/

#import <FBAudienceNetwork/FBAdBridgeCommon.h>

FB_EXTERN_C_BEGIN

typedef NS_ENUM(int32_t, FBAdViewBridgeSize) {
    FBAdViewBridgeSizeHeight50BannerKey,
    FBAdViewBridgeSizeHeight90BannerKey,
    FBAdViewBridgeSizeInterstitalKey,
    FBAdViewBridgeSizeHeight250RectangleKey
};

FB_EXPORT int32_t FBAdViewBridgeSizeHeight50Banner(void);
FB_EXPORT int32_t FBAdViewBridgeSizeHeight90Banner(void);
FB_EXPORT int32_t FBAdViewBridgeSizeInterstital(void);
FB_EXPORT int32_t FBAdViewBridgeSizeHeight250Rectangle(void);

FB_EXPORT int32_t FBAdViewBridgeCreate(char const *placementID, FBAdViewBridgeSize size);
FB_EXPORT int32_t FBAdViewBridgeLoad(int32_t uniqueId);
FB_EXPORT int32_t FBAdViewBridgeLoadWithBidPayload(int32_t uniqueId, char *bidPayload);

FB_EXPORT bool FBAdViewBridgeIsValid(int32_t uniqueId);
FB_EXPORT void FBAdViewBridgeShow(int32_t uniqueId, double x, double y, double width, double height);
FB_EXPORT char const *FBAdViewBridgeGetPlacementId(int32_t uniqueId);
FB_EXPORT void FBAdViewBridgeDisableAutoRefresh(int32_t uniqueId);
FB_EXPORT void FBAdViewBridgeSetExtraHints(int32_t uniqueId, char const *extraHints);
FB_EXPORT void FBAdViewBridgeRelease(int32_t uniqueId);

FB_EXPORT void FBAdViewBridgeOnLoad(int32_t uniqueId, FBAdBridgeCallback callback);
FB_EXPORT void FBAdViewBridgeOnImpression(int32_t uniqueId, FBAdBridgeCallback callback);
FB_EXPORT void FBAdViewBridgeOnClick(int32_t uniqueId, FBAdBridgeCallback callback);
FB_EXPORT void FBAdViewBridgeOnError(int32_t uniqueId, FBAdBridgeErrorCallback callback);
FB_EXPORT void FBAdViewBridgeOnFinishedClick(int32_t uniqueId, FBAdBridgeCallback callback);

FB_EXTERN_C_END
