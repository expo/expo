// Copyright 2017-present 650 Industries. All rights reserved.
package expo.modules.gl

import android.os.Bundle
import android.util.SparseArray
import android.view.View
import expo.modules.interfaces.camera.CameraViewInterface
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private class InvalidCameraViewException :
  CodedException("Provided view tag don't point to valid instance of the camera view")

private class InvalidGLContextException :
  CodedException("GLContext not found for given context id")

class GLObjectManagerModule : Module() {
  private val mGLObjects = SparseArray<GLObject>()
  private val mGLContextMap = SparseArray<GLContext>()
  override fun definition() = ModuleDefinition {
    Name("ExponentGLObjectManager")

    AsyncFunction("destroyObjectAsync") { exglObjId: Int ->
      val glObject = mGLObjects[exglObjId]
        ?: return@AsyncFunction false

      mGLObjects.remove(exglObjId)
      glObject.destroy()
      true
    }

    AsyncFunction("createCameraTextureAsync") { exglCtxId: Int, cameraViewTag: Int, promise: Promise ->
      val cameraView = appContext.findView<View>(cameraViewTag) as? CameraViewInterface
        ?: throw InvalidCameraViewException()

      val glContext = getContextWithId(exglCtxId)
        ?: throw InvalidGLContextException()

      glContext.runAsync {
        val cameraTexture = GLCameraObject(glContext, cameraView)
        val exglObjId = cameraTexture.getEXGLObjId()
        mGLObjects.put(exglObjId, cameraTexture)
        val response = Bundle()
        response.putInt("exglObjId", exglObjId)
        promise.resolve(response)
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("takeSnapshotAsync") { exglCtxId: Int, options: Map<String, Any?>, promise: Promise ->
      val context = appContext.reactContext
        ?: throw Exceptions.ReactContextLost()

      val glContext = getContextWithId(exglCtxId)
        ?: throw InvalidGLContextException()

      glContext.takeSnapshot(options, context, promise)
    }

    AsyncFunction("createContextAsync") { promise: Promise ->
      val glContext = GLContext(this@GLObjectManagerModule)
      glContext.initialize(null, false) {
        val results = Bundle()
        results.putInt("exglCtxId", glContext.contextId)
        promise.resolve(results)
      }
    }

    AsyncFunction("destroyContextAsync") { exglCtxId: Int ->
      val glContext = getContextWithId(exglCtxId)
        ?: return@AsyncFunction false

      glContext.destroy()
      true
    }
  }

  private fun getContextWithId(exglCtxId: Int): GLContext? {
    return mGLContextMap[exglCtxId]
  }

  fun saveContext(glContext: GLContext) {
    mGLContextMap.put(glContext.contextId, glContext)
  }

  fun deleteContextWithId(exglCtxId: Int) {
    mGLContextMap.delete(exglCtxId)
  }
}
