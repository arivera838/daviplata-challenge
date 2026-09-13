package com.rnapp

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class SessionManager(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        context,
        "secure_user_session",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveSession(sessionJson: String) {
        prefs.edit().putString("active_session", sessionJson).apply()
    }

    fun getSession(): JSONObject? {
        val raw = prefs.getString("active_session", null) ?: return null
        return try {
            JSONObject(raw)
        } catch (e: Exception) {
            null
        }
    }

    fun isSessionValid(): Boolean {
        val session = getSession() ?: return false
        val expiresAtStr = session.optString("expiresAt", "")
        if (expiresAtStr.isEmpty()) return false

        return try {
            val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
            val expiresAt = format.parse(expiresAtStr) ?: return false
            Date().before(expiresAt)
        } catch (e: Exception) {
            false
        }
    }

    fun clearSession() {
        prefs.edit().remove("active_session").apply()
    }
}