import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ListRenderItem,
  NativeModules,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeEvents } from '../../bridge/NativeBridge';
import { Movements, SessionPayload } from '../login/LoginScreen';
import { decryptPayload } from '../../crypto/cryptoUtils';


const SecurityBridge =
  NativeModules.SecurityBridge ?? NativeModules.SecurityBridgeModule;


const MovementsScreen: React.FC = ({
}) => {
  const [movements, setMovements] = useState([] as Movements[]);
  const redirectToLogin = () => {
    SecurityBridge.sendNativeEvent(NativeEvents.LOGOUT, '');
  };

  useEffect(() => {
    SecurityBridge.getEncryptedSession()
      .then((encryptedSession: any) => {
        if (!encryptedSession) {
          console.warn('Acceso denegado: HomeBundle montado sin sesión válida');
          redirectToLogin();
          return;
        }
        const decryptedString = decryptPayload(encryptedSession);

        if (decryptedString?.movements) {
          setMovements(decryptedString?.movements);
        }
      })
      .catch(() => {
        console.warn('Acceso denegado: HomeBundle montado sin sesión válida');
        redirectToLogin();
      });
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CO');
  };

  const renderItem: ListRenderItem<Movements> = ({ item }) => {
    const isOutgoing = item?.type === 'TRANSFER_OUT';
    const amountPrefix = !isOutgoing ? '+' : '-';
    // Green for incoming money, dark gray for outgoing
    const amountColor = !isOutgoing ? '#28A745' : '#901313';

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <Text style={styles.transactionDescription}>
            {isOutgoing ? 'La transferencia fue para: ' : 'La transferencia vino de: '}
            {item.destination}
          </Text>
          <Text style={styles.transactionDate}>{formatDate(item.timestamp as any) + ' ' + new Date(item.timestamp).toLocaleTimeString('es-CO')}</Text>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>
            {amountPrefix}${item.amount.toLocaleString('es-CO')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => {
              SecurityBridge.sendNativeEvent(NativeEvents.GO_HOME, '');
            }}>
            <Text style={styles.backButton}> Atras</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Movimientos</Text>
          <Text style={styles.subtitle}>Revisa tus últimas transacciones</Text>
        </View>

        <View style={styles.listContainer}>
          <FlatList
            data={movements}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No tienes movimientos recientes.</Text>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
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
  listContainer: {
    flex: 1,
    marginTop: -20, // Negative margin to bring the list up over the header slightly
  },
  flatListContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionLeft: {
    flex: 1,
    paddingRight: 16,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#999999',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
});

export default MovementsScreen;
