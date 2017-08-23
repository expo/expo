---
title: SecureStore
---

Provides access to encrypt and securely store key/value pairs locally on the device.  Each Expo app has a separate storage system and has no access to the storage system of other Expo apps. 

iOS:  Values are stored using the Keychain Service as `kSecClassGenericPassword`.  iOS has the additional option of being able to set the value's `kSecAttrAccessible` attribute which controls when the value is available to be fetched.

Android:  Values are stored in `SharedPrefs` encrypted with Android's Keystore system.

### `Expo.SecureStore.setValueWithKeyAsync(value, key, options)`

Store a key/value pair.

#### Arguments

-   **value (_string_)** -- The value to store.

- **key (_string_)** -- The key to associate with the stored value (Keys can contain alphanumeric characters `.`, `-`, and `_`.)

-   **options (_object_)** (optional) -- A map of options:

    -   **keychainService (_string_)** -- 
      iOS: The item's service, equivalent to `kSecAttrService`.
      Android: Equivalent of the public/private key pair `Alias`.
      **NOTE** If the item is set with the `keychainService` option, it will be required to later fetch the value.

    -   **keychainAccessible (_enum_)** -- iOS ONLY: The access level of the stored value, equivalent to `kSecAttrAccessible`.  The available options are:
        - `AFTER_FIRST_UNLOCK` : The data in the keychain item cannot be accessed after a restart until the device has been unlocked once by the user.
        - `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` : The data in the keychain item cannot be accessed after a restart until the device has been unlocked once by the user.
        - `ALWAYS` : The data in the keychain item can always be accessed regardless of whether the device is locked.
        - `ALWAYS_THIS_DEVICE_ONLY` : The data in the keychain item can always be accessed regardless of whether the device is locked.
        - `WHEN_PASSCODE_SET_THIS_DEVICE_ONLY` : The data in the keychain can only be accessed when the device is unlocked. Only available if a passcode is set on the device.
        - `WHEN_UNLOCKED` : The data in the keychain item can be accessed only while the device is unlocked by the user.
        - `WHEN_UNLOCKED_THIS_DEVICE_ONLY` : The data in the keychain item can be accessed only while the device is unlocked by the user.

#### Returns

A `Promise` that will reject if value can not be stored on the device.

### `Expo.SecureStore.getValueWithKeyAsync(key, options)`

Fetch the stored value associated with the provided key.

#### Arguments

-   **key (_string_)** -- The key that was used to store the associated value.

-   **options (_object_)** (optional) -- A map of options:
  
    -   **keychainService (_string_)** -- 
      iOS: The item's service, equivalent to `kSecAttrService`.
      Android: Equivalent of the public/private key pair `Alias`.  
      **NOTE** If the item is set with the `keychainService` option, it will be required to later fetch the value.

#### Returns

A `Promise` containing the fetched value.  The `Promise` will reject if the value cannot be fetched or doesn't exist.

### `Expo.SecureStore.deleteValueWithKeyAsync(key, options)`

Delete the value associated with the provided key.

#### Arguments

-   **key (_string_)** -- The key that was used to store the associated value.

-   **options (_object_)** (optional) -- A map of options:
  
    -   **keychainService (_string_)** -- iOS: The item's service, equivalent to `kSecAttrService`.  Android: Equivalent of the public/private key pair `Alias`.  If the item is set with a keychainService, it will be required to later fetch the value.

#### Returns

A `Promise` that will reject if the value couldn't be deleted.
