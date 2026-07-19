package expo.modules.video.utils

import java.lang.ref.ReferenceQueue
import java.lang.ref.WeakReference
import java.util.HashSet

/** Returns a new, empty [WeakMutableSet]. */
internal fun <T> weakMutableHashSetOf(): WeakMutableSet<T> = WeakMutableSet()

/** Returns a new [WeakMutableSet] with the given elements. */
internal fun <T> weakMutableHashSetOf(vararg elements: T): WeakMutableSet<T> {
  return WeakMutableSet<T>().apply {
    addAll(elements.asList())
  }
}

internal class WeakMutableSet<T> : MutableSet<T> {
  private val delegate = HashSet<WeakElement<T>>()
  private val referenceQueue = ReferenceQueue<T>()
  override val size: Int
    get() = delegate.size

  override fun contains(element: T): Boolean {
    return delegate.contains(WeakElement(element))
  }

  override fun add(element: T): Boolean {
    removeGarbageCollectedEntries()
    return delegate.add(WeakElement(element, this.referenceQueue))
  }

  override fun remove(element: T): Boolean {
    val ret = delegate.remove(WeakElement(element))
    removeGarbageCollectedEntries()
    return ret
  }

  override fun containsAll(elements: Collection<T>): Boolean {
    return elements.all(this::contains)
  }

  override fun addAll(elements: Collection<T>): Boolean {
    return elements.fold(false) { changed, element ->
      add(element) || changed
    }
  }

  override fun retainAll(elements: Collection<T>): Boolean {
    val itemsToRemove = this.filterNot { it in elements }.toSet()
    return this.removeAll(itemsToRemove)
  }

  override fun removeAll(elements: Collection<T>): Boolean {
    return elements.fold(false) { acc, element ->
      remove(element) || acc
    }
  }

  override fun clear() {
    delegate.clear()
  }

  override fun isEmpty(): Boolean {
    return delegate.isEmpty()
  }

  override fun iterator(): MutableIterator<T> {
    removeGarbageCollectedEntries()

    val i = delegate.iterator()

    return object : MutableIterator<T> {
      override fun hasNext(): Boolean {
        return i.hasNext()
      }

      override fun next(): T {
        // We should be relatively safe as we just called removeGarbageCollectedEntries
        return i.next().get() ?: throw NoSuchElementException("The next element was garbage collected.")
      }

      override fun remove() {
        i.remove()
      }
    }
  }

  private fun removeGarbageCollectedEntries() {
    while (true) {
      val weakElem = referenceQueue.poll() as? WeakElement<out T> ?: break
      delegate.remove(weakElem)
    }
  }
}

/**
 * A WeakReference that compares the stored object instead of the WeakReferences themselves.
 */
private class WeakElement<T> : WeakReference<T> {
  private val hash: Int

  constructor(o: T) : super(o) {
    hash = o?.hashCode() ?: 0
  }

  constructor(o: T, q: ReferenceQueue<T>) : super(o, q) {
    hash = o?.hashCode() ?: 0
  }

  override fun equals(other: Any?): Boolean {
    if (other !is WeakElement<*>) {
      return false
    }
    return this === other || this.get() == other.get()
  }

  override fun hashCode(): Int {
    return hash
  }
}
