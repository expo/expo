package expo.modules.securestore

import android.security.keystore.KeyGenParameterSpec
import java.io.InputStream
import java.io.OutputStream
import java.security.Key
import java.security.KeyStore
import java.security.KeyStoreSpi
import java.security.Provider
import java.security.SecureRandom
import java.security.Security
import java.security.cert.Certificate
import java.security.spec.AlgorithmParameterSpec
import java.util.Collections
import java.util.Date
import java.util.Enumeration
import java.util.concurrent.ConcurrentHashMap
import javax.crypto.KeyGeneratorSpi
import javax.crypto.SecretKey
import javax.crypto.spec.SecretKeySpec

/**
 * A JVM test has no Android KeyStore. This provider takes its name and keeps AES keys in memory,
 * under the aliases the module asks for, so a test can read the aliases back.
 */
object FakeAndroidKeyStore {
  val entries = ConcurrentHashMap<String, KeyStore.Entry>()

  @Suppress("DEPRECATION") // The constructor that takes a string version needs Java 9.
  private val provider = object : Provider("AndroidKeyStore", 1.0, "In-memory AndroidKeyStore for JVM tests") {
    init {
      put("KeyStore.AndroidKeyStore", FakeKeyStoreSpi::class.java.name)
      put("KeyGenerator.AES", FakeAesKeyGeneratorSpi::class.java.name)
    }
  }

  fun install() {
    Security.insertProviderAt(provider, 1)
  }

  fun uninstall() {
    Security.removeProvider(provider.name)
    entries.clear()
  }
}

class FakeKeyStoreSpi : KeyStoreSpi() {
  private val entries = FakeAndroidKeyStore.entries

  override fun engineGetEntry(alias: String, protParam: KeyStore.ProtectionParameter?): KeyStore.Entry? = entries[alias]

  override fun engineGetKey(alias: String, password: CharArray?): Key? =
    (entries[alias] as? KeyStore.SecretKeyEntry)?.secretKey

  override fun engineSetKeyEntry(alias: String, key: Key, password: CharArray?, chain: Array<out Certificate>?) {
    entries[alias] = KeyStore.SecretKeyEntry(key as SecretKey)
  }

  override fun engineDeleteEntry(alias: String) {
    entries.remove(alias)
  }

  override fun engineAliases(): Enumeration<String> = Collections.enumeration(entries.keys.toList())

  override fun engineContainsAlias(alias: String): Boolean = entries.containsKey(alias)

  override fun engineSize(): Int = entries.size

  override fun engineIsKeyEntry(alias: String): Boolean = entries.containsKey(alias)

  override fun engineIsCertificateEntry(alias: String): Boolean = false

  override fun engineLoad(stream: InputStream?, password: CharArray?) = Unit

  override fun engineGetCertificateChain(alias: String): Array<Certificate>? = null

  override fun engineGetCertificate(alias: String): Certificate? = null

  override fun engineGetCreationDate(alias: String): Date? = null

  override fun engineGetCertificateAlias(cert: Certificate): String? = null

  override fun engineSetKeyEntry(alias: String, key: ByteArray, chain: Array<out Certificate>?) =
    throw UnsupportedOperationException()

  override fun engineSetCertificateEntry(alias: String, cert: Certificate) =
    throw UnsupportedOperationException()

  override fun engineStore(stream: OutputStream?, password: CharArray?) =
    throw UnsupportedOperationException()
}

class FakeAesKeyGeneratorSpi : KeyGeneratorSpi() {
  private var spec: KeyGenParameterSpec? = null

  override fun engineInit(params: AlgorithmParameterSpec, random: SecureRandom?) {
    spec = params as KeyGenParameterSpec
  }

  override fun engineInit(random: SecureRandom?) = throw UnsupportedOperationException()

  override fun engineInit(keysize: Int, random: SecureRandom?) = throw UnsupportedOperationException()

  override fun engineGenerateKey(): SecretKey {
    val spec = requireNotNull(spec)
    val bytes = ByteArray(spec.keySize / 8).also { SecureRandom().nextBytes(it) }
    val key = SecretKeySpec(bytes, "AES")
    FakeAndroidKeyStore.entries[spec.keystoreAlias] = KeyStore.SecretKeyEntry(key)
    return key
  }
}
