package host.exp.exponent.notifications

import android.content.Intent

interface IntentProvider {
  fun provide(): Intent
}
