// MenuModal.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { logoutUser } from "../utils/authHelpers";
import LinearGradient from "react-native-linear-gradient";

const { width, height } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.75; // 75% screen width for a premium look
const scale = width / 400;

export default function MenuModal({ visible, setVisible, user, navigation }) {
  const slideAnim = React.useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  const [logoutModalVisible, setLogoutModalVisible] = React.useState(false);
  const logoutScaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SIDEBAR_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleNavigation = (screen) => {
    setVisible(false);
    setTimeout(() => {
      navigation.navigate(screen);
    }, 200);
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
    Animated.spring(logoutScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const confirmLogout = () => {
    setLogoutModalVisible(false);
    setVisible(false);
    setTimeout(() => {
      logoutUser(navigation);
    }, 200);
  };

  const cancelLogout = () => {
    Animated.timing(logoutScaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setLogoutModalVisible(false));
  };

  const menuItems = [
    { id: "home", label: "Home", icon: "grid-outline", screen: "Home", color: "#FF2B5C" },
    { id: "faq", label: "FAQ Support", icon: "help-buoy-outline", screen: "FAQ", color: "#3B82F6" },
    { id: "invite", label: "Refer & Earn", icon: "gift-outline", screen: "InviteFriends", color: "#10B981" },
    { id: "personal", label: "My Profile", icon: "person-outline", screen: "Profile", color: "#8B5CF6" },
  ];

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onShow={() => { }} // Optional: trigger extra things on open
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Cinematic Backdrop Overlay */}
          <Pressable
            style={styles.overlay}
            onPress={() => setVisible(false)}
          />

          {/* Premium Sidebar */}
          <Animated.View
            style={[
              styles.sidebar,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            {/* PREMIUM INTEGRATED HEADER */}
            <View style={styles.sidebarHeader}>
              <View style={styles.headerTop}>
                <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeIconBtn}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View style={styles.profileSection}>
                <LinearGradient
                  colors={["#FF2B5C", "#FF6B8B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.userIconCircle}
                >
                  <Ionicons name="person" size={30} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.profileInfo}>
                  <Text style={styles.greetingText}>Hello,</Text>
                  <Text style={styles.userNameText} numberOfLines={1}>
                    {user?.full_name ? user.full_name.split(" ")[0] : "Guest"}
                  </Text>
                </View>
              </View>
            </View>

            {/* REFINED MENU LIST */}
            <View style={styles.menuList}>
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Main Navigation</Text>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.menuItem}
                    onPress={() => handleNavigation(item.screen)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.menuIconBox, { backgroundColor: item.color + "15" }]}>
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <View style={styles.chevronBox}>
                      <Ionicons name="chevron-forward" size={16} color="#DDD" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.divider} />

              {/* AUTH SECTION */}
              <View style={styles.listSection}>
                {user ? (
                  <TouchableOpacity
                    style={[styles.menuItem, styles.logoutItem]}
                    onPress={handleLogout}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.menuIconBox, { backgroundColor: "#EF444415" }]}>
                      <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                    </View>
                    <Text style={[styles.menuLabel, { color: "#EF4444" }]}>Sign Out</Text>
                    <View style={styles.chevronBox}>
                      <Ionicons name="chevron-forward" size={16} color="#FFDADA" />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setVisible(false);
                      setTimeout(() => navigation.replace("Login"), 200);
                    }}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.menuIconBox, { backgroundColor: "#FF2B5C15" }]}>
                      <Ionicons name="log-in-outline" size={22} color="#FF2B5C" />
                    </View>
                    <Text style={styles.menuLabel}>Sign In</Text>
                    <View style={styles.chevronBox}>
                      <Ionicons name="chevron-forward" size={16} color="#DDD" />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* SIDEBAR FOOTER */}
            <View style={styles.sidebarFooter}>
              <Text style={styles.footerBrand}>CRISPY DOSA</Text>
              <Text style={styles.footerVersion}>v 1.0.4 Premium</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* PREMIUM LOGOUT CONFIRMATION MODAL */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.logoutOverlay}>
          <Animated.View style={[
            styles.logoutCard,
            { transform: [{ scale: logoutScaleAnim }] }
          ]}>
            <View style={styles.logoutContent}>
              <View style={styles.logoutIconCircle}>
                <Ionicons name="log-out" size={36 * scale} color="#EF4444" />
              </View>

              <Text style={styles.logoutTitle}>Sign Out?</Text>
              <Text style={styles.logoutMsg}>
                Are you sure you want to sign out? You'll need to sign back in to place new orders.
              </Text>

              <View style={styles.logoutActionRow}>
                <TouchableOpacity
                  style={styles.cancelLogoutBtn}
                  onPress={cancelLogout}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelLogoutText}>Not Now</Text>
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
  modalContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sidebar: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20,
  },
  sidebarHeader: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 25,
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 10,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF2B5C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  closeIconBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  greetingText: {
    fontSize: 14,
    fontFamily: "PoppinsBold",
    color: "#64748B",
  },
  userNameText: {
    fontSize: 22 * scale,
    fontFamily: "PoppinsBold",
    fontWeight: "700",
    color: "#0F172A",
    marginTop: -2,
  },
  menuList: {
    flex: 1,
    paddingTop: 10,
  },
  listSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "PoppinsBold",
    color: "#94A3B8",
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: "PoppinsBold",
    fontWeight: "700",
    color: "#1E293B",
  },
  chevronBox: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 15,
    marginHorizontal: 20,
  },
  logoutItem: {
    marginTop: 0,
  },
  sidebarFooter: {
    paddingVertical: 30,
    alignItems: "center",
  },
  footerBrand: {
    fontSize: 12,
    fontFamily: "PoppinsBold",
    color: "#CBD5E1",
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  footerVersion: {
    fontSize: 10,
    fontFamily: "PoppinsMedium",
    color: "#E2E8F0",
    marginTop: 4,
  },

  /* LOGOUT MODAL STYLES */
  logoutOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutCard: {
    width: "85%",
    borderRadius: 30,
    backgroundColor: '#FFF',
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  logoutContent: {
    padding: 30,
    alignItems: "center",
  },
  logoutIconCircle: {
    width: 80 * scale,
    height: 80 * scale,
    borderRadius: 40 * scale,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutTitle: {
    fontSize: 24 * scale,
    fontFamily: "PoppinsBold",
    color: "#0F172A",
    marginBottom: 8,
  },
  logoutMsg: {
    fontSize: 14 * scale,
    fontFamily: "PoppinsMedium",
    color: "#64748B",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22 * scale,
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
