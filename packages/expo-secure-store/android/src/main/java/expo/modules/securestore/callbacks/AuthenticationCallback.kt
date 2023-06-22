package expo.modules.securestore.callbacks

import expo.modules.kotlin.Promise
import expo.modules.securestore.SecureStoreOptions
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec

// Interface used to pass the authentication logic
interface AuthenticationCallback {
  fun checkAuthentication(
    promise: Promise,
    cipher: Cipher,
    gcmParameterSpec: GCMParameterSpec,
    options: SecureStoreOptions,
    encryptionCallback: EncryptionCallback,
    postEncryptionCallback: PostEncryptionCallback?
  )

  fun checkAuthentication(
    promise: Promise,
    requiresAuthentication: Boolean,
    cipher: Cipher,
    gcmParameterSpec: GCMParameterSpec,
    options: SecureStoreOptions,
    encryptionCallback: EncryptionCallback,
    postEncryptionCallback: PostEncryptionCallback?
  )
}
