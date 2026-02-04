package host.exp.exponent.brownfield.test.android

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        findViewById<Button>(R.id.openReactNativeButton).setOnClickListener {
            startActivity(Intent(this, ReactNativeActivity::class.java))
        }
    }
}
