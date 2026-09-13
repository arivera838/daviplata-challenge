import CryptoJS from 'crypto-js';

// Llave de sesión compartida derivada (32 bytes = 256 bits)
// En producción se deriva mediante intercambio seguro; aquí usamos un secret compartido
const SECRET_KEY = CryptoJS.enc.Utf8.parse('12345678901234567890123456789012');

export function encryptPayload(data: object | string): string {
  const plainText = typeof data === 'string' ? data : JSON.stringify(data);
  const iv = CryptoJS.lib.WordArray.random(16);

  const encrypted = CryptoJS.AES.encrypt(plainText, SECRET_KEY, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  // Retorna IV:Payload en Base64 para que Android lo pueda desempaquetar
  return `${iv.toString(CryptoJS.enc.Base64)}:${encrypted.toString()}`;
}

export function decryptPayload(cipherTextWithIv: string): any {
  try {
    const parts = cipherTextWithIv.split(':');
    if (parts.length !== 2) throw new Error('Formato de cifrado inválido');

    const iv = CryptoJS.enc.Base64.parse(parts[0]);
    const cipherText = parts[1];

    const decrypted = CryptoJS.AES.decrypt(cipherText, SECRET_KEY, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const utf8Text = decrypted.toString(CryptoJS.enc.Utf8);
    return JSON.parse(utf8Text);
  } catch (err) {
    console.error('Error al descifrar payload:', err);
    return null;
  }
}