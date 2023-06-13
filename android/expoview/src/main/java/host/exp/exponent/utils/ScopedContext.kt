// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.utils

import android.app.Application
import android.content.Context
import host.exp.exponent.kernel.ExperienceKey
import android.content.ContextWrapper
import host.exp.exponent.analytics.EXL
import android.content.SharedPreferences
import android.database.sqlite.SQLiteDatabase.CursorFactory
import android.database.sqlite.SQLiteDatabase
import android.database.DatabaseErrorHandler
import host.exp.exponent.Constants
import org.apache.commons.io.FileUtils
import java.io.File
import java.io.IOException
import java.io.UnsupportedEncodingException
import java.lang.Exception
import kotlin.jvm.Throws

class ScopedContext @Throws(UnsupportedEncodingException::class) constructor(context: Context?, experienceKey: ExperienceKey) : ContextWrapper(context) {
  private val scope: String
  private var filesDir: File
  private var noBackupDir: File
  private var cacheDir: File

  private val scopedApplicationContext by lazy { ScopedApplicationContext(baseContext.applicationContext as Application, this) }

  private fun migrateAllFiles(legacyDir: File, newDir: File) {
    try {
      migrateFilesRecursively(legacyDir, newDir)
      val scopedFilesMigrationMarker = File(legacyDir, ".expo-migration")
      scopedFilesMigrationMarker.createNewFile()
    } catch (e: Exception) {
      EXL.e(TAG, e)
    }
  }

  private fun migrateFilesRecursively(legacyDir: File, newDir: File) {
    val files = legacyDir.listFiles()
    for (file in files) {
      val fileName = file.name
      val newLocation = File(newDir, fileName)
      if (file.isDirectory) {
        if (!newLocation.exists()) {
          newLocation.mkdirs()
        }
        migrateFilesRecursively(file, newLocation)
      } else if (!newLocation.exists()) {
        // if a file with the same name already exists in the new location, ignore
        // we don't want to overwrite potentially newer files
        try {
          FileUtils.copyFile(file, newLocation)
        } catch (e: Exception) {
          EXL.e(TAG, e)
        }
      }
    }
  }

  override fun getApplicationContext(): Context = scopedApplicationContext

  override fun getPackageName(): String {
    // Can't scope this because Google Apis rely on this being the same as the actual
    // package name.
    EXL.d(TAG, "WARNING: getPackageName called on ScopedContext")
    return baseContext.packageName
  }

  override fun getSharedPreferences(name: String, mode: Int): SharedPreferences {
    return baseContext.getSharedPreferences(scope + name, mode)
  }

  override fun moveSharedPreferencesFrom(context: Context, s: String): Boolean {
    return baseContext.moveSharedPreferencesFrom(context, scope + s)
  }

  override fun deleteSharedPreferences(s: String): Boolean {
    return baseContext.deleteSharedPreferences(scope + s)
  }

  // TODO: scope all file methods
  override fun getFilesDir(): File {
    return filesDir
  }

  override fun getCacheDir(): File {
    return cacheDir
  }

  override fun getNoBackupFilesDir(): File {
    // We only need to create the directory if someone
    // asks for it - that's why .mkdirs() is not
    // in the constructor.
    noBackupDir.mkdirs()
    return noBackupDir
  }

  override fun openOrCreateDatabase(
    name: String,
    mode: Int,
    factory: CursorFactory
  ): SQLiteDatabase {
    return baseContext.openOrCreateDatabase(scope + name, mode, factory)
  }

  override fun openOrCreateDatabase(
    name: String,
    mode: Int,
    factory: CursorFactory,
    errorHandler: DatabaseErrorHandler?
  ): SQLiteDatabase {
    return baseContext.openOrCreateDatabase(scope + name, mode, factory, errorHandler)
  }

  override fun moveDatabaseFrom(context: Context, s: String): Boolean {
    return false
  }

  override fun deleteDatabase(name: String): Boolean {
    return baseContext.deleteDatabase(scope + name)
  }

  override fun getDatabasePath(name: String): File {
    return baseContext.getDatabasePath(scope + name)
  }

  override fun databaseList(): Array<String> {
    val list = baseContext.databaseList()
    return list.filter {
      it.startsWith(scope)
    }.map {
      it.substring(scope.length)
    }.toTypedArray()
  }

  private fun ensureDirExists(file: File) {
    if (!file.exists()) {
      val success = file.mkdirs()
      if (!success) {
        throw IOException("Unable to create scoped directory at path ${file.path}")
      }
    }
  }

  val context: Context = baseContext

  companion object {
    private val TAG = ScopedContext::class.java.simpleName
  }

  init {
    val scopeKey = experienceKey.getUrlEncodedScopeKey()

    scope = "$scopeKey-"

    val scopedFilesDir = File(baseContext.filesDir.toString() + "/ExperienceData/" + scopeKey)
    filesDir = scopedFilesDir
    cacheDir = File(baseContext.cacheDir.toString() + "/ExperienceData/" + scopeKey)
    noBackupDir = File(baseContext.noBackupFilesDir.toString() + "/ExperienceData/" + scopeKey)

    if (Constants.isStandaloneApp()) {
      val scopedFilesMigrationMarker = File(scopedFilesDir, ".expo-migration")
      if (scopedFilesDir.exists() && !scopedFilesMigrationMarker.exists()) {
        migrateAllFiles(scopedFilesDir, baseContext.filesDir)
      }
      filesDir = baseContext.filesDir
      cacheDir = baseContext.cacheDir
      noBackupDir = baseContext.noBackupFilesDir
    } else {
      listOf(filesDir, cacheDir, noBackupDir).forEach {
        ensureDirExists(it)
      }
    }
  }
}
