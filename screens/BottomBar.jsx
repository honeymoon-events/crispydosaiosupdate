import React from "react";
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const scale = width / 400;

export default function BottomBar({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      {/* HOME */}
      <TouchableOpacity style={styles.tabButton} onPress={() => navigation.navigate("Home")}>
        <Ionicons name="home-outline" size={24 * scale} color="#333" />
        <Text style={styles.label}>Home</Text>
      </TouchableOpacity>

      {/* ORDERS */}
      <TouchableOpacity style={styles.tabButton} onPress={() => navigation.navigate("Orders")}>
        <Ionicons name="receipt-outline" size={24 * scale} color="#333" />
        <Text style={styles.label}>Orders</Text>
      </TouchableOpacity>

      {/* QR SCAN */}
      {/* <TouchableOpacity style={styles.qrButton} onPress={() => navigation.navigate("Scanner")}>
        <Ionicons name="qr-code-outline" size={26 * scale} color="#fff" />
      </TouchableOpacity> */}

      {/* CREDITS */}
      <TouchableOpacity style={styles.tabButton} onPress={() => navigation.navigate("Credits")}>
        <Ionicons name="wallet-outline" size={24 * scale} color="#333" />
        <Text style={styles.label}>Credits</Text>
      </TouchableOpacity>

      {/* PROFILE */}
      <TouchableOpacity style={styles.tabButton} onPress={() => navigation.navigate("Profile")}>
        <Ionicons name="person-outline" size={24 * scale} color="#333" />
        <Text style={styles.label}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#fff",
    borderTopWidth: 0.5,
    borderColor: "#e0e0e0",
    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 8,
  },
  container: {},
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 10,
    maxWidth: width * 0.20,
  },
  label: {
    fontSize: 11 * scale,
    marginTop: 4,
    color: "#444",
    fontWeight: "600",
    fontFamily: "PoppinsMedium",
  },
  qrButton: {
    width: 56 * scale,
    height: 56 * scale,
    borderRadius: 28 * scale,
    backgroundColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    elevation: 14,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
