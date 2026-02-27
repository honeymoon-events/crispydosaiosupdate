import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Ionicons from "react-native-vector-icons/Ionicons";
import Voice from "@react-native-voice/voice";
import { PermissionsAndroid, Platform } from "react-native";
import { RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import useRefresh from "../../hooks/useRefresh";
import { fetchProducts } from "../../services/productService";
import { addToCart, getCart, removeFromCart } from "../../services/cartService";
import AppHeader from "../AppHeader";
import BottomBar from "../BottomBar";
import MenuModal from "../MenuModal";
import LinearGradient from "react-native-linear-gradient";

const { width } = Dimensions.get("window");
const scale = width / 400;

export default function Products({ route, navigation }) {
  const { userId, categoryId } = route.params;
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchText, setSearchText] = useState("");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [cartItems, setCartItems] = useState({});
  const [notes, setNotes] = useState({});
  const [popupIndex, setPopupIndex] = useState(0);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupTargetIds, setPopupTargetIds] = useState(null);
  const [updating, setUpdating] = useState({});
  const [pending, setPending] = useState({});
  const [noteInput, setNoteInput] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [replaceModalVisible, setReplaceModalVisible] = useState(false);
  const [replaceAction, setReplaceAction] = useState(null);

  const bannerHeight = useRef(new Animated.Value(40 * scale)).current;
  const [bannerVisible, setBannerVisible] = useState(true);
  const CONTAINS_ICONS = {
    Dairy: require("../../assets/contains/Dairy.png"),
    Gluten: require("../../assets/contains/Gluten.png"),
    Mild: require("../../assets/contains/Mild.png"),
    Nuts: require("../../assets/contains/Nuts.png"),
    Sesame: require("../../assets/contains/Sesame.png"),
    Vegan: require("../../assets/contains/Vegan.png"),
    Vegetarian: require("../../assets/contains/Vegetarian.png"),
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [textIndex, setTextIndex] = useState(0);
  const offers = [
    { colors: ["#FF416C", "#FF4B2B"], textColor: "#FFFFFF", icon: "flash" },
    { colors: ["#1D976C", "#93F9B9"], textColor: "#004D40", icon: "leaf" },
    { colors: ["#F2994A", "#F2C94C"], textColor: "#5D4037", icon: "wallet" },
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const animatedTexts = [
    "EARN £0.25 ON EVERY ORDER",
    "REFER & EARN £0.25",
    "£0.25 WELCOME BONUS",
  ];

  const highlightAmount = (text) => {
    const regex = /(£\s?0\.25|£0\.25)/i;
    const parts = text.split(regex);

    return (
      <Text style={[styles.offerText, { color: "#FFFFFF" }]} numberOfLines={1}>
        {parts[0]}
        {parts[1] && <Text style={styles.amountHighlight}>{parts[1]}</Text>}
        {parts[2]}
      </Text>
    );
  };


  // animated banner text
  useEffect(() => {
    const run = () => {
      fadeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTextIndex((p) => {
          const next = (p + 1) % animatedTexts.length;
          setActiveIndex(next % offers.length);
          return next;
        });
        run();
      });
    };
    run();
  }, []);

  const collapseBanner = () => {
    Animated.timing(bannerHeight, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start(() => setBannerVisible(false));
  };

  const expandBanner = () => {
    setBannerVisible(true);
    Animated.timing(bannerHeight, {
      toValue: 40 * scale,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  // load user
  useEffect(() => {
    (async () => {
      const u = await AsyncStorage.getItem("user");
      if (u) setUser(JSON.parse(u));
    })();
  }, []);

  // load products + cart — also re-run when `user` becomes available so quantities show immediately
  useEffect(() => {
    (async () => {
      const data = await fetchProducts(userId, categoryId);
      const list = Array.isArray(data) ? data : [];
      setProducts(list);
      setFilteredProducts(list);
      setLoading(false);

      try {
        const uid = user?.id ?? user?.customer_id;
        if (uid) {
          const res = await getCart(uid);
          if (res?.status === 1 && Array.isArray(res.data)) {
            const map = {};
            res.data.forEach((i) => {
              if (i.product_quantity > 0) map[i.product_id] = i.product_quantity;
            });
            setCartItems(map);
            return;
          }
        }

        const stored = await AsyncStorage.getItem("cart");
        if (stored) {
          const parsed = JSON.parse(stored);
          setCartItems(parsed[userId] || {});
        }
      } catch (e) {
        console.warn("Failed to load cart on init", e);
      }
    })();
  }, [userId, categoryId, user]);

  // Reload cart from AsyncStorage whenever this screen is focused
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          // Prefer server-side cart if user is signed in (keeps behavior like Categories)
          const uid = user?.id ?? user?.customer_id;
          if (uid) {
            const res = await getCart(uid);
            if (!active) return;
            if (res?.status === 1 && Array.isArray(res.data)) {
              const map = {};
              res.data.forEach((i) => {
                if (i.product_quantity > 0) map[i.product_id] = i.product_quantity;
              });
              setCartItems(map);
              // server is authoritative; clear any pending flags
              setPending({});
              return;
            }
          }

          // Fallback to local storage
          const stored = await AsyncStorage.getItem("cart");
          if (!active) return;
          if (stored) {
            const parsed = JSON.parse(stored);
            setCartItems(parsed[userId] || {});
          } else {
            setCartItems({});
          }
        } catch (e) {
          console.warn("Failed to load cart on focus", e);
        }
      })();

      return () => {
        active = false;
      };
    }, [userId])
  );

  // Persist cart state to AsyncStorage whenever it changes
  useEffect(() => {
    (async () => {
      try {
        if (!userId) return;
        const stored = await AsyncStorage.getItem("cart");
        const parsed = stored ? JSON.parse(stored) : {};
        parsed[userId] = cartItems || {};
        await AsyncStorage.setItem("cart", JSON.stringify(parsed));
      } catch (e) {
        console.warn("Failed to persist cart", e);
      }
    })();
  }, [cartItems, userId]);

  // search
  useEffect(() => {
    if (!searchText.trim()) setFilteredProducts(products);
    else {
      setFilteredProducts(
        products.filter((i) =>
          i.name.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
  }, [searchText, products]);

  const [voiceListening, setVoiceListening] = useState(false);

  useEffect(() => {
    if (!Voice) return;
    Voice.onSpeechStart = () => setVoiceListening(true);
    Voice.onSpeechEnd = () => setVoiceListening(false);
    Voice.onSpeechError = (e) => {
      console.log("onSpeechError: ", e);
      setVoiceListening(false);
    };
    Voice.onSpeechResults = (e) => {
      if (e.value && e.value.length > 0) {
        setSearchText(e.value[0]);
      }
      setVoiceListening(false);
    };
    Voice.onSpeechPartialResults = (e) => {
      if (e.value && e.value.length > 0) {
        setSearchText(e.value[0]);
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners).catch(err => console.log("Voice Cleanup Err:", err));
    };
  }, []);

  const requestAudioPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "Crispy Dosa needs access to your microphone to search.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const startVoiceSearch = async () => {
    try {
      if (!Voice || typeof Voice.start !== 'function') {
        Alert.alert("Voice Not Ready", "Voice search module is not initialized. Please restart the app or ensure permissions are granted.");
        return;
      }

      await Voice.stop().catch(() => { });
      await Voice.destroy().catch(() => { });

      const hasPermission = await requestAudioPermission();
      if (!hasPermission) return;

      setSearchText("");
      setVoiceListening(true);

      Voice.onSpeechStart = () => setVoiceListening(true);
      Voice.onSpeechResults = (e) => {
        if (e.value && e.value.length > 0) setSearchText(e.value[0]);
        setVoiceListening(false);
      };
      Voice.onSpeechError = (e) => {
        console.log("Speech Error:", e);
        setVoiceListening(false);
      };

      await Voice.start("en-US");
    } catch (e) {
      console.log("Voice Error:", e);
      setVoiceListening(false);
      if (e?.message?.includes('null')) {
        Alert.alert("Voice Error", "Native voice module not found. A clean build/re-install may be required.");
      }
    }
  };

  const cancelVoiceSearch = async () => {
    try {
      if (Voice && typeof Voice.stop === 'function') {
        await Voice.stop().catch(() => { });
      }
      setVoiceListening(false);
    } catch (e) {
      console.log(e);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Any cleanup logic here
    };
  }, []);

  const { refreshing, onRefresh } = useRefresh(async () => {
    // Reload products
    const data = await fetchProducts(userId, categoryId);
    const list = Array.isArray(data) ? data : [];
    setProducts(list);
    setFilteredProducts(list);
    // Reload cart: prefer server cart when signed-in (keeps parity with Categories)
    try {
      const uid = user?.id ?? user?.customer_id;
      if (uid) {
        const res = await getCart(uid);
        if (res?.status === 1 && Array.isArray(res.data)) {
          const map = {};
          res.data.forEach((i) => {
            if (i.product_quantity > 0) map[i.product_id] = i.product_quantity;
          });
          setCartItems(map);
        }
      } else {
        const stored = await AsyncStorage.getItem("cart");
        if (stored) {
          const parsed = JSON.parse(stored);
          setCartItems(parsed[userId] || {});
        }
      }
    } catch (e) {
      console.warn("Failed to reload cart on refresh", e);
    }
  });


  const increment = async (id) => {
    // optimistic update
    const prev = cartItems[id] || 0;
    setCartItems((p) => ({ ...p, [id]: prev + 1 }));
    // If this item is pending (added locally, waiting for special-instructions confirmation), don't sync yet
    if (!user || pending[id]) return;

    setUpdating((s) => ({ ...s, [id]: true }));
    try {
      const prod = products.find((p) => p.id == id);
      if (!prod) return;
      await addToCart({
        customer_id: user.id,
        user_id: prod.user_id,
        product_id: prod.id,
        product_name: prod.name,
        product_price: prod.price,
        product_tax: 0,
        product_quantity: 1,
        textfield: "",
      });
    } catch (e) {
      console.warn("Failed to increment cart item", e);
      // revert
      setCartItems((p) => ({ ...p, [id]: prev }));
    } finally {
      setUpdating((s) => {
        const n = { ...s };
        delete n[id];
        return n;
      });
    }
  };

  const decrement = async (id) => {
    const prev = cartItems[id] || 0;
    if (!prev) return;

    const nextQty = prev - 1;
    // optimistic update
    setCartItems((p) => {
      const u = { ...p };
      if (nextQty <= 0) delete u[id];
      else u[id] = nextQty;
      return u;
    });
    // If this item is pending (not yet synced to server), just update local state
    if (!user || pending[id]) return;

    setUpdating((s) => ({ ...s, [id]: true }));
    try {
      const prod = products.find((p) => p.id == id);
      if (!prod) return;
      // send delta -1
      await addToCart({
        customer_id: user.id,
        user_id: prod.user_id,
        product_id: prod.id,
        product_name: prod.name,
        product_price: prod.price,
        product_tax: 0,
        product_quantity: -1,
        textfield: "",
      });
    } catch (e) {
      console.warn("Failed to decrement cart item", e);
      // revert
      setCartItems((p) => ({ ...p, [id]: prev }));
    } finally {
      setUpdating((s) => {
        const n = { ...s };
        delete n[id];
        return n;
      });
    }
  };

  const startCheckout = () => {
    const ids = Object.keys(cartItems);
    if (ids.length === 0) return alert("Please add some items first.");
    setPopupTargetIds(null);
    setPopupIndex(0);
    setNoteInput(notes[ids[0]] || "");
    setPopupVisible(true);
  };

  // Add item locally and open popup for that single item
  const addAndOpenPopup = async (id) => {
    if (!user) {
      navigation.navigate("Login");
      return;
    }
    try {
      // 1. Check if ANY other restaurant has items in the cart (LocalStorage)
      const stored = await AsyncStorage.getItem("cart");
      const parsed = stored ? JSON.parse(stored) : {};

      // Filter out current restaurant and check if others have quantity > 0
      const otherRestaurants = Object.keys(parsed).filter(rid => rid != userId);
      const hasConflict = otherRestaurants.some(rid => {
        const items = parsed[rid];
        return Object.values(items).some(qty => qty > 0);
      });

      if (hasConflict) {
        setReplaceAction(() => async () => {
          // Show a small loader or just proceed
          const uid = user?.id ?? user?.customer_id;

          if (uid) {
            setLoading(true); // temporary show loader while clearing
            try {
              const res = await getCart(uid);
              if (res?.status === 1 && Array.isArray(res.data)) {
                // Remove everything from server
                await Promise.all(
                  res.data.map(item => removeFromCart(item.cart_id || item.id))
                );
              }
            } catch (err) {
              console.log("Error clearing server cart", err);
            }
          }

          // Clear everything locally
          await AsyncStorage.removeItem("cart");
          setCartItems({});
          setLoading(false);

          // Add the NEW item
          performAddItem(id);
        });
        setReplaceModalVisible(true);
        return;
      }

      // No conflict, proceed normally
      performAddItem(id);

    } catch (e) {
      console.warn("Cart validation error", e);
      performAddItem(id); // fallback
    }
  };

  const performAddItem = (id) => {
    // mark pending so it won't sync until popup confirmation
    setCartItems((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));
    setPending((s) => ({ ...s, [id]: true }));

    // Add scale animation trigger here
    triggerAddAnimation();
    triggerFlyAnimation(() => {
      setPopupTargetIds([id]);
      setPopupIndex(0);
      setNoteInput(notes[id] || "");
      setPopupVisible(true);
    });
  };

  const cartScale = useRef(new Animated.Value(1)).current;
  const flyAnim = useRef(new Animated.Value(0)).current;
  const flyY = useRef(new Animated.Value(0)).current;

  const triggerAddAnimation = () => {
    Animated.sequence([
      Animated.timing(cartScale, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(cartScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerFlyAnimation = (callback) => {
    flyAnim.setValue(1);
    flyY.setValue(0);
    Animated.parallel([
      Animated.timing(flyAnim, {
        toValue: 0,
        duration: 1000, // Even slower as requested
        useNativeDriver: true,
      }),
      Animated.timing(flyY, {
        toValue: 400,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start(() => {
      flyAnim.setValue(0);
      flyY.setValue(0);
      if (callback) callback();
    });
  };

  const handleNextPopup = async () => {
    const ids = popupTargetIds || Object.keys(cartItems);
    const pid = ids[popupIndex];
    setNotes((p) => ({ ...p, [pid]: noteInput }));

    const prod = products.find((p) => p.id == pid);
    // If this is not the single-item add flow (popupTargetIds), persist cart items for checkout
    if (prod && user) {
      // If this product was locally added (pending), send full quantity to server now.
      if (pending[pid]) {
        await addToCart({
          customer_id: user.id,
          user_id: prod.user_id,
          product_id: prod.id,
          product_name: prod.name,
          product_price: prod.price,
          product_tax: 0,
          product_quantity: cartItems[pid],
          textfield: noteInput || "",
        });
        // clear pending flag for this item
        setPending((s) => {
          const n = { ...s };
          delete n[pid];
          return n;
        });
      }
      // If not pending, we assume increments/decrements already synced with server
    }

    if (popupIndex < ids.length - 1) {
      const next = popupIndex + 1;
      setPopupIndex(next);
      setNoteInput(notes[ids[next]] || "");
    } else {
      setPopupVisible(false);
      // clear target ids if we were in single-item flow
      setPopupTargetIds(null);
      // if coming from single-item add flow, don't navigate away; otherwise, go to CartSummary
      if (!popupTargetIds) {
        navigation.navigate("CartSummary", { cartItems, notes, user });
      }
    }
  };

  const handleBackPopup = () => {
    if (popupIndex === 0) return;
    const ids = popupTargetIds || Object.keys(cartItems);
    const prev = popupIndex - 1;
    setPopupIndex(prev);
    setNoteInput(notes[ids[prev]] || "");
  };

  const selectedIds = Object.keys(cartItems);
  const popupIds = popupTargetIds || selectedIds;
  const currentProduct =
    popupVisible && popupIds.length > 0
      ? products.find((p) => p.id == popupIds[popupIndex])
      : null;

  const totalItemsInCart = Object.values(cartItems || {}).reduce((a, b) => a + b, 0);

  const renderItem = ({ item, index }) => {
    const qty = cartItems[item.id] || 0;
    const isEven = index % 2 === 0;
    return (
      <View style={styles.card}>
        <View style={styles.cardInner}>
          {/* IMAGE SECTION */}
          <View style={styles.imageWrapper}>
            <Image
              source={
                item.image
                  ? { uri: item.image }
                  : require("../../assets/restaurant.png")
              }
              style={styles.cardImg}
            />
          </View>

          {/* CONTENT SECTION */}
          <View style={styles.cardBody}>
            <View style={styles.topInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                {/* Optional: Add Veg/Non-Veg icons if needed */}
              </View>

              {!!item.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              )}

              {Array.isArray(item.contains) && item.contains.length > 0 && (
                <View style={styles.containsRow}>
                  {item.contains.map((c, index) => {
                    const rawKey = String(c).trim();
                    const key = rawKey.toLowerCase();
                    const ICON_MAP = {
                      dairy: CONTAINS_ICONS.Dairy,
                      gluten: CONTAINS_ICONS.Gluten,
                      mild: CONTAINS_ICONS.Mild,
                      nuts: CONTAINS_ICONS.Nuts,
                      sesame: CONTAINS_ICONS.Sesame,
                      vegan: CONTAINS_ICONS.Vegan,
                      vegetarian: CONTAINS_ICONS.Vegetarian,
                    };
                    const iconSource = ICON_MAP[key];
                    if (iconSource) {
                      return (
                        <Image key={index} source={iconSource} style={styles.containsIcon} />
                      );
                    }
                    // Fallback: Display text if icon is missing
                    return (
                      <Text key={index} style={{ fontSize: 10, color: '#64748B', marginRight: 6 }}>{rawKey}</Text>
                    );
                  })}
                </View>
              )}
            </View>

            {/* ACTION SECTION (PRICE + BUTTON) */}
            <View style={styles.priceRow}>
              <View style={styles.priceContainer}>
                <Text style={styles.currencySymbol}>£</Text>
                <Text style={styles.priceValue}>{item.price}</Text>
              </View>

              <View style={styles.actionContainer}>
                {qty > 0 ? (
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => decrement(item.id)}
                      disabled={!!updating[item.id]}
                      activeOpacity={0.6}
                    >
                      {updating[item.id] ? (
                        <ActivityIndicator size="small" color="#FF2B5C" />
                      ) : (
                        <Ionicons name="remove" size={18 * scale} color="#FF2B5C" />
                      )}
                    </TouchableOpacity>

                    <Text style={styles.qtyText}>{qty}</Text>

                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => increment(item.id)}
                      disabled={!!updating[item.id]}
                      activeOpacity={0.6}
                    >
                      {updating[item.id] ? (
                        <ActivityIndicator size="small" color="#FF2B5C" />
                      ) : (
                        <Ionicons name="add" size={18 * scale} color="#FF2B5C" />
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => addAndOpenPopup(item.id)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#FF2B5C", "#E23744"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.addBtn}
                    >
                      <Ionicons name="add" size={16 * scale} color="#FFF" />
                      <Text style={styles.addText}>ADD</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.safe}>
      <View style={styles.brandSection}>
        <LinearGradient
          colors={["#FF2B5C", "#FF6B8B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <AppHeader
          user={user}
          navigation={navigation}
          onMenuPress={() => setMenuVisible(true)}
          cartItems={cartItems}
          transparent
          textColor="#FFFFFF"
          barStyle="light-content"
          statusColor="#FF2B5C"
        />

        {/* DYNAMIC COLOR OFFER PILL */}
        <Animated.View style={[styles.premiumOfferWrap, { opacity: fadeAnim }]}>
          <View style={styles.premiumOfferInner}>
            <View style={styles.offerIconBadge}>
              <Ionicons
                name={offers[activeIndex]?.icon || "gift"}
                size={16 * scale}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.offerTextContainer}>
              {highlightAmount(animatedTexts[textIndex])}
            </View>
            <View style={[styles.glowingDot, { backgroundColor: '#FFFFFF' }]} />
          </View>
        </Animated.View>

        {/* SEARCH BOX */}
        <View style={styles.searchBoxPremium}>
          <Ionicons name="search-outline" size={18 * scale} color="#777" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search our delicious menu..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#aaaaaa"
          />
        </View>
      </View>

      {/* Voice Overlay - Modal for absolute visibility */}
      <Modal visible={voiceListening} transparent animationType="fade">
        <View style={styles.voiceOverlay}>
          <LinearGradient
            colors={["rgba(226,55,68,0.98)", "rgba(185,28,38,0.95)"]}
            style={styles.voiceOverlayInner}
          >
            <View style={styles.voicePulseCircle}>
              <Ionicons name="mic" size={60 * scale} color="#FFF" />
            </View>
            <Text style={styles.voiceText}>Listening...</Text>
            <Text style={styles.voiceSubtext}>Try saying "Dosa" or "Paneer"</Text>
            <TouchableOpacity style={styles.voiceClose} onPress={cancelVoiceSearch}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.voiceCloseInner}
              >
                <Ionicons name="close" size={28 * scale} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 24 }} />
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={filteredProducts}
            renderItem={renderItem}
            keyExtractor={(i) => i.id.toString()}
            ListHeaderComponent={() => (
              <View style={styles.listHeaderComp}>
                <Text style={styles.listHeaderTitle}>Discover Our Menu</Text>
                <View style={styles.listHeaderLine} />
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 150 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </View>
      )}

      {/* FLYING ANIMATION OBJECT */}
      <Animated.View style={[
        styles.flyingItem,
        {
          opacity: flyAnim,
          transform: [{ translateY: flyY }, { scale: flyAnim }]
        }
      ]}>
        <Ionicons name="fast-food" size={30} color="#FF2B5C" />
      </Animated.View>

      {/* Professional Glassmorphic sticky 'Go to Cart' button */}
      {selectedIds.length > 0 && (
        <View style={[styles.glassStickyBottom, { bottom: insets.bottom + 90 }]}>
          <Animated.View
            style={[
              styles.checkoutWrap,
              { transform: [{ scale: cartScale }] },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.checkoutBtn}
              onPress={() => navigation.navigate("CartSummary", { cartItems, notes, user })}
            >
              <LinearGradient
                colors={["#16a34a", "#15803d"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.checkoutGradient}
              >
                <Ionicons name="cart-outline" size={24 * scale} color="#ffffff" />
                <Text style={styles.checkoutText}>{`View Cart (${totalItemsInCart})`}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      <MenuModal
        visible={menuVisible}
        setVisible={setMenuVisible}
        user={user}
        navigation={navigation}
      />

      {/* Notes popup */}
      <Modal visible={popupVisible} transparent animationType="slide">
        <View style={styles.popupOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={styles.popupBox}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  flexGrow: 1,
                  paddingBottom: 24 * scale // Added breathing room at the bottom
                }}
                bounces={true}
              >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={styles.popupContent}>
                    {/* ICON CIRCLE */}
                    <View style={styles.addIconCircle}>
                      <Ionicons name="receipt-outline" size={32 * scale} color="#16a34a" />
                    </View>

                    {/* PRODUCT INFO */}
                    <View style={styles.popupProductHeader}>
                      {currentProduct && (
                        <Text style={styles.popupTitle}>{currentProduct.name}</Text>
                      )}
                      {currentProduct && (
                        <Text style={styles.popupPriceText}>£{currentProduct.price}</Text>
                      )}
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.popupHint}>
                      Special instructions (e.g. "Spicy", "No Onion")
                    </Text>

                    <TextInput
                      style={styles.popupInput}
                      placeholder="Type your instructions here..."
                      value={noteInput}
                      onChangeText={setNoteInput}
                      multiline
                      placeholderTextColor="#94A3B8"
                      selectionColor="#16a34a"
                    />

                    {/* BUTTONS */}
                    <View style={styles.popupRow}>
                      {popupIndex > 0 && (
                        <TouchableOpacity
                          style={styles.popupSecondaryBtn}
                          onPress={handleBackPopup}
                        >
                          <Text style={styles.popupSecondaryText}>Back</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.popupPrimaryWrap}
                        onPress={handleNextPopup}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={["#16a34a", "#15803d"]}
                          style={styles.popupPrimaryBtn}
                        >
                          <Text style={styles.popupPrimaryText}>
                            {popupIndex === popupIds.length - 1 ? "Add to Cart" : "Continue"}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        setPopupVisible(false);
                        setPopupTargetIds(null);
                      }}
                      style={styles.popupDismissBtn}
                    >
                      <Text style={styles.popupDismissText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableWithoutFeedback>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Replace Cart Modal */}
      <Modal
        visible={replaceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReplaceModalVisible(false)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.replaceBox}>
            <View style={styles.replaceInner}>
              <View style={styles.replaceIconCircle}>
                <Ionicons name="cart" size={36 * scale} color="#FB7185" />
              </View>

              <Text style={styles.replaceTitle}>Replace Cart Items?</Text>
              <Text style={styles.replaceMessage}>
                Your cart contains items from another restaurant. Do you want to discard them
                and start a new order with this restaurant?
              </Text>

              <View style={styles.popupRow}>
                <TouchableOpacity
                  style={[styles.popupSecondaryBtn, styles.replaceCancelBtn]}
                  onPress={() => setReplaceModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.popupSecondaryText, styles.replaceCancelLabel]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.replaceConfirmWrap}
                  onPress={() => {
                    setReplaceModalVisible(false);
                    if (replaceAction) replaceAction();
                  }}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={["#FB7185", "#E11D48"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.popupPrimaryBtn}
                  >
                    <Text style={styles.popupPrimaryText}>Replace</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <BottomBar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  // IMMERSIVE BRAND SECTION
  brandSection: {
    paddingBottom: 20,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    zIndex: 10,
  },
  premiumOfferWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 50,
    overflow: 'hidden',
  },
  premiumOfferInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  offerIconBadge: {
    width: 32 * scale,
    height: 32 * scale,
    borderRadius: 16 * scale,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  offerText: {
    fontSize: 16 * scale,
    fontFamily: "PoppinsBold",
    fontWeight: "900",
    letterSpacing: 0.6,
    color: "#FFFFFF",
  },

  glowingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E23744",
    marginLeft: 10,
  },
  searchBoxPremium: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 20,
    paddingHorizontal: 18,
    height: 56,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  safe: { flex: 1, backgroundColor: "#f8f8f8" },

  amountHighlight: {
    color: "#FBFF00",
    fontWeight: "900",
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  containsRow: {
    flexDirection: "row",
    marginTop: 6,
    flexWrap: "wrap",
  },

  containsIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
    marginRight: 6,
    marginBottom: 4,
  },

  banner: {
    width: "100%",
    backgroundColor: "#16a34a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  bannerLeft: { flexDirection: "row", alignItems: "center" },
  bannerText: {
    color: "#ffffff",
    fontSize: 13 * scale,
    fontWeight: "700",
    marginLeft: 8,
    maxWidth: width * 0.7,
  },
  bannerChip: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16a34a",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 5,
    marginTop: 10,
  },
  bannerChipText: {
    color: "#ffffff",
    fontSize: 13 * scale,
    fontWeight: "600",
    marginLeft: 6,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 46,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    elevation: 3,
    marginHorizontal: 16,
    marginTop: 14,
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14 * scale,
    color: "#222222",
  },

  card: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    // Elegant, subtle shadow for boutique feel
    shadowColor: "#1e293b",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardInner: {
    flexDirection: 'row',
    padding: 12 * scale, // Reduced from 14 for a tighter look
    alignItems: 'center',
  },
  imageWrapper: {
    width: 100 * scale,
    height: 100 * scale,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardImg: {
    width: '100%',
    height: '100%',
    resizeMode: "contain",
  },
  cardBody: {
    flex: 1,
    marginLeft: 18 * scale,
    minHeight: 85 * scale,
    justifyContent: 'space-between',
    paddingVertical: 2 * scale,
  },
  topInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17.5 * scale,
    fontFamily: "PoppinsBold",
    fontWeight: "700",
    color: "#0F172A",
    includeFontPadding: false,
    lineHeight: 24 * scale,
  },
  cardDesc: {
    fontSize: 13 * scale,
    fontFamily: "PoppinsMedium",
    color: "#64748B",
    lineHeight: 19 * scale,
    includeFontPadding: false,
  },
  containsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  containsIcon: {
    width: 18 * scale,
    height: 18 * scale,
    marginRight: 8,
    opacity: 0.9,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: "space-between",
    marginTop: 10 * scale,
  },
  priceContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10 * scale,
  },
  currencySymbol: {
    fontSize: 14 * scale,
    fontFamily: "PoppinsBold",
    color: "#FF2B5C",
    fontWeight: '900',
    marginRight: 2,
  },
  priceValue: {
    fontSize: 18 * scale, // Reduced from 21 to prevent overlap
    fontFamily: "PoppinsBold",
    fontWeight: "700",
    color: "#0F172A",
    includeFontPadding: false,
  },
  actionContainer: {
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 110 * scale,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    height: 40 * scale,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  qtyBtn: {
    width: 32 * scale,
    height: 32 * scale,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
  },
  qtyText: {
    paddingHorizontal: 14,
    fontSize: 18 * scale,
    fontFamily: "PoppinsBold",
    fontWeight: '900',
    color: "#000000",
    textAlign: 'center',
    minWidth: 40 * scale,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    height: 40 * scale,
    borderRadius: 12,
    width: 110 * scale, // Fixed width to guarantee visibility
    backgroundColor: "#FF2B5C",
    shadowColor: "#FF2B5C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  addText: {
    color: "#FFFFFF",
    fontSize: 14 * scale,
    fontFamily: "PoppinsBold",
    fontWeight: "900",
    marginLeft: 4,
    letterSpacing: 0.8,
    includeFontPadding: false,
    textTransform: 'uppercase',
  },

  checkoutBtn: {
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    overflow: 'hidden',
  },
  checkoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56 * scale,
    borderRadius: 15,
  },
  checkoutText: {
    color: "#ffffff",
    fontSize: 17 * scale,
    fontFamily: "PoppinsBold",
    fontWeight: "900",
    marginLeft: 10,
    letterSpacing: 0.6,
  },

  glassStickyBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  checkoutWrap: {
    width: '100%',
    zIndex: 101,
  },
  listHeaderComp: {
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listHeaderTitle: {
    fontSize: 20 * scale,
    fontFamily: "PoppinsBold",
    color: "#1C1C1C",
    letterSpacing: -0.5,
    fontWeight: '700',
    marginRight: 15,
  },
  listHeaderLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E0E0E0",
    borderRadius: 1,
  },

  /* POPUP PREMIUM (MATCHING SIGN OUT STYLE) */
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)", // Darker, more premium backdrop
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  popupBox: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%", // Ensure it doesn't hit screen edges
    borderRadius: 30,
    overflow: "hidden",
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    backgroundColor: "#fff",
    alignSelf: "center",
  },
  replaceBox: {
    width: "90%",
    maxWidth: 380,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  replaceInner: {
    paddingTop: 22 * scale,
    paddingBottom: 24 * scale,
    paddingHorizontal: 26 * scale,
    alignItems: "center",
    width: "100%",
  },

  /* ICONS */
  replaceIconCircle: {
    width: 64 * scale,
    height: 64 * scale,
    borderRadius: 32 * scale,
    backgroundColor: "rgba(255, 43, 92, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255, 43, 92, 0.2)",
  },
  addIconCircle: {
    width: 48 * scale, // Reduced from 64
    height: 48 * scale,
    borderRadius: 24 * scale,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12, // Reduced from 20
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },

  /* HEADERS */
  replaceTitle: {
    fontSize: 24 * scale,
    fontFamily: 'PoppinsBold',
    color: '#020617',
    marginBottom: 12,
    textAlign: "center",
    fontWeight: '900',
  },
  replaceMessage: {
    fontSize: 16 * scale,
    fontFamily: "PoppinsMedium",
    color: "#111827",
    lineHeight: 24 * scale,
    marginBottom: 26,
    textAlign: "center",
  },

  popupContent: {
    paddingTop: 22 * scale,
    paddingBottom: 22 * scale,
    paddingHorizontal: 24 * scale,
    alignItems: "center",
    width: "100%",
  },

  popupProductHeader: {
    alignItems: 'center',
    marginBottom: 10, // Reduced from 16
    width: '100%',
  },
  popupTitle: {
    fontSize: 18 * scale, // Reduced from 20
    fontFamily: "PoppinsSemiBold",
    color: "#0F172A",
    textAlign: 'center',
    marginBottom: 0,
  },
  popupPriceText: {
    fontSize: 18 * scale, // Reduced from 22
    fontFamily: "PoppinsBold",
    fontWeight: "900",
    color: "#16a34a",
    marginTop: 2,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 10, // Reduced from 16
  },
  popupDismissBtn: {
    marginTop: 16,
    padding: 8,
  },
  popupDismissText: {
    fontSize: 14 * scale,
    fontFamily: "PoppinsBold",
    color: "#94A3B8",
    fontWeight: '700',
  },
  popupCloseBtn: {
    padding: 4,
  },

  popupHint: {
    fontSize: 13 * scale,
    fontFamily: "PoppinsMedium",
    color: "#64748B",
    marginBottom: 10,
    textAlign: 'center',
    width: '100%',
  },

  popupInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    minHeight: 70 * scale, // Highly reduced from 90
    maxHeight: 120 * scale, // Cap growth
    width: '100%',
    borderRadius: 16,
    padding: 12,
    textAlignVertical: "top",
    fontSize: 14 * scale,
    color: "#0F172A",
    marginBottom: 15,
    fontFamily: 'PoppinsMedium',
    textAlign: 'left',
  },

  /* BUTTONS (MATCHING SIGN OUT STYLE) */
  popupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: '100%'
  },
  popupSecondaryBtn: {
    flex: 1,
    height: 48 * scale,
    alignItems: "center",
    justifyContent: 'center',
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  popupSecondaryText: {
    fontSize: 15 * scale,
    fontFamily: "PoppinsBold",
    color: "#64748B",
    fontWeight: '800',
  },

  popupPrimaryWrap: {
    flex: 2,
    borderRadius: 15,
    overflow: "hidden",
  },
  replaceConfirmWrap: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  replaceCancelBtn: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  replaceCancelLabel: {
    color: "#0F172A",
  },
  popupPrimaryBtn: {
    height: 46 * scale, // Reduced from 54
    alignItems: "center",
    justifyContent: 'center',
    width: '100%'
  },
  popupPrimaryText: {
    fontSize: 15 * scale,
    fontFamily: "PoppinsBold",
    fontWeight: "900",
    color: "#ffffff",
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  popupTopRow: { display: 'none' }, // hidden now
  popupBackIconWrap: { display: 'none' }, // hidden
  popupTopTitle: { display: 'none' }, // hidden
  replaceCancelText: { display: 'none' },
  replaceConfirmText: { display: 'none' },
  popupTitleRow: { display: 'none' },
  voiceOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  voiceOverlayInner: {
    width: '100%',
    height: '100%',
    justifyContent: "center",
    alignItems: "center",
  },
  voicePulseCircle: {
    width: 140 * scale,
    height: 140 * scale,
    borderRadius: 70 * scale,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  voiceText: {
    fontSize: 24 * scale,
    fontFamily: "PoppinsBold",
    color: "#FFF",
    marginTop: 20,
  },
  voiceSubtext: {
    fontSize: 14 * scale,
    fontFamily: "PoppinsMedium",
    color: "rgba(255,255,255,0.8)",
    marginTop: 10,
  },
  voiceClose: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  voiceCloseInner: {
    width: 60 * scale,
    height: 60 * scale,
    borderRadius: 30 * scale,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  flyingItem: {
    position: 'absolute',
    top: 300,
    left: width / 2 - 15,
    zIndex: 9999,
  },
});
