/**
 * @format
 */

import { AppRegistry } from 'react-native';
import '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';
import '@react-native-firebase/functions';
import '@react-native-firebase/messaging';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

messaging().setBackgroundMessageHandler(async remoteMessage => {
	console.log('FCM Background/Quit', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
