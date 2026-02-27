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
  Modal,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginUser } from "../services/authService";

const { width } = Dimensions.get("window");
const scale = width / 400;

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  // Premium Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [alertType, setAlertType] = useState("info");
  const alertScale = React.useRef(new Animated.Value(0)).current;

  const showPremiumAlert = (title, msg, type = "info") => {
    setAlertTitle(title);
    setAlertMsg(msg);
    setAlertType(type);
    setAlertVisible(true);
    Animated.spring(alertScale, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Auto dismiss for success/error
    if (type === "success" || type === "error") {
      setTimeout(() => hidePremiumAlert(), 2500);
    }
  };

  const hidePremiumAlert = () => {
    Animated.timing(alertScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setAlertVisible(false));
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showPremiumAlert("Error", "Please enter Email / Mobile Number and Password", "error");
      return;
    }

    // 🔥 Detect if input is valid email or mobile number
    const trimmed = email.trim();
    const isMobile = /^[0-9]{8,15}$/.test(trimmed);
    const isEmailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

    if (!isMobile && !isEmailFormat) {
      showPremiumAlert("Invalid Input", "Please enter a valid Email or Mobile Number", "error");
      return;
    }

    setLoading(true);
    try {
      const { user, token } = await loginUser(trimmed, password);

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      /* =======================
        🔔 STEP 6.3 – FCM TOKEN (Disabled)
      ======================= */
      // FCM token retrieval disabled - Firebase messaging removed
      /* ======================= */


      showPremiumAlert("Logged In!", `Welcome back, ${user.full_name}!`, "success");

      setTimeout(() => {
        navigation.replace("Resturent");
      }, 2500);

    } catch (e) {
      showPremiumAlert("Login Failed", e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>

          {/* BACKGROUND WAVES (Z-INDEX BACK) */}
          <LinearGradient
            colors={["#1d8f52", "#27b36a", "#41d48a"]}
            style={styles.topWave}
          />
          <LinearGradient
            colors={["#1d8f52", "#27b36a", "#41d48a"]}
            style={styles.bottomWave}
          />

          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* LOGO */}
            <View style={styles.logoWrap}>
              <Image
                source={require("../assets/logo.png")}
                style={styles.logo}
              />
            </View>

            {/* MAIN CARD AREA */}
            <View style={styles.card}>
              <Text style={styles.title}>Hello 👋</Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>

              {/* Email / Mobile */}
              <View style={styles.box}>
                <Text style={styles.label}>Email or Mobile Number</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={20} color="#1f4d35" />
                  <TextInput
                    placeholder="Enter email or mobile number"
                    placeholderTextColor="#88a796"
                    autoCapitalize="none"
                    keyboardType="default"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.input}
                  />
                </View>

                <Text style={styles.helperText}>
                  You can login using your Email or Mobile Number.
                </Text>
              </View>

              {/* Password */}
              <View style={styles.box}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#1f4d35"
                  />
                  <TextInput
                    placeholder="Enter password"
                    placeholderTextColor="#88a796"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                  />
                </View>

                <TouchableOpacity style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* LOGIN BUTTON */}
              <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.8}>
                <LinearGradient
                  colors={["#166534", "#15803d", "#22c55e"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginGradient}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.loginText}>Sign In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Signup Link */}
              <Text style={styles.bottomText}>
                Don’t have an account?{" "}
                <Text
                  style={styles.signup}
                  onPress={() => navigation.navigate("Signup")}
                >
                  Register Now
                </Text>
              </Text>
            </View>
          </ScrollView>

        </View>
      </KeyboardAvoidingView>

      {/* UNIFIED PREMIUM MODAL (Success / Error / Info) */}
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <Animated.View style={[styles.alertCard, { transform: [{ scale: alertScale }] }]}>
            <View style={styles.alertContent}>
              <View style={[
                styles.alertIconRing,
                { backgroundColor: alertType === 'error' ? '#FEF2F2' : alertType === 'success' ? '#F0FDF4' : '#F0F9FF' }
              ]}>
                <Ionicons
                  name={alertType === 'error' ? "close" : alertType === 'success' ? "checkmark" : "information"}
                  size={46 * scale}
                  color={alertType === 'error' ? "#EF4444" : alertType === 'success' ? "#16A34A" : "#0EA5E9"}
                />
              </View>
              <Text style={styles.alertTitleText}>{alertTitle}</Text>
              <Text style={styles.alertMsgText}>{alertMsg}</Text>
              {alertType === 'success' && (
                <Text style={styles.alertSubText}>Enjoy ordering your favorite meals 😋</Text>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

/* ====================== STYLES ====================== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  topWave: {
    height: "32%",
    width: "140%",
    borderBottomLeftRadius: 220,
    borderBottomRightRadius: 220,
    position: "absolute",
    top: -100,
    alignSelf: "center",
  },

  bottomWave: {
    height: "28%",
    width: "140%",
    borderTopLeftRadius: 220,
    borderTopRightRadius: 220,
    position: "absolute",
    bottom: -100,
    alignSelf: "center",
  },

  logoWrap: {
    marginTop: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 180,
    height: 90,
    resizeMode: "contain",
  },

  card: {
    paddingHorizontal: 28,
    marginTop: 10,
  },

  title: {
    fontSize: 32 * scale,
    fontWeight: "800",
    color: "#1f4d35",
    fontFamily: "PoppinsSemiBold",
  },

  subtitle: {
    fontSize: 15 * scale,
    color: "#4a7f65",
    marginBottom: 30,
    fontFamily: "PoppinsMedium",
  },

  box: { marginBottom: 20 },

  label: {
    color: "#1f4d35",
    marginBottom: 8,
    fontWeight: "700",
    fontSize: 15 * scale,
    fontFamily: "PoppinsSemiBold",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5ee",
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50 * scale,
  },

  input: {
    flex: 1,
    paddingVertical: 14 * scale,
    fontSize: 15 * scale,
    color: "#000",
    marginLeft: 10,
    fontFamily: "PoppinsMedium",
  },

  helperText: {
    color: "#4a7f65",
    fontSize: 13 * scale,
    marginTop: 7,
    fontFamily: "PoppinsRegular",
  },

  forgotBtn: { alignSelf: "flex-end", marginTop: 6 },
  forgotText: {
    color: "#1a8b50",
    fontWeight: "700",
    fontSize: 14 * scale,
    fontFamily: "PoppinsSemiBold",
  },

  loginBtn: {
    marginTop: 30,
    shadowColor: "#1a8b50",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
  },

  loginGradient: {
    paddingHorizontal: 10,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 62 * scale,
  },

  loginText: {
    color: "#fff",
    fontSize: 22 * scale,
    fontWeight: "900",
    fontFamily: "PoppinsSemiBold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  bottomText: {
    textAlign: "center",
    marginTop: 28,
    color: "#2c6e49",
    fontSize: 15 * scale,
    fontFamily: "PoppinsMedium",
  },

  signup: {
    color: "#1a8b50",
    fontWeight: "800",
    textDecorationLine: "underline",
    fontFamily: "PoppinsSemiBold",
  },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },

  successContent: {
    paddingVertical: 45,
    paddingHorizontal: 30,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  successIconRing: {
    width: 86 * scale,
    height: 86 * scale,
    borderRadius: 43 * scale,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: "#DCFCE7",
  },
  successTitleText: {
    fontSize: 26 * scale,
    fontFamily: "PoppinsSemiBold",
    color: "#1E293B",
    fontWeight: "900",
    marginBottom: 12,
    textAlign: "center",
  },
  successTextWrap: {
    alignItems: "center",
  },
  successMsgText: {
    fontSize: 17 * scale,
    fontFamily: "PoppinsMedium",
    color: "#475569",
    textAlign: "center",
    lineHeight: 24 * scale,
  },
  successSubText: {
    fontSize: 14 * scale,
    fontFamily: "PoppinsRegular",
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
  },

  /* ALERT STYLES */
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertCard: {
    width: "82%",
    borderRadius: 30,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  alertContent: {
    paddingVertical: 45,
    paddingHorizontal: 30,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  alertIconRing: {
    width: 86 * scale,
    height: 86 * scale,
    borderRadius: 43 * scale,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  alertTitleText: {
    fontSize: 24 * scale,
    fontFamily: "PoppinsSemiBold",
    color: "#1E293B",
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  alertMsgText: {
    fontSize: 16 * scale,
    fontFamily: "PoppinsMedium",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22 * scale,
  },
  alertSubText: {
    fontSize: 14 * scale,
    fontFamily: "PoppinsRegular",
    color: "#94A3B8",
    marginTop: 8,
    textAlign: "center",
  },
  alertBtn: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  alertBtnGrad: {
    paddingVertical: 16,
    alignItems: "center",
  },
  alertBtnText: {
    fontSize: 16 * scale,
    fontFamily: "PoppinsSemiBold",
    color: "#FFF",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
