package expo.modules.crypto.aes

import android.util.Base64
import expo.modules.crypto.aes.AesConfig.CIPHER_TRANSFORMATION_NAME
import expo.modules.crypto.aes.AesConfig.DEFAULT_TAG_SIZE
import expo.modules.crypto.aes.enums.DataFormat
import expo.modules.crypto.aes.enums.KeyEncoding
import expo.modules.crypto.aes.enums.KeySize
import expo.modules.crypto.aes.extensions.decrypt
import expo.modules.crypto.aes.extensions.encoded
import expo.modules.crypto.aes.extensions.encrypt
import expo.modules.crypto.aes.extensions.formatted
import expo.modules.crypto.aes.objects.EncryptionKey
import expo.modules.crypto.aes.objects.SealedData
import expo.modules.crypto.aes.records.CiphertextOptions
import expo.modules.crypto.aes.records.DecryptOptions
import expo.modules.crypto.aes.records.EncryptOptions
import expo.modules.crypto.aes.records.SealedDataConfig
import expo.modules.kotlin.apifeatures.EitherType
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.types.Either
import java.nio.ByteBuffer
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec

@OptIn(EitherType::class)
typealias BinaryInput = Either<ByteArray, String>

@OptIn(EitherType::class)
class AesCryptoModule : Module() {
  private val rng: SecureRandom by lazy { SecureRandom() }

  override fun definition() = ModuleDefinition {
    Name("ExpoCryptoAES")

    AsyncFunction("encryptAsync", this@AesCryptoModule::encrypt)
    AsyncFunction("decryptAsync", this@AesCryptoModule::decrypt)

    Class("EncryptionKey", EncryptionKey::class) {
      Constructor {
        throw Exceptions.IllegalArgument("EncryptionKey constructor cannot be used directly")
      }
      StaticAsyncFunction("generate", this@AesCryptoModule::generateKey)
      StaticAsyncFunction("import", this@AesCryptoModule::importKey)

      AsyncFunction("bytes") { key: EncryptionKey -> key.bytes }
      AsyncFunction("encoded") { key: EncryptionKey, encoding: KeyEncoding ->
        key.bytes.encoded(encoding)
      }

      Property("size") { key: EncryptionKey -> key.keySize }
    }

    Class("SealedData", SealedData::class) {
      Constructor {
        throw Exceptions.IllegalArgument("SealedData constructor cannot be used directly")
      }
      StaticFunction("fromParts", this@AesCryptoModule::sealedDataFromParts)
      StaticFunction("fromCombined") { combined: ByteArray, config: SealedDataConfig?  ->
        val config = config ?: SealedDataConfig()
        SealedData(config, content = combined)
      }

      AsyncFunction("iv") { sealedData: SealedData, format: DataFormat? ->
        sealedData.ivBytes.formatted(format)
      }
      AsyncFunction("tag") { sealedData: SealedData, format: DataFormat? ->
        sealedData.tagBytes.formatted(format)
      }
      AsyncFunction("combined") { sealedData: SealedData, format: DataFormat? ->
        sealedData.combinedArray.formatted(format)
      }
      AsyncFunction("ciphertext") { sealedData: SealedData, options: CiphertextOptions? ->
        val (includeTag, outputFormat) = options ?: CiphertextOptions()
        sealedData.ciphertextBytes(withTag = includeTag).formatted(outputFormat)
      }

      Property("combinedSize") { sealedData -> sealedData.combinedSize }
      Property("ivSize") { sealedData -> sealedData.ivSize }
      Property("tagSize") { sealedData -> sealedData.tagSize }
    }
  }

  private fun generateKey(size: KeySize?): EncryptionKey {
    return EncryptionKey(size ?: KeySize.AES256)
  }

  @OptIn(ExperimentalStdlibApi::class)
  private fun importKey(input: Either<ByteArray, String>, encoding: KeyEncoding?): EncryptionKey {
    val bytes = if (input.`is`(ByteArray::class)) {
      input.get(ByteArray::class)
    } else {
      requireNotNull(encoding) {
        "'encoding' argument must be provided for string input"
      }
      val encodedString = input.get(String::class)
      when (encoding) {
        KeyEncoding.BASE64 -> Base64.decode(encodedString, Base64.NO_WRAP)
        KeyEncoding.HEX -> encodedString
          .lowercase()
          .substringAfter("0x")
          .hexToByteArray(HexFormat.Default)
      }
    }
    return EncryptionKey(bytes)
  }

  private fun encrypt(
    plaintext: BinaryInput,
    key: EncryptionKey,
    options: EncryptOptions?,
  ): SealedData {
    val key = key.cryptoKey
    val plaintextBuffer = ByteBuffer.wrap(plaintext.toBytes())

    val cipher = Cipher.getInstance(CIPHER_TRANSFORMATION_NAME).apply {
      val params = options?.gcmParameterSpec(rng)
      init(Cipher.ENCRYPT_MODE, key, params)
      options?.additionalData?.let { updateAAD(it.toBytes()) }
    }

    return cipher.encrypt(plaintextBuffer)
  }

  private fun decrypt(
    sealedData: SealedData,
    key: EncryptionKey,
    options: DecryptOptions?,
  ): Any {
    val key = key.cryptoKey

    val cipher = Cipher.getInstance(CIPHER_TRANSFORMATION_NAME).apply {
      val spec = GCMParameterSpec(sealedData.tagSize * 8, sealedData.ivBytes)
      init(Cipher.DECRYPT_MODE, key, spec)
    }
    options?.additionalData?.let { cipher.updateAAD(it.toBytes()) }

    val plaintext = cipher.decrypt(sealedData)
    return plaintext.array().formatted(options?.output)
  }

  private fun sealedDataFromParts(iv: BinaryInput, ciphertext: BinaryInput, tag: Either<ByteArray, Int>?): SealedData {
    val iv = iv.toBytes()
    val ciphertext = ciphertext.toBytes()
    return if (tag?.`is`(Int::class) == true) {
      val tagLength = tag.get(Int::class)
      SealedData(iv, ciphertext, tagLength)
    } else if (tag?.`is`(ByteArray::class) == true) {
      val tag = tag.get(ByteArray::class)
      SealedData(iv, ciphertext + tag, tag.size)
    } else {
      SealedData(iv, ciphertext, DEFAULT_TAG_SIZE)
    }
  }

  private fun BinaryInput.toBytes(): ByteArray {
    if (this.`is`(ByteArray::class)) {
      return this.get(ByteArray::class)
    }

    return Base64.decode(this.get(String::class), Base64.NO_WRAP)
  }
}
