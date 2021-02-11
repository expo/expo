// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
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

#ifndef FBSDKMLMacros_h
#define FBSDKMLMacros_h

// keys for ML
#define MODEL_REQUEST_INTERVAL                  (60 * 60 * 24 * 3)
#define MODEL_REQUEST_TIMESTAMP_KEY             @"com.facebook.sdk:FBSDKModelRequestTimestamp"

#define FBSDK_ML_MODEL_PATH                     @"models"
#define MODEL_INFO_KEY                          @"com.facebook.sdk:FBSDKModelInfo"
#define ASSET_URI_KEY                           @"asset_uri"
#define RULES_URI_KEY                           @"rules_uri"
#define THRESHOLDS_KEY                          @"thresholds"
#define USE_CASE_KEY                            @"use_case"
#define VERSION_ID_KEY                          @"version_id"
#define MODEL_DATA_KEY                          @"data"

#define MTMLKey                                 @"MTML"
#define MTMLTaskAppEventPredKey                 @"MTML_APP_EVENT_PRED"
#define MTMLTaskIntegrityDetectKey              @"MTML_INTEGRITY_DETECT"

// keys for Suggested Event
#define SUGGEST_EVENT_KEY                       @"SUGGEST_EVENT"
#define DENSE_FEATURE_KEY                       @"DENSE_FEATURE"
#define SUGGESTED_EVENT_OTHER                   @"other"

#endif /* FBSDKMLMacros_h */
