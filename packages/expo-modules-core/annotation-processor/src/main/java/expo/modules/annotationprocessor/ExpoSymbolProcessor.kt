package expo.modules.annotationprocessor

import com.google.devtools.ksp.getVisibility
import com.google.devtools.ksp.processing.CodeGenerator
import com.google.devtools.ksp.processing.Dependencies
import com.google.devtools.ksp.processing.KSPLogger
import com.google.devtools.ksp.processing.Resolver
import com.google.devtools.ksp.processing.SymbolProcessor
import com.google.devtools.ksp.symbol.FunctionKind
import com.google.devtools.ksp.symbol.KSAnnotated
import com.google.devtools.ksp.symbol.KSFunctionDeclaration
import com.google.devtools.ksp.symbol.KSType
import com.google.devtools.ksp.symbol.KSVisitorVoid
import com.google.devtools.ksp.symbol.Visibility
import com.squareup.kotlinpoet.ClassName
import com.squareup.kotlinpoet.FileSpec
import com.squareup.kotlinpoet.FunSpec
import com.squareup.kotlinpoet.ParameterizedTypeName.Companion.parameterizedBy
import com.squareup.kotlinpoet.TypeSpec
import com.squareup.kotlinpoet.ksp.toClassName
import expo.modules.annotation.ConverterBinder
import java.io.OutputStreamWriter
import java.nio.charset.StandardCharsets

class ExpoSymbolProcessor(
  private val codeGenerator: CodeGenerator,
  private val logger: KSPLogger,
  private val options: Map<String, String>
) : SymbolProcessor {
  override fun process(resolver: Resolver): List<KSAnnotated> {
    val symbols = resolver
      .getSymbolsWithAnnotation(ConverterBinder::class.java.name)
      .filterIsInstance<KSFunctionDeclaration>()

    if (symbols.iterator().hasNext().not()) {
      return emptyList()
    }

    symbols.forEach { symbol ->
      val clazz = symbol.annotations.find {
        it.shortName.asString() == ConverterBinder::class.java.simpleName
      }!!.arguments[0].value as KSType

      symbol.accept(ConverterBinderVisitor(clazz.toClassName(), codeGenerator), Unit)
    }

    return emptyList()
  }
}

class ConverterBinderVisitor(
  private val clazz: ClassName,
  private val codeGenerator: CodeGenerator,
) : KSVisitorVoid() {

  override fun visitFunctionDeclaration(function: KSFunctionDeclaration, data: Unit) {
    if (function.functionKind != FunctionKind.TOP_LEVEL ||
      function.getVisibility() != Visibility.PUBLIC) {
      return
    }

    val containingFile = function.containingFile
    val dependencies = if (containingFile == null) {
      Dependencies(false)
    } else {
      Dependencies(false, containingFile)
    }

    val packageName = clazz.packageName
    val className = clazz.simpleName + "ExpoTypeConverter"

    val typeConverter = ClassName("expo.modules.kotlin.types", "TypeConverter")
      .parameterizedBy(clazz)

    val content = FileSpec
      .builder(packageName, className)
      .addType(
        TypeSpec
          .classBuilder(className)
          .addFunction(
            FunSpec
              .builder("converter")
              .returns(typeConverter)
              .addStatement("return ${function.packageName.asString()}.${function.simpleName.asString()}()")
              .build()
          )
          .build()
      )
      .build()

    val file = codeGenerator.createNewFile(dependencies, packageName, className)
    OutputStreamWriter(file, StandardCharsets.UTF_8).use {
      content.writeTo(it)
    }
  }
}
