package host.expo.processors

import com.google.auto.service.AutoService

import javax.annotation.processing.AbstractProcessor
import javax.annotation.processing.Processor
import javax.annotation.processing.RoundEnvironment
import javax.annotation.processing.SupportedAnnotationTypes
import javax.annotation.processing.SupportedSourceVersion
import javax.lang.model.SourceVersion
import javax.lang.model.element.TypeElement
import javax.tools.Diagnostic

import host.expo.annotations.RemoveOnceSdkIsNoLongerSupported

@SupportedAnnotationTypes("host.expo.annotations.RemoveOnceSdkIsNoLongerSupported")
@SupportedSourceVersion(SourceVersion.RELEASE_8)
@AutoService(Processor::class)
class SDKSupportAnnotationProcessor : AbstractProcessor() {
  override fun process(elements: Set<TypeElement>, roundEnvironment: RoundEnvironment): Boolean {
    roundEnvironment.getElementsAnnotatedWith(RemoveOnceSdkIsNoLongerSupported::class.java).forEach {
      val version = it.getAnnotation(RemoveOnceSdkIsNoLongerSupported::class.java).version
      if (version < LAST_SUPPORTED_SDK) {
        processingEnv.messager.printMessage(Diagnostic.Kind.ERROR, "SDK $version is no longer supported, remove this code", it)
      }
    }
    return true
  }

  companion object {
    private const val LAST_SUPPORTED_SDK = 33
  }
}
