//
//  AMPConstants.m
//  Copyright (c) 2014 Amplitude Inc. (https://amplitude.com/)
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

#import "AMPConstants.h"

NSString *const kAMPLibrary = @"amplitude-ios";
NSString *const kAMPVersion = @"6.0.0";
NSString *const kAMPUnknownLibrary = @"unknown-library";
NSString *const kAMPUnknownVersion = @"unknown-version";
NSString *const kAMPEventLogDomain = @"api2.amplitude.com";
NSString *const kAMPEventLogUrl = @"https://api2.amplitude.com/";
NSString *const kAMPDyanmicConfigUrl = @"https://regionconfig.amplitude.com/";
NSString *const kAMPDefaultInstance = @"$default_instance";
const int kAMPApiVersion = 3;
const int kAMPDBVersion = 3;
const int kAMPDBFirstVersion = 2; // to detect if DB exists yet

#if TARGET_OS_OSX
    const int kAMPEventUploadThreshold = 30;
    const int kAMPEventMaxCount = 1000;
    NSString *const kAMPPlatform = @"macOS";
    NSString *const kAMPOSName = @"macos";
#elif TARGET_OS_TV // For tvOS, upload events immediately, don't save too many events locally.
    const int kAMPEventUploadThreshold = 1;
    const int kAMPEventMaxCount = 100;
    NSString *const kAMPPlatform = @"tvOS";
    NSString *const kAMPOSName = @"tvos";
#elif TARGET_OS_MACCATALYST // This is when iPad app runs on mac.
    const int kAMPEventUploadThreshold = 30;
    const int kAMPEventMaxCount = 1000;
    NSString *const kAMPPlatform = @"macOS";
    NSString *const kAMPOSName = @"macos";
#else // iOS, simulator, etc.
    const int kAMPEventUploadThreshold = 30;
    const int kAMPEventMaxCount = 1000;
    NSString *const kAMPPlatform = @"iOS";
    NSString *const kAMPOSName = @"ios";
#endif

const int kAMPEventUploadMaxBatchSize = 100;
const int kAMPEventRemoveBatchSize = 20;
const int kAMPEventUploadPeriodSeconds = 30; // 30 seconds
const long kAMPMinTimeBetweenSessionsMillis = 5 * 60 * 1000; // 5 minutes
const int kAMPMaxStringLength = 1024;
const int kAMPMaxPropertyKeys = 1000;

NSString *const IDENTIFY_EVENT = @"$identify";
NSString *const GROUP_IDENTIFY_EVENT = @"$groupidentify";
NSString *const AMP_OP_ADD = @"$add";
NSString *const AMP_OP_APPEND = @"$append";
NSString *const AMP_OP_CLEAR_ALL = @"$clearAll";
NSString *const AMP_OP_PREPEND = @"$prepend";
NSString *const AMP_OP_SET = @"$set";
NSString *const AMP_OP_SET_ONCE = @"$setOnce";
NSString *const AMP_OP_UNSET = @"$unset";

NSString *const AMP_REVENUE_PRODUCT_ID = @"$productId";
NSString *const AMP_REVENUE_QUANTITY = @"$quantity";
NSString *const AMP_REVENUE_PRICE = @"$price";
NSString *const AMP_REVENUE_REVENUE_TYPE = @"$revenueType";
NSString *const AMP_REVENUE_RECEIPT = @"$receipt";

NSString *const AMP_TRACKING_OPTION_CARRIER = @"carrier";
NSString *const AMP_TRACKING_OPTION_CITY = @"city";
NSString *const AMP_TRACKING_OPTION_COUNTRY = @"country";
NSString *const AMP_TRACKING_OPTION_DEVICE_MANUFACTURER = @"device_manufacturer";
NSString *const AMP_TRACKING_OPTION_DEVICE_MODEL = @"device_model";
NSString *const AMP_TRACKING_OPTION_DMA = @"dma";
NSString *const AMP_TRACKING_OPTION_IDFA = @"idfa";
NSString *const AMP_TRACKING_OPTION_IDFV = @"idfv";
NSString *const AMP_TRACKING_OPTION_IP_ADDRESS = @"ip_address";
NSString *const AMP_TRACKING_OPTION_LANGUAGE = @"language";
NSString *const AMP_TRACKING_OPTION_LAT_LNG = @"lat_lng";
NSString *const AMP_TRACKING_OPTION_OS_NAME = @"os_name";
NSString *const AMP_TRACKING_OPTION_OS_VERSION = @"os_version";
NSString *const AMP_TRACKING_OPTION_PLATFORM = @"platform";
NSString *const AMP_TRACKING_OPTION_REGION = @"region";
NSString *const AMP_TRACKING_OPTION_VERSION_NAME = @"version_name";
