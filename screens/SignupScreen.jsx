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
import { useSettings } from "../context/SettingsContext";


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

  // Selection Modal State
  const [pickerModal, setPickerModal] = useState({ visible: false, type: "", data: [], title: "" });

  // Promotional Banner Animation
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const [bannerIndex, setBannerIndex] = useState(0);

  const { settings } = useSettings();

  const banners = [
    { text: `EARN £${settings.earn_per_order_amount} ON EVERY ORDER`, colors: ["#FF416C", "#FF4B2B"], icon: "flash" },
    { text: `REFER & EARN £${settings.referral_bonus_amount}`, colors: ["#1D976C", "#93F9B9"], icon: "leaf" },
    { text: `£${settings.signup_bonus_amount} WELCOME BONUS`, colors: ["#F2994A", "#F2C94C"], icon: "wallet" },
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
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedReferral = referralCode.trim();

    if (!trimmedName) {
      return Alert.alert("Required", "Full name is required.");
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return Alert.alert("Required", "A valid email is required.");
    }
    if (!trimmedPhone) {
      return Alert.alert("Required", "Phone number is required.");
    }
    if (password.length < 6) {
      return Alert.alert("Required", "Password must be at least 6 characters.");
    }
    if (password !== confirmPassword) {
      return Alert.alert("Required", "Passwords do not match.");
    }
    if (!preferredRestaurant) {
      return Alert.alert("Required", "Select your preferred restaurant.");
    }
    if (!dob || !(dob instanceof Date)) {
      return Alert.alert("Required", "Please select a valid Date of Birth.");
    }
    if (!termsAccepted) {
      return Alert.alert("Required", "Please accept Terms & Conditions.");
    }

    const payload = {
      full_name: trimmedName,
      email: trimmedEmail,
      mobile_number: trimmedPhone,
      country_code: `+${callingCode}`,
      password,
      preferred_restaurant: preferredRestaurant,
      date_of_birth: dob.toISOString().split("T")[0],
      referral_code: trimmedReferral || "",
      gender: gender || "",
    };

    setLoading(true);
    try {
      const { user, status, message } = await registerUser(payload);

      if (user) {
        showPremiumAlert("Welcome", "Your account has been created successfully.", "success");
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: "Resturent" }],
          });
        }, 2500);
      } else {
        showPremiumAlert("Success", message || "Account created successfully! Please login.", "success");
        setTimeout(() => {
          navigation.navigate("Login");
        }, 2500);
      }
    } catch (e) {
      console.log("Signup exception:", e);
      showPremiumAlert("Signup Failed", e.message || "Something went wrong during registration.", "error");
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

      {/* DATE OF BIRTH PICKER MODAL */}
      <Modal visible={showDobPicker} transparent animationType="slide" onRequestClose={() => setShowDobPicker(false)}>
        <View style={styles.dobModalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowDobPicker(false)} />
          <View style={styles.dobModalSheet}>
            <View style={styles.dobSheetHandle} />
            <View style={styles.dobSheetHeader}>
              <TouchableOpacity onPress={() => setShowDobPicker(false)} style={styles.dobCancelBtn}>
                <Text style={styles.dobCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.dobSheetTitle}>Date of Birth</Text>
              <TouchableOpacity
                onPress={() => setShowDobPicker(false)}
                style={styles.dobDoneBtn}
              >
                <Text style={styles.dobDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={dob || new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
              mode="date"
              display="spinner"
              textColor="#0F172A"
              maximumDate={new Date()}
              onChange={(e, date) => {
                if (date) setDob(date);
              }}
              style={styles.dobPicker}
            />
          </View>
        </View>
      </Modal>

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
            </View>
          </Animated.View>
        </View>
      </Modal>

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
  btnText: {
    color: "#FFFFFF",
    fontSize: 20 * scale,
    fontFamily: "PoppinsBold",
    fontWeight: "800",
  },
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

  /* DOB PICKER MODAL */
  dobModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  dobModalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 30,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  dobSheetHandle: {
    width: 44,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  dobSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dobSheetTitle: {
    fontSize: 16 * scale,
    fontFamily: "PoppinsBold",
    fontWeight: "800",
    color: "#0F172A",
  },
  dobCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  dobCancelText: {
    fontSize: 15 * scale,
    color: "#64748B",
    fontWeight: "600",
  },
  dobDoneBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#16a34a",
    borderRadius: 10,
  },
  dobDoneText: {
    fontSize: 15 * scale,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  dobPicker: {
    width: "100%",
    height: 200,
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
    backgroundColor: '#FFFFFF',
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
});
