export const LIST_OF_ANDROID_ADAPTIVE_ICON_FILES_FINAL = [
  'android/app/src/main/res/values/colors.xml',
  'android/app/src/main/res/mipmap-mdpi/ic_launcher.webp',
  'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.webp',
  'android/app/src/main/res/mipmap-mdpi/ic_launcher_monochrome.webp',
  'android/app/src/main/res/mipmap-mdpi/ic_launcher_background.webp',
  'android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.webp',
  'android/app/src/main/res/mipmap-hdpi/ic_launcher.webp',
  'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.webp',
  'android/app/src/main/res/mipmap-hdpi/ic_launcher_monochrome.webp',
  'android/app/src/main/res/mipmap-hdpi/ic_launcher_background.webp',
  'android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.webp',
  'android/app/src/main/res/mipmap-xhdpi/ic_launcher.webp',
  'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.webp',
  'android/app/src/main/res/mipmap-xhdpi/ic_launcher_monochrome.webp',
  'android/app/src/main/res/mipmap-xhdpi/ic_launcher_background.webp',
  'android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.webp',
  'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.webp',
  'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.webp',
  'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_monochrome.webp',
  'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_background.webp',
  'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.webp',
  'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.webp',
  'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.webp',
  'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_monochrome.webp',
  'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_background.webp',
  'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.webp',
  'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
  'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
  'assets/iconForeground.png',
  'assets/iconBackground.png',
  'assets/iconMonochrome.png',
];

export const ADAPTIVE_ICON_XML_WITH_BOTH = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
export const ADAPTIVE_ICON_XML_WITH_BOTH_AND_MONOCHROME = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>`;
export const ADAPTIVE_ICON_XML_WITH_BACKGROUND_COLOR = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/iconBackground"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
export const ADAPTIVE_ICON_XML_WITH_BACKGROUND_COLOR_AND_MONOCHROME = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/iconBackground"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>`;
export const SAMPLE_COLORS_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <color name="splashscreen_background">#FFFFFF</color>
</resources>`;
export const defaultDirectoryJSON = {
  './android/app/src/main/res/values/colors.xml': SAMPLE_COLORS_XML,
};
