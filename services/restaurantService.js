// restaurantService.js
import api from "../config/api";

// Fetch all restaurants
export const fetchRestaurants = async () => {
  try {
    const res = await api.get("/restaurants");
    if (res.data.status === 1) {
      return res.data.data.map(r => ({
        id: r.id,
        userId: r.userid,
        name: r.name,
        address: r.address,
        photo: r.photo ? r.photo.replace("http://", "https://") : r.photo,
        instore: r.instore,
        kerbside: r.kerbside,
        latitude: r.latitude,
        longitude: r.longitude,
      }));
    }
    return [];
  } catch (error) {
    console.log("Restaurant API Error:", error.response?.data || error.message);
    return [];
  }
};

// Fetch single restaurant by userId
export const fetchRestaurantDetails = async (userId) => {
  try {
    const res = await api.get(`/restaurant/${userId}`);
    if (res.data.status === 1 && res.data.data.length > 0) {
      const restaurant = res.data.data[0];
      if (restaurant.restaurant_photo) {
        restaurant.restaurant_photo = restaurant.restaurant_photo.replace("http://", "https://");
      }
      return restaurant;
    }
    return null;
  } catch (error) {
    console.log("Restaurant Details API Error:", error.response?.data || error.message);
    return null;
  }
};

export const fetchRestaurantTimings = async (restaurantId) => {
  try {
    const res = await api.get(`/restaurant-timings/${restaurantId}`);
    if (res.data.status === 1) {
      return res.data.data; // array of timings
    }
    return [];
  } catch (error) {
    console.log("Fetch Timings Error:", error.response?.data || error.message);
    return [];
  }
};

export const fetchStripeKey = async (restaurantId) => {
  try {
    const res = await api.get(`/stripe/restaurant-key?restaurant_id=${restaurantId}`);
    if (res.data.status === 1) {
      return res.data.publishableKey;
    }
    return null;
  } catch (error) {
    console.log("Fetch Stripe Key Error:", error.response?.data || error.message);
    return null;
  }
};
