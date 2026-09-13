package com.rnapp

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String? {
        return intent?.getStringExtra("BUNDLE_NAME") ?: "LoginBundle"
    }

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        object : DefaultReactActivityDelegate(this, "dummy", fabricEnabled) {
            override fun getMainComponentName(): String {
                return this@MainActivity.intent?.getStringExtra("BUNDLE_NAME") ?: "LoginBundle"
            }

            override fun getLaunchOptions(): Bundle? {
                val encryptedData = this@MainActivity.intent?.getStringExtra("ENCRYPTED_DATA") ?: ""
                return Bundle().apply {
                    putString("encryptedPayload", encryptedData)
                }
            }
        }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        // Recrear la actividad para que monte el nuevo bundle con los nuevos launchOptions
        recreate()
    }
}