package dev.expo.payments.generated;

import java.util.Arrays;
import java.util.List;
import org.unimodules.core.interfaces.Package;

public class BasePackageList {
  public List<Package> getPackageList() {
    return Arrays.<Package>asList(
        new expo.modules.analytics.amplitude.AmplitudePackage(),
        new expo.modules.analytics.segment.SegmentPackage(),
        new expo.modules.appauth.AppAuthPackage(),
        new expo.modules.application.ApplicationPackage(),
        new expo.modules.av.AVPackage(),
        new expo.modules.barcodescanner.BarCodeScannerPackage(),
        new expo.modules.battery.BatteryPackage(),
        new expo.modules.bluetooth.BluetoothPackage(),
        new expo.modules.brightness.BrightnessPackage(),
        new expo.modules.calendar.CalendarPackage(),
        new expo.modules.cellular.CellularPackage(),
        new expo.modules.constants.ConstantsPackage(),
        new expo.modules.contacts.ContactsPackage(),
        new expo.modules.crypto.CryptoPackage(),
        new expo.modules.device.DevicePackage(),
        new expo.modules.documentpicker.DocumentPickerPackage(),
        new expo.modules.errorrecovery.ErrorRecoveryPackage(),
        new expo.modules.facebook.FacebookPackage(),
        new expo.modules.filesystem.FileSystemPackage(),
        new expo.modules.firebase.core.FirebaseCorePackage(),
        new expo.modules.font.FontLoaderPackage(),
        new expo.modules.gl.GLPackage(),
        new expo.modules.google.signin.GoogleSignInPackage(),
        new expo.modules.haptics.HapticsPackage(),
        new expo.modules.imageloader.ImageLoaderPackage(),
        new expo.modules.imagemanipulator.ImageManipulatorPackage(),
        new expo.modules.imagepicker.ImagePickerPackage(),
        new expo.modules.intentlauncher.IntentLauncherPackage(),
        new expo.modules.keepawake.KeepAwakePackage(),
        new expo.modules.lineargradient.LinearGradientPackage(),
        new expo.modules.localauthentication.LocalAuthenticationPackage(),
        new expo.modules.localization.LocalizationPackage(),
        new expo.modules.location.LocationPackage(),
        new expo.modules.mailcomposer.MailComposerPackage(),
        new expo.modules.medialibrary.MediaLibraryPackage(),
        new expo.modules.network.NetworkPackage(),
        new expo.modules.notifications.NotificationsPackage(),
        new expo.modules.permissions.PermissionsPackage(),
        new expo.modules.print.PrintPackage(),
        new expo.modules.random.RandomPackage(),
        new expo.modules.screenorientation.ScreenOrientationPackage(),
        new expo.modules.securestore.SecureStorePackage(),
        new expo.modules.sensors.SensorsPackage(),
        new expo.modules.sharing.SharingPackage(),
        new expo.modules.sms.SMSPackage(),
        new expo.modules.speech.SpeechPackage(),
        new expo.modules.sqlite.SQLitePackage(),
        new expo.modules.updates.UpdatesPackage(),
        new expo.modules.webbrowser.WebBrowserPackage()
    );
  }
}
