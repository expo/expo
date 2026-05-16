package expo.modules.kotlin.views

import android.view.View
import com.google.common.truth.Truth
import io.mockk.every
import io.mockk.mockk
import org.junit.Test

class OnAttachAfterDetachmentListenerTest {
  @Test
  fun `does not run callback when view reattaches before detach check`() {
    val view = mockk<View>()
    val postedRunnables = mutableListOf<Runnable>()
    var callbackCount = 0
    every { view.isAttachedToWindow } returns false

    val listener = OnAttachAfterDetachmentListener(
      onAttachAfterDetachment = { callbackCount += 1 },
      post = { postedRunnables.add(it) }
    )

    listener.onViewDetachedFromWindow(view)
    listener.onViewAttachedToWindow(view)
    postedRunnables.single().run()

    Truth.assertThat(callbackCount).isEqualTo(0)
  }

  @Test
  fun `runs callback when view reattaches after detach check`() {
    val view = mockk<View>()
    val postedRunnables = mutableListOf<Runnable>()
    var callbackCount = 0
    every { view.isAttachedToWindow } returns false

    val listener = OnAttachAfterDetachmentListener(
      onAttachAfterDetachment = { callbackCount += 1 },
      post = { postedRunnables.add(it) }
    )

    listener.onViewDetachedFromWindow(view)
    postedRunnables.single().run()
    listener.onViewAttachedToWindow(view)

    Truth.assertThat(callbackCount).isEqualTo(1)
  }

  @Test
  fun `runs callback only once for a completed detach cycle`() {
    val view = mockk<View>()
    val postedRunnables = mutableListOf<Runnable>()
    var callbackCount = 0
    every { view.isAttachedToWindow } returns false

    val listener = OnAttachAfterDetachmentListener(
      onAttachAfterDetachment = { callbackCount += 1 },
      post = { postedRunnables.add(it) }
    )

    listener.onViewDetachedFromWindow(view)
    postedRunnables.single().run()
    listener.onViewAttachedToWindow(view)
    listener.onViewAttachedToWindow(view)

    Truth.assertThat(callbackCount).isEqualTo(1)
  }
}
