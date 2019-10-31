package expo.modules.ota

import android.os.Bundle
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.interfaces.services.EventEmitter

private const val UPDATES_EVENT = "Exponent.updatesEvent"

private const val DOWNLOAD_STARTED = "downloadStart"
private const val DOWNLOAD_FINISHED = "downloadFinished"
private const val NO_UPDATE_AVAILABLE = "noUpdateAvailable"
private const val ERROR = "error"

interface UpdatesEventEmitter {
    fun emitDownloadStarted()
    fun emitDownloadFinished()
    fun emitDownloadNotAvailable()
    fun emitError()
}

fun createUpdatesEventEmitter(moduleRegistry: ModuleRegistry): UpdatesEventEmitter {
    val eventEmitter: EventEmitter = moduleRegistry.getModule(EventEmitter::class.java)
    return UpdatesUnimoduleEventEmitter(eventEmitter)
}

class UpdatesUnimoduleEventEmitter(private val eventEmitter: EventEmitter): UpdatesEventEmitter {

    override fun emitDownloadStarted() {
        emitEventWithType(DOWNLOAD_STARTED)
    }

    override fun emitDownloadFinished() {
        emitEventWithType(DOWNLOAD_FINISHED) //To change body of created functions use File | Settings | File Templates.
    }

    override fun emitDownloadNotAvailable() {
        emitEventWithType(NO_UPDATE_AVAILABLE) //To change body of created functions use File | Settings | File Templates.
    }

    override fun emitError() {
        emitEventWithType(ERROR) //To change body of created functions use File | Settings | File Templates.
    }

    private fun emitEventWithType(type: String){
        val bundle = Bundle()
        bundle.putString("type", type)
        eventEmitter.emit(UPDATES_EVENT, bundle)
    }
}