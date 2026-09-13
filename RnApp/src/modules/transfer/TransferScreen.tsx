import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  NativeModules,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { decryptPayload, encryptPayload } from '../../crypto/cryptoUtils';
import { SessionPayload } from '../login/LoginScreen';
import { NativeEvents } from '../../bridge/NativeBridge';

const SecurityBridge =
  NativeModules.SecurityBridge ?? NativeModules.SecurityBridgeModule;


const TransferScreen = () => {
  const [destinationNumber, setDestinationNumber] = useState('');
  const [currentUserPhone, setCurrentUserPhone] = useState('');
  const [amount, setAmount] = useState('');

  const redirectToLogin = () => {
    SecurityBridge.sendNativeEvent(NativeEvents.LOGOUT, '');
  };

  useEffect(() => {
    // Validar sesión al montar y extraer teléfono del titular
    SecurityBridge?.getEncryptedSession?.()
      .then((encryptedSession: string) => {
        if (!encryptedSession) {
          redirectToLogin();
          return;
        }
        const decryptedString = decryptPayload(encryptedSession);
        setCurrentUserPhone(decryptedString?.phone || '');
      })
      .catch(() => {
        redirectToLogin();
      });
  }, []);

  const handleTransfer = async () => {
    Keyboard.dismiss();
    const cleanNumber = destinationNumber.trim();
    const numericAmount = parseFloat(amount.trim());

    if (cleanNumber.length !== 10 || !cleanNumber.startsWith('3')) {
      Alert.alert('Número Inválido', 'El número de celular debe contener 10 dígitos y comenzar por 3.');
      return;
    }

    if (currentUserPhone && cleanNumber === currentUserPhone) {
      Alert.alert('Operación no permitida', 'No puedes transferir dinero a tu propio número.');
      return;
    }

    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Monto Inválido', 'Ingresa un monto superior a $0.');
      return;
    }

    try {
      const transactionPayload = {
        sourcePhone: currentUserPhone,
        destinationPhone: cleanNumber,
        amount: numericAmount,
        timestamp: Date.now(),
      };

      const encryptedPayload = encryptPayload(JSON.stringify(transactionPayload));

      if (SecurityBridge?.sendNativeEvent) {
        SecurityBridge.sendNativeEvent(NativeEvents.PROCESS_TRANSFER, encryptedPayload);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la transferencia con seguridad.');
    }
  };

  const handleBackToHome = () => {
    if (SecurityBridge?.sendNativeEvent) {
      SecurityBridge.sendNativeEvent(NativeEvents.GO_HOME, '');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            <View style={styles.headerContainer}>
              <TouchableOpacity
                onPress={handleBackToHome}>
                <Text style={styles.backButton}> Atras</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Transferir Dinero</Text>
              <Text style={styles.subtitle}>
                Ingresa los datos del destinatario
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Número destino</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 3001234567"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={destinationNumber}
                  onChangeText={setDestinationNumber}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Monto a transferir</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 50000"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>
            </View>

            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[
                  styles.transferButton,
                  (!destinationNumber || !amount) && styles.transferButtonDisabled,
                ]}
                onPress={handleTransfer}
                disabled={!destinationNumber || !amount}
              >
                <Text style={styles.transferButtonText}>Confirmar Transferencia</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    backgroundColor: '#007BFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  actionContainer: {
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  transferButton: {
    backgroundColor: '#007BFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  transferButtonDisabled: {
    backgroundColor: '#80BDFF',
    shadowOpacity: 0,
    elevation: 0,
  },
  transferButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TransferScreen;
