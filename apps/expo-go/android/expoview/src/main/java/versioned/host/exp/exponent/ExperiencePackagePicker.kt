package versioned.host.exp.exponent

import expo.modules.application.ApplicationModule
import expo.modules.asset.AssetModule
import expo.modules.audio.AudioModule
import expo.modules.av.AVModule
import expo.modules.av.AVPackage
import expo.modules.av.video.VideoViewModule
import expo.modules.backgroundfetch.BackgroundFetchModule
import expo.modules.backgroundtask.BackgroundTaskModule
import expo.modules.battery.BatteryModule
import expo.modules.blur.BlurModule
import expo.modules.brightness.BrightnessModule
import expo.modules.calendar.CalendarModule
import expo.modules.camera.CameraViewModule
import expo.modules.cellular.CellularModule
import expo.modules.clipboard.ClipboardModule
import expo.modules.constants.ConstantsModule
import expo.modules.constants.ConstantsService
import expo.modules.contacts.ContactsModule
import expo.modules.core.interfaces.Package
import expo.modules.crypto.CryptoModule
import expo.modules.device.DeviceModule
import expo.modules.documentpicker.DocumentPickerModule
import expo.modules.easclient.EASClientModule
import expo.modules.fetch.ExpoFetchModule
import expo.modules.filesystem.FileSystemModule
import expo.modules.filesystem.legacy.FileSystemLegacyModule
import expo.modules.font.FontLoaderModule
import expo.modules.font.FontUtilsModule
import expo.modules.gl.GLModule
import expo.modules.haptics.HapticsModule
import expo.modules.image.ExpoImageModule
import expo.modules.imageloader.ImageLoaderPackage
import expo.modules.imagemanipulator.ImageManipulatorModule
import expo.modules.imagepicker.ImagePickerModule
import expo.modules.intentlauncher.IntentLauncherModule
import expo.modules.keepawake.KeepAwakeModule
import expo.modules.kotlin.ModulesProvider
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.services.Service
import expo.modules.lineargradient.LinearGradientModule
import expo.modules.linking.ExpoLinkingModule
import expo.modules.linking.ExpoLinkingPackage
import expo.modules.localauthentication.LocalAuthenticationModule
import expo.modules.localization.LocalizationModule
import expo.modules.location.LocationModule
import expo.modules.mailcomposer.MailComposerModule
import expo.modules.manifests.core.Manifest
import expo.modules.medialibrary.MediaLibraryModule
import expo.modules.navigationbar.NavigationBarModule
import expo.modules.navigationbar.NavigationBarPackage
import expo.modules.network.NetworkModule
import expo.modules.notifications.NotificationsPackage
import expo.modules.notifications.badge.BadgeModule
import expo.modules.notifications.notifications.background.ExpoBackgroundNotificationTasksModule
import expo.modules.notifications.notifications.channels.NotificationChannelGroupManagerModule
import expo.modules.notifications.notifications.channels.NotificationChannelManagerModule
import expo.modules.notifications.permissions.NotificationPermissionsModule
import expo.modules.notifications.tokens.PushTokenModule
import expo.modules.print.PrintModule
import expo.modules.screencapture.ScreenCaptureModule
import expo.modules.screenorientation.ScreenOrientationModule
import expo.modules.sensors.modules.AccelerometerModule
import expo.modules.sensors.modules.BarometerModule
import expo.modules.sensors.modules.DeviceMotionModule
import expo.modules.sensors.modules.GyroscopeModule
import expo.modules.sensors.modules.LightSensorModule
import expo.modules.sensors.modules.MagnetometerModule
import expo.modules.sensors.modules.MagnetometerUncalibratedModule
import expo.modules.sensors.modules.PedometerModule
import expo.modules.sharing.SharingModule
import expo.modules.sms.SMSModule
import expo.modules.speech.SpeechModule
import host.exp.exponent.experience.splashscreen.legacy.SplashScreenModule
import host.exp.exponent.experience.splashscreen.legacy.SplashScreenPackage
import expo.modules.sqlite.SQLiteModule
import expo.modules.storereview.StoreReviewModule
import expo.modules.systemui.SystemUIModule
import expo.modules.systemui.SystemUIPackage
import expo.modules.taskManager.TaskManagerModule
import expo.modules.taskManager.TaskManagerPackage
import expo.modules.trackingtransparency.TrackingTransparencyModule
import expo.modules.updates.UpdatesPackage
import expo.modules.video.VideoModule
import expo.modules.videothumbnails.VideoThumbnailsModule
import expo.modules.webbrowser.WebBrowserModule

object ExperiencePackagePicker : ModulesProvider {
  private val EXPO_MODULES_PACKAGES = listOf(
    AVPackage(),
    ExpoLinkingPackage(),
    ImageLoaderPackage(),
    NavigationBarPackage(),
    NotificationsPackage(),
    SplashScreenPackage(),
    SystemUIPackage(),
    TaskManagerPackage(),
    UpdatesPackage()
  )

  /**
   * Returns all available packages.
   */
  fun packages(): List<Package> {
    return EXPO_MODULES_PACKAGES
  }

  /**
   * Returns packages filtered based on the app's manifest.
   * For now, filtering is not applied but it is on the todo list.
   */
  fun packages(manifest: Manifest?): List<Package> {
    return EXPO_MODULES_PACKAGES
  }

  override fun getServices(): List<Class<out Service>> = listOf(
    ConstantsService::class.java
  )

  override fun getModulesMap(): Map<Class<out Module>, String?> = mapOf(
    AudioModule::class.java to null,
    AVModule::class.java to null,
    ApplicationModule::class.java to null,
    // Sensors
    AccelerometerModule::class.java to null,
    AssetModule::class.java to null,
    BarometerModule::class.java to null,
    GyroscopeModule::class.java to null,
    LightSensorModule::class.java to null,
    DeviceMotionModule::class.java to null,
    MagnetometerModule::class.java to null,
    MagnetometerUncalibratedModule::class.java to null,
    PedometerModule::class.java to null,
    // End of Sensors
    // Notifications
    BadgeModule::class.java to null,
    PushTokenModule::class.java to null,
    NotificationPermissionsModule::class.java to null,
    NotificationChannelManagerModule::class.java to null,
    NotificationChannelGroupManagerModule::class.java to null,
    ExpoBackgroundNotificationTasksModule::class.java to null,
    // End of Notifications
    BatteryModule::class.java to null,
    BackgroundFetchModule::class.java to null,
    BackgroundTaskModule::class.java to null,
    BlurModule::class.java to null,
    CalendarModule::class.java to null,
    CameraViewModule::class.java to null,
    CellularModule::class.java to null,
    ClipboardModule::class.java to null,
    CryptoModule::class.java to null,
    ConstantsModule::class.java to null,
    ContactsModule::class.java to null,
    DeviceModule::class.java to null,
    DocumentPickerModule::class.java to null,
    EASClientModule::class.java to null,
    ExpoFetchModule::class.java to null,
    FontUtilsModule::class.java to null,
    ExpoLinkingModule::class.java to null,
    FileSystemModule::class.java to null,
    FileSystemLegacyModule::class.java to null,
    FontLoaderModule::class.java to null,
    PrintModule::class.java to null,
    GLModule::class.java to null,
    HapticsModule::class.java to null,
    ImagePickerModule::class.java to null,
    ImageManipulatorModule::class.java to null,
    ExpoImageModule::class.java to null,
    IntentLauncherModule::class.java to null,
    KeepAwakeModule::class.java to null,
    LinearGradientModule::class.java to null,
    LocalAuthenticationModule::class.java to null,
    LocalizationModule::class.java to null,
    LocationModule::class.java to null,
    MailComposerModule::class.java to null,
    MediaLibraryModule::class.java to null,
    NavigationBarModule::class.java to null,
    NetworkModule::class.java to null,
    ScreenCaptureModule::class.java to null,
    ScreenOrientationModule::class.java to null,
    // SecureStoreModule is not added here, instead it is added in ExpoModuleRegistryAdapter.kt,
    // because it needs access to scopedContext for Expo Go support
    SMSModule::class.java to null,
    SharingModule::class.java to null,
    SpeechModule::class.java to null,
    SplashScreenModule::class.java to null,
    StoreReviewModule::class.java to null,
    SQLiteModule::class.java to null,
    SystemUIModule::class.java to null,
    TaskManagerModule::class.java to null,
    TrackingTransparencyModule::class.java to null,
    VideoThumbnailsModule::class.java to null,
    VideoModule::class.java to null,
    VideoViewModule::class.java to null,
    WebBrowserModule::class.java to null,
    BrightnessModule::class.java to null
  )
}
