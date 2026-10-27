package expo.modules.taskmanager

import android.content.Context
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import expo.modules.apploader.HeadlessAppLoader
import expo.modules.core.interfaces.Consumer
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskConsumerInterface
import expo.modules.interfaces.taskManager.TaskExecutionCallback
import expo.modules.interfaces.taskManager.TaskInterface
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface
import expo.modules.taskmanager.repository.BareTasksAndEventsRepository
import expo.modules.taskmanager.repository.ManagedTasksAndEventsRepository
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import java.lang.reflect.Modifier
import java.time.Duration

@RunWith(RobolectricTestRunner::class)
class TaskServiceTest {
  private val context = RuntimeEnvironment.getApplication()

  @Before
  fun setUp() {
    setMetadata()
    FakeHeadlessAppLoader.loadResult = null
    clearStaticState(TaskService::class.java)
    clearStaticState(BareTasksAndEventsRepository::class.java)
    clearStaticState(ManagedTasksAndEventsRepository::class.java)
  }

  @Test
  fun `notifyTaskFinished invokes and releases the task callback`() {
    val context = RuntimeEnvironment.getApplication()

    // TasksAndEventsRepository.create() reads application metadata to pick a storage
    // strategy; Robolectric's default package has none, so give it an empty Bundle.
    shadowOf(context.packageManager).getInternalMutablePackageInfo(context.packageName)
      .applicationInfo!!.metaData = Bundle()

    val taskService = TaskService(context)
    val appScopeKey = "testAppScopeKey"

    // Register a task manager so executeTask delivers the event body
    // synchronously instead of going through the headless app loader.
    var capturedBody: Bundle? = null
    val taskManager = object : TaskManagerInterface {
      override fun registerTask(taskName: String, consumerClass: Class<*>, options: Map<String, Any>) = Unit
      override fun unregisterTask(taskName: String, consumerClass: Class<*>) = Unit
      override fun executeTaskWithBody(body: Bundle) {
        capturedBody = body
      }
      override fun taskHasConsumerOfClass(taskName: String, consumerClass: Class<*>) = false
      override fun flushQueuedEvents() = Unit
      override fun getAppScopeKey() = appScopeKey
    }
    taskService.setTaskManager(taskManager, appScopeKey, "appUrl")

    val task = object : TaskInterface {
      override fun getName() = "testTask"
      override fun getAppScopeKey() = appScopeKey
      override fun getAppUrl() = "appUrl"
      override fun getConsumer(): TaskConsumerInterface? = null
      override fun getOptions(): Map<String, Any>? = null
      override fun getOptionsBundle(): Bundle? = null
      override fun execute(data: Bundle?, error: Error?) = Unit
      override fun execute(data: Bundle?, error: Error?, callback: TaskExecutionCallback?) = Unit
      override fun setOptions(options: Map<String, Any>?) = Unit
    }

    var finishedCount = 0
    val callback = TaskExecutionCallback { finishedCount++ }

    taskService.executeTask(task, Bundle(), null, callback)

    val eventId = capturedBody!!.getBundle("executionInfo")!!.getString("eventId")!!
    taskService.notifyTaskFinished("testTask", appScopeKey, mapOf<String, Any>("eventId" to eventId))

    assertEquals(1, finishedCount)

    // The callback must be released after execution — otherwise it retains the
    // JobService and JobParameters it closes over, for the lifetime of the process.
    assertFalse(taskCallbacksMap().containsKey(eventId))
  }

  @Test
  fun `a second notifyTaskFinished for a finished event does nothing`() {
    val taskService = TaskService(context)
    val bodies = mutableListOf<Bundle>()
    taskService.setTaskManager(capturingTaskManager(bodies), APP_SCOPE_KEY, APP_URL)
    val firstResponses = executeTask(taskService)
    val secondResponses = executeTask(taskService)

    val finishedResponse = mapOf<String, Any>("eventId" to eventIdOf(bodies[0]))
    taskService.notifyTaskFinished(TASK_NAME, APP_SCOPE_KEY, finishedResponse)
    taskService.notifyTaskFinished(TASK_NAME, APP_SCOPE_KEY, finishedResponse)

    assertEquals(1, firstResponses.size)
    assertEquals(0, secondResponses.size)
    assertEquals(listOf(eventIdOf(bodies[1])), staticMap(TaskService::class.java, "sEvents")[APP_SCOPE_KEY])
  }

  @Test
  fun `an event that JS never claims fails after the delivery timeout`() {
    val taskService = TaskService(context)
    taskService.setTaskManager(internalTaskManager(taskService), APP_SCOPE_KEY, APP_URL)

    val responses = executeTask(taskService)

    idleFor(Duration.ofSeconds(119))
    assertEquals(0, responses.size)

    idleFor(Duration.ofSeconds(1))
    assertEquals(1, responses.size)
    assertTrue(responses[0]!!.containsKey("result"))
    assertNull(responses[0]!!["result"])
    assertEquals("ERR_TASK_NOT_DELIVERED", errorCode(responses[0]))
    assertFalse(staticMap(TaskService::class.java, "sEvents").containsKey(APP_SCOPE_KEY))
  }

  @Test
  fun `only events that JS claims before their delivery timeout are emitted`() {
    val taskService = TaskService(context)
    val emitted = mutableListOf<Bundle>()
    val taskManager = observableTaskManager(taskService, emitted)

    val firstResponses = executeTask(taskService)
    idleFor(Duration.ofSeconds(1))
    val secondResponses = executeTask(taskService)

    idleFor(Duration.ofMillis(119_500))
    startObserving(taskManager)
    idleFor(Duration.ofSeconds(1))

    assertEquals(1, firstResponses.size)
    assertEquals("ERR_TASK_NOT_DELIVERED", errorCode(firstResponses[0]))
    assertEquals(1, emitted.size)
    assertNotEquals(firstResponses[0]!!["eventId"], eventIdOf(emitted[0]))
    assertEquals(0, secondResponses.size)
  }

  @Test
  fun `each event has its own delivery timeout`() {
    val taskService = TaskService(context)
    taskService.setTaskManager(internalTaskManager(taskService), APP_SCOPE_KEY, APP_URL)

    val firstResponses = executeTask(taskService)
    idleFor(Duration.ofSeconds(100))
    val secondResponses = executeTask(taskService)

    idleFor(Duration.ofSeconds(20))
    assertEquals(1, firstResponses.size)
    assertEquals(0, secondResponses.size)

    idleFor(Duration.ofSeconds(99))
    assertEquals(0, secondResponses.size)

    idleFor(Duration.ofSeconds(1))
    assertEquals(1, secondResponses.size)
  }

  @Test
  fun `a claimed event that never finishes does not change the timeout of a later event`() {
    val taskService = TaskService(context)
    taskService.setTaskManager(capturingTaskManager(mutableListOf()), APP_SCOPE_KEY, APP_URL)
    val claimedResponses = executeTask(taskService)

    idleFor(Duration.ofSeconds(60))
    taskService.setTaskManager(internalTaskManager(taskService), APP_SCOPE_KEY, APP_URL)
    val undeliveredResponses = executeTask(taskService)

    idleFor(Duration.ofSeconds(119))
    assertEquals(0, undeliveredResponses.size)

    idleFor(Duration.ofSeconds(1))
    assertEquals(1, undeliveredResponses.size)
    assertEquals(0, claimedResponses.size)
  }

  @Test
  fun `the delivery timeout starts when the task manager receives the event`() {
    val taskService = TaskService(context)
    val responses = executeTask(taskService)

    idleFor(Duration.ofSeconds(180))
    assertEquals(0, responses.size)

    taskService.setTaskManager(internalTaskManager(taskService), APP_SCOPE_KEY, APP_URL)
    idleFor(Duration.ofSeconds(119))
    assertEquals(0, responses.size)

    idleFor(Duration.ofSeconds(1))
    assertEquals(1, responses.size)
    assertEquals("ERR_TASK_NOT_DELIVERED", errorCode(responses[0]))
  }

  @Test
  fun `an emitted event fails when its task manager releases its events`() {
    val taskService = TaskService(context)
    val emitted = mutableListOf<Bundle>()
    val taskManager = observableTaskManager(taskService, emitted)
    startObserving(taskManager)
    idleFor(Duration.ofSeconds(1))

    val responses = executeTask(taskService)
    assertEquals(1, emitted.size)

    taskManager.releaseEvents()
    idleFor(Duration.ofSeconds(1))
    assertEquals(1, responses.size)
    assertEquals("ERR_TASK_INTERRUPTED", errorCode(responses[0]))

    taskService.notifyTaskFinished(TASK_NAME, APP_SCOPE_KEY, mapOf("eventId" to eventIdOf(emitted[0])))
    assertEquals(1, responses.size)
  }

  @Test
  fun `an event that reaches a destroyed task manager fails`() {
    val taskService = TaskService(context)
    val taskManager = internalTaskManager(taskService)
    taskService.setTaskManager(taskManager, APP_SCOPE_KEY, APP_URL)
    taskManager.releaseEvents()

    val responses = executeTask(taskService)
    idleFor(Duration.ofSeconds(1))

    assertEquals(1, responses.size)
    assertEquals("ERR_TASK_NOT_DELIVERED", errorCode(responses[0]))
  }

  @Test
  fun `an event fails with an error when the app does not load`() {
    FakeHeadlessAppLoader.loadResult = false
    val taskService = TaskService(context)
    taskService.registerTask(TASK_NAME, APP_SCOPE_KEY, APP_URL, TestTaskConsumer::class.java, emptyMap())

    val responses = executeTask(taskService)
    idleFor(Duration.ofSeconds(1))

    assertEquals(1, responses.size)
    assertEquals("ERR_TASK_NOT_DELIVERED", errorCode(responses[0]))
    assertFalse(taskService.hasRegisteredTask(TASK_NAME, APP_SCOPE_KEY))
  }

  private fun executeTask(taskService: TaskService): List<Map<String, Any>?> {
    val responses = mutableListOf<Map<String, Any>?>()
    taskService.executeTask(testTask(), Bundle(), null) { responses.add(it) }
    return responses
  }

  private fun testTask() = object : TaskInterface {
    override fun getName() = TASK_NAME
    override fun getAppScopeKey() = APP_SCOPE_KEY
    override fun getAppUrl() = APP_URL
    override fun getConsumer(): TaskConsumerInterface? = null
    override fun getOptions(): Map<String, Any>? = null
    override fun getOptionsBundle(): Bundle? = null
    override fun execute(data: Bundle?, error: Error?) = Unit
    override fun execute(data: Bundle?, error: Error?, callback: TaskExecutionCallback?) = Unit
    override fun setOptions(options: Map<String, Any>?) = Unit
  }

  private fun capturingTaskManager(bodies: MutableList<Bundle>) = object : TaskManagerInterface {
    override fun registerTask(taskName: String, consumerClass: Class<*>, options: Map<String, Any>) = Unit
    override fun unregisterTask(taskName: String, consumerClass: Class<*>) = Unit
    override fun executeTaskWithBody(body: Bundle) {
      bodies.add(body)
    }
    override fun taskHasConsumerOfClass(taskName: String, consumerClass: Class<*>) = false
    override fun flushQueuedEvents() = Unit
    override fun getAppScopeKey() = APP_SCOPE_KEY
  }

  private fun internalTaskManager(taskService: TaskService): TaskManagerInternalModule {
    val taskManager = TaskManagerInternalModule(context)
    TaskManagerInternalModule::class.java.getDeclaredField("mTaskService").apply {
      isAccessible = true
      set(taskManager, taskService)
    }
    return taskManager
  }

  private fun observableTaskManager(taskService: TaskService, emitted: MutableList<Bundle>): TaskManagerInternalModule {
    val taskManager = internalTaskManager(taskService)
    taskManager.setEmitEventWrapper { _, body -> emitted.add(body) }
    taskService.setTaskManager(taskManager, APP_SCOPE_KEY, APP_URL)
    return taskManager
  }

  // Mirrors OnStartObserving in TaskManagerModule.
  private fun startObserving(taskManager: TaskManagerInternalModule) {
    taskManager.markObserved()
    Handler(Looper.getMainLooper()).postDelayed({ taskManager.flushQueuedEvents() }, 1000)
  }

  private fun idleFor(duration: Duration) {
    shadowOf(Looper.getMainLooper()).idleFor(duration)
  }

  private fun eventIdOf(body: Bundle) = body.getBundle("executionInfo")!!.getString("eventId")!!

  private fun errorCode(response: Map<String, Any>?) = (response?.get("error") as? Map<*, *>)?.get("code")

  private fun setMetadata() {
    shadowOf(context.packageManager).getInternalMutablePackageInfo(context.packageName)
      .applicationInfo!!.metaData = Bundle().apply {
      putString("org.unimodules.core.AppLoader#react-native-headless", FakeHeadlessAppLoader::class.java.name)
    }
  }

  private fun clearStaticState(type: Class<*>) {
    for (field in type.declaredFields) {
      if (!Modifier.isStatic(field.modifiers)) {
        continue
      }
      field.isAccessible = true
      when (val value = field.get(null)) {
        is MutableMap<*, *> -> value.clear()
        is MutableCollection<*> -> value.clear()
      }
    }
  }

  private fun staticMap(type: Class<*>, name: String): Map<*, *> {
    val field = type.getDeclaredField(name)
    field.isAccessible = true
    return field.get(null) as Map<*, *>
  }

  private fun taskCallbacksMap(): Map<*, *> {
    val field = TaskService::class.java.getDeclaredField("sTaskCallbacks")
    field.isAccessible = true
    return field.get(null) as Map<*, *>
  }

  companion object {
    private const val APP_SCOPE_KEY = "testAppScopeKey"
    private const val APP_URL = "appUrl"
    private const val TASK_NAME = "testTask"
  }
}

class FakeHeadlessAppLoader : HeadlessAppLoader {
  override fun loadApp(context: Context, params: HeadlessAppLoader.Params, alreadyRunning: Runnable, callback: Consumer<Boolean>) {
    loadResult?.let { callback.apply(it) }
  }

  override fun invalidateApp(appScopeKey: String) = false

  override fun isRunning(appScopeKey: String) = false

  companion object {
    // Null: the app never reports the result.
    var loadResult: Boolean? = null
  }
}

class TestTaskConsumer(context: Context, taskManagerUtils: TaskManagerUtilsInterface) : TaskConsumer(context, taskManagerUtils) {
  override fun taskType() = "test"
  override fun didRegister(task: TaskInterface) = Unit
  override fun didUnregister() = Unit
}
