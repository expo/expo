// adb -s emulator-5554 shell dumpsys package host.exp.exponent
export const shellDumpsysPackage = `
Activity Resolver Table:
  Schemes:
      expauth:
        66dcbda host.exp.exponent/.experience.HomeActivity filter 779d6e8
          Action: "android.intent.action.VIEW"
          Category: "android.intent.category.DEFAULT"
          Category: "android.intent.category.BROWSABLE"
          Scheme: "expauth"
      stripesdk:
        ab22f39 host.exp.exponent/com.stripe.android.payments.StripeBrowserLauncherActivity filter 757a97e
          Action: "android.intent.action.VIEW"
          Category: "android.intent.category.DEFAULT"
          Category: "android.intent.category.BROWSABLE"
          Scheme: "stripesdk"
          Authority: "payment_return_url": -1
          Path: "PatternMatcher{LITERAL: /host.exp.exponent}"
      exp:
        59241c9 host.exp.exponent/.LauncherActivity filter 9c770ce
          Action: "android.intent.action.VIEW"
          Category: "android.intent.category.DEFAULT"
          Category: "android.intent.category.BROWSABLE"
          Scheme: "exp"
          Scheme: "exps"
      exps:
        59241c9 host.exp.exponent/.LauncherActivity filter 9c770ce
          Action: "android.intent.action.VIEW"
          Category: "android.intent.category.DEFAULT"
          Category: "android.intent.category.BROWSABLE"
          Scheme: "exp"
          Scheme: "exps"
      http:
        59241c9 host.exp.exponent/.LauncherActivity filter b9dfbef
          Action: "android.intent.action.VIEW"
          Category: "android.intent.category.DEFAULT"
          Category: "android.intent.category.BROWSABLE"
          Scheme: "https"
          Scheme: "http"
          Authority: "expo.io": -1
          Authority: "expo.io": -1
          Authority: "expo.dev": -1
          Authority: "expo.dev": -1
          Path: "PatternMatcher{LITERAL: /expo-go}"
          Path: "PatternMatcher{LITERAL: /expo-go}"
          Path: "PatternMatcher{LITERAL: /expo-go}"
          Path: "PatternMatcher{LITERAL: /expo-go}"
          AutoVerify=true
        59241c9 host.exp.exponent/.LauncherActivity filter ee146fc
          Action: "android.intent.action.VIEW"
          Category: "android.intent.category.DEFAULT"
          Category: "android.intent.category.BROWSABLE"
          Scheme: "http"
          Scheme: "https"
          Authority: "exp.host": -1
          Authority: "exp.host": -1
          Authority: ".exp.direct": -1 WILD
          Authority: ".exp.direct": -1 WILD
          Path: "PatternMatcher{PREFIX: /@}"
          Path: "PatternMatcher{PREFIX: /@}"
          Path: "PatternMatcher{GLOB: .*}"
          Path: "PatternMatcher{GLOB: .*}"
      https:
        59241c9 host.exp.exponent/.LauncherActivity filter b9dfbef
          Action: "android.intent.action.VIEW"
          Category: "android.intent.category.DEFAULT"
          Category: "android.intent.category.BROWSABLE"
          Scheme: "https"
          Scheme: "http"
          Authority: "expo.io": -1
          Authority: "expo.io": -1
          Authority: "expo.dev": -1
          Authority: "expo.dev": -1
          Path: "PatternMatcher{LITERAL: /expo-go}"
          Path: "PatternMatcher{LITERAL: /expo-go}"
          Path: "PatternMatcher{LITERAL: /expo-go}"
          Path: "PatternMatcher{LITERAL: /expo-go}"
          AutoVerify=true
        59241c9 host.exp.exponent/.LauncherActivity filter ee146fc
          Action: "android.intent.action.VIEW"
          Category: "android.intent.category.DEFAULT"
          Category: "android.intent.category.BROWSABLE"
          Scheme: "http"
          Scheme: "https"
          Authority: "exp.host": -1
          Authority: "exp.host": -1
          Authority: ".exp.direct": -1 WILD
          Authority: ".exp.direct": -1 WILD
          Path: "PatternMatcher{PREFIX: /@}"
          Path: "PatternMatcher{PREFIX: /@}"
          Path: "PatternMatcher{GLOB: .*}"
          Path: "PatternMatcher{GLOB: .*}"
      host.exp.exponent:
        897994 host.exp.exponent/net.openid.appauth.RedirectUriReceiverActivity filter a0c0c3d
          Action: "android.intent.action.VIEW"
          Category: "android.intent.category.DEFAULT"
          Category: "android.intent.category.BROWSABLE"
          Scheme: "host.exp.exponent"
          Path: "PatternMatcher{LITERAL: oauthredirect}"
      fbconnect:
        709fc32 host.exp.exponent/com.facebook.CustomTabActivity filter 44e9b00
          Action: "android.intent.action.VIEW"
          Category: "android.intent.category.DEFAULT"
          Category: "android.intent.category.BROWSABLE"
          Scheme: "fbconnect"
          Authority: "cct.host.exp.exponent": -1
      expo-home:
        66dcbda host.exp.exponent/.experience.HomeActivity filter dcb6101
          Action: "android.intent.action.VIEW"
          Category: "android.intent.category.DEFAULT"
          Category: "android.intent.category.BROWSABLE"
          Scheme: "expo-home"

  Non-Data Actions:
      expo.modules.notifications.OPEN_APP_ACTION:
        59241c9 host.exp.exponent/.LauncherActivity filter c743185
          Action: "expo.modules.notifications.OPEN_APP_ACTION"
          Category: "android.intent.category.DEFAULT"
          Category: "android.intent.category.BROWSABLE"
      android.intent.action.MAIN:
        66dcbda host.exp.exponent/.experience.HomeActivity filter 578680b
          Action: "android.intent.action.MAIN"
          Category: "android.intent.category.DEFAULT"
          Category: "android.intent.category.LAUNCHER"
        eeccba6 host.exp.exponent/.experience.TvActivity filter 94379e7
          Action: "android.intent.action.MAIN"
          Category: "android.intent.category.LEANBACK_LAUNCHER"
      android.intent.action.VIEW:
        709fc32 host.exp.exponent/com.facebook.CustomTabActivity filter ac3cd83
          Action: "android.intent.action.VIEW"
          Category: "android.intent.category.DEFAULT"
          Category: "android.intent.category.BROWSABLE"

Receiver Resolver Table:
  Non-Data Actions:
      abi43_0_0.expo.modules.notifications.NOTIFICATION_EVENT:
        efd7ead host.exp.exponent/abi43_0_0.expo.modules.notifications.service.NotificationsService filter 555d5e2
          Action: "abi43_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
      android.intent.action.QUICKBOOT_POWERON:
        77769fb host.exp.exponent/.notifications.ExpoNotificationsService filter 344ca18
          Action: "expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
        6d8c71 host.exp.exponent/abi44_0_0.expo.modules.notifications.service.NotificationsService filter fd56a56
          Action: "abi44_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        efd7ead host.exp.exponent/abi43_0_0.expo.modules.notifications.service.NotificationsService filter 555d5e2
          Action: "abi43_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        52058a9 host.exp.exponent/abi42_0_0.expo.modules.notifications.service.NotificationsService filter 57f6e2e
          Action: "abi42_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        b7cd665 host.exp.exponent/abi41_0_0.expo.modules.notifications.service.NotificationsService filter 4983f3a
          Action: "abi41_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        46973e1 host.exp.exponent/.notifications.receivers.SchedulingTriggerReceiver filter 33b1506
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.TIMEZONE_CHANGED"
          Action: "android.intent.action.TIME_CHANGED"
          Action: "android.intent.action.QUICKBOOT_POWERON"
        933f7c7 host.exp.exponent/expo.modules.notifications.service.NotificationsService filter b8951f4
          Action: "expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
      com.htc.intent.action.QUICKBOOT_POWERON:
        77769fb host.exp.exponent/.notifications.ExpoNotificationsService filter 344ca18
          Action: "expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
        6d8c71 host.exp.exponent/abi44_0_0.expo.modules.notifications.service.NotificationsService filter fd56a56
          Action: "abi44_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        efd7ead host.exp.exponent/abi43_0_0.expo.modules.notifications.service.NotificationsService filter 555d5e2
          Action: "abi43_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        52058a9 host.exp.exponent/abi42_0_0.expo.modules.notifications.service.NotificationsService filter 57f6e2e
          Action: "abi42_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        b7cd665 host.exp.exponent/abi41_0_0.expo.modules.notifications.service.NotificationsService filter 4983f3a
          Action: "abi41_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        933f7c7 host.exp.exponent/expo.modules.notifications.service.NotificationsService filter b8951f4
          Action: "expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
      android.intent.action.TIME_CHANGED:
        46973e1 host.exp.exponent/.notifications.receivers.SchedulingTriggerReceiver filter 33b1506
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.TIMEZONE_CHANGED"
          Action: "android.intent.action.TIME_CHANGED"
          Action: "android.intent.action.QUICKBOOT_POWERON"
      expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION:
        7286d1d host.exp.exponent/expo.modules.taskManager.TaskBroadcastReceiver filter ee37b92
          Action: "expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
      com.google.android.gms.analytics.ANALYTICS_DISPATCH:
        afd85f5 host.exp.exponent/com.google.android.gms.analytics.AnalyticsReceiver filter d40df8a
          Action: "com.google.android.gms.analytics.ANALYTICS_DISPATCH"
      com.facebook.sdk.ACTION_CURRENT_ACCESS_TOKEN_CHANGED:
        17218bf host.exp.exponent/com.facebook.CurrentAccessTokenExpirationBroadcastReceiver filter 3d8eb8c
          Action: "com.facebook.sdk.ACTION_CURRENT_ACCESS_TOKEN_CHANGED"
      expo.modules.notifications.NOTIFICATION_EVENT:
        77769fb host.exp.exponent/.notifications.ExpoNotificationsService filter 344ca18
          Action: "expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
        933f7c7 host.exp.exponent/expo.modules.notifications.service.NotificationsService filter b8951f4
          Action: "expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
      abi44_0_0.expo.modules.notifications.NOTIFICATION_EVENT:
        6d8c71 host.exp.exponent/abi44_0_0.expo.modules.notifications.service.NotificationsService filter fd56a56
          Action: "abi44_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
      com.android.vending.INSTALL_REFERRER:
        b6bbedf host.exp.exponent/.referrer.InstallReferrerReceiver filter 82672c
          Action: "com.android.vending.INSTALL_REFERRER"
        2e3be19 host.exp.exponent/com.google.android.gms.measurement.AppMeasurementInstallReferrerReceiver filter f39bede
          Action: "com.android.vending.INSTALL_REFERRER"
      abi43_0_0.expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION:
        b831d73 host.exp.exponent/abi43_0_0.expo.modules.taskManager.TaskBroadcastReceiver filter 3bec430
          Action: "abi43_0_0.expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
      abi41_0_0.expo.modules.notifications.NOTIFICATION_EVENT:
        b7cd665 host.exp.exponent/abi41_0_0.expo.modules.notifications.service.NotificationsService filter 4983f3a
          Action: "abi41_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
      abi41_0_0.expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION:
        8f2c7eb host.exp.exponent/abi41_0_0.expo.modules.taskManager.TaskBroadcastReceiver filter 30ae948
          Action: "abi41_0_0.expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
      androidx.profileinstaller.action.INSTALL_PROFILE:
        56922d5 host.exp.exponent/androidx.profileinstaller.ProfileInstallReceiver filter c1eeaea
          Action: "androidx.profileinstaller.action.INSTALL_PROFILE"
      com.google.android.c2dm.intent.RECEIVE:
        b6e4963 host.exp.exponent/com.google.firebase.iid.FirebaseInstanceIdReceiver filter de39960
          Action: "com.google.android.c2dm.intent.RECEIVE"
      android.intent.action.TIMEZONE_CHANGED:
        46973e1 host.exp.exponent/.notifications.receivers.SchedulingTriggerReceiver filter 33b1506
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.TIMEZONE_CHANGED"
          Action: "android.intent.action.TIME_CHANGED"
          Action: "android.intent.action.QUICKBOOT_POWERON"
      android.intent.action.BOOT_COMPLETED:
        77769fb host.exp.exponent/.notifications.ExpoNotificationsService filter 344ca18
          Action: "expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
        6d8c71 host.exp.exponent/abi44_0_0.expo.modules.notifications.service.NotificationsService filter fd56a56
          Action: "abi44_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        8c8aad7 host.exp.exponent/abi44_0_0.expo.modules.taskManager.TaskBroadcastReceiver filter ac86fc4
          Action: "abi44_0_0.expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
        efd7ead host.exp.exponent/abi43_0_0.expo.modules.notifications.service.NotificationsService filter 555d5e2
          Action: "abi43_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        b831d73 host.exp.exponent/abi43_0_0.expo.modules.taskManager.TaskBroadcastReceiver filter 3bec430
          Action: "abi43_0_0.expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
        52058a9 host.exp.exponent/abi42_0_0.expo.modules.notifications.service.NotificationsService filter 57f6e2e
          Action: "abi42_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        681dcf host.exp.exponent/abi42_0_0.expo.modules.taskManager.TaskBroadcastReceiver filter 283f35c
          Action: "abi42_0_0.expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
        b7cd665 host.exp.exponent/abi41_0_0.expo.modules.notifications.service.NotificationsService filter 4983f3a
          Action: "abi41_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        8f2c7eb host.exp.exponent/abi41_0_0.expo.modules.taskManager.TaskBroadcastReceiver filter 30ae948
          Action: "abi41_0_0.expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
        46973e1 host.exp.exponent/.notifications.receivers.SchedulingTriggerReceiver filter 33b1506
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.TIMEZONE_CHANGED"
          Action: "android.intent.action.TIME_CHANGED"
          Action: "android.intent.action.QUICKBOOT_POWERON"
        933f7c7 host.exp.exponent/expo.modules.notifications.service.NotificationsService filter b8951f4
          Action: "expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        7286d1d host.exp.exponent/expo.modules.taskManager.TaskBroadcastReceiver filter ee37b92
          Action: "expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
      abi44_0_0.expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION:
        8c8aad7 host.exp.exponent/abi44_0_0.expo.modules.taskManager.TaskBroadcastReceiver filter ac86fc4
          Action: "abi44_0_0.expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
      abi42_0_0.expo.modules.notifications.NOTIFICATION_EVENT:
        52058a9 host.exp.exponent/abi42_0_0.expo.modules.notifications.service.NotificationsService filter 57f6e2e
          Action: "abi42_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
      android.intent.action.MY_PACKAGE_REPLACED:
        77769fb host.exp.exponent/.notifications.ExpoNotificationsService filter 344ca18
          Action: "expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
        6d8c71 host.exp.exponent/abi44_0_0.expo.modules.notifications.service.NotificationsService filter fd56a56
          Action: "abi44_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        8c8aad7 host.exp.exponent/abi44_0_0.expo.modules.taskManager.TaskBroadcastReceiver filter ac86fc4
          Action: "abi44_0_0.expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
        efd7ead host.exp.exponent/abi43_0_0.expo.modules.notifications.service.NotificationsService filter 555d5e2
          Action: "abi43_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        b831d73 host.exp.exponent/abi43_0_0.expo.modules.taskManager.TaskBroadcastReceiver filter 3bec430
          Action: "abi43_0_0.expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
        52058a9 host.exp.exponent/abi42_0_0.expo.modules.notifications.service.NotificationsService filter 57f6e2e
          Action: "abi42_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        681dcf host.exp.exponent/abi42_0_0.expo.modules.taskManager.TaskBroadcastReceiver filter 283f35c
          Action: "abi42_0_0.expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
        b7cd665 host.exp.exponent/abi41_0_0.expo.modules.notifications.service.NotificationsService filter 4983f3a
          Action: "abi41_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        8f2c7eb host.exp.exponent/abi41_0_0.expo.modules.taskManager.TaskBroadcastReceiver filter 30ae948
          Action: "abi41_0_0.expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
        933f7c7 host.exp.exponent/expo.modules.notifications.service.NotificationsService filter b8951f4
          Action: "expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        7286d1d host.exp.exponent/expo.modules.taskManager.TaskBroadcastReceiver filter ee37b92
          Action: "expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
      abi42_0_0.expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION:
        681dcf host.exp.exponent/abi42_0_0.expo.modules.taskManager.TaskBroadcastReceiver filter 283f35c
          Action: "abi42_0_0.expo.modules.taskManager.TaskBroadcastReceiver.INTENT_ACTION"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
      android.intent.action.REBOOT:
        77769fb host.exp.exponent/.notifications.ExpoNotificationsService filter 344ca18
          Action: "expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
        6d8c71 host.exp.exponent/abi44_0_0.expo.modules.notifications.service.NotificationsService filter fd56a56
          Action: "abi44_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        efd7ead host.exp.exponent/abi43_0_0.expo.modules.notifications.service.NotificationsService filter 555d5e2
          Action: "abi43_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        52058a9 host.exp.exponent/abi42_0_0.expo.modules.notifications.service.NotificationsService filter 57f6e2e
          Action: "abi42_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        b7cd665 host.exp.exponent/abi41_0_0.expo.modules.notifications.service.NotificationsService filter 4983f3a
          Action: "abi41_0_0.expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        46973e1 host.exp.exponent/.notifications.receivers.SchedulingTriggerReceiver filter 33b1506
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.TIMEZONE_CHANGED"
          Action: "android.intent.action.TIME_CHANGED"
          Action: "android.intent.action.QUICKBOOT_POWERON"
        933f7c7 host.exp.exponent/expo.modules.notifications.service.NotificationsService filter b8951f4
          Action: "expo.modules.notifications.NOTIFICATION_EVENT"
          Action: "android.intent.action.BOOT_COMPLETED"
          Action: "android.intent.action.REBOOT"
          Action: "android.intent.action.QUICKBOOT_POWERON"
          Action: "com.htc.intent.action.QUICKBOOT_POWERON"
          Action: "android.intent.action.MY_PACKAGE_REPLACED"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false

Service Resolver Table:
  Non-Data Actions:
      com.google.firebase.MESSAGING_EVENT:
        fb981db host.exp.exponent/.fcm.ExpoFcmMessagingService filter 1ef3478
          Action: "com.google.firebase.MESSAGING_EVENT"
        1a61751 host.exp.exponent/abi44_0_0.expo.modules.notifications.service.ExpoFirebaseMessagingService filter 878cbb6
          Action: "com.google.firebase.MESSAGING_EVENT"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        e4460b7 host.exp.exponent/abi43_0_0.expo.modules.notifications.service.ExpoFirebaseMessagingService filter d1f2024
          Action: "com.google.firebase.MESSAGING_EVENT"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        1e3d78d host.exp.exponent/abi42_0_0.expo.modules.notifications.service.ExpoFirebaseMessagingService filter dbded42
          Action: "com.google.firebase.MESSAGING_EVENT"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        b345153 host.exp.exponent/abi41_0_0.expo.modules.notifications.service.ExpoFirebaseMessagingService filter f401a90
          Action: "com.google.firebase.MESSAGING_EVENT"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        1c35f89 host.exp.exponent/expo.modules.notifications.service.ExpoFirebaseMessagingService filter 4419b8e
          Action: "com.google.firebase.MESSAGING_EVENT"
          mPriority=-1, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false
        b28afaf host.exp.exponent/com.google.firebase.messaging.FirebaseMessagingService filter 6344fbc
          Action: "com.google.firebase.MESSAGING_EVENT"
          mPriority=-500, mOrder=0, mHasStaticPartialTypes=false, mHasDynamicPartialTypes=false

Permissions:
  Permission [host.exp.exponent.permission.C2D_MESSAGE] (ab6d4ea):
    sourcePackage=host.exp.exponent
    uid=10159 gids=null type=0 prot=signature
    perm=Permission{bb423db host.exp.exponent.permission.C2D_MESSAGE}

Registered ContentProviders:
  host.exp.exponent/abi44_0_0.expo.modules.filesystem.FileSystemFileProvider:
    Provider{5022e78 host.exp.exponent/abi44_0_0.expo.modules.filesystem.FileSystemFileProvider}
  host.exp.exponent/com.facebook.ads.AudienceNetworkContentProvider:
    Provider{4e68951 host.exp.exponent/com.facebook.ads.AudienceNetworkContentProvider}
  host.exp.exponent/abi43_0_0.expo.modules.imagepicker.ImagePickerFileProvider:
    Provider{9a555b6 host.exp.exponent/abi43_0_0.expo.modules.imagepicker.ImagePickerFileProvider}
  host.exp.exponent/androidx.startup.InitializationProvider:
    Provider{c4722b7 host.exp.exponent/androidx.startup.InitializationProvider}
  host.exp.exponent/abi44_0_0.expo.modules.imagepicker.ImagePickerFileProvider:
    Provider{767ba24 host.exp.exponent/abi44_0_0.expo.modules.imagepicker.ImagePickerFileProvider}
  host.exp.exponent/abi42_0_0.expo.modules.sharing.SharingFileProvider:
    Provider{db9698d host.exp.exponent/abi42_0_0.expo.modules.sharing.SharingFileProvider}
  host.exp.exponent/expo.modules.sharing.SharingFileProvider:
    Provider{6291742 host.exp.exponent/expo.modules.sharing.SharingFileProvider}
  host.exp.exponent/abi41_0_0.expo.modules.mailcomposer.MailComposerFileProvider:
    Provider{3a13353 host.exp.exponent/abi41_0_0.expo.modules.mailcomposer.MailComposerFileProvider}
  host.exp.exponent/abi42_0_0.expo.modules.mailcomposer.MailComposerFileProvider:
    Provider{e785490 host.exp.exponent/abi42_0_0.expo.modules.mailcomposer.MailComposerFileProvider}
  host.exp.exponent/abi43_0_0.expo.modules.mailcomposer.MailComposerFileProvider:
    Provider{a601189 host.exp.exponent/abi43_0_0.expo.modules.mailcomposer.MailComposerFileProvider}
  host.exp.exponent/abi44_0_0.expo.modules.mailcomposer.MailComposerFileProvider:
    Provider{935658e host.exp.exponent/abi44_0_0.expo.modules.mailcomposer.MailComposerFileProvider}
  host.exp.exponent/abi41_0_0.expo.modules.sharing.SharingFileProvider:
    Provider{a81b1af host.exp.exponent/abi41_0_0.expo.modules.sharing.SharingFileProvider}
  host.exp.exponent/abi41_0_0.expo.modules.filesystem.FileSystemFileProvider:
    Provider{9b629bc host.exp.exponent/abi41_0_0.expo.modules.filesystem.FileSystemFileProvider}
  host.exp.exponent/androidx.lifecycle.ProcessLifecycleOwnerInitializer:
    Provider{6af3d45 host.exp.exponent/androidx.lifecycle.ProcessLifecycleOwnerInitializer}
  host.exp.exponent/com.google.android.gms.ads.MobileAdsInitProvider:
    Provider{5a64c9a host.exp.exponent/com.google.android.gms.ads.MobileAdsInitProvider}
  host.exp.exponent/androidx.core.content.FileProvider:
    Provider{c41b9cb host.exp.exponent/androidx.core.content.FileProvider}
  host.exp.exponent/abi41_0_0.host.exp.exponent.modules.api.components.webview.RNCWebViewFileProvider:
    Provider{c9a25a8 host.exp.exponent/abi41_0_0.host.exp.exponent.modules.api.components.webview.RNCWebViewFileProvider}
  host.exp.exponent/abi42_0_0.host.exp.exponent.modules.api.components.webview.RNCWebViewFileProvider:
    Provider{d0b68c1 host.exp.exponent/abi42_0_0.host.exp.exponent.modules.api.components.webview.RNCWebViewFileProvider}
  host.exp.exponent/abi43_0_0.host.exp.exponent.modules.api.components.webview.RNCWebViewFileProvider:
    Provider{e0c9866 host.exp.exponent/abi43_0_0.host.exp.exponent.modules.api.components.webview.RNCWebViewFileProvider}
  host.exp.exponent/abi44_0_0.host.exp.exponent.modules.api.components.webview.RNCWebViewFileProvider:
    Provider{6b027a7 host.exp.exponent/abi44_0_0.host.exp.exponent.modules.api.components.webview.RNCWebViewFileProvider}
  host.exp.exponent/abi44_0_0.expo.modules.sharing.SharingFileProvider:
    Provider{73ff454 host.exp.exponent/abi44_0_0.expo.modules.sharing.SharingFileProvider}
  host.exp.exponent/abi42_0_0.expo.modules.filesystem.FileSystemFileProvider:
    Provider{fa4cffd host.exp.exponent/abi42_0_0.expo.modules.filesystem.FileSystemFileProvider}
  host.exp.exponent/expo.modules.mailcomposer.MailComposerFileProvider:
    Provider{b39d4f2 host.exp.exponent/expo.modules.mailcomposer.MailComposerFileProvider}
  host.exp.exponent/abi43_0_0.expo.modules.filesystem.FileSystemFileProvider:
    Provider{bad9743 host.exp.exponent/abi43_0_0.expo.modules.filesystem.FileSystemFileProvider}
  host.exp.exponent/abi41_0_0.expo.modules.imagepicker.ImagePickerFileProvider:
    Provider{dd201c0 host.exp.exponent/abi41_0_0.expo.modules.imagepicker.ImagePickerFileProvider}
  host.exp.exponent/expo.modules.imagepicker.ImagePickerFileProvider:
    Provider{9736ef9 host.exp.exponent/expo.modules.imagepicker.ImagePickerFileProvider}
  host.exp.exponent/expo.modules.filesystem.FileSystemFileProvider:
    Provider{f8c4e3e host.exp.exponent/expo.modules.filesystem.FileSystemFileProvider}
  host.exp.exponent/abi43_0_0.expo.modules.sharing.SharingFileProvider:
    Provider{88649f host.exp.exponent/abi43_0_0.expo.modules.sharing.SharingFileProvider}
  host.exp.exponent/versioned.host.exp.exponent.modules.api.components.webview.RNCWebViewFileProvider:
    Provider{ab579ec host.exp.exponent/versioned.host.exp.exponent.modules.api.components.webview.RNCWebViewFileProvider}
  host.exp.exponent/com.google.firebase.provider.FirebaseInitProvider:
    Provider{2f301b5 host.exp.exponent/com.google.firebase.provider.FirebaseInitProvider}
  host.exp.exponent/com.facebook.internal.FacebookInitProvider:
    Provider{2fb104a host.exp.exponent/com.facebook.internal.FacebookInitProvider}
  host.exp.exponent/abi42_0_0.expo.modules.imagepicker.ImagePickerFileProvider:
    Provider{718abbb host.exp.exponent/abi42_0_0.expo.modules.imagepicker.ImagePickerFileProvider}

ContentProvider Authorities:
  [host.exp.exponent.AudienceNetworkContentProvider]:
    Provider{4e68951 host.exp.exponent/com.facebook.ads.AudienceNetworkContentProvider}
      applicationInfo=ApplicationInfo{527c2fd host.exp.exponent}
  [host.exp.exponent.ImagePickerFileProvider]:
    Provider{767ba24 host.exp.exponent/abi44_0_0.expo.modules.imagepicker.ImagePickerFileProvider}
      applicationInfo=ApplicationInfo{c054bf2 host.exp.exponent}
  [host.exp.exponent.SharingFileProvider]:
    Provider{73ff454 host.exp.exponent/abi44_0_0.expo.modules.sharing.SharingFileProvider}
      applicationInfo=ApplicationInfo{a914243 host.exp.exponent}
  [host.exp.exponent.MailComposerFileProvider]:
    Provider{935658e host.exp.exponent/abi44_0_0.expo.modules.mailcomposer.MailComposerFileProvider}
      applicationInfo=ApplicationInfo{4dbd0c0 host.exp.exponent}
  [host.exp.exponent.mobileadsinitprovider]:
    Provider{5a64c9a host.exp.exponent/com.google.android.gms.ads.MobileAdsInitProvider}
      applicationInfo=ApplicationInfo{fb291f9 host.exp.exponent}
  [host.exp.exponent.lifecycle-process]:
    Provider{6af3d45 host.exp.exponent/androidx.lifecycle.ProcessLifecycleOwnerInitializer}
      applicationInfo=ApplicationInfo{718353e host.exp.exponent}
  [host.exp.exponent.androidx-startup]:
    Provider{c4722b7 host.exp.exponent/androidx.startup.InitializationProvider}
      applicationInfo=ApplicationInfo{17bbf9f host.exp.exponent}
  [host.exp.exponent.firebaseinitprovider]:
    Provider{2f301b5 host.exp.exponent/com.google.firebase.provider.FirebaseInitProvider}
      applicationInfo=ApplicationInfo{a0d38ec host.exp.exponent}
  [host.exp.exponent.fileprovider]:
    Provider{6b027a7 host.exp.exponent/abi44_0_0.host.exp.exponent.modules.api.components.webview.RNCWebViewFileProvider}
      applicationInfo=ApplicationInfo{18154b5 host.exp.exponent}
  [host.exp.exponent.provider]:
    Provider{c41b9cb host.exp.exponent/androidx.core.content.FileProvider}
      applicationInfo=ApplicationInfo{4de674a host.exp.exponent}
  [host.exp.exponent.FacebookInitProvider]:
    Provider{2fb104a host.exp.exponent/com.facebook.internal.FacebookInitProvider}
      applicationInfo=ApplicationInfo{366b6bb host.exp.exponent}
  [host.exp.exponent.FileSystemFileProvider]:
    Provider{5022e78 host.exp.exponent/abi44_0_0.expo.modules.filesystem.FileSystemFileProvider}
      applicationInfo=ApplicationInfo{e0af7d8 host.exp.exponent}

Key Set Manager:
  [host.exp.exponent]
      Signing KeySets: 35

Packages:
  Package [host.exp.exponent] (801361c):
    userId=10159
    pkg=Package{ca8c225 host.exp.exponent}
    codePath=/data/app/~~KeB2iFfz6iw3vTSAy3c4Ig==/host.exp.exponent-SLI3KWo_NeOeME6CrjCDMw==
    resourcePath=/data/app/~~KeB2iFfz6iw3vTSAy3c4Ig==/host.exp.exponent-SLI3KWo_NeOeME6CrjCDMw==
    legacyNativeLibraryDir=/data/app/~~KeB2iFfz6iw3vTSAy3c4Ig==/host.exp.exponent-SLI3KWo_NeOeME6CrjCDMw==/lib
    primaryCpuAbi=x86
    secondaryCpuAbi=null
    versionCode=164 minSdk=21 targetSdk=30
    versionName=2.23.2
    splits=[base]
    apkSigningVersion=2
    applicationInfo=ApplicationInfo{ca8c225 host.exp.exponent}
    flags=[ HAS_CODE ALLOW_CLEAR_USER_DATA ALLOW_BACKUP LARGE_HEAP ]
    privateFlags=[ PRIVATE_FLAG_ACTIVITIES_RESIZE_MODE_RESIZEABLE_VIA_SDK_VERSION ALLOW_AUDIO_PLAYBACK_CAPTURE PRIVATE_FLAG_REQUEST_LEGACY_EXTERNAL_STORAGE HAS_DOMAIN_URLS PARTIALLY_DIRECT_BOOT_AWARE PRIVATE_FLAG_ALLOW_NATIVE_HEAP_POINTER_TAGGING ]
    forceQueryable=false
    queriesIntents=[Intent { act=android.intent.action.VIEW dat=content://*/* }, Intent { act=android.intent.action.SEND cat=[android.intent.category.DEFAULT] dat=content://*/* typ=application/octet-stream }, Intent { act=android.intent.action.SEND cat=[android.intent.category.DEFAULT] dat=content://*/* typ=text/x-vcard }, Intent { act=android.intent.action.SEND cat=[android.intent.category.DEFAULT] dat=content://*/* typ=text/vcard }, Intent { act=android.intent.action.EDIT }, Intent { act=android.intent.action.INSERT }, Intent { act=android.intent.action.OPEN_DOCUMENT cat=[android.intent.category.DEFAULT,android.intent.category.OPENABLE] dat=content://*/* typ=*/* }, Intent { act=android.intent.action.OPEN_DOCUMENT_TREE }, Intent { act=android.media.action.IMAGE_CAPTURE }, Intent { act=android.media.action.ACTION_VIDEO_CAPTURE }, Intent { act=android.intent.action.SENDTO dat=mailto:xxxxx }, Intent { act=android.intent.action.SEND_MULTIPLE cat=[android.intent.category.DEFAULT] dat=content://*/* typ=*/* }, Intent { act=android.intent.action.SEND dat=content://*/* typ=*/* }, Intent { act=android.intent.action.SEND dat=content://*/* typ=*/* }, Intent { act=android.intent.action.SENDTO cat=[android.intent.category.DEFAULT,android.intent.category.BROWSABLE] dat=sms:xxxxx }, Intent { act=android.intent.action.SENDTO cat=[android.intent.category.DEFAULT,android.intent.category.BROWSABLE] dat=smsto:xxxxx }, Intent { act=android.intent.action.TTS_SERVICE }, Intent { act=android.support.customtabs.action.CustomTabsService }, Intent { act=android.intent.action.SEND cat=[android.intent.category.DEFAULT] dat=content://*/* typ=application/octet-stream }, Intent { act=android.intent.action.SEND cat=[android.intent.category.DEFAULT] dat=content://*/* typ=text/x-vcard }, Intent { act=android.intent.action.SEND cat=[android.intent.category.DEFAULT] dat=content://*/* typ=text/vcard }, Intent { act=android.intent.action.EDIT }, Intent { act=android.intent.action.INSERT }, Intent { act=android.intent.action.OPEN_DOCUMENT cat=[android.intent.category.DEFAULT,android.intent.category.OPENABLE] dat=content://*/* typ=*/* }, Intent { act=android.intent.action.OPEN_DOCUMENT_TREE }, Intent { act=android.media.action.IMAGE_CAPTURE }, Intent { act=android.media.action.ACTION_VIDEO_CAPTURE }, Intent { act=android.intent.action.SENDTO dat=mailto:xxxxx }, Intent { act=android.intent.action.SEND_MULTIPLE cat=[android.intent.category.DEFAULT] dat=content://*/* typ=*/* }, Intent { act=android.intent.action.SEND dat=content://*/* typ=*/* }, Intent { act=android.intent.action.SEND dat=content://*/* typ=*/* }, Intent { act=android.intent.action.SENDTO cat=[android.intent.category.DEFAULT,android.intent.category.BROWSABLE] dat=sms:xxxxx }, Intent { act=android.intent.action.SENDTO cat=[android.intent.category.DEFAULT,android.intent.category.BROWSABLE] dat=smsto:xxxxx }, Intent { act=android.intent.action.TTS_SERVICE }, Intent { act=android.support.customtabs.action.CustomTabsService }]
    dataDir=/data/user/0/host.exp.exponent
    supportsScreens=[small, medium, large, xlarge, resizeable, anyDensity]
    usesOptionalLibraries:
      org.apache.http.legacy
    usesLibraryFiles:
      /system/framework/org.apache.http.legacy.jar
    timeStamp=2022-01-05 11:26:56
    firstInstallTime=2022-01-05 11:26:58
    lastUpdateTime=2022-01-05 11:26:58
    signatures=PackageSignatures{ca01ffa version:2, signatures:[57f52fdb], past signatures:[]}
    installPermissionsFixed=true
    pkgFlags=[ HAS_CODE ALLOW_CLEAR_USER_DATA ALLOW_BACKUP LARGE_HEAP ]
    declared permissions:
      host.exp.exponent.permission.C2D_MESSAGE: prot=signature, INSTALLED
    requested permissions:
      host.exp.exponent.permission.C2D_MESSAGE
      com.google.android.c2dm.permission.RECEIVE
      android.permission.ACCESS_NETWORK_STATE
      android.permission.INTERNET
      android.permission.SYSTEM_ALERT_WINDOW
      android.permission.WAKE_LOCK
      android.permission.MANAGE_DOCUMENTS
      android.permission.READ_INTERNAL_STORAGE
      android.permission.READ_PHONE_STATE
      android.permission.USE_FINGERPRINT
      android.permission.VIBRATE
      com.android.launcher.permission.INSTALL_SHORTCUT
      android.permission.MODIFY_AUDIO_SETTINGS
      android.permission.ACCESS_COARSE_LOCATION
      android.permission.ACCESS_FINE_LOCATION
      android.permission.CAMERA
      android.permission.READ_CONTACTS
      android.permission.READ_CALENDAR
      android.permission.WRITE_CALENDAR
      android.permission.READ_EXTERNAL_STORAGE: restricted=true
      android.permission.RECORD_AUDIO
      android.permission.WRITE_EXTERNAL_STORAGE: restricted=true
      android.permission.WRITE_SETTINGS
      android.permission.ACCESS_WIFI_STATE
      android.permission.ACCESS_BACKGROUND_LOCATION: restricted=true
      android.permission.ACCESS_MEDIA_LOCATION
      android.permission.RECEIVE_BOOT_COMPLETED
      android.permission.USE_BIOMETRIC
      android.permission.FOREGROUND_SERVICE
      com.sec.android.provider.badge.permission.READ
      com.sec.android.provider.badge.permission.WRITE
      com.htc.launcher.permission.READ_SETTINGS
      com.htc.launcher.permission.UPDATE_SHORTCUT
      com.sonyericsson.home.permission.BROADCAST_BADGE
      com.sonymobile.home.permission.PROVIDER_INSERT_BADGE
      com.anddoes.launcher.permission.UPDATE_COUNT
      com.majeur.launcher.permission.UPDATE_BADGE
      com.huawei.android.launcher.permission.CHANGE_BADGE
      com.huawei.android.launcher.permission.READ_SETTINGS
      com.huawei.android.launcher.permission.WRITE_SETTINGS
      android.permission.READ_APP_BADGE
      com.oppo.launcher.permission.READ_SETTINGS
      com.oppo.launcher.permission.WRITE_SETTINGS
      me.everything.badger.permission.BADGE_COUNT_READ
      me.everything.badger.permission.BADGE_COUNT_WRITE
      com.google.android.providers.gsf.permission.READ_GSERVICES
      com.google.android.gms.permission.ACTIVITY_RECOGNITION
      com.google.android.finsky.permission.BIND_GET_INSTALL_REFERRER_SERVICE
      com.android.vending.BILLING
    install permissions:
      com.google.android.c2dm.permission.RECEIVE: granted=true
      android.permission.MODIFY_AUDIO_SETTINGS: granted=true
      com.google.android.providers.gsf.permission.READ_GSERVICES: granted=true
      android.permission.FOREGROUND_SERVICE: granted=true
      android.permission.RECEIVE_BOOT_COMPLETED: granted=true
      android.permission.INTERNET: granted=true
      host.exp.exponent.permission.C2D_MESSAGE: granted=true
      android.permission.ACCESS_NETWORK_STATE: granted=true
      com.google.android.gms.permission.ACTIVITY_RECOGNITION: granted=true
      android.permission.USE_FINGERPRINT: granted=true
      android.permission.VIBRATE: granted=true
      android.permission.ACCESS_WIFI_STATE: granted=true
      android.permission.USE_BIOMETRIC: granted=true
      com.android.launcher.permission.INSTALL_SHORTCUT: granted=true
      android.permission.WAKE_LOCK: granted=true
    User 0: ceDataInode=131619 installed=true hidden=false suspended=false distractionFlags=0 stopped=false notLaunched=false enabled=0 instant=false virtual=false
      gids=[3003]
      runtime permissions:
        android.permission.READ_CALENDAR: granted=false, flags=[ USER_SENSITIVE_WHEN_GRANTED|USER_SENSITIVE_WHEN_DENIED]
        android.permission.ACCESS_FINE_LOCATION: granted=false, flags=[ USER_SENSITIVE_WHEN_GRANTED|USER_SENSITIVE_WHEN_DENIED]
        android.permission.READ_EXTERNAL_STORAGE: granted=false, flags=[ USER_SENSITIVE_WHEN_GRANTED|USER_SENSITIVE_WHEN_DENIED|RESTRICTION_INSTALLER_EXEMPT]
        android.permission.ACCESS_COARSE_LOCATION: granted=false, flags=[ USER_SENSITIVE_WHEN_GRANTED|USER_SENSITIVE_WHEN_DENIED]
        android.permission.READ_PHONE_STATE: granted=false, flags=[ USER_SENSITIVE_WHEN_GRANTED|USER_SENSITIVE_WHEN_DENIED]
        android.permission.CAMERA: granted=false, flags=[ USER_SENSITIVE_WHEN_GRANTED|USER_SENSITIVE_WHEN_DENIED]
        android.permission.WRITE_CALENDAR: granted=false, flags=[ USER_SENSITIVE_WHEN_GRANTED|USER_SENSITIVE_WHEN_DENIED]
        android.permission.WRITE_EXTERNAL_STORAGE: granted=false, flags=[ USER_SENSITIVE_WHEN_GRANTED|USER_SENSITIVE_WHEN_DENIED|RESTRICTION_INSTALLER_EXEMPT]
        android.permission.RECORD_AUDIO: granted=false, flags=[ USER_SENSITIVE_WHEN_GRANTED|USER_SENSITIVE_WHEN_DENIED]
        android.permission.READ_CONTACTS: granted=false, flags=[ USER_SENSITIVE_WHEN_GRANTED|USER_SENSITIVE_WHEN_DENIED]
        android.permission.ACCESS_BACKGROUND_LOCATION: granted=false, flags=[ USER_SENSITIVE_WHEN_GRANTED|USER_SENSITIVE_WHEN_DENIED|RESTRICTION_INSTALLER_EXEMPT]
        android.permission.ACCESS_MEDIA_LOCATION: granted=false, flags=[ USER_SENSITIVE_WHEN_GRANTED|USER_SENSITIVE_WHEN_DENIED]

Queries:
  system apps queryable: false
  queries via package name:
    com.helloworld:
      host.exp.exponent
    host.exp.exponent:
      com.android.chrome
    bluetooth.test.com:
      host.exp.exponent
    com.bacon.withwebrtc:
      host.exp.exponent
    com.bacon.withpdf:
      host.exp.exponent
  queries via intent:
    com.bacon.withappleauth:
      host.exp.exponent
    com.bacon.app:
      host.exp.exponent
    com.helloworld:
      host.exp.exponent
    com.bacon.yolo83:
      host.exp.exponent
    host.exp.exponent:
      com.google.android.documentsui
      com.android.bips
      com.google.android.googlequicksearchbox
      com.google.android.apps.docs
      com.google.android.gm
      com.google.android.tts
      com.android.camera2
      com.android.chrome
      com.google.android.apps.maps
      com.google.android.apps.messaging
      com.google.android.youtube
      com.google.android.music
      com.google.android.calendar
      com.google.android.apps.photos
    com.bacon.yolo76:
      host.exp.exponent
    bluetooth.test.com:
      host.exp.exponent
    com.bacon.yolo80:
      host.exp.exponent
    com.bacon.withwebrtc:
      host.exp.exponent
    com.bacon.withpdf:
      host.exp.exponent
  queryable via interaction:
    User 0:
      [com.android.server.telecom,android,com.android.inputdevices,com.android.location.fused,com.android.dynsystem,com.android.emulator.multidisplay,com.android.settings,com.android.localtransport,com.android.keychain,com.android.providers.settings,com.android.wallpaperbackup]:
        host.exp.exponent
      [com.google.android.gsf,com.google.android.gms]:
        host.exp.exponent
      com.google.android.webview:
        host.exp.exponent
      com.google.android.tts:
        host.exp.exponent
      host.exp.exponent:
        com.google.android.webview

Package Changes:
  Sequence number=17
  User 0:
    seq=7, package=com.google.android.gms
    seq=10, package=com.bacon.withappleauth
    seq=16, package=com.bacon.yolo83


Dexopt state:
  [host.exp.exponent]
    path: /data/app/~~KeB2iFfz6iw3vTSAy3c4Ig==/host.exp.exponent-SLI3KWo_NeOeME6CrjCDMw==/base.apk
      x86: [status=speed-profile] [reason=install]


Compiler stats:
  [host.exp.exponent]
    (No recorded stats)

APEX session state:

Active APEX packages:


Inactive APEX packages:


Factory APEX packages:`;
