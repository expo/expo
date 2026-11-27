package expo.modules.crypto.aes.extensions

import expo.modules.crypto.aes.AesConfig
import expo.modules.crypto.aes.objects.SealedData
import org.junit.Assert.assertArrayEquals
import org.junit.Test
import java.nio.ByteBuffer
import java.security.AlgorithmParameters
import java.security.Key
import java.security.SecureRandom
import java.security.spec.AlgorithmParameterSpec
import javax.crypto.Cipher
import javax.crypto.CipherSpi
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

class CipherExtensionsTest {
  @Test
  fun decryptReturnsEmptyPlaintextWhenOutputSizeIsOverestimated() {
    assertDecryptsTo(byteArrayOf())
  }

  @Test
  fun decryptPreservesTrailingZerosWhenOutputSizeIsOverestimated() {
    assertDecryptsTo(byteArrayOf(1, 2, 0, 0))
  }

  private fun assertDecryptsTo(plaintext: ByteArray) {
    val iv = ByteArray(AesConfig.DEFAULT_IV_SIZE)
    val params = GCMParameterSpec(AesConfig.DEFAULT_TAG_SIZE * Byte.SIZE_BITS, iv)
    val key = SecretKeySpec(ByteArray(16), AesConfig.CRYPTO_KEY_ALGORITHM)

    val encryptor = Cipher.getInstance(AesConfig.CIPHER_TRANSFORMATION_NAME)
    encryptor.init(Cipher.ENCRYPT_MODE, key, params)
    val sealedData = SealedData(iv, encryptor.doFinal(plaintext), AesConfig.DEFAULT_TAG_SIZE)

    val decryptor = OversizedOutputCipher(Cipher.getInstance(AesConfig.CIPHER_TRANSFORMATION_NAME))
    decryptor.init(Cipher.DECRYPT_MODE, key, params)

    assertArrayEquals(plaintext, decryptor.decrypt(sealedData))
  }

  private class OversizedOutputCipher(delegate: Cipher) :
    Cipher(OversizedOutputCipherSpi(delegate), delegate.provider, delegate.algorithm)

  private class OversizedOutputCipherSpi(private val delegate: Cipher) : CipherSpi() {
    override fun engineGetOutputSize(inputLen: Int): Int =
      delegate.getOutputSize(inputLen) + AesConfig.DEFAULT_TAG_SIZE

    override fun engineDoFinal(input: ByteBuffer, output: ByteBuffer): Int =
      delegate.doFinal(input, output)

    override fun engineGetBlockSize(): Int = delegate.blockSize

    override fun engineGetIV(): ByteArray? = delegate.iv

    override fun engineGetParameters(): AlgorithmParameters? = delegate.parameters

    override fun engineInit(opmode: Int, key: Key, random: SecureRandom?) =
      delegate.init(opmode, key, random)

    override fun engineInit(opmode: Int, key: Key, params: AlgorithmParameterSpec?, random: SecureRandom?) =
      delegate.init(opmode, key, params, random)

    override fun engineInit(opmode: Int, key: Key, params: AlgorithmParameters?, random: SecureRandom?) =
      delegate.init(opmode, key, params, random)

    override fun engineUpdate(input: ByteArray, inputOffset: Int, inputLen: Int): ByteArray? =
      delegate.update(input, inputOffset, inputLen)

    override fun engineUpdate(input: ByteArray, inputOffset: Int, inputLen: Int, output: ByteArray, outputOffset: Int): Int =
      delegate.update(input, inputOffset, inputLen, output, outputOffset)

    override fun engineDoFinal(input: ByteArray, inputOffset: Int, inputLen: Int): ByteArray =
      delegate.doFinal(input, inputOffset, inputLen)

    override fun engineDoFinal(input: ByteArray, inputOffset: Int, inputLen: Int, output: ByteArray, outputOffset: Int): Int =
      delegate.doFinal(input, inputOffset, inputLen, output, outputOffset)

    override fun engineSetMode(mode: String) {
      throw UnsupportedOperationException()
    }

    override fun engineSetPadding(padding: String) {
      throw UnsupportedOperationException()
    }
  }
}
