package expo.modules.ota

import okhttp3.*
import org.json.JSONObject
import org.spongycastle.jce.provider.BouncyCastleProvider
import org.spongycastle.util.encoders.Base64
import java.io.IOException
import java.security.*
import java.security.spec.InvalidKeySpecException
import java.security.spec.X509EncodedKeySpec
import javax.crypto.BadPaddingException
import javax.crypto.IllegalBlockSizeException
import javax.crypto.NoSuchPaddingException

interface ManifestResponseValidator {

    fun validate(response: JSONObject, success: (String) -> Unit, error: (Exception) -> Unit)

}

class DummyValidator : ManifestResponseValidator {
    override fun validate(response: JSONObject, success: (String) -> Unit, error: (Exception) -> Unit) {
        success(response.getString("manifestString"))
    }
}

class ExpoValidator(private val publicKeyUrl: String, private val httpClient: OkHttpClient) : ManifestResponseValidator {

    override fun validate(response: JSONObject, success: (String) -> Unit, error: (Exception) -> Unit) {
        val request = Request.Builder()
                .url(publicKeyUrl)
                .get()
                .build()
        httpClient.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                error(IllegalStateException("Manifest fetching failed: ", e))
            }

            override fun onResponse(call: Call, publicKeyResponse: Response) {
                if (publicKeyResponse.isSuccessful && publicKeyResponse.body() != null) {
                    validateResponseWithKey(response, publicKeyResponse.body()!!.string(), success, error)
                } else {
                    error(IllegalStateException("PublicKeyResponse not successful: $publicKeyResponse"))
                }
            }
        })
    }

    private fun validateResponseWithKey(response: JSONObject, publicKey: String, success: (String) -> Unit, error: (Exception) -> Unit) {
        try {
            val manifestString = response.optString("manifestString")
            val signature = response.optString("signature")
            val verified = verifyPublicRSASignature(publicKey, manifestString, signature)
            if(verified) {
                success(manifestString)
            } else {
                error(IllegalArgumentException("Manifest verification failed!"))
            }
        } catch (e: Exception) {
            when (e) {
                is NoSuchPaddingException,
                is NoSuchAlgorithmException,
                is InvalidKeySpecException,
                is InvalidKeyException,
                is BadPaddingException,
                is IllegalBlockSizeException -> {
                    error(IllegalStateException("Error with RSA key.", e))
                }
                else -> {
                    error(IllegalStateException("Error verifying", e))
                }
            }

        }
    }

    @Throws(NoSuchPaddingException::class, NoSuchAlgorithmException::class, InvalidKeySpecException::class, InvalidKeyException::class, BadPaddingException::class, IllegalBlockSizeException::class, SignatureException::class)
    private fun verifyPublicRSASignature(publicKey: String, plainText: String, cipherText: String): Boolean {
        // remove comments
        val publicKeySplit = publicKey.split("\\r?\\n".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()
        var publicKeyNoComments = ""
        for (line in publicKeySplit) {
            if (!line.contains("PUBLIC KEY-----")) {
                publicKeyNoComments += line + "\n"
            }
        }

        val signature = Signature.getInstance("SHA256withRSA", getBouncyCastleProvider())
        val decodedPublicKey = Base64.decode(publicKeyNoComments)
        val publicKeySpec = X509EncodedKeySpec(decodedPublicKey)
        val keyFactory = KeyFactory.getInstance(publicKeySpec.format)
        val key = keyFactory.generatePublic(publicKeySpec)

        signature.initVerify(key)
        signature.update(plainText.toByteArray())
        return signature.verify(Base64.decode(cipherText))
    }

    @Synchronized
    fun getBouncyCastleProvider(): Provider {
        val sBouncyCastleProvider = BouncyCastleProvider()
        Security.insertProviderAt(sBouncyCastleProvider, 1)
        return sBouncyCastleProvider
    }
}