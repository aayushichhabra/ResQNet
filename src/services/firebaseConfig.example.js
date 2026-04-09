import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
  apiKey: "abc",
  authDomain: "abc",
  projectId: "abc",
  storageBucket: "abc",
  messagingSenderId: "abc",
  appId: "abc",
  measurementId: "abc"
};

let app;
// Check if any Firebase apps have already been initialized
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // Use the existing app
}

// Initialize Auth with persistence
const auth = getAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { app, auth };