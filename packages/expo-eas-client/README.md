# expo-eas-client

Information related to EAS.

## Client ID Discussion

Stable client identifier for EAS services.

On iOS, this is stored in NSUserDefaults which is persisted and backed up. Upon restore (set up new iOS device for example), the identifier should be the same.

On Android, this is stored in SharedPreferences. By default since Android 6, SharedPreferences are backed up automatically via Auto Backup, though some devices or apps may not (for example, if `android:allowBackup="true"` is not specified in AndroidManifest.xml).

## Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide](https://github.com/expo/expo#contributing).

