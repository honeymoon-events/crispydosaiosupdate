import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Clipboard from "@react-native-clipboard/clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { StatusBar } from "react-native";
import BottomBar from "./BottomBar.jsx";
import AppHeader from "./AppHeader";
import { AuthRequiredInline } from "./AuthRequired";
import { fetchProfile } from "../services/profileService";
import { getWalletSummary } from "../services/walletService";
import { getCart } from "../services/cartService";
import { getOrders } from "../services/orderService";
import auth from "@react-native-firebase/auth";

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
  const [orderCount, setOrderCount] = useState(0);

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

  const copyReferralCode = () => {
    if (!profile?.referral_code) {
      Alert.alert("No referral code", "Please sign in to access your referral code.");
      return;
    }
    Clipboard.setString(profile.referral_code);
    Alert.alert("Copied", "Referral code copied to clipboard ✨");
  };

  const shareReferral = async () => {
    if (!profile?.referral_code) {
      Alert.alert("No referral code", "Please sign in to share your code.");
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
    Alert.alert("Sign Out?", "Are you sure you want to sign out from your account?", [
      { text: "Stay", onPress: () => {}, style: "cancel" },
      { text: "Sign Out", onPress: confirmLogout, style: "destructive" }
    ]);
  };

  const confirmLogout = async () => {
    await auth().signOut();
    await AsyncStorage.multiRemove(["token", "user", "profile_cache", "wallet_summary_cache"]);
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };



  if (!userLocal) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFF" }}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <AppHeader user={null} navigation={navigation} cartItems={{}} />
        <View style={styles.authContainer}>
          <AuthRequiredInline onSignIn={() => navigation.replace("Login")} description={"Sign in to access your business profile and rewards."} />
        </View>
        <BottomBar navigation={navigation} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const totalWallet = wallet
    ? (Number(wallet.wallet_balance || 0) + (wallet.loyalty_expiry_list || []).reduce((sum, i) => sum + Number(i.credit_value || 0), 0)).toFixed(2)
    : "0.00";

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <AppHeader user={userLocal} navigation={navigation} cartItems={cartItemsMap} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
      >
        {/* PROFILE HEADER */}
        <View style={[styles.profileHeader, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerContent}>
            {navigation?.canGoBack() && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ marginRight: 15, padding: 5 }}
              >
                <Ionicons name="arrow-back" size={24} color="#1E293B" />
              </TouchableOpacity>
            )}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarInner}>
                <Ionicons name="person" size={40} color="#16a34a" />
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profile?.full_name || "User"}</Text>
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

        {/* CONTENT CARD */}
        <View style={styles.mainContentCard}>
          {/* REFERRAL */}
          <View style={styles.referralIntegrated}>
            <View style={styles.refLeft}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                <Ionicons name="people-circle" size={26} color="#16a34a" />
                <Text style={[styles.refTitle, { marginLeft: 8 }]}>Refer a Friend</Text>
              </View>
              <Text style={styles.refDesc}>(Invite & earn instantly)</Text>
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
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <MenuItem icon="receipt" label="My Orders" sub="View history & tracking" color="#F97316" onPress={() => navigation.navigate("Orders")} />
          <MenuItem icon="wallet" label="Credits & Wallet" sub="Balance & statement" color="#0EA5E9" onPress={() => navigation.navigate("Credits")} />
          <MenuItem icon="person-circle" label="Edit Profile" sub="Update personal info" color="#8B5CF6" onPress={() => navigation.navigate("EditProfile")} />

          <View style={styles.menuDivider} />

          {/* RESOURCES */}
          <Text style={styles.sectionLabel}>RESOURCES</Text>
          <MenuItem icon="help-buoy" label="Support Center" sub="FAQs & chat" color="#10B981" onPress={() => navigation.navigate("HelpCenter")} />
          <MenuItem icon="shield-checkmark" label="Privacy Policy" sub="Data usage" color="#64748B" onPress={() => navigation.navigate("PrivacyPolicy")} />
          <MenuItem icon="document-text" label="Terms of Service" sub="Guidelines" color="#64748B" onPress={() => navigation.navigate("TermsConditions")} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <View style={styles.logoutInner}>
            <Ionicons name="log-out" size={22} color="#EF4444" />
            <Text style={styles.logoutText}>Sign Out Account</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.versionText}>Crispy Dosa Business v2.0.1</Text>
      </ScrollView>

      <BottomBar navigation={navigation} />
    </View>
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
  root: { flex: 1, backgroundColor: '#FFF' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  loadingText: { marginTop: 15, fontFamily: 'PoppinsMedium', color: '#16a34a' },
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },

  profileHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarContainer: { position: 'relative' },
  avatarInner: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#DCFCE7' },

  userInfo: { marginLeft: 15, flex: 1 },
  userName: { fontSize: 20 * scale, fontFamily: "PoppinsBold", color: "#1E293B", fontWeight: '700' },
  userPhone: { fontSize: 12 * scale, fontFamily: "PoppinsMedium", color: "#64748B", marginTop: 2 },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18 * scale, fontFamily: "PoppinsBold", color: "#16a34a", fontWeight: '900' },
  statLabel: { fontSize: 11 * scale, fontFamily: "PoppinsMedium", color: "#64748B", marginTop: 4 },
  statDivider: { width: 1, height: 50, backgroundColor: '#E2E8F0', alignSelf: 'center' },

  mainContentCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  referralIntegrated: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refLeft: { flex: 1 },
  refTitle: { fontSize: 16 * scale, fontFamily: "PoppinsBold", color: "#1C1C1C" },
  refDesc: { fontSize: 12 * scale, fontFamily: "PoppinsMedium", color: "#64748B", marginTop: 2 },
  codeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  refCodeLabel: { fontSize: 10 * scale, fontFamily: "PoppinsBold", color: "#94A3B8" },
  refCodeText: { fontSize: 14 * scale, fontFamily: "PoppinsBold", color: "#16a34a", marginLeft: 6, letterSpacing: 1 },

  refActions: {},
  iconBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },

  menuDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  sectionLabel: { fontSize: 11 * scale, fontFamily: "PoppinsBold", color: "#94A3B8", opacity: 0.8, letterSpacing: 1, marginBottom: 12, marginLeft: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  menuIconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuTextContent: { flex: 1, marginLeft: 12 },
  menuLabel: { fontSize: 14 * scale, fontFamily: "PoppinsBold", color: "#1E293B", fontWeight: '600' },
  menuSub: { fontSize: 12 * scale, fontFamily: "PoppinsMedium", color: "#94A3B8", marginTop: 2 },
  chevron: { opacity: 0.5 },

  logoutBtn: { marginHorizontal: 20, marginTop: 20, borderRadius: 12, overflow: 'hidden' },
  logoutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2'
  },
  logoutText: { fontSize: 16 * scale, fontFamily: "PoppinsBold", fontWeight: "700", color: "#EF4444", marginLeft: 10 },

  versionText: { textAlign: 'center', marginTop: 24, marginBottom: 20, fontSize: 12 * scale, fontFamily: "PoppinsMedium", color: "#94A3B8" },
});
