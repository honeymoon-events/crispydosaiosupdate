import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from "@react-native-async-storage/async-storage";

// 🔹 Login User
export const loginUser = async (email, password) => {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    const firebaseUser = userCredential.user;
    const userDoc = await firestore().collection('customers').doc(firebaseUser.uid).get();

    if (!userDoc.exists) {
      throw new Error("Customer profile not found in database.");
    }

    const user = { id: firebaseUser.uid, ...userDoc.data() };
    const token = await firebaseUser.getIdToken();
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));
    return { user, token };
  } catch (error) {
    console.log("Login error:", error.message);
    throw new Error(error.message || "Login failed");
  }
};

export const registerUser = async (data) => {
  try {
    const { email, password, full_name } = data;
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    await userCredential.user.updateProfile({ displayName: full_name });
    return { status: 1, message: "Account created successfully!" };
  } catch (error) {
    console.log("Register error:", error.message);
    throw new Error(error.message || "Signup failed");
  }
};
