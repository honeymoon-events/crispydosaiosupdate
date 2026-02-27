import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Share,
  Alert,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Clipboard from "@react-native-clipboard/clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LinearGradient from "react-native-linear-gradient";
import { useIsFocused } from "@react-navigation/native";
import { StatusBar } from "react-native";
import BottomBar from "./BottomBar.jsx";
import AppHeader from "./AppHeader";
import { AuthRequiredInline, AuthRequiredModal } from "./AuthRequired";
import { fetchProfile } from "../services/profileService";
import { getWalletSummary } from "../services/walletService";
import { getCart } from "../services/cartService";
import { getOrders } from "../services/orderService";

const { width } = Dimensions.get("window");
const scale = width / 400;

export default function Profile({ navigation }) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartItemsMap, setCartItemsMap] = useState({});

  const [userLocal, setUserLocal] = useState(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [orderCount, setOrderCount] = useState(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Premium Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [alertType, setAlertType] = useState("info");
  const alertScale = useRef(new Animated.Value(0)).current;

  // Premium Logout Modal State
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const logoutScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        const parsed = stored ? JSON.parse(stored) : null;
        setUserLocal(parsed);

        if (!parsed) {
          setLoading(false);
          return;
        }

        // Cache first
        const [cachedProfile, cachedWallet] = await Promise.all([
          AsyncStorage.getItem("profile_cache"),
          AsyncStorage.getItem("wallet_summary_cache"),
        ]);

        if (cachedProfile && cachedWallet) {
          setProfile(JSON.parse(cachedProfile));
          setWallet(JSON.parse(cachedWallet));
          setLoading(false);
          startAnimations();
        }

        // Fetch fresh
        const [profileData, walletData, ordersData] = await Promise.all([
          fetchProfile(),
          getWalletSummary(),
          getOrders(parsed.id || parsed.customer_id)
        ]);

        if (profileData) {
          setProfile(profileData);
          AsyncStorage.setItem("profile_cache", JSON.stringify(profileData));
        }
        if (walletData) {
          setWallet(walletData);
          AsyncStorage.setItem("wallet_summary_cache", JSON.stringify(walletData));
        }
        if (ordersData && ordersData.status === 1) {
          const list = ordersData.data || [];
          setOrderCount(list.length);
        }
        setLoading(false);
        startAnimations();
      } catch (err) {
        console.log("Profile error", err);
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!userLocal || !isFocused) return;
    (async () => {
      const cid = userLocal.id ?? userLocal.customer_id;
      const res = await getCart(cid);
      if (res?.status === 1 && Array.isArray(res.data)) {
        const map = {};
        res.data.forEach(item => {
          if (item.product_quantity > 0) map[item.product_id] = item.product_quantity;
        });
        setCartItemsMap(map);
      }
    })();
  }, [userLocal, isFocused]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  };

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
  };

  const hidePremiumAlert = () => {
    Animated.timing(alertScale, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setAlertVisible(false));
  };

  const copyReferralCode = () => {
    if (!profile?.referral_code) {
      showPremiumAlert("No referral code", "Please sign in to access your referral code.", "error");
      return;
    }
    Clipboard.setString(profile.referral_code);
    showPremiumAlert("Copied", "Referral code copied to clipboard ✨", "success");
  };

  const shareReferral = async () => {
    if (!profile?.referral_code) {
      showPremiumAlert("No referral code", "Please sign in to share your code.", "error");
      return;
    }
    try {
      await Share.share({
        message: `Join Crispy Dosa using my code *${profile.referral_code}* and enjoy premium rewards! 🍛🔥`,
      });
    } catch (err) {
      console.log("Share error", err);
    }
  };

  const onRefresh = async () => {
    if (!userLocal) return;
    try {
      setRefreshing(true);
      const [profileData, walletData] = await Promise.all([fetchProfile(), getWalletSummary()]);
      setProfile(profileData);
      setWallet(walletData);

      const cid = userLocal.id ?? userLocal.customer_id;
      const res = await getCart(cid);
      if (res?.status === 1 && Array.isArray(res.data)) {
        const map = {};
        res.data.forEach(item => {
          if (item.product_quantity > 0) map[item.product_id] = item.product_quantity;
        });
        setCartItemsMap(map);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const logout = () => {
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
    await AsyncStorage.multiRemove(["token", "user", "profile_cache", "wallet_summary_cache"]);
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  const cancelLogout = () => {
    Animated.timing(logoutScaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setLogoutModalVisible(false));
  };



  if (!userLocal) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFF" }}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <AppHeader user={null} navigation={navigation} cartItems={{}} onMenuPress={() => setAuthModalVisible(true)} />
        <View style={styles.authContainer}>
          <AuthRequiredInline onSignIn={() => navigation.replace("Login")} description={"Sign in to access your business profile and rewards."} />
        </View>
        <BottomBar navigation={navigation} />
      </View>
    );
  }

  const totalWallet = wallet
    ? (Number(wallet.wallet_balance || 0) + (wallet.loyalty_expiry_list || []).reduce((sum, i) => sum + Number(i.credit_value || 0), 0)).toFixed(2)
    : "0.00";

  return (
    <LinearGradient
      colors={["#16a34a", "#F8FAFC"]}
      style={styles.root}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.4 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* FULL-WIDTH PREMIUM HEADER */}
          <View
            style={[styles.profileHeader, { paddingTop: insets.top + 20 }]}
          >
            <View style={styles.headerContent}>
              {navigation?.canGoBack() && (
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{ marginRight: 15, padding: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 }}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
              )}
              <View style={styles.avatarContainer}>
                <View style={styles.avatarInner}>
                  <Ionicons name="person" size={40} color="#16a34a" />
                </View>
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={12} color="#FFF" />
                </View>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{profile?.full_name || "Crispy User"}</Text>
                <Text style={styles.userPhone}>{profile?.country_code} {profile?.mobile_number}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>£{totalWallet}</Text>
                <Text style={styles.statLabel}>Balance</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{wallet?.loyalty_expiry_list?.length || 0}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{orderCount}</Text>
                <Text style={styles.statLabel}>Orders</Text>
              </View>
            </View>
          </View>

          {/* CONSOLIDATED CONTENT CARD - OVERLAPPING HEADER */}
          <View style={[styles.mainContentCard, { marginTop: -35 }]}>
            {/* REFERRAL INTEGRATED */}
            <View style={styles.referralIntegrated}>
              <View style={styles.refLeft}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                  <Ionicons name="people-circle" size={26} color="#16a34a" />
                  <Text style={[styles.refTitle, { marginLeft: 8 }]}>Refer a Friend</Text>
                </View>
                <Text style={styles.refDesc}>(Invite friends and earn instantly)</Text>
                <View style={styles.codeRow}>
                  <Text style={styles.refCodeLabel}>MY CODE:</Text>
                  <Text style={styles.refCodeText}>{profile?.referral_code || "ALPHA"}</Text>
                </View>
              </View>
              <View style={styles.refActions}>
                <TouchableOpacity style={[styles.iconBtn, { marginBottom: 10 }]} onPress={copyReferralCode}>
                  <Ionicons name="copy" size={20} color="#16a34a" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#16a34a' }]} onPress={shareReferral}>
                  <Ionicons name="share-social" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.menuDivider} />

            {/* ACCOUNT MANAGEMENT */}
            <Text style={styles.sectionLabel}>ACCOUNT MANAGEMENT</Text>
            <MenuItem icon="receipt" label="My Orders" sub="View history & tracking" color="#F97316" onPress={() => navigation.navigate("Orders")} />
            <MenuItem icon="wallet" label="Credits & Wallet" sub="Balance & statement" color="#0EA5E9" onPress={() => navigation.navigate("Credits")} />
            <MenuItem icon="person-circle" label="Edit Profile" sub="Update personal info" color="#8B5CF6" onPress={() => navigation.navigate("EditProfile")} />

            <View style={styles.menuDivider} />

            {/* RESOURCES & LEGAL */}
            <Text style={styles.sectionLabel}>RESOURCES & LEGAL</Text>
            <MenuItem icon="help-buoy" label="Support Center" sub="FAQs & live chat" color="#10B981" onPress={() => navigation.navigate("HelpCenter")} />
            <MenuItem icon="shield-checkmark" label="Privacy Policy" sub="How we use your data" color="#64748B" onPress={() => navigation.navigate("PrivacyPolicy")} />
            <MenuItem icon="document-text" label="Terms of Service" sub="App usage guidelines" color="#64748B" onPress={() => navigation.navigate("TermsConditions")} />
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
            <View style={styles.logoutInner}>
              <Ionicons name="log-out" size={22} color="#EF4444" />
              <Text style={styles.logoutText}>Sign Out Account</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.versionText}>Crispy Dosa Business v2.0.1</Text>
        </Animated.View>
      </ScrollView>

      <BottomBar navigation={navigation} />
      <AuthRequiredModal visible={authModalVisible} onClose={() => setAuthModalVisible(false)} onSignIn={() => { setAuthModalVisible(false); navigation.replace("Login"); }} />

      {/* PREMIUM ALERT MODAL */}
      <Modal visible={alertVisible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <Animated.View style={[styles.alertCard, { transform: [{ scale: alertScale }] }]}>
            <LinearGradient
              colors={alertType === 'error' ? ["#FFFFFF", "#FFF5F5"] : ["#FFFFFF", "#F0FDF4"]}
              style={styles.alertContent}
            >
              <View style={[
                styles.alertIconRing,
                { backgroundColor: alertType === 'error' ? '#FEE2E2' : '#DCFCE7' }
              ]}>
                <Ionicons
                  name={
                    alertType === 'error' ? "close-circle"
                      : alertType === 'success' ? "checkmark-circle"
                        : "information-circle"
                  }
                  size={46 * scale}
                  color={alertType === 'error' ? "#EF4444" : "#16A34A"}
                />
              </View>
              <Text style={styles.alertTitleText}>{alertTitle}</Text>
              <Text style={styles.alertMsgText}>{alertMsg}</Text>
              <TouchableOpacity style={styles.alertBtn} onPress={hidePremiumAlert} activeOpacity={0.8}>
                <LinearGradient
                  colors={alertType === 'error' ? ["#EF4444", "#B91C1C"] : ["#16A34A", "#15803D"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.alertBtnGrad}
                >
                  <Text style={styles.alertBtnText}>Ok</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      {/* PREMIUM LOGOUT MODAL */}
      <Modal visible={logoutModalVisible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <Animated.View style={[styles.alertCard, { transform: [{ scale: logoutScaleAnim }] }]}>
            <View style={styles.alertContent}>
              <View style={[styles.alertIconRing, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="log-out" size={46 * scale} color="#EF4444" />
              </View>
              <Text style={styles.alertTitleText}>Sign Out?</Text>
              <Text style={styles.alertMsgText}>Are you sure you want to sign out from your account?</Text>

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
                  <View style={styles.confirmLogoutInner}>
                    <Text style={styles.confirmLogoutText}>Sign Out</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

const MenuItem = ({ icon, label, sub, color, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIconBg, { backgroundColor: color + '15' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <View style={styles.menuTextContent}>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuSub}>{sub}</Text>
    </View>
    <View style={styles.chevron}>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  loaderText: { marginTop: 15, fontFamily: 'PoppinsMedium', color: '#16a34a' },
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },

  profileHeader: {
    paddingHorizontal: 25,
    paddingBottom: 60,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative' },
  avatarInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#EA580C', padding: 5, borderRadius: 10, borderWidth: 2, borderColor: '#FFF' },

  userInfo: { marginLeft: 16, flex: 1 },
  userName: { fontSize: 22 * scale, fontFamily: "PoppinsBold", color: "#FFF", fontWeight: '700' },
  userPhone: { fontSize: 13 * scale, fontFamily: "PoppinsMedium", color: "rgba(255,255,255,0.9)", marginTop: -2 },
  businessBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, marginTop: 8, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10 * scale, fontFamily: "PoppinsBold", color: "#FFF", marginLeft: 5, letterSpacing: 0.5 },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    paddingHorizontal: 10
  },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20 * scale, fontFamily: "PoppinsBold", color: "#FFF", fontWeight: '900' },
  statLabel: { fontSize: 11 * scale, fontFamily: "PoppinsMedium", color: "rgba(255,255,255,0.9)", marginTop: 2 },
  statDivider: { width: 1.5, height: '40%', backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'center' },

  mainContentCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 30,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  referralIntegrated: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 5,
  },
  refLeft: { flex: 1 },
  refTitle: { fontSize: 18 * scale, fontFamily: "PoppinsBold", color: "#1C1C1C" },
  refDesc: { fontSize: 12 * scale, fontFamily: "PoppinsMedium", color: "#64748B", marginTop: 2 },
  codeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  refCodeLabel: { fontSize: 10 * scale, fontFamily: "PoppinsBold", color: "#94A3B8" },
  refCodeText: { fontSize: 16 * scale, fontFamily: "PoppinsBold", color: "#16a34a", marginLeft: 8, letterSpacing: 2 },

  refActions: {},
  iconBtn: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DCFCE7' },

  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 18,
  },
  sectionLabel: { fontSize: 12 * scale, fontFamily: "PoppinsBold", color: "#64748B", opacity: 0.8, letterSpacing: 1.5, marginBottom: 15, marginLeft: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  menuIconBg: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  menuTextContent: { flex: 1, marginLeft: 15 },
  menuLabel: { fontSize: 15 * scale, fontFamily: "PoppinsBold", color: "#1E293B" },
  menuSub: { fontSize: 12 * scale, fontFamily: "PoppinsMedium", color: "#94A3B8", marginTop: 1 },
  chevron: { opacity: 0.5 },

  logoutBtn: { marginHorizontal: 20, marginTop: 30, borderRadius: 20, overflow: 'hidden' },
  logoutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: 'rgba(254, 242, 242, 0.6)',
    borderWidth: 1,
    borderColor: '#FEE2E2'
  },
  logoutText: { fontSize: 18 * scale, fontFamily: "PoppinsBold", fontWeight: "800", color: "#EF4444", marginLeft: 10 },

  versionText: { textAlign: 'center', marginTop: 30, fontSize: 12 * scale, fontFamily: "PoppinsMedium", color: "#CBD5E1" },

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
    padding: 32,
    alignItems: "center",
  },
  alertIconRing: {
    width: 86 * scale,
    height: 86 * scale,
    borderRadius: 43 * scale,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
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
    fontSize: 15 * scale,
    fontFamily: "PoppinsMedium",
    color: "#64748B",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22 * scale,
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
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  confirmLogoutInner: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmLogoutGrad: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmLogoutText: {
    fontSize: 18 * scale,
    fontFamily: "PoppinsBold",
    fontWeight: "800",
    color: "#EF4444",
    textAlign: "center",
  },
});
