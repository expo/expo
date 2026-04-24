struct SplashScreenConfigurationBuilder {
  static func parse(manifest: EXManifests.Manifest) -> ManagedAppSplashScreenConfiguration {
    let imageUrl = manifest.iosAppIconUrl()
    let appName = manifest.name()

    return ManagedAppSplashScreenConfiguration(
      appName: appName,
      imageUrl: imageUrl
    )
  }
}
