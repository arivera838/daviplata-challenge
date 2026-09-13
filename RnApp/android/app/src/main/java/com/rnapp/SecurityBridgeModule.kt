package com.rnapp

import android.app.Activity
import android.app.AlertDialog
import android.content.Intent
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject
import java.text.NumberFormat
import java.util.Locale

class SecurityBridgeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "SecurityBridgeModule"
        private const val ERROR_GENERIC = "Ha ocurrido un error al procesar la solicitud."
    }

    override fun getName(): String = "SecurityBridgeModule"

    private fun getValidActivity(): Activity? {
        val activity = reactContext.currentActivity
        return if (activity != null && !activity.isFinishing && !activity.isDestroyed) {
            activity
        } else {
            null
        }
    }

    private fun showSafeAlert(title: String, message: String) {
        val activity = getValidActivity() ?: return
        activity.runOnUiThread {
            try {
                AlertDialog.Builder(activity)
                    .setTitle(title)
                    .setMessage(message)
                    .setPositiveButton("Entendido", null)
                    .show()
            } catch (e: Exception) {
                Log.e(TAG, "No se pudo desplegar el diálogo de error", e)
            }
        }
    }

    private fun navigateToLogin() {
        val activity = getValidActivity()
        val intent = Intent(activity ?: reactContext, MainActivity::class.java).apply {
            putExtra("BUNDLE_NAME", "LoginBundle")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        if (activity != null) {
            activity.startActivity(intent)
            activity.finish()
        } else {
            reactContext.startActivity(intent)
        }
    }

    private fun emitSessionExpired() {
        try {
            val sessionManager = SessionManager(reactContext)
            sessionManager.clearSession()
        } catch (e: Exception) {
            Log.e(TAG, "Error purgando sesión en expiración", e)
        }

        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit("SESSION_EXPIRED", null)
        } catch (e: Exception) {
            Log.w(TAG, "No se pudo emitir SESSION_EXPIRED a JavaScript", e)
        }

        navigateToLogin()
    }

    @ReactMethod
    fun sendNativeEvent(eventName: String, encryptedPayload: String) {
        val sessionManager = SessionManager(reactContext)

        try {
            when (eventName) {
                "LOGIN_SUCCESS" -> {
                    val plainJson = CryptoUtil.decrypt(encryptedPayload)
                    sessionManager.saveSession(plainJson)

                    val activity = getValidActivity()
                    if (activity != null) {
                        val intent = Intent(activity, MainActivity::class.java).apply {
                            putExtra("BUNDLE_NAME", "HomeBundle")
                            putExtra("ENCRYPTED_DATA", encryptedPayload)
                            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                        }
                        activity.startActivity(intent)
                    } else {
                        val intent = Intent(reactContext, MainActivity::class.java).apply {
                            putExtra("BUNDLE_NAME", "HomeBundle")
                            putExtra("ENCRYPTED_DATA", encryptedPayload)
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                        }
                        reactContext.startActivity(intent)
                    }
                }

                "GO_HOME" -> {
                    if (sessionManager.isSessionValid()) {
                        val activity = getValidActivity()
                        val currentSessionRaw = sessionManager.getSession()?.toString() ?: "{}"
                        val sessionJson = JSONObject(currentSessionRaw)
                        val encryptedData = CryptoUtil.encrypt(sessionJson.toString())

                        if (activity != null) {
                            val intent = Intent(activity, MainActivity::class.java).apply {
                                putExtra("BUNDLE_NAME", "HomeBundle")
                                putExtra("ENCRYPTED_DATA", encryptedData)
                                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                            }
                            activity.startActivity(intent)
                        } else {
                            val intent = Intent(reactContext, MainActivity::class.java).apply {
                                putExtra("BUNDLE_NAME", "HomeBundle")
                                putExtra("ENCRYPTED_DATA", encryptedData)
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                            }
                            reactContext.startActivity(intent)
                        }
                    } else {
                        emitSessionExpired()
                    }
                }

                "OPEN_TRANSFER" -> {
                    if (sessionManager.isSessionValid()) {
                        val currentSessionRaw = sessionManager.getSession()?.toString() ?: "{}"
                        val sessionJson = JSONObject(currentSessionRaw)
                        val encryptedData = CryptoUtil.encrypt(sessionJson.toString())

                        val activity = getValidActivity()
                        if (activity != null) {
                            val intent = Intent(activity, MainActivity::class.java).apply {
                                putExtra("BUNDLE_NAME", "TransferBundle")
                                putExtra("ENCRYPTED_DATA", encryptedData)
                            }
                            activity.startActivity(intent)
                        } else {
                            val intent = Intent(reactContext, MainActivity::class.java).apply {
                                putExtra("BUNDLE_NAME", "TransferBundle")
                                putExtra("ENCRYPTED_DATA", encryptedData)
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                            }
                            reactContext.startActivity(intent)
                        }
                    } else {
                        emitSessionExpired()
                    }
                }

                "OPEN_MOVEMENTS" -> {
                    if (sessionManager.isSessionValid()) {
                        val activity = getValidActivity()
                        val currentSessionRaw = sessionManager.getSession()?.toString() ?: "{}"
                        val sessionJson = JSONObject(currentSessionRaw)
                        val encryptedData = CryptoUtil.encrypt(sessionJson.toString())

                        if (activity != null) {
                            val intent = Intent(activity, MainActivity::class.java).apply {
                                putExtra("BUNDLE_NAME", "MovementsBundle")
                                putExtra("ENCRYPTED_DATA", encryptedData)
                            }
                            activity.startActivity(intent)
                        } else {
                            val intent = Intent(reactContext, MainActivity::class.java).apply {
                                putExtra("BUNDLE_NAME", "MovementsBundle")
                                putExtra("ENCRYPTED_DATA", encryptedData)
                                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                            }
                            reactContext.startActivity(intent)
                        }
                    } else {
                        emitSessionExpired()
                    }
                }

                "LOGOUT" -> {
                    sessionManager.clearSession()
                    navigateToLogin()
                }

                "PROCESS_TRANSFER" -> {
                    if (sessionManager.isSessionValid()) {
                        try {
                            val plainJson = CryptoUtil.decrypt(encryptedPayload)
                            val jsonObject = JSONObject(plainJson)
                            val destinationPhone = jsonObject.optString(
                                "destinationPhone",
                                jsonObject.optString("destinationNumber", "N/A")
                            )
                            val amount = jsonObject.optDouble("amount", 0.0)

                            val currentSessionRaw = sessionManager.getSession()?.toString() ?: "{}"
                            val sessionJson = JSONObject(currentSessionRaw)
                            val currentBalance = sessionJson.optDouble(
                                "balance",
                                sessionJson.optDouble("amount", 0.0)
                            )

                            val activity = getValidActivity()

                            if (currentBalance < amount) {
                                activity?.runOnUiThread {
                                    AlertDialog.Builder(activity)
                                        .setTitle("Fondos Insuficientes")
                                        .setMessage("No cuentas con saldo suficiente para realizar esta transferencia.")
                                        .setPositiveButton("Aceptar", null)
                                        .show()
                                }
                                return
                            }

                            val newBalance = currentBalance - amount

                            sessionJson.put("balance", newBalance)
                            sessionJson.put("amount", newBalance)

                            val movementsArray = sessionJson.optJSONArray("movements") ?: JSONArray()
                            val newMovement = JSONObject().apply {
                                put("id", "TX-${System.currentTimeMillis()}")
                                put("type", "TRANSFER_OUT")
                                put("title", "Transferencia a $destinationPhone")
                                put("destination", destinationPhone)
                                put("amount", amount)
                                put("timestamp", System.currentTimeMillis())
                            }

                            movementsArray.put(newMovement)
                            sessionJson.put("movements", movementsArray)

                            val updatedSessionString = sessionJson.toString()
                            sessionManager.saveSession(updatedSessionString)

                            val newEncryptedPayload = CryptoUtil.encrypt(updatedSessionString)

                            val currencyFormat = NumberFormat.getCurrencyInstance(Locale("es", "CO")).apply {
                                maximumFractionDigits = 0
                            }
                            val formattedTransfer = currencyFormat.format(amount)
                            val formattedNewBalance = currencyFormat.format(newBalance)

                            val messageText = """
                                Transferencia procesada de forma segura por el módulo nativo.
                                
                                Destino: $destinationPhone
                                Monto transferido: $formattedTransfer
                                Nuevo saldo disponible: $formattedNewBalance
                            """.trimIndent()

                            activity?.runOnUiThread {
                                AlertDialog.Builder(activity)
                                    .setTitle("Transacción Exitosa")
                                    .setMessage(messageText)
                                    .setCancelable(false)
                                    .setPositiveButton("Aceptar") { dialog, _ ->
                                        dialog.dismiss()

                                        val intent = Intent(activity, MainActivity::class.java).apply {
                                            putExtra("BUNDLE_NAME", "HomeBundle")
                                            putExtra("ENCRYPTED_DATA", newEncryptedPayload)
                                            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                                        }
                                        activity.startActivity(intent)
                                    }
                                    .show()
                            }

                        } catch (e: Exception) {
                            Log.e(TAG, "Error procesando transferencia", e)
                            showSafeAlert(
                                "Error en Transacción",
                                "No se pudo procesar la transferencia de forma segura."
                            )
                        }
                    } else {
                        emitSessionExpired()
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Excepción no controlada en sendNativeEvent [$eventName]", e)
            showSafeAlert("Error de Aplicación", ERROR_GENERIC)
        }
    }

    @ReactMethod
    fun getEncryptedSession(promise: Promise) {
        try {
            val sessionManager = SessionManager(reactContext)
            if (!sessionManager.isSessionValid()) {
                promise.reject("SESSION_INVALID", "No hay sesión activa o ha expirado")
                return
            }

            val session = sessionManager.getSession()
            if (session != null) {
                val encrypted = CryptoUtil.encrypt(session.toString())
                promise.resolve(encrypted)
            } else {
                promise.reject("SESSION_EMPTY", "No se encontraron datos en la sesión activa")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Fallo al obtener sesión cifrada", e)
            promise.reject("CRYPTO_ERROR", "Error de seguridad al acceder a la sesión")
        }
    }

    @ReactMethod
    fun getEncryptedMovements(promise: Promise) {
        try {
            val sessionManager = SessionManager(reactContext)
            if (!sessionManager.isSessionValid()) {
                promise.reject("SESSION_INVALID", "No hay sesión activa o ha expirado")
                return
            }

            val session = sessionManager.getSession()
            val movementsArray = session?.optJSONArray("movements") ?: JSONArray()
            val encrypted = CryptoUtil.encrypt(movementsArray.toString())
            promise.resolve(encrypted)
        } catch (e: Exception) {
            Log.e(TAG, "Fallo al obtener movimientos cifrados", e)
            promise.reject("MOVEMENTS_ERROR", "No fue posible leer el historial seguro")
        }
    }
}