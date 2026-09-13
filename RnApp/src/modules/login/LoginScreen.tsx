import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeBridge, NativeEvents } from '../../bridge/NativeBridge';
import { v4 as uuidv4 } from 'uuid';

export interface Movements {
  id: string;
  type: string;
  title: string;
  destination: string;
  amount: number;
  timestamp: number;
}

export interface SessionPayload {
  sessionId: string;
  userId: string;
  name: string;
  phone: string;
  amount: number;
  expiresAt: string;
  movements?: Movements[];
}

const LoginScreen = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {

    if (!phone.trim() || !password.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    if (phone.length !== 10 || !phone.startsWith('3')) {
      Alert.alert('Número Inválido', 'El número de celular debe contener 10 dígitos y comenzar por 3.');
      return;
    }

    try {
      const sessionPayload = {
        sessionId: uuidv4(),
        userId: '12345',
        name: 'Usuario prueba',
        phone: phone,
        amount: 50000,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      };

      NativeBridge.sendEvent(NativeEvents.LOGIN_SUCCESS, sessionPayload);
    } catch (error) {
      console.error('Error al emitir evento:', error);
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
            {/* Header/Logo Section */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Bienvenido</Text>
              <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Celular</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu celular"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Clave</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ingresa tu clave"
                  placeholderTextColor="#999"
                  secureTextEntry
                  keyboardType="numeric"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

            </View>

            {/* Footer/Action Section */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  (!phone || !password) && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={!phone || !password}
              >
                <Text style={styles.loginButtonText}>Ingresar</Text>
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
  innerContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  headerContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 20,
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
    borderColor: '#E0E0E0',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
  },
  actionContainer: {
    paddingBottom: 40,
  },
  loginButton: {
    backgroundColor: '#007BFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#007BFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#80BDFF',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

});

export default LoginScreen;
