# 🧪 Evidencia de Pruebas (QA & Security)

Este documento recopila las pruebas de aceptación, casos de borde y validaciones de seguridad ejecutadas en la aplicación, garantizando que el diseño arquitectónico de **Brownfield Seguro** funciona de manera óptima tanto en la lógica de negocio como en la criptografía en tránsito.

---

## 1. Pruebas de Seguridad Nativa (Splash Screen)

| Escenario de Prueba | Acción Realizada | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- |
| **Detección de Dispositivo Rooteado** | Iniciar app en dispositivo con binarios `su` (`/system/app/Superuser.apk`, etc). | Despliega `AlertDialog` nativo de "Alerta de Seguridad". Bloquea el inicio de React Native y obliga a salir (`finishAffinity()`). | ✅ Exitoso |
| **Detección de Emulador (Modo Release)** | Compilar en Release (`BuildConfig.DEBUG = false`) e iniciar en Emulador x86. | Despliega `AlertDialog` de "Entorno no permitido". Bloquea inicio de la app. | ✅ Exitoso |
| **Inicio en Dispositivo Limpio** | Iniciar la app en un entorno sin root (Happy path). | La animación ocurre suavemente y delega la responsabilidad a `SessionManager` para saber si abrir Login o Home. | ✅ Exitoso |

---

## 2. Pruebas de Autenticación y Bridge (LoginBundle)

| Escenario de Prueba | Acción Realizada | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- |
| **Login Exitoso** | Ingresar un celular válido (Ej: `3123456789`) y contraseña. | El JS emite `sendNativeEvent('LOGIN_SUCCESS', encryptedData)`. Kotlin descifra, guarda en el Keystore y lanza el `HomeBundle` nativamente. | ✅ Exitoso |
| **Campos Vacíos** | Presionar "Ingresar" sin completar el celular o la contraseña. | Muestra alerta local en JS: "Todos los campos son obligatorios" y evita llamar al puente nativo. | ✅ Exitoso |
| **Validación de Número** | Ingresar celular que no empiece por 3, o que tenga menos de 10 dígitos. | Muestra alerta local en JS indicando el formato incorrecto. No se invoca el `SecurityBridgeModule`. | ✅ Exitoso |

---

## 3. Pruebas de Flujo Transaccional (TransferBundle)

| Escenario de Prueba | Acción Realizada | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- |
| **Transferencia Exitosa (Happy Path)** | Transferir monto válido a destino válido (ej. $10,000 teniendo $50,000 de saldo). | Despliega `AlertDialog` Nativo de "Transacción Exitosa", mostrando el saldo remanente. Redirige automáticamente al `HomeBundle`. | ✅ Exitoso |
| **Fondos Insuficientes** | Intentar transferir un monto mayor al saldo disponible. | Kotlin (`SecurityBridgeModule`) evalúa el estado, detiene la transacción y despliega `AlertDialog` nativo de "Fondos Insuficientes". | ✅ Exitoso |
| **Transferencia a Sí Mismo** | Ingresar el mismo número con el que se hizo login. | El JS bloquea la solicitud y muestra alerta de "Operación no permitida". | ✅ Exitoso |
| **Monto Inválido ($0 o texto)** | Ingresar un monto `<= 0` o un valor no numérico. | El JS bloquea la solicitud indicando monto inválido. | ✅ Exitoso |

---

## 4. Persistencia y Sincronización (HomeBundle & MovementsBundle)

| Escenario de Prueba | Acción Realizada | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- |
| **Reflejo de Nuevo Saldo** | Ir al `HomeBundle` tras realizar una transferencia exitosa. | El payload descifrado en el `HomeBundle` expone el saldo descontado exactamente como lo calculó la capa Nativa en el paso anterior. | ✅ Exitoso |
| **Historial de Movimientos** | Abrir `MovementsBundle` tras realizar una transacción. | El array de movimientos incluye el nuevo ítem marcado como `TRANSFER_OUT` en color rojo y con el timestamp real de la transacción. | ✅ Exitoso |
| **Persistencia de Sesión (Cold Start)** | Matar la aplicación desde el gestor de tareas del dispositivo y volver a abrirla. | El `SplashActivity` evalúa `SessionManager.isSessionValid()`. Al estar vigente, lanza directo el `HomeBundle` evitando el login. | ✅ Exitoso |

---

## 5. Control de Expiración y Seguridad (TTL)

| Escenario de Prueba | Acción Realizada | Resultado Esperado | Estado |
| :--- | :--- | :--- | :--- |
| **Cierre de Sesión Manual** | Presionar el botón "Cerrar Sesión" desde el `HomeBundle`. | Kotlin invoca `clearSession()` purgando el SharedPreferences seguro y redirecciona el Intent hacia el `LoginBundle`. | ✅ Exitoso |
| **Intento de Operación con Sesión Inválida** | Modificar los milisegundos de la fecha de expiración en código o emular inactividad, para luego intentar abrir Transferencias. | Kotlin rechaza el `Intent`, purga la sesión y emite `emitSessionExpired()`. El frontend redirecciona forzosamente al Login. | ✅ Exitoso |
| **Inyección de Payload (Interceptación Bridge)** | Intentar enviar texto plano a `sendNativeEvent` (`{ "userId": "hack" }`) saltándose la encriptación JS. | El `CryptoUtil.decrypt()` en Android falla (lanza excepción) porque el string carece del Vector de Inicialización (IV) requerido por `AES/CBC/PKCS7Padding`. Transacción denegada. | ✅ Exitoso |

---

## 📊 Conclusiones Técnicas
La separación estricta entre la UI (React Native) y la lógica financiera (Kotlin/Android) garantiza que si la capa de JavaScript es comprometida o manipulada, el estado contable y la autorización seguirán bajo el resguardo de la máquina virtual de Android y el **Android Keystore**, bloqueando exitosamente cualquier transferencia que viole el flujo de negocio.
