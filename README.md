# DaviPlata Brownfield Challenge - Secure Android & React Native

Aplicación móvil bancaria híbrida construida bajo una arquitectura **Brownfield** (React Native embebido en Android nativo). El proyecto implementa un esquema de seguridad multicapa con cifrado de extremo a extremo, gestión de sesión respaldada por hardware, navegación multi-bundle impulsada por intents y controles estrictos contra alteraciones del entorno.


---

## 🚀 Características Principales

1. **Navegación Multi-Bundle Nativa**: No utiliza navegación monolítica tradicional de JavaScript (`react-navigation`). Cada flujo (`LoginBundle`, `HomeBundle`, `TransferBundle`, `MovementsBundle`) se registra de forma desacoplada y se monta en `MainActivity` mediante Intents nativos de Android.
2. **Cifrado Extremo a Extremo en el Bridge**: Los datos sensibles (credenciales, montos, números de destino) viajan cifrados a través del puente (`React Native <-> Java/Kotlin`) mediante algoritmos simétricos compatibles.
3. **Persistencia Criptográfica**: Las sesiones y el historial de transacciones se almacenan en `EncryptedSharedPreferences` utilizando una clave maestra protegida en el **Android Keystore**.
4. **Control Estricto de TTL (Time-To-Live)**: Expiración de sesión temporal gobernada por el sistema operativo. Cualquier intento de navegación o consulta con sesión vencida purga los datos y expulsa al usuario al login.
5. **Detección Preventiva de Amenazas**: En `SplashActivity`, la app comprueba la presencia de binarios de Root (`su`) e indicios de emulación antes de autorizar la carga del runtime de React Native.
6. **Manejo Controlado de Errores**: Sin fugas de trazas internas ni fallos catastróficos no capturados; diálogos nativos contextuales e interacción defensiva.

---

## 💻 Pila Tecnológica

- **Frontend**: React Native, TypeScript, JavaScript Criptográfico (`crypto-js` / utilidades internas).
- **Backend Móvil / Host Nativo**: Android SDK (API 34+), Kotlin, Java Criptografía (`javax.crypto`, `KeyStore`).
- **Seguridad Android**: `androidx.security:security-crypto` (`EncryptedSharedPreferences`, `MasterKey`).
- **Empaquetado y Compilación**: Gradle 8+, R8/ProGuard para ofuscación y reducción de código muerto.

---

## 🏛️ Arquitectura del Sistema

La solución adopta un patrón **Clean Architecture / Brownfield Bridge**:

[ React Native Layer ]  -->  Cifrado de Payload (cryptoUtils)
│
▼
[ Native Bridge (SecurityBridgeModule) ]  -->  Validación de Sesión & Despacho
│
├─► Android Keystore / CryptoUtil (AES-256-GCM)
├─► SessionManager (EncryptedSharedPreferences + TTL)
└─► Navegación Nativa (MainActivity Intents con banderas de limpieza)

Cada bundle de React Native funciona como una vista aislada:
- **`LoginBundle`**: Solicita credenciales, genera el payload cifrado y lo envía a través de `SecurityBridge.sendNativeEvent('LOGIN_SUCCESS', encryptedData)`.
- **`HomeBundle`**: Descifra y muestra los datos del usuario, su saldo disponible y accesos directos.
- **`TransferBundle`**: Valida montos y destinatarios, cifra la transacción y la remite al nativo.
- **`MovementsBundle`**: Lee y descifra en tiempo real el historial de transferencias registradas en la sesión activa.

---

## 📁 Estructura del Proyecto

```text
├── android/
│   ├── app/
│   │   ├── build.gradle                 # Configuración de compilación, R8 y dependencias
│   │   ├── proguard-rules.pro           # Reglas de ofuscación para clases nativas y React
│   │   └── src/main/java/com/rnapp/
│   │       ├── CryptoUtil.kt            # Criptografía nativa (AES/GCM)
│   │       ├── MainActivity.kt          # Host nativo de React Native y router de bundles
│   │       ├── MainApplication.kt       # Inicialización del React Host y registro de paquetes
│   │       ├── SecurityBridgeModule.kt  # Puente de eventos seguros entre JS y Android
│   │       ├── SecurityBridgePackage.kt # Registro del módulo nativo en React Native
│   │       ├── SecurityCheckUtil.kt     # Utilidad de detección de Root y Emuladores
│   │       ├── SessionManager.kt        # Manejo de Keystore, TTL y EncryptedSharedPreferences
│   │       └── SplashActivity.kt        # Splash nativo animado con inspección de seguridad
├── src/
│   ├── modules/
│   │   ├── home/
│   │   │   └── HomeScreen.tsx           # HomeBundle: Balance y accesos directos
│   │   ├── login/
│   │   │   └── LoginScreen.tsx          # LoginBundle: Captura y cifrado de credenciales
│   │   ├── movements/
│   │   │   └── MovementsScreen.tsx      # MovementsBundle: Historial descifrado de transacciones
│   │   └── transfer/
│   │       └── TransferScreen.tsx       # TransferBundle: Formulario y envío de transferencias
│   └── crypto/
│   │   └── cryptoUtils.ts               # Utilidad de cifrado simétrico en JavaScript
│   └── bridge/
│       └── NativeBridge.ts              # Bridge entre React Native y Android
├── index.js                             # Registro de componentes (AppRegistry) para cada bundle
└── package.json

## 1. Instalar dependencias de Node
npm install

## 2. Crear el directorio de assets nativos si no existe
mkdir -p android/app/src/main/assets

## 3. Generar el bundle de React Native empaquetado
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

## 4. Compilar e instalar en el dispositivo o emulador
cd android
./gradlew clean
./gradlew installDebug
cd ..

## 5. Iniciar la app
npx react-native run-android
