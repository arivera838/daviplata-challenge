/**
 * @format
 */
import 'react-native-get-random-values';

import { AppRegistry } from 'react-native';
import LoginScreen from './src/modules/login/LoginScreen';
import HomeScreen from './src/modules/home/HomeScreen';
import TransferScreen from './src/modules/transfer/TransferScreen';
import MovementsScreen from './src/modules/movements/MovementsScreen';

AppRegistry.registerComponent('LoginBundle', () => LoginScreen);
AppRegistry.registerComponent('HomeBundle', () => HomeScreen);
AppRegistry.registerComponent('TransferBundle', () => TransferScreen);
AppRegistry.registerComponent('MovementsBundle', () => MovementsScreen);