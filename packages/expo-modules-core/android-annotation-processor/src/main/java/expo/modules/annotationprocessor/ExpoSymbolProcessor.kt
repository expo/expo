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
import expo.modules.annotation.Config
import expo.modules.annotation.ConverterBinder
import java.io.OutputStreamWriter
import java.nio.charset.StandardCharsets

class ExpoSymbolProcessor(
  private val codeGenerator: CodeGenerator,
  private val logger: KSPLogger
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

      val parsedClazz = if (clazz.toString() == "Void") {
        null
      } else {
        clazz.toClassName()
      }

      symbol.accept(ConverterBinderVisitor(parsedClazz, codeGenerator, logger), Unit)
    }

    return emptyList()
  }
}

class ConverterBinderVisitor(
  private val clazz: ClassName?,
  private val codeGenerator: CodeGenerator,
  private val logger: KSPLogger
) : KSVisitorVoid() {

  override fun visitFunctionDeclaration(function: KSFunctionDeclaration, data: Unit) {
    if (function.functionKind != FunctionKind.TOP_LEVEL ||
      function.getVisibility() != Visibility.PUBLIC
    ) {
      logger.error("ConverterBinder has to be a public top-level function", function)
      return
    }

    val resolvedType = resolveConverterType(function) ?: return
    val shouldReceiveType = shouldReceiveType(function) ?: return

    val packageName = "${Config.packageNamePrefix}${resolvedType.packageName}"
    val className = "${resolvedType.simpleName}${Config.classNameSuffix}"

    val content = generateConverterProvider(
      packageName,
      className,
      function,
      resolvedType,
      shouldReceiveType
    )

    logger.info("Generating: $packageName.$className")

    val file = codeGenerator.createNewFile(
      createFileDependencies(function),
      packageName,
      className
    )
    OutputStreamWriter(file, StandardCharsets.UTF_8).use {
      content.writeTo(it)
    }
  }

  private fun shouldReceiveType(function: KSFunctionDeclaration): Boolean? {
    val argsNumber = function.parameters.size
    if (argsNumber != 0 && argsNumber != 1) {
      logger.error("ConverterBinder cannot receive more then one argument", function)
      return null
    }

    return function.parameters.firstOrNull()?.type?.toString() == "KType"
  }

  private fun createFileDependencies(function: KSFunctionDeclaration): Dependencies {
    val containingFile = function.containingFile
    return if (containingFile == null) {
      Dependencies(false)
    } else {
      Dependencies(false, containingFile)
    }
  }

  private fun resolveConverterType(function: KSFunctionDeclaration): ClassName? {
    if (clazz != null) {
      return clazz
    }

    val returnType = function.returnType?.resolve()
    if (returnType == null) {
      logger.error("Cannot resolve return type", function)
      return null
    }

    if (returnType.arguments.size != 1) {
      logger.error("Incorrect return type", function)
      return null
    }

    val type = returnType.arguments.first().type?.resolve()
    if (type == null) {
      logger.error("Cannot resolve converter inner type", function)
      return null
    }

    return type.toClassName()
  }

  private fun generateConverterProvider(
    packageName: String,
    className: String,
    function: KSFunctionDeclaration,
    forType: ClassName,
    receivesType: Boolean
  ): FileSpec {
    val typeConverter = ClassName("expo.modules.kotlin.types", "TypeConverter")
      .parameterizedBy(forType)
    val kType = ClassName("kotlin.reflect", "KType")

    return FileSpec
      .builder(packageName, className)
      .addType(
        TypeSpec
          .classBuilder(className)
          .addFunction(
            FunSpec
              .builder(Config.converterProviderFunctionName)
              .addParameter("type", kType)
              .returns(typeConverter)
              .apply {
                if (receivesType) {
                  addStatement("return ${function.packageName.asString()}.${function.simpleName.asString()}(type)")
                } else {
                  addStatement("return ${function.packageName.asString()}.${function.simpleName.asString()}()")
                }
              }
              .build()
          )
          .build()
      )
      .build()
  }
}
