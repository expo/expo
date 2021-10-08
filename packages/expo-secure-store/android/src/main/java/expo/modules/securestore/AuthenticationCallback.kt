package expo.modules.securestore

import expo.modules.core.Promise
import expo.modules.core.arguments.ReadableArguments
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec

// Interface used to pass the authentication logic
interface AuthenticationCallback {
  fun checkAuthentication(
    promise: Promise,
    cipher: Cipher,
    gcmParameterSpec: GCMParameterSpec,
    options: ReadableArguments,
    encryptionCallback: EncryptionCallback,
    postEncryptionCallback: PostEncryptionCallback?
  )

  fun checkAuthentication(
    promise: Promise,
    requiresAuthentication: Boolean,
    cipher: Cipher,
    gcmParameterSpec: GCMParameterSpec,
    options: ReadableArguments,
    encryptionCallback: EncryptionCallback,
    postEncryptionCallback: PostEncryptionCallback?
  )
}
