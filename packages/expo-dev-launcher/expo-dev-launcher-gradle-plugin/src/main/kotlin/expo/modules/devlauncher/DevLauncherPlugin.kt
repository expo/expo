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
import org.objectweb.asm.ClassVisitor
import org.objectweb.asm.MethodVisitor
import org.objectweb.asm.Opcodes
import org.slf4j.LoggerFactory

abstract class DevLauncherPlugin : Plugin<Project> {

  override fun apply(project: Project) {
    val androidComponents = project.extensions.getByType(AndroidComponentsExtension::class.java)
    androidComponents.onVariants(androidComponents.selector().withBuildType("debug")) { variant ->
      variant.instrumentation.transformClassesWith(DevLauncherClassVisitorFactory::class.java, InstrumentationScope.ALL) {
      }
      variant.instrumentation.setAsmFramesComputationMode(FramesComputationMode.COMPUTE_FRAMES_FOR_INSTRUMENTED_METHODS)
    }
  }

  abstract class DevLauncherClassVisitorFactory : AsmClassVisitorFactory<InstrumentationParameters.None> {
    override fun createClassVisitor(
      classContext: ClassContext,
      nextClassVisitor: ClassVisitor
    ): ClassVisitor {
      return OkHttpClassVisitor(classContext, instrumentationContext.apiVersion.get(), nextClassVisitor)
    }

    override fun isInstrumentable(classData: ClassData): Boolean {
      return classData.className in listOf("okhttp3.OkHttpClient\$Builder")
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
      // opcodes for `this.addNetworkInterceptor(expo.modules.devlauncher.network.DevLauncherOkHttpInterceptor())`
      visitVarInsn(Opcodes.ALOAD, 0)
      visitTypeInsn(Opcodes.NEW, "expo/modules/devlauncher/network/DevLauncherOkHttpInterceptor")
      visitInsn(Opcodes.DUP)
      visitMethodInsn(Opcodes.INVOKESPECIAL, "expo/modules/devlauncher/network/DevLauncherOkHttpInterceptor", "<init>", "()V", false)
      visitTypeInsn(Opcodes.CHECKCAST, "okhttp3/Interceptor")
      visitMethodInsn(Opcodes.INVOKEVIRTUAL, "okhttp3/OkHttpClient\$Builder", "addNetworkInterceptor", "(Lokhttp3/Interceptor;)Lokhttp3/OkHttpClient\$Builder;", false)

      // opcode for `return OkHttpClient(this)`
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
