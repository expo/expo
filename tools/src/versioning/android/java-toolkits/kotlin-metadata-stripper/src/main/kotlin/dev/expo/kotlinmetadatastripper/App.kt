package dev.expo.kotlinmetadatastripper

import org.objectweb.asm.AnnotationVisitor
import org.objectweb.asm.ClassReader
import org.objectweb.asm.ClassVisitor
import org.objectweb.asm.ClassWriter
import org.objectweb.asm.Opcodes
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.util.jar.JarFile
import java.util.jar.JarOutputStream
import java.util.zip.ZipEntry

fun main(args: Array<String>) {
  if (args.size < 2) {
    println("Usage: java -jar kotlin-metadata-stripper.jar <input.jar> <output.jar>")
    return
  }

  val inputJarPath = args[0]
  val outputJarPath = determineOutputPath(args[1])

  val jarFile = JarFile(inputJarPath)
  JarOutputStream(Files.newOutputStream(outputJarPath)).use { jos ->
    jarFile.entries().asSequence().forEach { entry ->
      if (!entry.isDirectory && entry.name.endsWith(".class")) {
        val inputStream = jarFile.getInputStream(entry)
        val classReader = ClassReader(inputStream)
        val classWriter = ClassWriter(classReader, 0)

        // Use custom class visitor to handle Kotlin Metadata
        val classVisitor = MetadataStripper(classWriter)
        classReader.accept(classVisitor, 0)

        // Write the modified class
        jos.putNextEntry(ZipEntry(entry.name))
        jos.write(classWriter.toByteArray())
        jos.closeEntry()
      }
    }
  }

  println("Modified JAR file is created at: $outputJarPath")
}

private fun determineOutputPath(outputArg: String): Path {
  val outputPath = Paths.get(outputArg)
  return if (outputPath.isAbsolute) {
    outputPath
  } else {
    Paths.get(System.getProperty("user.dir")).resolve(outputArg)
  }
}

private class MetadataStripper(cv: ClassVisitor) : ClassVisitor(Opcodes.ASM9, cv) {
  override fun visitAnnotation(descriptor: String?, visible: Boolean): AnnotationVisitor? {
    if (descriptor == "Lkotlin/Metadata;") {
      // Skip the kotlin.Metadata annotation
      return null
    }
    return super.visitAnnotation(descriptor, visible)
  }
}
