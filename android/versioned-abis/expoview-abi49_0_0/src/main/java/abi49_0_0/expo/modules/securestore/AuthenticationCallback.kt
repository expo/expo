package abi49_0_0.expo.modules.securestore

import abi49_0_0.expo.modules.core.Promise
import abi49_0_0.expo.modules.core.arguments.ReadableArguments
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
