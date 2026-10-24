# Android integration

Setup generated a separate `:expoEmbedding` module. Application and Activity integration use composition. With approval, setup creates/registers or wires the Application and migrates a standard Activity superclass and XML theme. Activity delegate wiring remains manual.

## 1. Application

When the manifest has no `android:name` (or names `android.app.Application`), `init` offers to create `MainApplication.kt` in the app's source tree and register its fully qualified name. For an existing Kotlin Application, it can add composition to a simple class declaration, preserving its superclass and forwarding lifecycle callbacks after `super`. The preview includes all host changes. Use `npx expo-embedding init --configure-host` to authorize them without a prompt; `CI=1` alone does not authorize edits. Commit the Application and manifest with your app. Repeat runs preserve the configured class.

Setup refuses class-name collisions, custom constructors, ambiguous callbacks and existing React Native integrations. For manual integration, add these imports and use your app's package declaration. Keep your existing Application superclass if you have one. The default constructor argument supplies the no-argument constructor Android needs.

```kotlin
import android.app.Application
import android.content.res.Configuration
import com.facebook.react.ReactApplication
import expo.embedding.ExpoApplicationDelegate

class MainApplication(
  val expo: ExpoApplicationDelegate = ExpoApplicationDelegate()
) : Application(), ReactApplication by expo {
  override fun onCreate() {
    super.onCreate()
    expo.onCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    expo.onConfigurationChanged(newConfig)
  }
}
```

For manual integration, set the fully qualified name (for example, `android:name="com.example.app.MainApplication"`) on the existing manifest `<application>` element. Setup already adds this when creating the Application.

## 2. Activity

Keep your existing Activity superclass if it derives from `AppCompatActivity`. The current embedding delegate requires AppCompat. For a standard Kotlin `ComponentActivity`, `init` includes the superclass/import and XML theme migration in its preview. Agents and CI can authorize the combined host changes with `npx expo-embedding init --configure-host`. The narrower `--migrate-activity=appcompat` only authorizes Activity/theme edits and requires Application setup to be complete already. `CI=1` alone only disables prompts. Reruns preserve a configured host.

Automatic migration handles one launch Activity and standard explicit Android Material NoActionBar XML parents, including `values*` variants. It preserves style items and compatible AppCompat/Material Components/Material 3 XML parents. Custom superclass or theme changes, dynamic themes and source-set overrides require manual integration. Use an AppCompat-derived XML theme, such as `Theme.AppCompat.DayNight.NoActionBar`. Your Compose `MaterialTheme` stays unchanged. Build and launch after migration to check the XML theme.

Migration does not add the delegate wiring below. Add it to your Activity while retaining its existing Compose content and callbacks.

```kotlin
import android.content.Intent
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import expo.embedding.ExpoActivityDelegate
import expo.embedding.ExpoScene

class MainActivity : AppCompatActivity(), PermissionAwareActivity {
  private val expo = ExpoActivityDelegate()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    expo.attach(this, (application as MainApplication).expo.host)
    setContent {
      ExpoScene(expo.host, "Main", Modifier.fillMaxSize())
    }
  }

  override fun onWindowFocusChanged(hasFocus: Boolean) {
    super.onWindowFocusChanged(hasFocus)
    expo.onWindowFocusChanged(hasFocus)
  }

  @Deprecated("Forwarded for native modules using the legacy Activity result API")
  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    expo.onActivityResult(requestCode, resultCode, data)
  }

  override fun requestPermissions(permissions: Array<String>, requestCode: Int, listener: PermissionListener?) {
    expo.requestPermissions(permissions, requestCode, listener)
  }

  override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    expo.onRequestPermissionsResult(requestCode, permissions, grantResults)
  }
}
```

Attach once after `super.onCreate()` and before `setContent()`. Use one delegate per Activity instance. Resume, pause, destruction, back navigation, new intents, and configuration changes are observed automatically; do not forward them again. Destruction unregisters the listeners and releases the delegate's Activity reference. Reattaching the same Activity and host is harmless; binding another host or reusing a destroyed delegate is rejected.

`PermissionAwareActivity` lets React Native find the real Activity for permission requests. Implement its three-argument `requestPermissions` method as shown; inherited Android methods provide the permission checks. Keep the three result/focus overrides above. Existing overrides must still call `super` so AndroidX listeners receive events.

## 3. JavaScript and building

Edit `expo/App.tsx`. The generated entry registers `Main`. Register additional names with `AppRegistry.registerComponent('Details', () => Details)` and render `ExpoScene(expo.host, "Details", ...)` with explicit layout bounds. All scenes in an Activity must use the same host. Remember an `initialProps` Bundle across recompositions; a new Bundle identity or scene name remounts the surface.

Sync Gradle and Run in Android Studio, or run `./gradlew :app:assembleDebug`. Debug and Release embed JavaScript and assets; Metro is optional. Node must be available on the Gradle daemon's PATH, including when started by Android Studio.

Run `npx expo-embedding install expo-sqlite expo-video` to install modules and refresh the native integration in one step. For a CLI invoked directly by absolute path, use that same invocation with `install` instead of `init`. Sync Gradle and rebuild afterward. Config plugins are not applied; add required permissions and other native settings manually.

## Migrating an earlier prototype

Replace `ExpoEmbeddingApplication` / `createExpoHost` with `ExpoApplicationDelegate`, and replace the `ExpoActivity` superclass with the Activity composition above. `init` removes those obsolete generated superclass sources. It preserves your app's Kotlin files, so migrate their imports, superclass declarations, and callback forwarding yourself. There is no inheritance-based embedding API.
