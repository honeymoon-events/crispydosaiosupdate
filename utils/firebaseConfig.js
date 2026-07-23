import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';
import '@react-native-firebase/messaging';
import '@react-native-firebase/functions';

export const initializeFirebase = async () => {
  try {
    firebase.app();
    return true;
  } catch (error) {
    console.error('Firebase initialization failed:', error.message);
    return false;
  }
};
