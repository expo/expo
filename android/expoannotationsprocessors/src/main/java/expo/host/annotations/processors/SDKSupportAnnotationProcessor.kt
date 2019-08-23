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

import host.expo.annotations.RemoveWhenSdkIsNotLongerSupported

@SupportedAnnotationTypes("host.expo.annotations.RemoveWhenSdkIsNotLongerSupported")
@SupportedSourceVersion(SourceVersion.RELEASE_8)
@AutoService(Processor::class)
class SDKSupportAnnotationProcessor : AbstractProcessor() {
  override fun process(elements: Set<TypeElement>, roundEnvironment: RoundEnvironment): Boolean {
    roundEnvironment.getElementsAnnotatedWith(RemoveWhenSdkIsNotLongerSupported::class.java).forEach {
      val version = it.getAnnotation(RemoveWhenSdkIsNotLongerSupported::class.java).version
      if (version < LAST_SUPPORTED_SDK) {
        processingEnv.messager.printMessage(Diagnostic.Kind.ERROR, "SDK $version is not longer supported", it)
      }
    }
    return true
  }

  companion object {
    private const val LAST_SUPPORTED_SDK = 33
  }
}
