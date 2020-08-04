// Copyright 2019 Google
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

#import <FirebaseCore/FirebaseCore.h>

#if !defined(__has_include)
  #error "Firebase.h won't import anything if your compiler doesn't support __has_include. Please \
          import the headers individually."
#else
  #if __has_include(<FirebaseAnalytics/FirebaseAnalytics.h>)
    #import <FirebaseAnalytics/FirebaseAnalytics.h>
  #endif

  #if __has_include(<FirebaseAuth/FirebaseAuth.h>)
    #import <FirebaseAuth/FirebaseAuth.h>
  #endif

  #if __has_include(<FirebaseDatabase/FirebaseDatabase.h>)
    #import <FirebaseDatabase/FirebaseDatabase.h>
  #endif

  #if __has_include(<FirebaseDynamicLinks/FirebaseDynamicLinks.h>)
    #import <FirebaseDynamicLinks/FirebaseDynamicLinks.h>
    #if !__has_include(<FirebaseAnalytics/FirebaseAnalytics.h>)
      #ifndef FIREBASE_ANALYTICS_SUPPRESS_WARNING
        #warning "FirebaseAnalytics.framework is not included in your target. Please add \
`Firebase/Analytics` to your Podfile or add FirebaseAnalytics.framework to your project to ensure \
Firebase Dynamic Links works as intended."
      #endif // #ifndef FIREBASE_ANALYTICS_SUPPRESS_WARNING
    #endif
  #endif

  #if __has_include(<FirebaseFirestore/FirebaseFirestore.h>)
    #import <FirebaseFirestore/FirebaseFirestore.h>
  #endif

  #if __has_include(<FirebaseFunctions/FirebaseFunctions.h>)
    #import <FirebaseFunctions/FirebaseFunctions.h>
  #endif

  #if __has_include(<FirebaseInAppMessaging/FirebaseInAppMessaging.h>)
    #import <FirebaseInAppMessaging/FirebaseInAppMessaging.h>
    #if !__has_include(<FirebaseAnalytics/FirebaseAnalytics.h>)
      #ifndef FIREBASE_ANALYTICS_SUPPRESS_WARNING
        #warning "FirebaseAnalytics.framework is not included in your target. Please add \
`Firebase/Analytics` to your Podfile or add FirebaseAnalytics.framework to your project to ensure \
Firebase In App Messaging works as intended."
      #endif // #ifndef FIREBASE_ANALYTICS_SUPPRESS_WARNING
    #endif
  #endif

  #if __has_include(<FirebaseInstanceID/FirebaseInstanceID.h>)
    #import <FirebaseInstanceID/FirebaseInstanceID.h>
  #endif

  #if __has_include(<FirebaseMessaging/FirebaseMessaging.h>)
    #import <FirebaseMessaging/FirebaseMessaging.h>
      #if !__has_include(<FirebaseAnalytics/FirebaseAnalytics.h>)
      #ifndef FIREBASE_ANALYTICS_SUPPRESS_WARNING
        #warning "FirebaseAnalytics.framework is not included in your target. Please add \
`Firebase/Analytics` to your Podfile or add FirebaseAnalytics.framework to your project to ensure \
Firebase Messaging works as intended."
      #endif // #ifndef FIREBASE_ANALYTICS_SUPPRESS_WARNING
    #endif
#endif

  #if __has_include(<FirebaseMLCommon/FirebaseMLCommon.h>)
    #import <FirebaseMLCommon/FirebaseMLCommon.h>
  #endif

  #if __has_include(<FirebaseMLModelInterpreter/FirebaseMLModelInterpreter.h>)
    #import <FirebaseMLModelInterpreter/FirebaseMLModelInterpreter.h>
  #endif

  #if __has_include(<FirebaseMLNLLanguageID/FirebaseMLNLLanguageID.h>)
    #import <FirebaseMLNLLanguageID/FirebaseMLNLLanguageID.h>
  #endif

  #if __has_include(<FirebaseMLNLSmartReply/FirebaseMLNLSmartReply.h>)
    #import <FirebaseMLNLSmartReply/FirebaseMLNLSmartReply.h>
  #endif

  #if __has_include(<FirebaseMLNLTranslate/FirebaseMLNLTranslate.h>)
    #import <FirebaseMLNLTranslate/FirebaseMLNLTranslate.h>
  #endif

  #if __has_include(<FirebaseMLNaturalLanguage/FirebaseMLNaturalLanguage.h>)
    #import <FirebaseMLNaturalLanguage/FirebaseMLNaturalLanguage.h>
  #endif

  #if __has_include(<FirebaseMLVision/FirebaseMLVision.h>)
    #import <FirebaseMLVision/FirebaseMLVision.h>
  #endif

  #if __has_include(<FirebaseMLVisionAutoML/FirebaseMLVisionAutoML.h>)
    #import <FirebaseMLVisionAutoML/FirebaseMLVisionAutoML.h>
  #endif

  #if __has_include(<FirebaseMLVisionBarcodeModel/FirebaseMLVisionBarcodeModel.h>)
    #import <FirebaseMLVisionBarcodeModel/FirebaseMLVisionBarcodeModel.h>
  #endif

  #if __has_include(<FirebaseMLVisionFaceModel/FirebaseMLVisionFaceModel.h>)
    #import <FirebaseMLVisionFaceModel/FirebaseMLVisionFaceModel.h>
  #endif

  #if __has_include(<FirebaseMLVisionLabelModel/FirebaseMLVisionLabelModel.h>)
    #import <FirebaseMLVisionLabelModel/FirebaseMLVisionLabelModel.h>
  #endif

  #if __has_include(<FirebaseMLVisionObjectDetection/FirebaseMLVisionObjectDetection.h>)
    #import <FirebaseMLVisionObjectDetection/FirebaseMLVisionObjectDetection.h>
  #endif

  #if __has_include(<FirebaseMLVisionTextModel/FirebaseMLVisionTextModel.h>)
    #import <FirebaseMLVisionTextModel/FirebaseMLVisionTextModel.h>
  #endif

  #if __has_include(<FirebasePerformance/FirebasePerformance.h>)
    #import <FirebasePerformance/FirebasePerformance.h>
    #if !__has_include(<FirebaseAnalytics/FirebaseAnalytics.h>)
      #ifndef FIREBASE_ANALYTICS_SUPPRESS_WARNING
        #warning "FirebaseAnalytics.framework is not included in your target. Please add \
`Firebase/Analytics` to your Podfile or add FirebaseAnalytics.framework to your project to ensure \
Firebase Performance works as intended."
      #endif // #ifndef FIREBASE_ANALYTICS_SUPPRESS_WARNING
    #endif
  #endif

  #if __has_include(<FirebaseRemoteConfig/FirebaseRemoteConfig.h>)
    #import <FirebaseRemoteConfig/FirebaseRemoteConfig.h>
    #if !__has_include(<FirebaseAnalytics/FirebaseAnalytics.h>)
      #ifndef FIREBASE_ANALYTICS_SUPPRESS_WARNING
        #warning "FirebaseAnalytics.framework is not included in your target. Please add \
`Firebase/Analytics` to your Podfile or add FirebaseAnalytics.framework to your project to ensure \
Firebase Remote Config works as intended."
      #endif // #ifndef FIREBASE_ANALYTICS_SUPPRESS_WARNING
    #endif
  #endif

  #if __has_include(<FirebaseStorage/FirebaseStorage.h>)
    #import <FirebaseStorage/FirebaseStorage.h>
  #endif

  #if __has_include(<GoogleMobileAds/GoogleMobileAds.h>)
    #import <GoogleMobileAds/GoogleMobileAds.h>
  #endif

  #if __has_include(<Fabric/Fabric.h>)
    #import <Fabric/Fabric.h>
  #endif

  #if __has_include(<Crashlytics/Crashlytics.h>)
    #import <Crashlytics/Crashlytics.h>
  #endif

#endif  // defined(__has_include)
