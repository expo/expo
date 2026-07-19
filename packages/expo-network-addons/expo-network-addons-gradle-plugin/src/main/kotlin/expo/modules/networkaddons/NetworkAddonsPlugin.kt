// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.networkaddons

import com.android.build.api.instrumentation.AsmClassVisitorFactory
import com.android.build.api.instrumentation.ClassContext
import com.android.build.api.instrumentation.ClassData
import com.android.build.api.instrumentation.FramesComputationMode
import com.android.build.api.instrumentation.InstrumentationParameters
import com.android.build.api.instrumentation.InstrumentationScope
import com.android.build.api.variant.AndroidComponentsExtension
import com.android.build.api.variant.Variant
import com.facebook.react.ReactExtension
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.Optional
import org.objectweb.asm.ClassVisitor
import org.objectweb.asm.MethodVisitor
import org.objectweb.asm.Opcodes
import org.slf4j.LoggerFactory

abstract class NetworkAddonsPlugin : Plugin<Project> {

  override fun apply(project: Project) {
    val androidComponents = project.extensions.getByType(AndroidComponentsExtension::class.java)
    val reactExtension = project.extensions.findByType(ReactExtension::class.java)
    val devLauncherInstalled = project.findProject(":expo-dev-launcher") != null

    androidComponents.onVariants(androidComponents.selector().all()) { variant ->
      variant.instrumentation.transformClassesWith(NetworkAddonsClassVisitorFactory::class.java, InstrumentationScope.ALL) {
        it.enabled.set(true)
        it.debugVariant.set(isDebugVariant(variant, reactExtension))
        it.devLauncherInstalled.set(devLauncherInstalled)
      }
      variant.instrumentation.setAsmFramesComputationMode(FramesComputationMode.COMPUTE_FRAMES_FOR_INSTRUMENTED_METHODS)
    }
  }

  private fun isDebugVariant(variant: Variant, reactExtension: ReactExtension?): Boolean {
    return if (System.getenv("EX_UPDATES_NATIVE_DEBUG") != "1" && reactExtension != null) {
      reactExtension.debuggableVariants.get().any { it.equals(variant.name, ignoreCase = true) }
    } else {
      variant.buildType == "debug"
    }
  }

  interface NetworkAddonsPluginParameters : InstrumentationParameters {
    @get:Input
    @get:Optional
    val enabled: Property<Boolean>

    @get:Input
    @get:Optional
    val debugVariant: Property<Boolean>

    @get:Input
    @get:Optional
    val devLauncherInstalled: Property<Boolean>
  }

  abstract class NetworkAddonsClassVisitorFactory : AsmClassVisitorFactory<NetworkAddonsPluginParameters> {
    override fun createClassVisitor(
      classContext: ClassContext,
      nextClassVisitor: ClassVisitor
    ): ClassVisitor {
      if (parameters.get().enabled.getOrElse(false)) {
        logger.debug("[NetworkAddonsPlugin] parameters: debugVariant[${parameters.get().debugVariant}] devLauncherInstalled[${parameters.get().devLauncherInstalled}]")
        return OkHttpClassVisitor(classContext, instrumentationContext.apiVersion.get(), nextClassVisitor, parameters.get())
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

  class OkHttpClassVisitor(
    private val classContext: ClassContext,
    api: Int, classVisitor: ClassVisitor,
    private val parameters: NetworkAddonsPluginParameters
    ) : ClassVisitor(api, classVisitor) {
    override fun visitMethod(access: Int, name: String?, descriptor: String?, signature: String?, exceptions: Array<out String>?): MethodVisitor {
      val originalVisitor = super.visitMethod(access, name, descriptor, signature, exceptions)
      if (name == "build") {
        return OkHttpClientCustomBuildMethod(api, originalVisitor, parameters)
      }
      return originalVisitor
    }
  }

  class OkHttpClientCustomBuildMethod(
    api: Int, methodVisitor: MethodVisitor,
    private val parameters: NetworkAddonsPluginParameters
    ) : MethodVisitor(api, methodVisitor) {
    override fun visitCode() {
      // opcodes for `this.addInterceptor(expo.modules.kotlin.devtools.ExpoNetworkInspectOkHttpAppInterceptor())`
      visitVarInsn(Opcodes.ALOAD, 0)
      visitTypeInsn(Opcodes.NEW, "expo/modules/networkaddons/ExpoOkHttpInterceptor")
      visitInsn(Opcodes.DUP)
      visitMethodInsn(Opcodes.INVOKESPECIAL, "expo/modules/networkaddons/ExpoOkHttpInterceptor", "<init>", "()V", false)
      visitTypeInsn(Opcodes.CHECKCAST, "okhttp3/Interceptor")
      visitMethodInsn(Opcodes.INVOKEVIRTUAL, "okhttp3/OkHttpClient\$Builder", "addInterceptor", "(Lokhttp3/Interceptor;)Lokhttp3/OkHttpClient\$Builder;", false)

      if (parameters.debugVariant.getOrElse(false) && parameters.devLauncherInstalled.getOrElse(false)) {
        //
        // NOTE: The following code should be kept in sync with **packages/expo-dev-launcher/expo-dev-launcher-gradle-plugin/src/main/kotlin/expo/modules/devlauncher/DevLauncherPlugin.kt**
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
      }

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
      LoggerFactory.getLogger(NetworkAddonsPlugin::class.java)
    }
  }
}
