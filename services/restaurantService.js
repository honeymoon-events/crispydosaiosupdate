// restaurantService.js
import firestore from '@react-native-firebase/firestore';
import { isRestaurantDeliveryEnabled } from '../utils/restaurantDelivery';

export { isRestaurantDeliveryEnabled };

const getSafeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/^http:\/\//i, 'https://').replace(/ /g, '%20');
};

// Fetch all restaurants
export const fetchRestaurants = async (lat, lng) => {
  try {
    const snapshot = await firestore().collection('restaurant').get();
    return snapshot.docs.map(doc => {
      const restaurant = doc.data();
      return {
        id: doc.id,
        userId: restaurant.user_id || doc.id,
        name: restaurant.restaurant_name || restaurant.name || "Crispy Dosa",
        address: restaurant.restaurant_address || restaurant.address || "",
        photo: getSafeUrl(restaurant.restaurant_photo || restaurant.photo),
        instore: restaurant.instore || 0,
        kerbside: restaurant.kerbside || 0,
        delivery: restaurant.delivery || restaurant.home_delivery || restaurant.delivery_available || 0,
        distance: 0,
      };
    });
  } catch (error) {
    console.error("Fetch Restaurants Error:", error);
    return [];
  }
};

// Fetch single restaurant by userId
export const fetchRestaurantDetails = async (userId) => {
  try {
    let doc = await firestore().collection('restaurant').doc(String(userId)).get();
    if (doc.exists) {
      const restaurant = doc.data();
      const lat = Number(restaurant.latitude ?? restaurant.lat ?? restaurant.location?.latitude ?? restaurant.location?.lat ?? 0);
      const lng = Number(restaurant.longitude ?? restaurant.lng ?? restaurant.long ?? restaurant.location?.longitude ?? restaurant.location?.lng ?? 0);
      const baseFee = Number(
        restaurant.base_delivery_fee ??
        restaurant.delivery_charges ??
        restaurant.delivery_fee ??
        restaurant.deliveryCharge ??
        restaurant.delivery_cost ??
        0,
      );
      const baseDistance = Number(
        restaurant.base_delivery_distance ??
        restaurant.base_distance ??
        restaurant.delivery_radius ??
        restaurant.max_delivery_radius ??
        restaurant.delivery_distance ??
        restaurant.distance_km ??
        0,
      );

      return {
        id: doc.id,
        ...restaurant,
        latitude: Number.isFinite(lat) && lat !== 0 ? lat : null,
        longitude: Number.isFinite(lng) && lng !== 0 ? lng : null,
        lat: Number.isFinite(lat) && lat !== 0 ? lat : null,
        lng: Number.isFinite(lng) && lng !== 0 ? lng : null,
        base_delivery_fee: Number.isFinite(baseFee) ? baseFee : 0,
        delivery_fee: Number.isFinite(baseFee) ? baseFee : 0,
        base_delivery_distance: Number.isFinite(baseDistance) ? baseDistance : 0,
        restaurant_photo: getSafeUrl(restaurant.restaurant_photo || restaurant.photo),
        photo: getSafeUrl(restaurant.restaurant_photo || restaurant.photo),
      };
    }

    const qSnap = await firestore().collection('restaurant').where('user_id', '==', String(userId)).limit(1).get();
    if (!qSnap.empty) {
      const d = qSnap.docs[0];
      return { id: d.id, ...d.data() };
    }

    const qSnapNum = await firestore().collection('restaurant').where('user_id', '==', Number(userId)).limit(1).get();
    if (!qSnapNum.empty) {
      const d = qSnapNum.docs[0];
      return { id: d.id, ...d.data() };
    }

    return null;
  } catch (error) {
    console.error("Restaurant Details API Error:", error);
    return null;
  }
};

export const fetchRestaurantTimings = async (restaurantId) => {
  try {
    const doc = await firestore().collection('restaurant').doc(String(restaurantId)).get();
    if (doc.exists && doc.data().timings) return doc.data().timings;
    return [];
  } catch (error) {
    console.error("Fetch Timings Error:", error);
    return [];
  }
};

export const fetchStripeKey = async (restaurantId) => {
  try {
    const doc = await firestore().collection('restaurant').doc(String(restaurantId)).get();
    if (doc.exists && doc.data().stripe_publishable_key) return doc.data().stripe_publishable_key;
    return null;
  } catch (error) {
    console.error("Fetch Stripe Key Error:", error);
    return null;
  }
};