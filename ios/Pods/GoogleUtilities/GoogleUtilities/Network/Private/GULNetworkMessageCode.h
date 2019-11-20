/*
 * Copyright 2017 Google
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

// Make sure these codes do not overlap with any contained in the FIRAMessageCode enum.
typedef NS_ENUM(NSInteger, GULNetworkMessageCode) {
  // GULNetwork.m
  kGULNetworkMessageCodeNetwork000 = 900000,  // I-NET900000
  kGULNetworkMessageCodeNetwork001 = 900001,  // I-NET900001
  kGULNetworkMessageCodeNetwork002 = 900002,  // I-NET900002
  kGULNetworkMessageCodeNetwork003 = 900003,  // I-NET900003
  // GULNetworkURLSession.m
  kGULNetworkMessageCodeURLSession000 = 901000,  // I-NET901000
  kGULNetworkMessageCodeURLSession001 = 901001,  // I-NET901001
  kGULNetworkMessageCodeURLSession002 = 901002,  // I-NET901002
  kGULNetworkMessageCodeURLSession003 = 901003,  // I-NET901003
  kGULNetworkMessageCodeURLSession004 = 901004,  // I-NET901004
  kGULNetworkMessageCodeURLSession005 = 901005,  // I-NET901005
  kGULNetworkMessageCodeURLSession006 = 901006,  // I-NET901006
  kGULNetworkMessageCodeURLSession007 = 901007,  // I-NET901007
  kGULNetworkMessageCodeURLSession008 = 901008,  // I-NET901008
  kGULNetworkMessageCodeURLSession009 = 901009,  // I-NET901009
  kGULNetworkMessageCodeURLSession010 = 901010,  // I-NET901010
  kGULNetworkMessageCodeURLSession011 = 901011,  // I-NET901011
  kGULNetworkMessageCodeURLSession012 = 901012,  // I-NET901012
  kGULNetworkMessageCodeURLSession013 = 901013,  // I-NET901013
  kGULNetworkMessageCodeURLSession014 = 901014,  // I-NET901014
  kGULNetworkMessageCodeURLSession015 = 901015,  // I-NET901015
  kGULNetworkMessageCodeURLSession016 = 901016,  // I-NET901016
  kGULNetworkMessageCodeURLSession017 = 901017,  // I-NET901017
  kGULNetworkMessageCodeURLSession018 = 901018,  // I-NET901018
  kGULNetworkMessageCodeURLSession019 = 901019,  // I-NET901019
};
