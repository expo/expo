package expo.modules.devlauncher.launcher.manifest

import com.google.common.truth.Truth
import expo.modules.manifests.core.Manifest
import org.json.JSONException
import org.json.JSONObject
import org.junit.Assert.assertThrows
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
internal class DevLauncherManifestTest {

  @Test
  fun `checks if fromJson can parse manifest`() {
    val manifest = """
      {"name":"Expo APIs","description":"This demonstrates a bunch of the native components that you can use in React Native core and Expo.","slug":"native-component-list","sdkVersion":"UNVERSIONED","version":"41.0.0","githubUrl":"https://github.com/expo/native-component-list","orientation":"default","primaryColor":"#cccccc","privacy":"public","icon":"./assets/icons/icon.png","scheme":"ncl","notification":{"icon":"./assets/icons/notificationIcon.png","color":"#000000","iosDisplayInForeground":true,"iconUrl":"http://127.0.0.1:8081/assets/./assets/icons/notificationIcon.png"},"splash":{"image":"./assets/icons/loadingIcon.png","imageUrl":"http://127.0.0.1:8081/assets/./assets/icons/loadingIcon.png"},"developmentClient":{"silentLaunch":true},"platforms":["android","ios","web"],"facebookScheme":"fb629712900716487","facebookAppId":"629712900716487","facebookDisplayName":"Expo APIs","facebookAutoLogAppEventsEnabled":true,"facebookAdvertiserIDCollectionEnabled":true,"androidStatusBar":{"backgroundColor":"#4630eb"},"android":{"package":"host.exp.nclexp","versionCode":11,"googleServicesFile":"{\n  \"project_info\": {\n    \"project_number\": \"535516533800\",\n    \"firebase_url\": \"https://native-component-list-ac497.firebaseio.com\",\n    \"project_id\": \"native-component-list-ac497\",\n    \"storage_bucket\": \"native-component-list-ac497.appspot.com\"\n  },\n  \"client\": [\n    {\n      \"client_info\": {\n        \"mobilesdk_app_id\": \"1:535516533800:android:c41d3c676c51294b\",\n        \"android_client_info\": {\n          \"package_name\": \"host.exp.nclexp\"\n        }\n      },\n      \"oauth_client\": [\n        {\n          \"client_id\": \"535516533800-njp69pbcts74n2uuu5tm1srv4r6bgh7o.apps.googleusercontent.com\",\n          \"client_type\": 3\n        }\n      ],\n      \"api_key\": [\n        {\n          \"current_key\": \"AIzaSyDIbiyFGA53t7CKaYSLrBaA7St79d-aoO0\"\n        }\n      ],\n      \"services\": {\n        \"analytics_service\": {\n          \"status\": 1\n        },\n        \"appinvite_service\": {\n          \"status\": 1,\n          \"other_platform_oauth_client\": []\n        },\n        \"ads_service\": {\n          \"status\": 2\n        }\n      }\n    }\n  ],\n  \"configuration_version\": \"1\"\n}\n","playStoreUrl":"https://play.google.com/store/apps/details?id=host.exp.exponent","config":{"googleSignIn":{"apiKey":"AIzaSyC2kse8d0rFfi27jff5nD14cSNcPBQC4Tk","certificateHash":"1746BECB2497593B3296903145793BC0BE8C426B"},"googleMaps":{"apiKey":"AIzaSyC2kse8d0rFfi27jff5nD14cSNcPBQC4Tk"},"branch":{"apiKey":"key_live_pcxsCTBguAUqQBd8CjYZ7ogkurnZcQAO"},"googleMobileAdsAppId":"ca-app-pub-3940256099942544~3347511713"}},"ios":{"bundleIdentifier":"host.exp.nclexp","appStoreUrl":"https://itunes.apple.com/us/app/expo-client/id982107779?mt=8","userInterfaceStyle":"light","usesAppleSignIn":true,"usesIcloudStorage":true,"googleServicesFile":"PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPCFET0NUWVBFIHBsaXN0IFBVQkxJQyAiLS8vQXBwbGUvL0RURCBQTElTVCAxLjAvL0VOIiAiaHR0cDovL3d3dy5hcHBsZS5jb20vRFREcy9Qcm9wZXJ0eUxpc3QtMS4wLmR0ZCI+CjxwbGlzdCB2ZXJzaW9uPSIxLjAiPgo8ZGljdD4KCTxrZXk+Q0xJRU5UX0lEPC9rZXk+Cgk8c3RyaW5nPjEwMjY3NjMyNjU0MTUtNDBkMzkwZnBhYWExMjFrbGoxdTY3cHM5cnI1NWVyYTAuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb208L3N0cmluZz4KCTxrZXk+UkVWRVJTRURfQ0xJRU5UX0lEPC9rZXk+Cgk8c3RyaW5nPmNvbS5nb29nbGV1c2VyY29udGVudC5hcHBzLjEwMjY3NjMyNjU0MTUtNDBkMzkwZnBhYWExMjFrbGoxdTY3cHM5cnI1NWVyYTA8L3N0cmluZz4KCTxrZXk+QVBJX0tFWTwva2V5PgoJPHN0cmluZz5BSXphU3lCZ0g5bW85UjhXR040dGN1ZjdNM0haSFZqNDR6U0R2czQ8L3N0cmluZz4KCTxrZXk+R0NNX1NFTkRFUl9JRDwva2V5PgoJPHN0cmluZz4xMDI2NzYzMjY1NDE1PC9zdHJpbmc+Cgk8a2V5PlBMSVNUX1ZFUlNJT048L2tleT4KCTxzdHJpbmc+MTwvc3RyaW5nPgoJPGtleT5CVU5ETEVfSUQ8L2tleT4KCTxzdHJpbmc+aG9zdC5leHAubmNsZXhwPC9zdHJpbmc+Cgk8a2V5PlBST0pFQ1RfSUQ8L2tleT4KCTxzdHJpbmc+dGVzdC1zdWl0ZS1lY2QyMDwvc3RyaW5nPgoJPGtleT5TVE9SQUdFX0JVQ0tFVDwva2V5PgoJPHN0cmluZz50ZXN0LXN1aXRlLWVjZDIwLmFwcHNwb3QuY29tPC9zdHJpbmc+Cgk8a2V5PklTX0FEU19FTkFCTEVEPC9rZXk+Cgk8ZmFsc2U+PC9mYWxzZT4KCTxrZXk+SVNfQU5BTFlUSUNTX0VOQUJMRUQ8L2tleT4KCTxmYWxzZT48L2ZhbHNlPgoJPGtleT5JU19BUFBJTlZJVEVfRU5BQkxFRDwva2V5PgoJPHRydWU+PC90cnVlPgoJPGtleT5JU19HQ01fRU5BQkxFRDwva2V5PgoJPHRydWU+PC90cnVlPgoJPGtleT5JU19TSUdOSU5fRU5BQkxFRDwva2V5PgoJPHRydWU+PC90cnVlPgoJPGtleT5HT09HTEVfQVBQX0lEPC9rZXk+Cgk8c3RyaW5nPjE6MTAyNjc2MzI2NTQxNTppb3M6MDQ2MjNiN2I1NzMzM2Q4ZGU4YWYyMjwvc3RyaW5nPgoJPGtleT5EQVRBQkFTRV9VUkw8L2tleT4KCTxzdHJpbmc+aHR0cHM6Ly90ZXN0LXN1aXRlLWVjZDIwLmZpcmViYXNlaW8uY29tPC9zdHJpbmc+CjwvZGljdD4KPC9wbGlzdD4=","config":{"usesNonExemptEncryption":false,"googleSignIn":{"reservedClientId":"com.googleusercontent.apps.603386649315-1b2o2gole94qc6h4prj6lvoiueq83se4"},"branch":{"apiKey":"key_live_pcxsCTBguAUqQBd8CjYZ7ogkurnZcQAO"},"googleMobileAdsAppId":"ca-app-pub-3940256099942544~1458002511"},"scheme":["ncl-payments"]},"web":{"build":{"babel":{"root":"./","include":["test-suite","native-component-list","bare-expo"]}}},"assetBundlePatterns":["assets/**","node_modules/react-navigation/src/**/*.png","node_modules/@expo/vector-icons/fonts/*.ttf"],"_internal":{"isDebug":false,"projectRoot":"/Users/lukasz/work/expo/apps/native-component-list","dynamicConfigPath":"/Users/lukasz/work/expo/apps/native-component-list/app.config.js","staticConfigPath":"/Users/lukasz/work/expo/apps/native-component-list/app.json","packageJsonPath":"/Users/lukasz/work/expo/apps/native-component-list/package.json","pluginHistory":{"expo-payments-stripe":{"name":"expo-payments-stripe","version":"9.2.3"},"expo-document-picker":{"name":"expo-document-picker","version":"9.1.2"}}},"plugins":["./plugins/withNotFoundModule","./plugins/withDevMenu","./plugins/withExpoAsyncStorage",["./plugins/withPodfileMinVersion","11.0"],"unimodules-test-core",["./plugins/withGradleProperties",{"org.gradle.jvmargs":"-Xmx3g -XX:MaxPermSize=2048m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8"}],["./plugins/withSettingsImport",{"packageName":"unimodules-test-core","packagePath":"../../../packages/unimodules-test-core/android"}],["expo-payments-stripe",{"scheme":"ncl-payments","merchantId":"merchant.com.example.development"}],["expo-document-picker",{"appleTeamId":"XXXXXX"}]],"xde":true,"developer":{"tool":"expo-cli","projectRoot":"/Users/lukasz/work/expo/apps/native-component-list"},"packagerOpts":{"scheme":null,"hostType":"lan","lanType":"ip","devClient":false,"dev":true,"minify":false,"urlRandomness":"ju-kge","https":false},"mainModuleName":"__generated__/AppEntry","bundleUrl":"http://127.0.0.1:8081/__generated__/AppEntry.bundle?platform=ios&dev=true&hot=false&minify=false","debuggerHost":"127.0.0.1:8081","hostUri":"127.0.0.1:8081","iconUrl":"http://127.0.0.1:8081/assets/./assets/icons/icon.png"}
    """.trimIndent()

    val manifestObj = Manifest.fromManifestJson(JSONObject(manifest))

    Truth.assertThat(manifestObj).isNotNull()
    Truth.assertThat(manifestObj.getSlug()).isEqualTo("native-component-list")
    Truth.assertThat(manifestObj.getHostUri()).isEqualTo("127.0.0.1:8081")
    Truth.assertThat(manifestObj.getPrimaryColor()).isEqualTo("#cccccc")
    Truth.assertThat(manifestObj.getBundleURL()).isEqualTo("http://127.0.0.1:8081/__generated__/AppEntry.bundle?platform=ios&dev=true&hot=false&minify=false")
    Truth.assertThat(manifestObj.getOrientation()).isEqualTo(DevLauncherOrientation.DEFAULT)
  }

  @Test
  fun `checks if fromJson can parse android subsection`() {
    val manifest = """
    {
      "userInterfaceStyle": "light",
      "android": {
        "userInterfaceStyle": "dark",
        "backgroundColor": "#ff0000"
      }
    }
    """.trimIndent()

    val manifestObj = Manifest.fromManifestJson(JSONObject(manifest))

    Truth.assertThat(manifestObj).isNotNull()
    Truth.assertThat(manifestObj.getAndroidUserInterfaceStyle()).isEqualTo(DevLauncherUserInterface.DARK)
    Truth.assertThat(manifestObj.getAndroidBackgroundColor()).isEqualTo("#ff0000")
  }

  @Test
  fun `checks if fromJson throws on invalid json`() {
    val manifest = """
    {
      invalid json
    }
    """.trimIndent()

    val failure = assertThrows(JSONException::class.java) {
      Manifest.fromManifestJson(JSONObject(manifest))
    }

    Truth.assertThat(failure).isNotNull()
  }
}
