import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const findDriverDocByAuth = async (firebaseUser) => {
  if (!firebaseUser) return null;

  const uid = firebaseUser.uid;
  const email = firebaseUser.email;

  const queries = [
    firestore().collection("delivery_partners").where("uid", "==", uid).limit(1),
    firestore().collection("delivery_partners").where("email", "==", email).limit(1),
  ];

  for (const query of queries) {
    const snapshot = await query.get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
  }

  return null;
};

export default function DeliveryLoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanEmail = String(email || "").trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      Alert.alert("Missing details", "Please enter a valid email address.");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Missing password", "Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        cleanEmail,
        password.trim()
      );

      const firebaseUser = userCredential.user;
      const partner = await findDriverDocByAuth(firebaseUser);

      if (!partner) {
        Alert.alert(
          "Driver not found",
          "This email does not match a delivery partner in Firestore."
        );
        return;
      }

      if (Number(partner.status) === 0) {
        Alert.alert("Account disabled", "This delivery partner account is inactive.");
        return;
      }

      const driverProfile = {
        ...partner,
        uid: partner.uid || firebaseUser.uid,
        email: partner.email || firebaseUser.email,
        restaurant_id: partner.restaurant_id || partner.restaurantId || partner.restaurant,
        id: partner.id || partner.uid || firebaseUser.uid,
      };

      const token = await firebaseUser.getIdToken();
      await AsyncStorage.setItem("delivery_partner", JSON.stringify(driverProfile));
      await AsyncStorage.setItem("delivery_partner_token", token);

      navigation.replace("DeliveryHome", { partner: driverProfile });
    } catch (error) {
      const message = error?.message || "Unable to login right now.";
      Alert.alert("Login failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.background}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 18 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.centerWrap}>
              <View style={styles.topBar}>
                <TouchableOpacity
                  style={styles.backButton}
                  activeOpacity={0.8}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="arrow-back" size={22} color="#1f4d35" />
                </TouchableOpacity>
              </View>

              <View style={styles.logoWrap}>
                <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />
              </View>

              <View style={styles.headerWrap}>
                <Text style={styles.title}>Delivery Partner</Text>
                <Text style={styles.subtitle}>Sign in to manage orders</Text>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={18} color="#1f4d35" />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter email address"
                    placeholderTextColor="#88a796"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color="#1f4d35" />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter password"
                    placeholderTextColor="#88a796"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} activeOpacity={0.8}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#1f4d35" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                activeOpacity={0.9}
                onPress={handleLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#1a8b50", "#21a863", "#34c87c"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Continue</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.helperText}>Delivery access is only for authorised partners.</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  background: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  centerWrap: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    marginTop: -8,
  },
  topBar: {
    width: "100%",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f4f8f5",
    borderWidth: 1,
    borderColor: "#dfeee5",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: {
    width: 170,
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  logo: {
    width: 134,
    height: 134,
    borderRadius: 28,
  },
  headerWrap: {
    width: "100%",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0f2d20",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#587260",
  },
  fieldWrap: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#234b39",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5faf6",
    borderWidth: 1,
    borderColor: "#dfeee5",
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  prefix: {
    marginLeft: 8,
    marginRight: 2,
    fontSize: 15,
    fontWeight: "700",
    color: "#1f4d35",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#102a1d",
    paddingVertical: 12,
    paddingLeft: 6,
  },
  primaryBtn: {
    marginTop: 18,
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    alignSelf: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.8,
  },
  btnGradient: {
    width: "100%",
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    includeFontPadding: false,
  },
  helperText: {
    marginTop: 16,
    fontSize: 12,
    color: "#6f8d7d",
    textAlign: "center",
  },
});
