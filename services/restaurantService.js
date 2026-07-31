// restaurantService.js
import firestore from '@react-native-firebase/firestore';

const IMAGE_BASE_URL = "https://api.crispydosa.info/uploads";

const getSafeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  return url.trim();
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
        distance: 0,
      };
    });
  } catch (error) {
    console.error("Restaurant API Error:", error);
    return [];
  }
};

// Fetch single restaurant by userId
export const fetchRestaurantDetails = async (userId) => {
  try {
    const doc = await firestore().collection('restaurant').doc(String(userId)).get();
    if (doc.exists) {
      const restaurant = doc.data();
      return {
        id: doc.id,
        ...restaurant,
        restaurant_photo: getSafeUrl(restaurant.restaurant_photo || restaurant.photo),
        photo: getSafeUrl(restaurant.restaurant_photo || restaurant.photo),
      };
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