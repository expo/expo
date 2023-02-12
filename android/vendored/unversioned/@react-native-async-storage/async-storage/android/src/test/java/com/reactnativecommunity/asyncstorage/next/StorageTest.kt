package com.reactnativecommunity.asyncstorage.next

import androidx.room.Room
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.google.common.truth.Truth.assertThat
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import kotlin.random.Random

@ExperimentalCoroutinesApi
@RunWith(AndroidJUnit4::class)
class AsyncStorageAccessTest {
    private lateinit var asyncStorage: AsyncStorageAccess
    private lateinit var database: StorageDb

    @Before
    fun setup() {
        database = Room.inMemoryDatabaseBuilder(
            InstrumentationRegistry.getInstrumentation().context, StorageDb::class.java
        ).allowMainThreadQueries().build()
        asyncStorage = StorageSupplier(database)
    }

    @After
    fun tearDown() {
        database.close()
    }

    @Test
    fun performsBasicGetSetRemoveOperations() = runBlocking {
        val entriesCount = 10
        val entries = createRandomEntries(entriesCount)
        val keys = entries.map { it.key }
        assertThat(asyncStorage.getValues(keys)).hasSize(0)
        asyncStorage.setValues(entries)
        assertThat(asyncStorage.getValues(keys)).hasSize(entriesCount)
        val indicesToRemove = (1..4).map { Random.nextInt(0, entriesCount) }.distinct()
        val toRemove = entries.filterIndexed { index, _ -> indicesToRemove.contains(index) }
        asyncStorage.removeValues(toRemove.map { it.key })
        val currentEntries = asyncStorage.getValues(keys)
        assertThat(currentEntries).hasSize(entriesCount - toRemove.size)
    }

    @Test
    fun readsAllKeysAndClearsDb() = runBlocking {
        val entries = createRandomEntries(8)
        val keys = entries.map { it.key }
        asyncStorage.setValues(entries)
        val dbKeys = asyncStorage.getKeys()
        assertThat(dbKeys).isEqualTo(keys)
        asyncStorage.clear()
        assertThat(asyncStorage.getValues(keys)).hasSize(0)
    }

    @Test
    fun mergesDeeplyTwoValues() = runBlocking {
        val initialEntry = Entry("key", VALUE_INITIAL)
        val overrideEntry = Entry("key", VALUE_OVERRIDES)
        asyncStorage.setValues(listOf(initialEntry))
        asyncStorage.mergeValues(listOf(overrideEntry))
        val current = asyncStorage.getValues(listOf("key"))[0]
        assertThat(current.value).isEqualTo(VALUE_MERGED)
    }

    @Test
    fun updatesExistingValues() = runBlocking {
        val key = "test_key"
        val value = "test_value"
        val entries = listOf(Entry(key, value))
        assertThat(asyncStorage.getValues(listOf(key))).hasSize(0)
        asyncStorage.setValues(entries)
        assertThat(asyncStorage.getValues(listOf(key))).isEqualTo(entries)
        val modifiedEntries = listOf(Entry(key, "updatedValue"))
        asyncStorage.setValues(modifiedEntries)
        assertThat(asyncStorage.getValues(listOf(key))).isEqualTo(modifiedEntries)
    }


    // Test Helpers
    private fun createRandomEntries(count: Int = Random.nextInt(10)): List<Entry> {
        val entries = mutableListOf<Entry>()
        for (i in 0 until count) {
            entries.add(Entry("key$i", "value$i"))
        }
        return entries
    }

    private val VALUE_INITIAL = JSONObject(
        """
    {
       "key":"value",
       "key2":"override",
       "key3":{
          "key4":"value4",
          "key6":{
             "key7":"value7",
             "key8":"override"
          }
       }
    }
""".trimMargin()
    ).toString()

    private val VALUE_OVERRIDES = JSONObject(
        """
    {
       "key2":"value2",
       "key3":{
          "key5":"value5",
          "key6":{
             "key8":"value8"
          }
       }
    }
"""
    ).toString()


    private val VALUE_MERGED = JSONObject(
        """
    {
       "key":"value",
       "key2":"value2",
       "key3":{
          "key4":"value4",
          "key6":{
             "key7":"value7",
             "key8":"value8"
          },
          "key5":"value5"
       }
    }
""".trimMargin()
    ).toString()
}
