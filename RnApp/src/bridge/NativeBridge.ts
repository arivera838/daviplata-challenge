import { NativeModules, NativeEventEmitter } from 'react-native';
import { encryptPayload, decryptPayload } from '../crypto/cryptoUtils';

const { SecurityBridgeModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(SecurityBridgeModule);

export enum NativeEvents {
  LOGOUT = 'LOGOUT',
  OPEN_TRANSFER = 'OPEN_TRANSFER',
  OPEN_MOVEMENTS = 'OPEN_MOVEMENTS',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  GO_HOME = 'GO_HOME',
  PROCESS_TRANSFER = 'PROCESS_TRANSFER',
}

export const NativeBridge = {
  sendEvent(eventName: NativeEvents, payload: object = {}) {
    const encrypted = encryptPayload(payload);
    SecurityBridgeModule.sendNativeEvent(eventName, encrypted);
  },

  async getActiveSession(): Promise<any> {
    try {
      const encrypted = await SecurityBridgeModule.getEncryptedSession();
      return decryptPayload(encrypted);
    } catch {
      return null;
    }
  },

  onSessionExpired(callback: () => void) {
    return eventEmitter.addListener('SESSION_EXPIRED', callback);
  },
};