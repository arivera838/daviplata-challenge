package com.rnapp

import android.util.Base64
import java.nio.charset.StandardCharsets
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

object CryptoUtil {
    private const val ALGORITHM = "AES/CBC/PKCS7Padding"
    // Misma clave de 32 bytes
    private val KEY_BYTES = "12345678901234567890123456789012".toByteArray(StandardCharsets.UTF_8)
    private val secretKeySpec = SecretKeySpec(KEY_BYTES, "AES")

    fun decrypt(encryptedWithIv: String): String {
        val parts = encryptedWithIv.split(":")
        require(parts.size == 2) { "Formato cifrado inválido" }

        val iv = Base64.decode(parts[0], Base64.NO_WRAP)
        val cipherData = Base64.decode(parts[1], Base64.NO_WRAP)

        val cipher = Cipher.getInstance(ALGORITHM)
        cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, IvParameterSpec(iv))
        val original = cipher.doFinal(cipherData)
        return String(original, StandardCharsets.UTF_8)
    }

    fun encrypt(plainText: String): String {
        val cipher = Cipher.getInstance(ALGORITHM)
        cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec)
        val iv = cipher.iv
        val encryptedBytes = cipher.doFinal(plainText.toByteArray(StandardCharsets.UTF_8))

        val ivBase64 = Base64.encodeToString(iv, Base64.NO_WRAP)
        val cipherBase64 = Base64.encodeToString(encryptedBytes, Base64.NO_WRAP)
        return "$ivBase64:$cipherBase64"
    }
}