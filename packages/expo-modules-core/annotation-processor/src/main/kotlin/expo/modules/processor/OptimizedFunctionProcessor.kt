package expo.modules.processor

import com.google.devtools.ksp.processing.*
import com.google.devtools.ksp.symbol.*
import com.google.devtools.ksp.validate
import java.io.File

class OptimizedFunctionProcessor(
    private val codeGenerator: CodeGenerator,
    private val logger: KSPLogger,
    private val options: Map<String, String>
) : SymbolProcessor {

    private val generatedFunctions = mutableListOf<FunctionMetadata>()

    override fun process(resolver: Resolver): List<KSAnnotated> {
        val symbols = resolver.getSymbolsWithAnnotation("expo.modules.kotlin.functions.OptimizedFunction")
        val ret = symbols.filter { !it.validate() }.toList()

        symbols
            .filterIsInstance<KSFunctionDeclaration>()
            .filter { it.validate() }
            .forEach { function ->
                try {
                    processFunctionDeclaration(function)
                } catch (e: Exception) {
                    logger.error("Error processing function ${function.simpleName.asString()}: ${e.message}", function)
                }
            }

        return ret
    }

    private fun processFunctionDeclaration(function: KSFunctionDeclaration) {
        val moduleName = function.parentDeclaration?.simpleName?.asString()
            ?: throw IllegalStateException("Function must be in a class")

        val functionName = function.simpleName.asString()
        val packageName = function.packageName.asString()

        logger.info("Processing @OptimizedFunction: $moduleName.$functionName")

        // Extract parameter metadata
        val parameters = function.parameters.map { param ->
            ParameterMetadata(
                name = param.name?.asString() ?: "",
                kotlinType = param.type.resolve().declaration.simpleName.asString(),
                isNullable = param.type.resolve().isMarkedNullable
            )
        }

        // Extract return type
        val returnType = function.returnType?.resolve()
        val returnTypeName = returnType?.declaration?.simpleName?.asString() ?: "Unit"

        val metadata = FunctionMetadata(
            moduleName = moduleName,
            modulePackage = packageName,
            functionName = functionName,
            parameters = parameters,
            returnType = returnTypeName
        )

        generatedFunctions.add(metadata)
    }

    override fun finish() {
        if (generatedFunctions.isEmpty()) {
            return
        }

        // Group functions by module
        val functionsByModule = generatedFunctions.groupBy { it.moduleName }

        functionsByModule.forEach { (moduleName, functions) ->
            functions.forEach { metadata ->
                try {
                    generateCppAdapter(metadata)
                    generateCppJniBinding(metadata)
                } catch (e: Exception) {
                    logger.error("Error generating code for ${metadata.functionName}: ${e.message}")
                }
            }

            try {
                generateKotlinRegistry(moduleName, functions)
            } catch (e: Exception) {
                logger.error("Error generating Kotlin registry for $moduleName: ${e.message}")
            }
        }

        logger.info("OptimizedFunctionProcessor generated code for ${generatedFunctions.size} functions")
    }

    private fun generateCppAdapter(metadata: FunctionMetadata) {
        val cppDir = options["expo.generated.cpp.dir"] ?: "build/generated/cpp/expo"
        val outputFile = File("$cppDir/${metadata.moduleName}_${metadata.functionName}.cpp")
        outputFile.parentFile.mkdirs()

        val code = CppAdapterGenerator.generate(metadata)
        outputFile.writeText(code)

        logger.info("Generated C++ adapter: ${outputFile.absolutePath}")
    }

    private fun generateCppJniBinding(metadata: FunctionMetadata) {
        val cppDir = options["expo.generated.cpp.dir"] ?: "build/generated/cpp/expo"
        val outputFile = File("$cppDir/${metadata.moduleName}_${metadata.functionName}_jni.cpp")
        outputFile.parentFile.mkdirs()

        val code = CppJniBindingGenerator.generate(metadata)
        outputFile.writeText(code)

        logger.info("Generated C++ JNI binding: ${outputFile.absolutePath}")
    }

    private fun generateKotlinRegistry(moduleName: String, functions: List<FunctionMetadata>) {
        val kotlinDir = options["expo.generated.kotlin.dir"] ?: "build/generated/ksp/kotlin"
        val metadata = functions.first()
        val packageName = metadata.modulePackage
        val packagePath = packageName.replace('.', '/')
        val outputFile = File("$kotlinDir/$packagePath/${moduleName}_OptimizedRegistry.kt")
        outputFile.parentFile.mkdirs()

        val code = KotlinRegistryGenerator.generate(moduleName, packageName, functions)
        outputFile.writeText(code)

        logger.info("Generated Kotlin registry: ${outputFile.absolutePath}")
    }

    data class FunctionMetadata(
        val moduleName: String,
        val modulePackage: String,
        val functionName: String,
        val parameters: List<ParameterMetadata>,
        val returnType: String
    )

    data class ParameterMetadata(
        val name: String,
        val kotlinType: String,
        val isNullable: Boolean
    )
}

class OptimizedFunctionProcessorProvider : SymbolProcessorProvider {
    override fun create(environment: SymbolProcessorEnvironment): SymbolProcessor {
        return OptimizedFunctionProcessor(
            environment.codeGenerator,
            environment.logger,
            environment.options
        )
    }
}
