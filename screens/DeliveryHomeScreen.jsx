import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Linking,
  Alert,
  Platform,
  RefreshControl,
  Pressable,
  StatusBar,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import firestore from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TAB_ITEMS = ["Available", "Active", "Completed"];

const normalizeStatus = (value) => {
  if (value === null || value === undefined || value === "") return "";
  return String(value).trim().toLowerCase();
};

const getRestaurantId = (order = {}) => {
  return order.restaurant_id || order.restaurantId || order.restaurantid || order.restaurant || "";
};

const getAssignedDriverId = (order = {}) => {
  return order.assigned_driver_id || order.driver_id || order.delivery_partner_id || order.driverId || "";
};

const getCustomerPhone = (order = {}) => {
  return (
    order.customer_phone ||
    order.phone ||
    order.customerPhone ||
    order.mobile_number ||
    order.contact_number ||
    ""
  );
};

const getCustomerName = (order = {}) => {
  return order.customer_name || order.customerName || order.name || "Customer";
};

const getDeliveryAddress = (order = {}) => {
  return order.delivery_address || order.address || order.deliveryAddress || "Address unavailable";
};

const formatCurrency = (amount) => {
  const numeric = Number(amount || 0);
  if (Number.isNaN(numeric)) return "£0.00";
  return `£${numeric.toFixed(2)}`;
};

const isActiveStatus = (value) => {
  const status = normalizeStatus(value);
  return [
    "accepted",
    "assigned",
    "picked_up",
    "pickup",
    "out_for_delivery",
    "en_route",
    "in_transit",
    "inprogress",
    "in_progress",
    "on_the_way",
  ].includes(status);
};

const isCompletedStatus = (value) => {
  const status = normalizeStatus(value);
  return ["delivered", "completed", "done", "fulfilled"].includes(status);
};

const isAvailableStatus = (value) => {
  const status = normalizeStatus(value);
  return [
    "pending",
    "new",
    "queued",
    "placed",
    "ready_for_pickup",
    "ready",
    "waiting",
    "unassigned",
  ].includes(status);
};

export default function DeliveryHomeScreen({ navigation, route }) {
  const [driver, setDriver] = useState(route?.params?.partner || null);
  const [activeTab, setActiveTab] = useState("Available");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const restoreDriver = async () => {
      if (driver) return;
      try {
        const stored = await AsyncStorage.getItem("delivery_partner");
        if (stored) {
          setDriver(JSON.parse(stored));
        } else {
          navigation.replace("DeliveryLogin");
        }
      } catch (error) {
        navigation.replace("DeliveryLogin");
      }
    };

    restoreDriver();
  }, [driver, navigation]);

  useEffect(() => {
    if (!driver) return;

    const restaurantId = driver.restaurant_id || driver.restaurantId || driver.restaurant;
    if (!restaurantId) {
      Alert.alert("Access denied", "This partner is not assigned to a restaurant.");
      setLoading(false);
      return;
    }

    setLoading(true);

    const query = firestore()
      .collection("orders")
      .where("restaurant_id", "==", restaurantId);

    const unsubscribe = query.onSnapshot(
      (snapshot) => {
        const nextOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setOrders(nextOrders);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.log("Delivery orders listener error:", error);
        setLoading(false);
        setRefreshing(false);
        Alert.alert("Connection issue", "Unable to load the delivery queue right now.");
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [driver]);

  const filteredOrders = useMemo(() => {
    const driverId = driver?.id || driver?.uid || "";

    return orders.filter((order) => {
      const orderRestaurantId = getRestaurantId(order);
      const assignedDriverId = getAssignedDriverId(order);
      const status = normalizeStatus(order.status || order.order_status || order.delivery_status);

      if (orderRestaurantId && orderRestaurantId !== (driver?.restaurant_id || driver?.restaurantId || driver?.restaurant)) {
        return false;
      }

      if (activeTab === "Available") {
        return (
          !assignedDriverId &&
          isAvailableStatus(status)
        );
      }

      if (activeTab === "Active") {
        return (
          (assignedDriverId === driverId || assignedDriverId === driver?.partner_id) &&
          isActiveStatus(status)
        );
      }

      return (
        (assignedDriverId === driverId || assignedDriverId === driver?.partner_id) &&
        isCompletedStatus(status)
      );
    });
  }, [driver, orders, activeTab]);

  const handleAcceptOrder = async (orderId) => {
    if (!driver) return;

    try {
      await firestore().collection("orders").doc(orderId).update({
        status: "accepted",
        order_status: "accepted",
        delivery_status: "accepted",
        assigned_driver_id: driver.id,
        assigned_driver_name: driver.full_name || driver.name || "Delivery Partner",
        assigned_at: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.log("Accept order error:", error);
      Alert.alert("Update failed", "Unable to accept this order right now.");
    }
  };

  const handleMarkDelivered = async (orderId) => {
    if (!driver) return;

    try {
      await firestore().collection("orders").doc(orderId).update({
        status: "delivered",
        order_status: "delivered",
        delivery_status: "delivered",
        delivered_by: driver.id,
        delivered_at: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.log("Mark delivered error:", error);
      Alert.alert("Update failed", "Unable to mark this order as delivered.");
    }
  };

  const handleCallCustomer = (order) => {
    const phone = getCustomerPhone(order);
    if (!phone) {
      Alert.alert("No phone number", "This customer does not have a phone number on file.");
      return;
    }

    const url = `tel:${phone}`;
    Linking.openURL(url);
  };

  const handleOpenMap = (order) => {
    const address = getDeliveryAddress(order);
    if (!address) {
      Alert.alert("No address", "This order is missing a delivery address.");
      return;
    }

    const encodedAddress = encodeURIComponent(address);
    const mapUrl = Platform.select({
      ios: `maps://?q=${encodedAddress}`,
      android: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
    });

    Linking.openURL(mapUrl);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("delivery_partner");
      await AsyncStorage.removeItem("delivery_partner_token");
      navigation.replace("DeliveryLogin");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  const renderOrderCard = ({ item }) => {
    const driverId = driver?.id || driver?.uid || "";
    const status = normalizeStatus(item.status || item.order_status || item.delivery_status);
    const isAssignedToMe = getAssignedDriverId(item) === driverId;
    const isOwnActiveOrder = isAssignedToMe && isActiveStatus(status);
    const statusPillStyle = [
      styles.statusPill,
      { backgroundColor: isOwnActiveOrder ? "#ecfdf5" : "#ecf7ff" },
    ];
    const statusTextStyle = [
      styles.statusText,
      { color: isOwnActiveOrder ? "#15803d" : "#1d4ed8" },
    ];

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={styles.orderTitle}>{item.order_number || item.orderNo || `Order ${item.id?.slice(0, 6) || "#"}`}</Text>
            <Text style={styles.orderMeta}>{getCustomerName(item)}</Text>
          </View>
          <View style={statusPillStyle}>
            <Text style={statusTextStyle}>
              {status ? status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "New"}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#64748B" />
          <Text style={styles.infoText} numberOfLines={2}>{getDeliveryAddress(item)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={16} color="#64748B" />
          <Text style={styles.infoText}>{formatCurrency(item.total_amount || item.total || item.amount || item.grand_total)}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryAction} onPress={() => handleCallCustomer(item)} activeOpacity={0.8}>
            <Ionicons name="call-outline" size={16} color="#102a1d" />
            <Text style={styles.secondaryActionText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryAction} onPress={() => handleOpenMap(item)} activeOpacity={0.8}>
            <Ionicons name="navigate-outline" size={16} color="#102a1d" />
            <Text style={styles.secondaryActionText}>Maps</Text>
          </TouchableOpacity>
        </View>

        {activeTab === "Available" && (
          <TouchableOpacity style={styles.primaryAction} onPress={() => handleAcceptOrder(item.id)} activeOpacity={0.88}>
            <Text style={styles.primaryActionText}>Accept Order</Text>
          </TouchableOpacity>
        )}

        {activeTab === "Active" && (
          <TouchableOpacity style={styles.primaryAction} onPress={() => handleMarkDelivered(item.id)} activeOpacity={0.88}>
            <Text style={styles.primaryActionText}>Mark Delivered</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (!driver) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.loadingView}>
          <ActivityIndicator size="large" color="#1d8f52" />
          <Text style={styles.loadingText}>Loading driver profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8faf8" />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.eyebrow}>Crispy Dosa</Text>
            <Text style={styles.title}>Delivery Hub</Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={18} color="#102a1d" />
          </TouchableOpacity>
        </View>

        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Ionicons name="person" size={22} color="#1d8f52" />
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driver.full_name || driver.name || "Driver"}</Text>
            <Text style={styles.driverMeta}>Restaurant ID: {driver.restaurant_id || driver.restaurantId || driver.restaurant || "Unassigned"}</Text>
          </View>
        </View>

        <View style={styles.tabBar}>
          {TAB_ITEMS.map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, active && styles.activeTab]}
              >
                <Text style={[styles.tabText, active && styles.activeTabText]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loadingView}>
            <ActivityIndicator size="large" color="#1d8f52" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderOrderCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  setRefreshing(false);
                }}
                tintColor="#1d8f52"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="basket-outline" size={36} color="#9aa9a0" />
                <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} orders</Text>
                <Text style={styles.emptyText}>New assignments will appear here.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3faf5",
  },
  container: {
    flex: 1,
    backgroundColor: "#f3faf5",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  eyebrow: {
    fontSize: 12,
    color: "#5e7d6a",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#102a1d",
    marginTop: 2,
  },
  logoutBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#edf5f0",
    alignItems: "center",
    justifyContent: "center",
  },
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 4,
    alignSelf: "stretch",
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(29, 143, 82, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#102a1d",
  },
  driverMeta: {
    fontSize: 12,
    color: "#667a71",
    marginTop: 2,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#edf5f0",
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    alignSelf: "stretch",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: "#1d8f52",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#446257",
  },
  activeTabText: {
    color: "#ffffff",
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
    width: "100%",
    alignSelf: "center",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#102a1d",
  },
  orderMeta: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 4,
    marginBottom: 12,
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f6faf7",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  secondaryActionText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#102a1d",
  },
  primaryAction: {
    backgroundColor: "#1d8f52",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  loadingView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8faf8",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#456158",
  },
  emptyState: {
    paddingTop: 50,
    paddingBottom: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#102a1d",
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 6,
  },
});
