package com.rnapp

import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import androidx.appcompat.app.AppCompatActivity
import com.rnapp.R

@SuppressLint("CustomSplashScreen")
class SplashActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)

        startSplashAnimation()
    }

    private fun startSplashAnimation() {
        val container = findViewById<View>(R.id.splashContainer)

        // Estado inicial de la animación
        container.alpha = 0f
        container.scaleX = 0.8f
        container.scaleY = 0.8f

        // Animación suave de entrada: Fade in + Zoom in
        container.animate()
            .alpha(1f)
            .scaleX(1.0f)
            .scaleY(1.0f)
            .setDuration(1200)
            .setInterpolator(AccelerateDecelerateInterpolator())
            .withEndAction {
                // Esperar 400ms adicionales para estabilidad visual antes de validar
                Handler(Looper.getMainLooper()).postDelayed({
                    if (performSecurityChecks()) {
                        proceedToNextScreen()
                    }
                }, 400)
            }
            .start()
    }

    private fun performSecurityChecks(): Boolean {
        // Validación Root
        if (SecurityCheckUtil.isDeviceRooted()) {
            showSecurityAlert(
                title = "Alerta de Seguridad",
                message = "Este dispositivo se encuentra rooteado. Por motivos de seguridad y protección de tus datos financieros, DaviPlata no puede ejecutarse en este entorno."
            )
            return false
        }

        // Validación Emulador (bloqueado en producción o si se desea forzar)
        val enforceEmulatorCheck = !BuildConfig.DEBUG
        if (enforceEmulatorCheck && SecurityCheckUtil.isEmulator()) {
            showSecurityAlert(
                title = "Entorno no permitido",
                message = "La aplicación no puede ejecutarse en dispositivos emulados o virtuales."
            )
            return false
        }

        return true
    }

    private fun showSecurityAlert(title: String, message: String) {
        AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setCancelable(false)
            .setPositiveButton("Salir") { _, _ ->
                finishAffinity() // Cierra la app y destruye la tarea
            }
            .show()
    }

    private fun proceedToNextScreen() {
        val sessionManager = SessionManager(this)
        val targetBundle = if (sessionManager.isSessionValid()) "HomeBundle" else "LoginBundle"

        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra("BUNDLE_NAME", targetBundle)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        startActivity(intent)
        finish()
    }
}