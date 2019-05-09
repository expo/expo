// Copyright 2017 Google
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import "GULAppEnvironmentUtil.h"

#import <Foundation/Foundation.h>
#import <dlfcn.h>
#import <mach-o/dyld.h>
#import <sys/utsname.h>

#if TARGET_OS_IOS
#import <UIKit/UIKit.h>
#endif

/// The encryption info struct and constants are missing from the iPhoneSimulator SDK, but not from
/// the iPhoneOS or Mac OS X SDKs. Since one doesn't ever ship a Simulator binary, we'll just
/// provide the definitions here.
#if TARGET_OS_SIMULATOR && !defined(LC_ENCRYPTION_INFO)
#define LC_ENCRYPTION_INFO 0x21
struct encryption_info_command {
  uint32_t cmd;
  uint32_t cmdsize;
  uint32_t cryptoff;
  uint32_t cryptsize;
  uint32_t cryptid;
};
#endif

@implementation GULAppEnvironmentUtil

/// A key for the Info.plist to enable or disable checking if the App Store is running in a sandbox.
/// This will affect your data integrity when using Firebase Analytics, as it will disable some
/// necessary checks.
static NSString *const kFIRAppStoreReceiptURLCheckEnabledKey =
    @"FirebaseAppStoreReceiptURLCheckEnabled";

/// The file name of the sandbox receipt. This is available on iOS >= 8.0
static NSString *const kFIRAIdentitySandboxReceiptFileName = @"sandboxReceipt";

/// The following copyright from Landon J. Fuller applies to the isAppEncrypted function.
///
/// Copyright (c) 2017 Landon J. Fuller <landon@landonf.org>
/// All rights reserved.
///
/// Permission is hereby granted, free of charge, to any person obtaining a copy of this software
/// and associated documentation files (the "Software"), to deal in the Software without
/// restriction, including without limitation the rights to use, copy, modify, merge, publish,
/// distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
/// Software is furnished to do so, subject to the following conditions:
///
/// The above copyright notice and this permission notice shall be included in all copies or
/// substantial portions of the Software.
///
/// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
/// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
/// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
/// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
/// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
///
/// Comment from <a href="http://iphonedevwiki.net/index.php/Crack_prevention">iPhone Dev Wiki
/// Crack Prevention</a>:
/// App Store binaries are signed by both their developer and Apple. This encrypts the binary so
/// that decryption keys are needed in order to make the binary readable. When iOS executes the
/// binary, the decryption keys are used to decrypt the binary into a readable state where it is
/// then loaded into memory and executed. iOS can tell the encryption status of a binary via the
/// cryptid structure member of LC_ENCRYPTION_INFO MachO load command. If cryptid is a non-zero
/// value then the binary is encrypted.
///
/// 'Cracking' works by letting the kernel decrypt the binary then siphoning the decrypted data into
/// a new binary file, resigning, and repackaging. This will only work on jailbroken devices as
/// codesignature validation has been removed. Resigning takes place because while the codesignature
/// doesn't have to be valid thanks to the jailbreak, it does have to be in place unless you have
/// AppSync or similar to disable codesignature checks.
///
/// More information at <a href="http://landonf.org/2009/02/index.html">Landon Fuller's blog</a>
static BOOL IsAppEncrypted() {
  const struct mach_header *executableHeader = NULL;
  for (uint32_t i = 0; i < _dyld_image_count(); i++) {
    const struct mach_header *header = _dyld_get_image_header(i);
    if (header && header->filetype == MH_EXECUTE) {
      executableHeader = header;
      break;
    }
  }

  if (!executableHeader) {
    return NO;
  }

  BOOL is64bit = (executableHeader->magic == MH_MAGIC_64);
  uintptr_t cursor = (uintptr_t)executableHeader +
                     (is64bit ? sizeof(struct mach_header_64) : sizeof(struct mach_header));
  const struct segment_command *segmentCommand = NULL;
  uint32_t i = 0;

  while (i++ < executableHeader->ncmds) {
    segmentCommand = (struct segment_command *)cursor;

    if (!segmentCommand) {
      continue;
    }

    if ((!is64bit && segmentCommand->cmd == LC_ENCRYPTION_INFO) ||
        (is64bit && segmentCommand->cmd == LC_ENCRYPTION_INFO_64)) {
      if (is64bit) {
        struct encryption_info_command_64 *cryptCmd =
            (struct encryption_info_command_64 *)segmentCommand;
        return cryptCmd && cryptCmd->cryptid != 0;
      } else {
        struct encryption_info_command *cryptCmd = (struct encryption_info_command *)segmentCommand;
        return cryptCmd && cryptCmd->cryptid != 0;
      }
    }
    cursor += segmentCommand->cmdsize;
  }

  return NO;
}

static BOOL HasSCInfoFolder() {
#if TARGET_OS_IOS || TARGET_OS_TV
  NSString *bundlePath = [NSBundle mainBundle].bundlePath;
  NSString *scInfoPath = [bundlePath stringByAppendingPathComponent:@"SC_Info"];
  return [[NSFileManager defaultManager] fileExistsAtPath:scInfoPath];
#elif TARGET_OS_OSX
  return NO;
#endif
}

static BOOL HasEmbeddedMobileProvision() {
#if TARGET_OS_IOS || TARGET_OS_TV
  return [[NSBundle mainBundle] pathForResource:@"embedded" ofType:@"mobileprovision"].length > 0;
#elif TARGET_OS_OSX
  return NO;
#endif
}

+ (BOOL)isFromAppStore {
  static dispatch_once_t isEncryptedOnce;
  static BOOL isEncrypted = NO;

  dispatch_once(&isEncryptedOnce, ^{
    isEncrypted = IsAppEncrypted();
  });

  if ([GULAppEnvironmentUtil isSimulator]) {
    return NO;
  }

  // If an app contain the sandboxReceipt file, it means its coming from TestFlight
  // This must be checked before the SCInfo Folder check below since TestFlight apps may
  // also have an SCInfo folder.
  if ([GULAppEnvironmentUtil isAppStoreReceiptSandbox]) {
    return NO;
  }

  if (HasSCInfoFolder()) {
    // When iTunes downloads a .ipa, it also gets a customized .sinf file which is added to the
    // main SC_Info directory.
    return YES;
  }

  // For iOS >= 8.0, iTunesMetadata.plist is moved outside of the sandbox. Any attempt to read
  // the iTunesMetadata.plist outside of the sandbox will be rejected by Apple.
  // If the app does not contain the embedded.mobileprovision which is stripped out by Apple when
  // the app is submitted to store, then it is highly likely that it is from Apple Store.
  return isEncrypted && !HasEmbeddedMobileProvision();
}

+ (BOOL)isAppStoreReceiptSandbox {
  // Since checking the App Store's receipt URL can be memory intensive, check the option in the
  // Info.plist if developers opted out of this check.
  id enableSandboxCheck =
      [[NSBundle mainBundle] objectForInfoDictionaryKey:kFIRAppStoreReceiptURLCheckEnabledKey];
  if (enableSandboxCheck && [enableSandboxCheck isKindOfClass:[NSNumber class]] &&
      ![enableSandboxCheck boolValue]) {
    return NO;
  }
// The #else is for pre Xcode 9 where @available is not yet implemented.
#if __has_builtin(__builtin_available)
  if (@available(iOS 7.0, *)) {
#else
  if ([[UIDevice currentDevice].systemVersion integerValue] >= 7) {
#endif
    NSURL *appStoreReceiptURL = [NSBundle mainBundle].appStoreReceiptURL;
    NSString *appStoreReceiptFileName = appStoreReceiptURL.lastPathComponent;
    return [appStoreReceiptFileName isEqualToString:kFIRAIdentitySandboxReceiptFileName];
  }
  return NO;
}

+ (BOOL)isSimulator {
#if TARGET_OS_IOS || TARGET_OS_TV
  NSString *platform = [GULAppEnvironmentUtil deviceModel];
  return [platform isEqual:@"x86_64"] || [platform isEqual:@"i386"];
#elif TARGET_OS_OSX
  return NO;
#endif
}

+ (NSString *)deviceModel {
  static dispatch_once_t once;
  static NSString *deviceModel;

  dispatch_once(&once, ^{
    struct utsname systemInfo;
    if (uname(&systemInfo) == 0) {
      deviceModel = [NSString stringWithUTF8String:systemInfo.machine];
    }
  });
  return deviceModel;
}

+ (NSString *)systemVersion {
#if TARGET_OS_IOS
  return [UIDevice currentDevice].systemVersion;
#elif TARGET_OS_OSX || TARGET_OS_TV
  // Assemble the systemVersion, excluding the patch version if it's 0.
  NSOperatingSystemVersion osVersion = [NSProcessInfo processInfo].operatingSystemVersion;
  NSMutableString *versionString = [[NSMutableString alloc]
      initWithFormat:@"%ld.%ld", (long)osVersion.majorVersion, (long)osVersion.minorVersion];
  if (osVersion.patchVersion != 0) {
    [versionString appendFormat:@".%ld", (long)osVersion.patchVersion];
  }
  return versionString;
#endif
}

+ (BOOL)isAppExtension {
#if TARGET_OS_IOS || TARGET_OS_TV
  // Documented by <a href="https://goo.gl/RRB2Up">Apple</a>
  BOOL appExtension = [[[NSBundle mainBundle] bundlePath] hasSuffix:@".appex"];
  return appExtension;
#elif TARGET_OS_OSX
  return NO;
#endif
}

+ (BOOL)isIOS7OrHigher {
#if __has_builtin(__builtin_available)
  if (@available(iOS 7.0, *)) {
#else
  if ([[UIDevice currentDevice].systemVersion integerValue] >= 7) {
#endif
      return YES;
    }

    return NO;
}

@end
