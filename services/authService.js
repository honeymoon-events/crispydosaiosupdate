import api from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 🔹 Login User
export const loginUser = async (email, password) => {
  try {
    const res = await api.post("/login", { email, password });
    const { token, user } = res.data;

    // Save token for future requests
    await AsyncStorage.setItem("token", token);

    // Save user info for dynamic customer_id
    await AsyncStorage.setItem("user", JSON.stringify(user)); // ✅ crucial

    return { user, token };
  } catch (error) {
    console.log("Login error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Login failed");
  }
};


export const registerUser = async (data) => {
  try {
    // Mobile signup endpoint
    const res = await api.post("/register", data);

    console.log("Signup API response:", res.data);

    // Some APIs return data nested in a 'data' property
    const responseData = res.data;
    const status = responseData.status;
    const message = responseData.message || responseData.data?.message;
    const user = responseData.user || responseData.data?.user;
    const token = responseData.token || responseData.data?.token;

    // If status is 0, it means the request was received but failed logically (e.g., email exists)
    if (status === 0) {
      throw new Error(message || "Registration failed. Please try again.");
    }

    // If backend returns token + user on signup, persist them
    if (token && user) {
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));
    }

    return { token, user, message, status };
  } catch (error) {
    console.log("Register error details:", error.response?.data || error.message);

    if (error.isNetworkError) {
      throw new Error(
        "Unable to reach the server. Please check your internet connection and try again."
      );
    }

    // Handle case where error response contains a message
    const errorMsg = error.response?.data?.message || error.message || "Signup failed";
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
  }
};
