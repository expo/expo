import groovy.json.JsonSlurper
import groovy.util.FileNameFinder

class Unimodule(
        var name: String = "",
        var platform: List<String> = listOf(),
        var target: List<String> = listOf(),
        var androidBasePackage: String? = null
)

fun findUnimodules(modulesDir: String): List<Unimodule> {
    fun readUnimoduleData(path: String): Unimodule? {
        val json = JsonSlurper().parse(rootDir.resolve(path)) as? Map<*, *> ?: return null

        return Unimodule().apply {
            name = json["name"] as String
            @Suppress("UNCHECKED_CAST")
            platform = (json["platform"] as List<String>?) ?: listOf("android", "ios")
            @Suppress("UNCHECKED_CAST")
            target = (json["target"] as List<String>?) ?: listOf("react-native", "flutter")
            androidBasePackage = (json["androidBasePackage"] as String?)
        }
    }

    val unimodules = mutableListOf<Unimodule>()
    val baseDir = rootDir.resolve("../packages")
    val pkgPaths = FileNameFinder().getFileNames(baseDir.absolutePath, "**/unimodule.json")
    for (packageDir in pkgPaths) {
        readUnimoduleData(packageDir)?.let {
            unimodules.add(it)
        }
    }
    return unimodules
}

fun generateBasePackageList(modulesDir: String) {
    val modules = findUnimodules(modulesDir)
    val fileBuilder = StringBuilder()
    fileBuilder.append("package host.exp.exponent.generated;\n\n")

    fileBuilder.append("import java.util.Arrays;\n")
    fileBuilder.append("import java.util.List;\n")
    fileBuilder.append("import org.unimodules.core.interfaces.Package;\n\n")

    fileBuilder.append("public class BasePackageList {\n")
    fileBuilder.append("  public List<Package> getPackageList() {\n")
    fileBuilder.append("    return Arrays.<Package>asList(\n")
    var isEmptyList = true
    for (module in modules) {
        module.androidBasePackage?.let {
            fileBuilder.append("        new $it(),\n")
            isEmptyList = false
        }
    }
    if (!isEmptyList) {
        fileBuilder.deleteCharAt(fileBuilder.length - 2) // remove last comma in a list
    }
    fileBuilder.append("    );\n")
    fileBuilder.append("  }\n")
    fileBuilder.append("}\n")

    val javaFile = rootDir.resolve("app/src/main/java/host/exp/exponent/generated/BasePackageList.java")
    if (javaFile.exists()) {
        javaFile.delete()
    }
    javaFile.createNewFile()
    javaFile.writeText(fileBuilder.toString());
}


tasks {
    register("generateList") {
        doLast{
            generateBasePackageList("../../packages")
        }
    }

}