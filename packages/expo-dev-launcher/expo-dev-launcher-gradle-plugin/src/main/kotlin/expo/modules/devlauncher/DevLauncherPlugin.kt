// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.devlauncher

import com.android.build.api.instrumentation.AsmClassVisitorFactory
import com.android.build.api.instrumentation.ClassContext
import com.android.build.api.instrumentation.ClassData
import com.android.build.api.instrumentation.FramesComputationMode
import com.android.build.api.instrumentation.InstrumentationParameters
import com.android.build.api.instrumentation.InstrumentationScope
import com.android.build.api.variant.AndroidComponentsExtension
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.Optional
import org.objectweb.asm.ClassVisitor
import org.objectweb.asm.MethodVisitor
import org.objectweb.asm.Opcodes
import org.slf4j.LoggerFactory

abstract class DevLauncherPlugin : Plugin<Project> {

  override fun apply(project: Project) {
    val enableNetworkInspector = project.properties["EX_DEV_CLIENT_NETWORK_INSPECTOR"]?.toString()?.toBoolean()
    if (enableNetworkInspector == null || enableNetworkInspector) {
      // When expo-network-addons is installed, we will let it do the bytecode manipulation
      val networkAddonsInstalled = project.findProject(":expo-network-addons") != null
      if (networkAddonsInstalled) {
        logger.warn("[DevLauncherPlugin] expo-network-addons is installed and will take this plugin's responsibilities")
        return
      }

      val androidComponents = project.extensions.getByType(AndroidComponentsExtension::class.java)
      androidComponents.onVariants(androidComponents.selector().withBuildType("debug")) { variant ->
        variant.instrumentation.transformClassesWith(DevLauncherClassVisitorFactory::class.java, InstrumentationScope.ALL) {
          it.enabled.set(true)
        }
        variant.instrumentation.setAsmFramesComputationMode(FramesComputationMode.COMPUTE_FRAMES_FOR_INSTRUMENTED_METHODS)
      }
    }
  }

  interface DevLauncherPluginParameters : InstrumentationParameters {
    @get:Input
    @get:Optional
    val enabled: Property<Boolean>
  }

  abstract class DevLauncherClassVisitorFactory : AsmClassVisitorFactory<DevLauncherPluginParameters> {
    override fun createClassVisitor(
      classContext: ClassContext,
      nextClassVisitor: ClassVisitor
    ): ClassVisitor {
      if (parameters.get().enabled.getOrElse(false)) {
        return OkHttpClassVisitor(classContext, instrumentationContext.apiVersion.get(), nextClassVisitor)
      }
      return nextClassVisitor
    }

    override fun isInstrumentable(classData: ClassData): Boolean {
      if (parameters.get().enabled.getOrElse(false)) {
        return classData.className in listOf("okhttp3.OkHttpClient\$Builder")
      }
      return false
    }
  }

  class OkHttpClassVisitor(private val classContext: ClassContext, api: Int, classVisitor: ClassVisitor) : ClassVisitor(api, classVisitor) {
    override fun visitMethod(access: Int, name: String?, descriptor: String?, signature: String?, exceptions: Array<out String>?): MethodVisitor {
      val originalVisitor = super.visitMethod(access, name, descriptor, signature, exceptions)
      if (name == "build") {
        return OkHttpClientCustomBuildMethod(api, originalVisitor)
      }
      return originalVisitor
    }
  }

  class OkHttpClientCustomBuildMethod(api: Int, methodVisitor: MethodVisitor) : MethodVisitor(api, methodVisitor) {
    override fun visitCode() {
      //
      // NOTE: The following code should be kept in sync with **packages/expo-network-addons/expo-network-addons-gradle-plugin/src/main/kotlin/expo/modules/networkaddons/NetworkAddonsPlugin.kt**
      //

      // opcodes for `this.addInterceptor(expo.modules.kotlin.devtools.ExpoNetworkInspectOkHttpAppInterceptor())`
      visitVarInsn(Opcodes.ALOAD, 0)
      visitTypeInsn(Opcodes.NEW, "expo/modules/kotlin/devtools/ExpoNetworkInspectOkHttpAppInterceptor")
      visitInsn(Opcodes.DUP)
      visitMethodInsn(Opcodes.INVOKESPECIAL, "expo/modules/kotlin/devtools/ExpoNetworkInspectOkHttpAppInterceptor", "<init>", "()V", false)
      visitTypeInsn(Opcodes.CHECKCAST, "okhttp3/Interceptor")
      visitMethodInsn(Opcodes.INVOKEVIRTUAL, "okhttp3/OkHttpClient\$Builder", "addInterceptor", "(Lokhttp3/Interceptor;)Lokhttp3/OkHttpClient\$Builder;", false)

      // opcodes for `this.addNetworkInterceptor(expo.modules.kotlin.devtools.ExpoNetworkInspectOkHttpNetworkInterceptor())`
      visitVarInsn(Opcodes.ALOAD, 0)
      visitTypeInsn(Opcodes.NEW, "expo/modules/kotlin/devtools/ExpoNetworkInspectOkHttpNetworkInterceptor")
      visitInsn(Opcodes.DUP)
      visitMethodInsn(Opcodes.INVOKESPECIAL, "expo/modules/kotlin/devtools/ExpoNetworkInspectOkHttpNetworkInterceptor", "<init>", "()V", false)
      visitTypeInsn(Opcodes.CHECKCAST, "okhttp3/Interceptor")
      visitMethodInsn(Opcodes.INVOKEVIRTUAL, "okhttp3/OkHttpClient\$Builder", "addNetworkInterceptor", "(Lokhttp3/Interceptor;)Lokhttp3/OkHttpClient\$Builder;", false)

      // opcodes for `return OkHttpClient(this)`
      visitTypeInsn(Opcodes.NEW, "okhttp3/OkHttpClient")
      visitInsn(Opcodes.DUP)
      visitVarInsn(Opcodes.ALOAD, 0)
      visitMethodInsn(Opcodes.INVOKESPECIAL, "okhttp3/OkHttpClient", "<init>", "(Lokhttp3/OkHttpClient\$Builder;)V", false)
      visitInsn(Opcodes.ARETURN)
    }
  }

  companion object {
    internal val logger by lazy {
      LoggerFactory.getLogger(DevLauncherPlugin::class.java)
    }
  }
}
