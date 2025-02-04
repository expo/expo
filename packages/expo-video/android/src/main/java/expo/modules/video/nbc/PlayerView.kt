package expo.modules.video.player

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.util.AttributeSet
import android.util.Log
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.FrameLayout
import androidx.media3.ui.PlayerView

// Configuration
const val SHOULD_USE_DEFAULT_CONTROLLER = true // If we should display the default controller

class PlayerView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : PlayerView(context, attrs, defStyleAttr)   {
    private var overlayUpNextFrame = FrameLayout(context).apply {
        setBackgroundColor(Color.RED)
        visibility = View.VISIBLE
    }

    init {
        // Ensure useController is always false
        super.setUseController(SHOULD_USE_DEFAULT_CONTROLLER)

        // Automatically hide/show the overlay based on player controls visibility

        setControllerVisibilityListener(object : ControllerVisibilityListener {
            override fun onVisibilityChanged(visibility: Int) {
                // TODO: Fix multiple triggers
                Log.w("NBCCCC", "ISITSHOWING" + visibility.toString())
                onControllerVisibilityChanged(visibility)
            }
        })

        initUpNextOverlay()
    }

    // This function will be called when the visibility of the player controls changes
    private fun onControllerVisibilityChanged(controllerVisibility: Int) {
        val visible = controllerVisibility == View.VISIBLE

        // Fade in/out overlay
        overlayUpNextFrame?.apply {
            if (visible) {
                // Fade-in animation
                visibility = View.VISIBLE
                alpha = 0f
                animate()
                    .alpha(1f)
                    .setDuration(300) // Duration for fade-in
                    .start()
            } else {
                // Fade-out animation
                animate()
                    .alpha(0f)
                    .setDuration(300) // Duration for fade-out
                    .withEndAction {
                        // Once fade-out completes, set visibility to gone
                        visibility = View.GONE
                    }
                    .start()
            }
        }
    }

    // Prevent library from modifying our player control overrides:
    override fun setUseController(useController: Boolean) {
        super.setUseController(SHOULD_USE_DEFAULT_CONTROLLER)
    }

    // **** Customization **** //
    @SuppressLint("SetTextI18n")
    fun initUpNextOverlay(){
        // Create a FrameLayout to act as the overlay container
        overlayUpNextFrame = FrameLayout(context).apply {
            setBackgroundColor(Color.RED)
            visibility = View.VISIBLE
        }

        // Create an overlay button programmatically
        val overlayButton = Button(context).apply {
            text = "Overlay Button"
            visibility = View.VISIBLE // Initially visible
            setOnClickListener {
                // Create an AlertDialog builder
                Log.w("CUSTOMNBC", "ButtonPress")
            }
        }

        // Add the button to the overlay container
        val buttonParams = LayoutParams(
            LayoutParams.WRAP_CONTENT,
            LayoutParams.WRAP_CONTENT,
            Gravity.CENTER // Center the button inside the overlay
        )
        overlayUpNextFrame.addView(overlayButton, buttonParams)

        // Add the overlay frame to the PlayerView layout
        val overlayUpNextFrameParams = LayoutParams(
            LayoutParams.WRAP_CONTENT,
            LayoutParams.WRAP_CONTENT
        ).apply { setMargins(20, 20, 20, 20) }
        this.addView(overlayUpNextFrame, 1, overlayUpNextFrameParams)
    }
//
//    override fun setMediaSource(MediaSource mediaSource) {
//
//    }
}