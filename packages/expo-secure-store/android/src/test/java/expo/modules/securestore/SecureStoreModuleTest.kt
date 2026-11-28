package expo.modules.securestore

import android.app.KeyguardManager
import android.content.Context
import android.content.ContextWrapper
import android.content.SharedPreferences
import android.hardware.biometrics.BiometricManager
import android.preference.PreferenceManager
import androidx.test.core.app.ApplicationProvider
import com.facebook.react.bridge.BridgeReactContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions
import expo.modules.v2.legacyAppContext
import io.github.expo.modules.v2.Enumerable
import io.github.expo.modules.v2.ExpoObject
import io.github.expo.modules.v2.core.ExpoModulesV2
import io.github.expo.modules.v2.react.ReactExpoContext
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.androidContextOrNull
import io.github.expo.modules.v2.react.reactContext
import io.github.expo.modules.v2.react.reactContextOrNull
import io.github.expo.modules.v2.records.codecFor
import io.mockk.every
import io.mockk.mockk
import io.mockk.mockkObject
import io.mockk.mockkStatic
import io.mockk.spyk
import io.mockk.unmockkObject
import io.mockk.unmockkStatic
import io.mockk.verify
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.shadow.api.Shadow
import org.robolectric.shadows.ShadowBiometricManager

/** The file class that holds `androidContext` and the other extensions, which mockk mocks as statics. */
private const val REACT_CONTEXT_EXTENSIONS = "io.github.expo.modules.v2.react.ReactContextExtensionsKt"

/** The file class that holds `legacyAppContext`. Its `AppExpoContext` is internal to expo-modules-core. */
private const val APP_EXPO_CONTEXT_EXTENSIONS = "expo.modules.v2.AppExpoContextKt"

private const val NO_FOREGROUND_ACTIVITY_MESSAGE =
  "Could not authenticate the user: Cannot display biometric prompt when the app is not in the foreground"

/** Mirrors Expo Go's `ScopedContext`, which gives every experience its own preference files. */
private class ScopedContext(base: Context) : ContextWrapper(base) {
  override fun getSharedPreferences(name: String, mode: Int): SharedPreferences =
    super.getSharedPreferences("experience-$name", mode)
}

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
class SecureStoreModuleTest {
  private val reactContext = BridgeReactContext(ApplicationProvider.getApplicationContext())

  // A module holds its context weakly. In an app, the host keeps it alive.
  private lateinit var expoContext: ReactExpoContext

  // The file name and the key format are what an update reads back. A change here loses user data.
  private fun storedItem(context: Context, key: String, keychainService: String = "key_v1"): JSONObject? =
    context.getSharedPreferences("SecureStore", Context.MODE_PRIVATE)
      .getString("$keychainService-$key", null)
      ?.let(::JSONObject)

  private fun setCanAuthenticateWithBiometrics(canAuthenticate: Boolean) {
    val biometricManager: ShadowBiometricManager =
      Shadow.extract(reactContext.getSystemService(BiometricManager::class.java))
    biometricManager.setAuthenticatorType(BiometricManager.Authenticators.BIOMETRIC_STRONG)
    biometricManager.setCanAuthenticate(canAuthenticate)
  }

  private fun setDeviceSecure(isSecure: Boolean) {
    shadowOf(reactContext.getSystemService(KeyguardManager::class.java)).setIsDeviceSecure(isSecure)
  }

  @Before
  fun setUp() {
    // A JVM test has no Expo Modules v2 native library, which a module registry loads when it is
    // created. Nothing in these tests calls into it.
    mockkObject(ExpoModulesV2)
    every { ExpoModulesV2.load() } returns Unit
    FakeAndroidKeyStore.install()
    expoContext = ReactExpoContext(reactContext)
    // Outside Expo Go, the storage context is the app context itself.
    val appContext = mockk<AppContext> {
      every { storageContext } returns this@SecureStoreModuleTest.reactContext
    }
    mockkStatic(APP_EXPO_CONTEXT_EXTENSIONS)
    every { any<ExpoObject>().legacyAppContext } returns appContext
  }

  @After
  fun tearDown() {
    unmockkStatic(APP_EXPO_CONTEXT_EXTENSIONS)
    FakeAndroidKeyStore.uninstall()
    unmockkObject(ExpoModulesV2)
  }

  private fun registeredModule(): SecureStoreModule =
    SecureStoreModule().also { expoContext.moduleRegistry.register(it) }

  @Test
  fun `options decode from what JS sends like they did in v1`() {
    // `normalizeOptions` in SecureStore.ts leaves `requireAuthentication` out when it is undefined,
    // and turns the deprecated booleans into 'none' and 'biometry'. An absent field takes the default.
    val codec = codecFor<SecureStoreOptions>()

    val defaults = codec.fromMap(emptyMap())
    assertEquals(" ", defaults.authenticationPrompt)
    assertEquals("key_v1", defaults.keychainService)
    assertEquals(AuthenticationMethod.NONE, defaults.requireAuthentication)
    assertTrue(defaults.requireConfirmation)

    assertEquals(AuthenticationMethod.NONE, codec.fromMap(mapOf("requireAuthentication" to "none")).requireAuthentication)
    assertEquals(AuthenticationMethod.BIOMETRY, codec.fromMap(mapOf("requireAuthentication" to "biometry")).requireAuthentication)
    assertEquals(
      AuthenticationMethod.DEVICE_CREDENTIALS,
      codec.fromMap(mapOf("requireAuthentication" to "deviceCredentials")).requireAuthentication
    )
    // v1 rejected these too. Falling back to no authentication would store a secret unprotected.
    for (invalid in listOf("faceId", true, null)) {
      assertThrows(IllegalArgumentException::class.java) {
        codec.fromMap(mapOf("requireAuthentication" to invalid))
      }
    }
    // R8 keeps the entries and the `value` property of an enum only when it is a v2 `Enumerable`.
    // Without them, a release build would send the entry names to JS or fail.
    assertTrue(Enumerable::class.java.isAssignableFrom(AuthenticationMethod::class.java))
  }

  @Test
  fun `an async write is read back from the SecureStore preferences file in the stored format`() {
    val module = registeredModule()
    val options = SecureStoreOptions()

    runBlocking { module.setValueWithKeyAsync("secret", "token", options) }

    val item = requireNotNull(storedItem(reactContext, "token"))
    assertEquals("aes", item.getString("scheme"))
    assertTrue(item.getBoolean("usesKeystoreSuffix"))
    assertEquals("key_v1", item.getString("keystoreAlias"))
    // Older versions read this field with `optBoolean`, so it stays a boolean for no authentication.
    assertEquals(false, item.get("requireAuthentication"))
    assertFalse(item.toString().contains("secret"))
    assertEquals(
      setOf("AES/GCM/NoPadding:key_v1:keystoreUnauthenticated"),
      FakeAndroidKeyStore.entries.keys
    )

    assertEquals("secret", runBlocking { module.getValueWithKeyAsync("token", options) })
  }

  @Test
  fun `a sync write is read back with the async read and the other way round`() {
    val module = registeredModule()
    val options = SecureStoreOptions(keychainService = "service")

    module.setValueWithKeySync("from sync", "a", options)
    runBlocking { module.setValueWithKeyAsync("from async", "b", options) }

    assertEquals("from sync", runBlocking { module.getValueWithKeyAsync("a", options) })
    assertEquals("from async", module.getValueWithKeySync("b", options))
    assertEquals("service", storedItem(reactContext, "a", keychainService = "service")?.getString("keystoreAlias"))
  }

  @Test
  fun `a missing key reads as null`() {
    val module = registeredModule()

    assertNull(module.getValueWithKeySync("missing", SecureStoreOptions()))
  }

  @Test
  fun `a null key is rejected with the v1 error code`() {
    val module = registeredModule()

    val error = assertThrows(NullKeyException::class.java) {
      runBlocking { module.setValueWithKeyAsync("value", null, SecureStoreOptions()) }
    }
    assertEquals("ERR_NULL_KEY", error.code)
    assertThrows(NullKeyException::class.java) {
      module.setValueWithKeySync("value", null, SecureStoreOptions())
    }
  }

  @Test
  fun `delete removes the value and the oldest value in the default preferences`() {
    val module = registeredModule()
    val options = SecureStoreOptions()
    runBlocking { module.setValueWithKeyAsync("secret", "token", options) }
    // Values of the oldest SecureStore versions are in the default preferences under the bare key.
    val defaultPreferences = PreferenceManager.getDefaultSharedPreferences(reactContext)
    defaultPreferences.edit().putString("token", "oldest").commit()

    runBlocking { module.deleteValueWithKeyAsync("token", options) }

    assertNull(storedItem(reactContext, "token"))
    assertFalse(defaultPreferences.contains("token"))
    assertNull(runBlocking { module.getValueWithKeyAsync("token", options) })
  }

  @Test
  fun `biometric authentication is usable only when strong biometrics can authenticate`() {
    val module = registeredModule()

    setCanAuthenticateWithBiometrics(false)
    assertFalse(module.canUseBiometricAuthentication())

    setCanAuthenticateWithBiometrics(true)
    assertTrue(module.canUseBiometricAuthentication())
  }

  @Test
  fun `device credentials authentication is usable only when the device has a secure lock screen`() {
    val module = registeredModule()

    setDeviceSecure(false)
    assertFalse(module.canUseDeviceCredentialsAuthentication())

    setDeviceSecure(true)
    assertTrue(module.canUseDeviceCredentialsAuthentication())
  }

  @Test
  @Config(sdk = [29])
  fun `device credentials authentication is not usable before Android 11`() {
    val module = registeredModule()
    setDeviceSecure(true)

    assertFalse(module.canUseDeviceCredentialsAuthentication())
  }

  @Test
  @Config(sdk = [29])
  fun `a device credentials write before Android 11 fails with the v1 error and stores nothing`() {
    val module = registeredModule()
    setDeviceSecure(true)
    val options = SecureStoreOptions(requireAuthentication = AuthenticationMethod.DEVICE_CREDENTIALS)

    val error = assertThrows(UnsupportedDeviceCredentialsException::class.java) {
      runBlocking { module.setValueWithKeyAsync("secret", "token", options) }
    }
    assertEquals("ERR_UNSUPPORTED_DEVICE_CREDENTIALS", error.code)
    assertThrows(UnsupportedDeviceCredentialsException::class.java) {
      module.setValueWithKeySync("secret", "token", options)
    }

    assertTrue(FakeAndroidKeyStore.entries.isEmpty())
    assertNull(storedItem(reactContext, "token"))
  }

  @Test
  fun `an authenticated write without a foreground activity fails with the v1 error`() {
    val module = registeredModule()
    setCanAuthenticateWithBiometrics(true)

    // The React context of this test has no current activity, so there is nothing to show the
    // biometric prompt in.
    val error = assertThrows(AuthenticationException::class.java) {
      module.setValueWithKeySync("secret", "token", SecureStoreOptions(requireAuthentication = AuthenticationMethod.BIOMETRY))
    }

    assertEquals("ERR_AUTHENTICATION", error.code)
    assertEquals(NO_FOREGROUND_ACTIVITY_MESSAGE, error.message)
    assertEquals(
      setOf("AES/GCM/NoPadding:key_v1:keystoreAuthenticated"),
      FakeAndroidKeyStore.entries.keys
    )
    assertNull(storedItem(reactContext, "token"))
  }

  @Test
  fun `a device credentials write uses its own KeyStore key`() {
    val module = registeredModule()
    setDeviceSecure(true)

    val error = assertThrows(AuthenticationException::class.java) {
      runBlocking {
        module.setValueWithKeyAsync(
          "secret",
          "token",
          SecureStoreOptions(requireAuthentication = AuthenticationMethod.DEVICE_CREDENTIALS)
        )
      }
    }

    assertEquals(NO_FOREGROUND_ACTIVITY_MESSAGE, error.message)
    // A key that also accepts the device credentials must not unlock the values of the biometry mode.
    assertEquals(
      setOf("AES/GCM/NoPadding:key_v1:keystoreDeviceCredentials"),
      FakeAndroidKeyStore.entries.keys
    )
    assertNull(storedItem(reactContext, "token"))
  }

  /**
   * Stores "secret" with no authentication, then makes the item look like one that [storedValue]
   * protects: the field gets [storedValue] and the KeyStore key moves to the alias with [keySuffix].
   * A read that picks another alias finds no key and returns null.
   */
  private fun readItemStoredAs(module: SecureStoreModule, storedValue: Any?, keySuffix: String): String? {
    FakeAndroidKeyStore.entries.clear()
    runBlocking { module.setValueWithKeyAsync("secret", "token", SecureStoreOptions()) }
    val key = requireNotNull(FakeAndroidKeyStore.entries.remove("AES/GCM/NoPadding:key_v1:keystoreUnauthenticated"))
    FakeAndroidKeyStore.entries["AES/GCM/NoPadding:key_v1:$keySuffix"] = key

    val item = requireNotNull(storedItem(reactContext, "token"))
    item.remove("requireAuthentication")
    storedValue?.let { item.put("requireAuthentication", it) }
    reactContext.getSharedPreferences("SecureStore", Context.MODE_PRIVATE)
      .edit().putString("key_v1-token", item.toString()).commit()

    return module.getValueWithKeySync("token", SecureStoreOptions())
  }

  @Test
  fun `stored items of every version are read with the authentication they were written with`() {
    val module = registeredModule()
    setCanAuthenticateWithBiometrics(true)
    // The device credentials prompt fails on this before it looks for an activity, which tells the
    // two authenticated modes apart.
    setDeviceSecure(false)

    // Items of the oldest versions have no field.
    assertEquals("secret", readItemStoredAs(module, null, "keystoreUnauthenticated"))
    assertEquals("secret", readItemStoredAs(module, false, "keystoreUnauthenticated"))

    for (biometry in listOf(true, "biometry")) {
      val error = assertThrows(AuthenticationException::class.java) {
        readItemStoredAs(module, biometry, "keystoreAuthenticated")
      }
      assertEquals(NO_FOREGROUND_ACTIVITY_MESSAGE, error.message)
    }

    val deviceCredentialsError = assertThrows(AuthenticationException::class.java) {
      readItemStoredAs(module, "deviceCredentials", "keystoreDeviceCredentials")
    }
    assertTrue(deviceCredentialsError.message!!.contains("A secure lock screen (PIN, pattern, or password) is required"))

    // A newer version may store a mode this one does not know. Reading it without authentication
    // would be wrong, so the read fails.
    val unknownError = assertThrows(DecryptException::class.java) {
      readItemStoredAs(module, "faceId", "keystoreUnauthenticated")
    }
    assertEquals("ERR_DECRYPT", unknownError.code)
    assertTrue(unknownError.message!!.contains("unknown requireAuthentication value"))
  }

  @Test
  fun `a module without a context fails with the v1 error`() {
    val module = SecureStoreModule()

    val error = assertThrows(Exceptions.ReactContextLost::class.java) {
      module.getValueWithKeySync("token", SecureStoreOptions())
    }
    assertEquals("ERR_REACT_CONTEXT_LOST", error.code)
  }

  @Test
  fun `every use of the context goes through the storage context getter`() {
    // Expo Go plugs its per-experience context in at this one getter. A use that bypasses it would
    // read and write the preferences of Expo Go itself, shared by every experience.
    val scopedContext = ScopedContext(reactContext)
    val module = spyk<SecureStoreModule>(recordPrivateCalls = true)
    every { module getProperty "storageContext" } returns scopedContext
    expoContext.moduleRegistry.register(module)
    mockkStatic(REACT_CONTEXT_EXTENSIONS)
    try {
      val options = SecureStoreOptions()
      // A hybrid item from Android 22 and older. Reading it builds the hybrid encryptor.
      scopedContext.getSharedPreferences("SecureStore", Context.MODE_PRIVATE)
        .edit().putString("key_v1-hybrid", JSONObject().put("scheme", "hybrid").toString()).commit()
      PreferenceManager.getDefaultSharedPreferences(scopedContext)
        .edit().putString("deleted", "oldest").commit()

      runBlocking { module.setValueWithKeyAsync("async", "a", options) }
      module.setValueWithKeySync("sync", "b", options)
      assertEquals("async", module.getValueWithKeySync("a", options))
      assertEquals("sync", runBlocking { module.getValueWithKeyAsync("b", options) })
      assertNull(runBlocking { module.getValueWithKeyAsync("hybrid", options) })
      runBlocking { module.deleteValueWithKeyAsync("deleted", options) }
      module.canUseBiometricAuthentication()
      module.canUseDeviceCredentialsAuthentication()

      assertTrue(storedItem(scopedContext, "a") != null)
      assertTrue(storedItem(scopedContext, "b") != null)
      assertFalse(PreferenceManager.getDefaultSharedPreferences(scopedContext).contains("deleted"))
      assertNull(storedItem(reactContext, "a"))
      assertNull(storedItem(reactContext, "b"))
      verify(exactly = 0) { module.androidContext }
      verify(exactly = 0) { module.androidContextOrNull }
      verify(exactly = 0) { module.reactContext }
      verify(exactly = 0) { module.reactContextOrNull }
    } finally {
      unmockkStatic(REACT_CONTEXT_EXTENSIONS)
    }
  }

  @Test
  fun `values are stored in the storage context of the app context`() {
    // In Expo Go, each experience has its own preferences. A value written by one experience must
    // not be readable by another one, or by Expo Go itself.
    val scopedContext = ScopedContext(reactContext)
    val appContext = mockk<AppContext> {
      every { storageContext } returns scopedContext
    }
    val module = registeredModule()
    every { module.legacyAppContext } returns appContext
    val options = SecureStoreOptions()

    runBlocking { module.setValueWithKeyAsync("secret", "token", options) }

    assertTrue(storedItem(scopedContext, "token") != null)
    assertNull(storedItem(reactContext, "token"))
    assertEquals("secret", module.getValueWithKeySync("token", options))
  }
}
