// screens/SignupScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  StatusBar,
  ScrollView,
  Dimensions,
  Modal,
  Animated,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import CountryPicker from "react-native-country-picker-modal";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { registerUser } from "../services/authService";
import { fetchRestaurants } from "../services/restaurantService";

const { width } = Dimensions.get("window");
const scale = width / 400;

export default function SignupScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [countryCode, setCountryCode] = useState("GB");
  const [callingCode, setCallingCode] = useState("44");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferredRestaurant, setPreferredRestaurant] = useState("");
  const [dob, setDob] = useState(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [gender, setGender] = useState("");

  const [restaurants, setRestaurants] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Selection Modal State
  const [pickerModal, setPickerModal] = useState({ visible: false, type: "", data: [], title: "" });

  // Promotional Banner Animation
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [bannerIndex, setBannerIndex] = useState(0);

  const banners = [
    { text: "EARN £0.25 ON EVERY ORDER", colors: ["#FF416C", "#FF4B2B"], icon: "flash" },
    { text: "REFER & EARN £0.25", colors: ["#1D976C", "#93F9B9"], icon: "leaf" },
    { text: "£0.25 WELCOME BONUS", colors: ["#F2994A", "#F2C94C"], icon: "wallet" },
  ];

  useEffect(() => {
    const animate = () => {
      fadeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start(() => {
        setBannerIndex((prev) => (prev + 1) % banners.length);
        animate();
      });
    };
    animate();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchRestaurants();
        setRestaurants(data || []);
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);

  const handleSignup = async () => {
    if (!name.trim()) return Alert.alert("Required", "Full name is required.");
    if (!email.trim() || !email.includes("@")) return Alert.alert("Required", "A valid email is required.");
    if (!phone.trim()) return Alert.alert("Required", "Phone number is required.");
    if (password.length < 6) return Alert.alert("Required", "Password must be at least 6 characters.");
    if (password !== confirmPassword) return Alert.alert("Required", "Passwords do not match.");
    if (!preferredRestaurant) return Alert.alert("Required", "Select your preferred restaurant.");
    if (!dob) return Alert.alert("Required", "Please select your Date of Birth.");
    if (!termsAccepted) return Alert.alert("Required", "Please accept Terms & Conditions.");

    setLoading(true);
    try {
      await registerUser({
        full_name: name,
        email,
        mobile_number: phone,
        country_code: `+${callingCode}`,
        password,
        preferred_restaurant: preferredRestaurant,
        date_of_birth: dob ? dob.toISOString().split("T")[0] : null,
        referral_code: referralCode || null,
        gender: gender || null,
      });
      Alert.alert("Success", "Account created successfully! Please login.");
      navigation.navigate("Login");
    } catch (e) {
      Alert.alert("Signup Failed", e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const openPicker = (type) => {
    if (type === "gender") {
      setPickerModal({
        visible: true,
        type: "gender",
        title: "Select Gender",
        data: [{ label: "Male", value: "male" }, { label: "Female", value: "female" }, { label: "Other", value: "other" }],
      });
    } else {
      setPickerModal({
        visible: true,
        type: "restaurant",
        title: "Select Restaurant",
        data: restaurants.map((r) => ({ label: r.name, value: r.name })),
      });
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* REFINED PREMIUM HEADER WITH SAFE AREA */}
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={26} color="#1E293B" />
        </TouchableOpacity>
        <Image source={require("../assets/logo.png")} style={styles.headerLogo} />
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        bounces={true}
      >
        <View style={styles.topInfo}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Crispy Dosa & Earn Rewards</Text>

          {/* DYNAMIC PROMO TEXT (CLEAN & MINIMAL) */}
          <Animated.View style={[styles.promoContainer, { opacity: fadeAnim }]}>
            <View style={styles.promoInner}>
              <Ionicons name={banners[bannerIndex].icon} size={16} color="#16a34a" />
              <Text style={styles.promoText}>{banners[bannerIndex].text}</Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.formCard}>
          <SignupInput label="Full Name" icon="person-outline" placeholder="Enter full name" value={name} onChangeText={setName} />
          <SignupInput label="Email Address" icon="mail-outline" placeholder="email@gmail.com" value={email} onChangeText={setEmail} keyboardType="email-address" />

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Mobile Number</Text>
            <View style={styles.phoneRow}>
              <CountryPicker
                countryCode={countryCode}
                withFilter
                withFlag
                withCallingCode
                onSelect={(c) => {
                  setCountryCode(c.cca2);
                  setCallingCode(c.callingCode[0]);
                }}
              />
              <Text style={styles.callingCodeText}>+{callingCode}</Text>
              <TextInput placeholder="Mobile Number" placeholderTextColor="#94A3B8" keyboardType="number-pad" style={styles.phoneInput} value={phone} onChangeText={setPhone} />
            </View>
          </View>

          <SignupInput label="Password" icon="lock-closed-outline" placeholder="••••••••" value={password} onChangeText={setPassword} secureTextEntry />
          <SignupInput label="Confirm Password" icon="lock-closed-outline" placeholder="••••••••" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

          <SignupSelect label="Preferred Restaurant" icon="restaurant-outline" value={preferredRestaurant || "Select Restaurant"} onPress={() => openPicker("restaurant")} />
          <SignupSelect label="Date of Birth" icon="calendar-outline" value={dob ? dob.toLocaleDateString("en-GB") : "Select Date"} onPress={() => setShowDobPicker(true)} />
          <SignupSelect label="Gender" icon="male-female-outline" value={gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "Select Gender"} onPress={() => openPicker("gender")} />

          <SignupInput label="Referral Code (Optional)" icon="gift-outline" placeholder="Enter code" value={referralCode} onChangeText={setReferralCode} />

          <TouchableOpacity style={styles.termsRow} onPress={() => setTermsAccepted(!termsAccepted)} activeOpacity={0.7}>
            <Ionicons name={termsAccepted ? "checkmark-circle" : "ellipse-outline"} size={20} color={termsAccepted ? "#16a34a" : "#CBD5E1"} />
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.link} onPress={() => navigation.navigate("TermsConditions")}>Terms</Text> & <Text style={styles.link} onPress={() => navigation.navigate("PrivacyPolicy")}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainBtn, (!termsAccepted || loading) && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={!termsAccepted || loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.footer} onPress={() => navigation.navigate("Login")} activeOpacity={0.7}>
          <Text style={styles.footerText}>Already have an account? <Text style={styles.footerLink}>Sign In</Text></Text>
        </TouchableOpacity>
      </ScrollView>

      {showDobPicker && (
        <DateTimePicker
          value={dob || new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
          mode="date"
          display="spinner"
          onChange={(e, date) => {
            setShowDobPicker(false);
            if (date) setDob(date);
          }}
        />
      )}

      {/* CUSTOM MODAL PICKER */}
      <Modal visible={pickerModal.visible} transparent animationType="fade" onRequestClose={() => setPickerModal({ ...pickerModal, visible: false })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{pickerModal.title}</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 15 }}>
              {pickerModal.data.map((item, id) => (
                <TouchableOpacity
                  key={id}
                  style={[styles.modalItem, (gender === item.value || preferredRestaurant === item.value) && styles.modalItemActive]}
                  onPress={() => {
                    if (pickerModal.type === "gender") setGender(item.value);
                    else setPreferredRestaurant(item.value);
                    setPickerModal({ ...pickerModal, visible: false });
                  }}
                >
                  <Text style={[styles.modalItemText, (gender === item.value || preferredRestaurant === item.value) && styles.modalItemTextActive]}>{item.label}</Text>
                  {(gender === item.value || preferredRestaurant === item.value) && <Ionicons name="checkmark-circle" size={20} color="#16a34a" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPickerModal({ ...pickerModal, visible: false })}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const SignupInput = ({ label, icon, ...props }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputRow}>
      <Ionicons name={icon} size={18} color="#16a34a" style={{ width: 25 }} />
      <TextInput placeholderTextColor="#94A3B8" style={styles.input} {...props} />
    </View>
  </View>
);

const SignupSelect = ({ label, icon, value, onPress }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TouchableOpacity style={styles.inputRow} onPress={onPress}>
      <Ionicons name={icon} size={18} color="#16a34a" style={{ width: 25 }} />
      <Text style={[styles.input, value.includes("Select") && { color: "#94A3B8" }]}>{value}</Text>
      <Ionicons name="chevron-down" size={14} color="#CBD5E1" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    zIndex: 100,
  },
  headerLogo: { width: 110, height: 44, resizeMode: "contain" },
  backBtn: { padding: 8, marginLeft: -5 },
  scrollContent: { paddingTop: 10 },
  topInfo: { paddingHorizontal: 20, paddingBottom: 25, alignItems: "center" },
  title: { fontSize: 28, fontWeight: "900", color: "#1E293B", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 6, fontWeight: "500" },
  promoContainer: { marginTop: 15, width: "100%" },
  promoInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  promoText: {
    color: "#16a34a",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase"
  },
  formCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
  },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: { fontSize: 10, fontWeight: "800", color: "#94A3B8", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 10, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: "#E2E8F0" },
  phoneRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 10, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: "#E2E8F0" },
  input: { flex: 1, fontSize: 14, color: "#334155", fontWeight: "600" },
  callingCodeText: { fontSize: 14, fontWeight: "600", color: "#334155", marginHorizontal: 8 },
  phoneInput: { flex: 1, fontSize: 14, color: "#334155", fontWeight: "600" },
  termsRow: { flexDirection: "row", alignItems: "center", marginTop: 5, marginBottom: 15 },
  termsText: { flex: 1, marginLeft: 8, fontSize: 11, color: "#64748B", lineHeight: 16 },
  link: { color: "#16a34a", fontWeight: "800" },
  mainBtn: { backgroundColor: "#16a34a", height: 50, borderRadius: 12, justifyContent: "center", alignItems: "center", elevation: 4, shadowOpacity: 0.2 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  footer: { marginTop: 25, alignItems: "center" },
  footerText: { color: "#64748B", fontSize: 14 },
  footerLink: { color: "#16a34a", fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#FFF", borderRadius: 24, padding: 24, maxHeight: "75%" },
  modalTitle: { fontSize: 20, fontWeight: "900", color: "#1E293B", marginBottom: 20, textAlign: "center" },
  modalItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  modalItemActive: { backgroundColor: "#F0FDF4", borderRadius: 12 },
  modalItemText: { fontSize: 16, color: "#475569", fontWeight: "600" },
  modalItemTextActive: { color: "#16a34a", fontWeight: "800" },
  modalCloseBtn: { marginTop: 15, paddingVertical: 14, alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 12 },
  modalCloseText: { fontSize: 16, color: "#64748B", fontWeight: "700" },
});
