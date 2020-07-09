/*
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, GULSwizzlerMessageCode) {
  // App Delegate Swizzling.
  kGULSwizzlerMessageCodeAppDelegateSwizzling000 = 1000,                 // I-SWZ001000
  kGULSwizzlerMessageCodeAppDelegateSwizzling001 = 1001,                 // I-SWZ001001
  kGULSwizzlerMessageCodeAppDelegateSwizzling002 = 1002,                 // I-SWZ001002
  kGULSwizzlerMessageCodeAppDelegateSwizzling003 = 1003,                 // I-SWZ001003
  kGULSwizzlerMessageCodeAppDelegateSwizzling004 = 1004,                 // I-SWZ001004
  kGULSwizzlerMessageCodeAppDelegateSwizzling005 = 1005,                 // I-SWZ001005
  kGULSwizzlerMessageCodeAppDelegateSwizzling006 = 1006,                 // I-SWZ001006
  kGULSwizzlerMessageCodeAppDelegateSwizzling007 = 1007,                 // I-SWZ001007
  kGULSwizzlerMessageCodeAppDelegateSwizzling008 = 1008,                 // I-SWZ001008
  kGULSwizzlerMessageCodeAppDelegateSwizzling009 = 1009,                 // I-SWZ001009
  kGULSwizzlerMessageCodeAppDelegateSwizzling010 = 1010,                 // I-SWZ001010
  kGULSwizzlerMessageCodeAppDelegateSwizzling011 = 1011,                 // I-SWZ001011
  kGULSwizzlerMessageCodeAppDelegateSwizzling012 = 1012,                 // I-SWZ001012
  kGULSwizzlerMessageCodeAppDelegateSwizzling013 = 1013,                 // I-SWZ001013
  kGULSwizzlerMessageCodeAppDelegateSwizzlingInvalidAppDelegate = 1014,  // I-SWZ001014

  // Scene Delegate Swizzling.
  kGULSwizzlerMessageCodeSceneDelegateSwizzling000 = 1100,                   // I-SWZ001100
  kGULSwizzlerMessageCodeSceneDelegateSwizzling001 = 1101,                   // I-SWZ001101
  kGULSwizzlerMessageCodeSceneDelegateSwizzling002 = 1102,                   // I-SWZ001102
  kGULSwizzlerMessageCodeSceneDelegateSwizzling003 = 1103,                   // I-SWZ001103
  kGULSwizzlerMessageCodeSceneDelegateSwizzling004 = 1104,                   // I-SWZ001104
  kGULSwizzlerMessageCodeSceneDelegateSwizzling005 = 1105,                   // I-SWZ001105
  kGULSwizzlerMessageCodeSceneDelegateSwizzling006 = 1106,                   // I-SWZ001106
  kGULSwizzlerMessageCodeSceneDelegateSwizzling007 = 1107,                   // I-SWZ001107
  kGULSwizzlerMessageCodeSceneDelegateSwizzling008 = 1108,                   // I-SWZ001108
  kGULSwizzlerMessageCodeSceneDelegateSwizzling009 = 1109,                   // I-SWZ001109
  kGULSwizzlerMessageCodeSceneDelegateSwizzling010 = 1110,                   // I-SWZ001110
  kGULSwizzlerMessageCodeSceneDelegateSwizzling011 = 1111,                   // I-SWZ001111
  kGULSwizzlerMessageCodeSceneDelegateSwizzling012 = 1112,                   // I-SWZ001112
  kGULSwizzlerMessageCodeSceneDelegateSwizzling013 = 1113,                   // I-SWZ001113
  kGULSwizzlerMessageCodeSceneDelegateSwizzlingInvalidSceneDelegate = 1114,  // I-SWZ001114

  // Method Swizzling.
  kGULSwizzlerMessageCodeMethodSwizzling000 = 2000,  // I-SWZ002000
};
