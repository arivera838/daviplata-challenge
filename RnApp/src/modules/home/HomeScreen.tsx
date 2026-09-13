import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  NativeModules,
  DeviceEventEmitter,
  Alert,
} from 'react-native';
import { decryptPayload } from '../../crypto/cryptoUtils';
import { SessionPayload } from '../login/LoginScreen';
import { NativeEvents } from '../../bridge/NativeBridge';

const SecurityBridge =
  NativeModules.SecurityBridge ?? NativeModules.SecurityBridgeModule;

export default function Home(props: any) {
  const { encryptedPayload } = props;

  const [userData, setUserData] = useState<SessionPayload | null>(null);
  const [errorDescifrado, setErrorDescifrado] = useState<string>('');

  const redirectToLogin = () => {
    SecurityBridge.sendNativeEvent(NativeEvents.LOGOUT, '');
  };

  useEffect(() => {
    SecurityBridge.getEncryptedSession()
      .then((session: any) => {
        if (!session) {
          console.warn('Acceso denegado: HomeBundle montado sin sesión válida');
          redirectToLogin();
          return;
        }
        const decryptedString = decryptPayload(session);
        setUserData(decryptedString);
      })
      .catch(() => {
        console.warn('Acceso denegado: HomeBundle montado sin sesión válida');
        redirectToLogin();
      });
  }, []);

  useEffect(() => {
    if (encryptedPayload) {
      try {

        const subscription = DeviceEventEmitter.addListener('SESSION_EXPIRED', () => {
          Alert.alert(
            'Sesión Expirada',
            'Tu sesión ha finalizado por inactividad o seguridad. Por favor ingresa nuevamente.',
            [{ text: 'Aceptar', onPress: redirectToLogin }],
            { cancelable: false }
          );
        });

        const decryptedString = decryptPayload(encryptedPayload);
        setUserData(decryptedString);

        return () => {
          subscription.remove();
        };
      } catch (error: any) {
        console.error('Error al descifrar con cryptoUtils:', error);
        setErrorDescifrado('No fue posible descifrar la información del usuario');
      }
    } else {
      setUserData(null);
      SecurityBridge.sendNativeEvent('LOGOUT', '');
    }
  }, [encryptedPayload]);

  const handleLogout = async () => {
    try {
      SecurityBridge.sendNativeEvent('LOGOUT', '');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleAction = (actionName: string) => {
    console.log(`Acceso seleccionado: ${actionName}`);
    if (SecurityBridge?.sendNativeEvent) {
      if (actionName === 'Transferencias') {
        SecurityBridge.sendNativeEvent('OPEN_TRANSFER', '');
      } else if (actionName === 'Movimientos') {
        SecurityBridge.sendNativeEvent('OPEN_MOVEMENTS', '');
      }
    }
  };

  // Mapeo flexible según las claves que use tu payload de Login
  const displayUser = userData?.name
  const displayPhone = userData?.phone;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Home</Text>
          <Text style={styles.subtitle}>Sesión iniciada con éxito</Text>
        </View>

        {/* Tarjeta con la información descifrada */}
        <View style={styles.userCard}>
          <Text style={styles.userCardTitle}>Información del Usuario</Text>

          {errorDescifrado ? (
            <Text style={styles.errorText}>{errorDescifrado}</Text>
          ) : (
            <View style={styles.dataContainer}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Usuario:</Text>
                <Text style={styles.dataValue}>{displayUser}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Número / Celular:</Text>
                <Text style={styles.dataValueBold}>{displayPhone}</Text>
              </View>

              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Saldo Disponible:</Text>
                <Text style={styles.dataValueBold}>${userData?.amount}</Text>
              </View>

              {userData?.expiresAt && (
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Hora en que expira la sesión:</Text>
                  <Text style={styles.dataValue}>
                    {new Date(userData.expiresAt).toLocaleTimeString()}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Payload encriptado tal como viajó por el bridge */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Payload Encriptado Recibido:</Text>
          <Text style={styles.payloadText}>
            {encryptedPayload ? encryptedPayload : 'No se recibió información encriptada'}
          </Text>
        </View>

        {/* Botones de acceso rápido */}
        <Text style={styles.sectionTitle}>Accesos Directos</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAction('Transferencias')}
            activeOpacity={0.8}>
            <Text style={styles.actionIcon}>💸</Text>
            <Text style={styles.actionLabel}>Transferir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAction('Movimientos')}
            activeOpacity={0.8}>
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionLabel}>Movimientos</Text>
          </TouchableOpacity>
        </View>

        {/* Botón de Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 20,
    paddingTop: 50,
    flexGrow: 1,
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  userCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  dataContainer: {
    gap: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  dataValueBold: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  payloadText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#334155',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 6,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});