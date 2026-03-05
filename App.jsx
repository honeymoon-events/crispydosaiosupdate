// App.jsx
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StripeProvider } from "@stripe/stripe-react-native";

import SplashScreen from "./screens/SplashScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import Resturent from "./screens/Resturent.jsx";
import LoginScreen from "./screens/LoginScreen.jsx";
import SignupScreen from "./screens/SignupScreen.jsx";
import NetworkErrorScreen from "./screens/NetworkErrorScreen.jsx";
import Categories from "./screens/categories";
import Products from "./screens/Products";
import Credits from "./screens/Credits";
import CartSummary from "./screens/CartSummary.jsx";
import CheckoutScreen from "./screens/CheckoutScreen.jsx";
import Orders from "./screens/Orders.jsx";
import Profile from "./screens/Profile.jsx";
import PaymentHistory from "./screens/PaymentHistory.jsx";
import FAQ from "./screens/FAQ.jsx";
import InviteFriends from "./screens/InviteFriends.jsx";
import EditProfile from "./screens/EditProfile.jsx";
import HelpCenter from "./screens/HelpCenter.jsx";
import Notifications from "./screens/Notifications.jsx";
import PrivacyPolicyScreen from "./screens/PrivacyPolicyScreen.jsx";
import TermsConditionsScreen from "./screens/TermsConditionsScreen.jsx";

const Stack = createNativeStackNavigator();

export default function App() {
  const [isOffline, setIsOffline] = useState(false);
  const [stripeKey, setStripeKey] = useState("");

  // ===============================
  // 🔑 STRIPE DYNAMIC KEY
  // ===============================
  useEffect(() => {
    global.updateStripeKey = (newKey) => {
      setStripeKey(newKey);
    };
  }, []);

  // ===============================
  // 🌐 NETWORK STATUS
  // ===============================
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // ===============================
  // ❌ OFFLINE SCREEN
  // ===============================
  if (isOffline) {
    return (
      <SafeAreaProvider>
        <NetworkErrorScreen />
      </SafeAreaProvider>
    );
  }

  // ===============================
  // 🚀 MAIN APP
  // ===============================

  return (
    <StripeProvider publishableKey={stripeKey}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Resturent" component={Resturent} />
            <Stack.Screen name="Categories" component={Categories} />
            <Stack.Screen name="Products" component={Products} />
            <Stack.Screen name="CartSummary" component={CartSummary} />
            <Stack.Screen name="CheckoutScreen" component={CheckoutScreen} />
            <Stack.Screen name="Orders" component={Orders} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="Credits" component={Credits} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="PaymentHistory" component={PaymentHistory} />
            <Stack.Screen name="FAQ" component={FAQ} />
            <Stack.Screen name="InviteFriends" component={InviteFriends} />
            <Stack.Screen name="EditProfile" component={EditProfile} />
            <Stack.Screen name="HelpCenter" component={HelpCenter} />
            <Stack.Screen name="Notifications" component={Notifications} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </StripeProvider>
  );
}