// HomeScreen.js
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, Modal } from "react-native";

const { width, height } = Dimensions.get("window");
const isVerySmallScreen = height <= 640;
const isSmallScreen = height > 640 && height <= 720;
const FONT_FAMILY = Platform.select({ ios: "System", android: "System" });
const scale = width / 400; // Add scale definition since styles use it implicitly or we will add it

export default function HomeScreen({ navigation }) {
  const swingAnim = useRef(new Animated.Value(0)).current;
  const [isLoggedIn, setIsLoggedIn] = useState(false);





  useFocusEffect(
    React.useCallback(() => {
      const checkAuth = async () => {
        const token = await AsyncStorage.getItem("token");
        setIsLoggedIn(!!token);
      };
      checkAuth();
    }, [])
  );

  // Premium Logout Modal State
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const logoutScaleAnim = useRef(new Animated.Value(0)).current;

  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
    Animated.spring(logoutScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    await AsyncStorage.multiRemove([
      "token",
      "user",
      "profile_cache",
      "wallet_summary_cache",
    ]);
    setIsLoggedIn(false);
    // Optional: show a small toast or success alert if needed
  };

  const cancelLogout = () => {
    Animated.timing(logoutScaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setLogoutModalVisible(false));
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(swingAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(swingAnim, {
          toValue: -1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const swing = swingAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-6deg", "6deg"],
  });



  const logoWidth = isVerySmallScreen
    ? width * 0.5
    : isSmallScreen
      ? width * 0.55
      : width * 0.6;
  const logoHeight = logoWidth * 0.66;
  const imageCircleSize = isVerySmallScreen
    ? width * 0.5
    : isSmallScreen
      ? width * 0.56
      : width * 0.62;
  const verticalPadding = isVerySmallScreen ? 4 : isSmallScreen ? 8 : 12;




  return (
    <>
      <StatusBar backgroundColor="#F7CB45" barStyle="dark-content" />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#F7CB45" }}
        edges={["top", "bottom"]}
      >
        <LinearGradient
          colors={["#F7CB45", "#F7CB45"]}
          style={styles.container}
        >
          <View style={[styles.mainContent, { paddingVertical: verticalPadding }]}>
            <View style={styles.topSection}>
              <View style={styles.rope} />
              <Animated.Image
                source={require("../assets/logo.png")}
                style={[
                  styles.brandLogoImage,
                  {
                    width: logoWidth,
                    height: logoHeight,
                    transform: [{ rotate: swing }],
                  },
                ]}
              />

              <View style={styles.mainTitleWrap}>
                <Text style={styles.mainTitleBlack}>UK’S FINEST PURE</Text>
                <Text style={styles.mainTitleOrange}>
                  VEGETARIAN FOOD CHAIN
                </Text>
              </View>

              <View
                style={[
                  styles.imageWrapper,
                  {
                    width: imageCircleSize,
                    height: imageCircleSize,
                    borderRadius: imageCircleSize / 2,
                  },
                ]}
              >
                <Image
                  source={require("../assets/yourFoodImage.png")}
                  style={styles.foodImage}
                  resizeMode="cover"
                />
              </View>

              <Text style={styles.subtitle}>Fresh • Authentic • Pure Veg</Text>
            </View>



            {/* 🔻 Buttons brought closer under subtitle */}
            <View style={styles.bottomSection}>
              <View style={styles.buttonArea}>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Resturent")}
                  style={styles.primaryBtn}
                  activeOpacity={0.9}
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={20}
                    color="#1c1c1c"
                    style={styles.btnIcon}
                  />
                  <Text style={styles.primaryBtnText}>Explore</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    if (isLoggedIn) handleLogoutPress();
                    else navigation.navigate("Login");
                  }}
                  activeOpacity={0.9}
                >
                  <Ionicons
                    name={isLoggedIn ? "log-out-outline" : "log-in-outline"}
                    size={20}
                    color="#1c1c1c"
                    style={styles.btnIcon}
                  />
                  <Text style={styles.secondaryBtnText}>
                    {isLoggedIn ? "Sign Out" : "Sign In"}
                  </Text>
                </TouchableOpacity>



                <Text style={styles.bottomLine}>
                  New here?{" "}
                  <Text
                    style={styles.linkText}
                    onPress={() => navigation.navigate("Signup")}
                  >
                    Create an account
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>

      {/* PREMIUM LOGOUT MODAL */}
      <Modal visible={logoutModalVisible} transparent animationType="fade">
        <View style={styles.logoutOverlay}>
          <Animated.View style={[styles.logoutCard, { transform: [{ scale: logoutScaleAnim }] }]}>
            <View style={styles.logoutContent}>
              <View style={[styles.logoutIconRing, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Ionicons name="log-out" size={40} color="#EF4444" />
              </View>
              <Text style={styles.logoutTitle}>Sign Out?</Text>
              <Text style={styles.logoutMsg}>Are you sure you want to sign out from your account?</Text>

              <View style={styles.logoutActionRow}>
                <TouchableOpacity
                  style={styles.cancelLogoutBtn}
                  onPress={cancelLogout}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelLogoutText}>Stay</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmLogoutBtn}
                  onPress={confirmLogout}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmLogoutText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: "stretch",
    justifyContent: "flex-start",
  },
  topSection: {
    alignItems: "center",
    marginTop: -10,
  },
  bottomSection: {
    width: "100%",
    paddingTop: 2,
    paddingBottom: 8,
    marginTop: 32,
  },
  brandLogoImage: {
    resizeMode: "contain",
  },
  mainTitleWrap: {
    marginTop: 8,
    alignItems: "center",
  },
  mainTitleBlack: {
    fontSize: 22 * scale,
    fontFamily: "PoppinsSemiBold",
    color: "#1c1c1c",
    fontWeight: "700",
  },
  mainTitleOrange: {
    fontSize: 26 * scale,
    fontFamily: "PoppinsSemiBold",
    color: "#C62828",
    marginTop: -2,
    fontWeight: "800",
  },
  imageWrapper: {
    marginTop: 6,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  foodImage: {
    width: "100%",
    height: "100%",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14 * scale,
    color: "#1c1c1c",
    fontFamily: "PoppinsMedium",
    fontWeight: "600",
  },

  buttonArea: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  primaryBtn: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 320 * scale,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: "#1c1c1c",
    paddingVertical: 16 * scale,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    minHeight: 52,
  },
  primaryBtnText: {
    fontSize: 16 * scale,
    fontFamily: "PoppinsSemiBold",
    color: "#1c1c1c",
    fontWeight: "800",
  },
  secondaryBtn: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 320 * scale,
    borderWidth: 2.5,
    borderColor: "#2D1B0F",
    paddingVertical: 16 * scale,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    minHeight: 52,
  },
  secondaryBtnText: {
    fontSize: 16 * scale,
    fontFamily: "PoppinsSemiBold",
    color: "#1c1c1c",
    fontWeight: "800",
  },
  btnIcon: {
    marginRight: 10,
  },
  bottomLine: {
    fontSize: 14 * scale,
    color: "#1c1c1c",
    marginTop: 4,
    fontFamily: "PoppinsMedium",
    fontWeight: "600",
  },
  linkText: {
    fontFamily: "PoppinsSemiBold",
    textDecorationLine: "underline",
    color: "#C62828",
    fontWeight: "800",
  },
  rope: {
    width: 2,
    height: 28,
    backgroundColor: "#1D976C",
    marginBottom: 6,
  },

  /* LOGOUT MODAL STYLES */
  logoutOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutCard: {
    width: "85%",
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  logoutContent: {
    padding: 30,
    alignItems: "center",
  },
  logoutIconRing: {
    width: 80 * scale,
    height: 80 * scale,
    borderRadius: 40 * scale,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logoutTitle: {
    fontSize: 22 * scale,
    fontFamily: "PoppinsSemiBold",
    color: "#0F172A",
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  logoutMsg: {
    fontSize: 14 * scale,
    fontFamily: "PoppinsMedium",
    color: "#475569",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22 * scale,
    fontWeight: "600",
  },
  logoutActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelLogoutBtn: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelLogoutText: {
    fontSize: 15 * scale,
    fontWeight: "800",
    color: "#475569",
    textAlign: "center",
  },
  confirmLogoutBtn: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#EF4444",
  },
  confirmLogoutText: {
    fontSize: 15 * scale,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
  },
});
