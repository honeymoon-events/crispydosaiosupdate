import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { fetchRestaurants } from "../services/restaurantService";
import { fetchProfile, updateProfileData } from "../services/profileService";

export default function EditProfile({ navigation }) {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    mobile_number: "",
    gender: "",
    date_of_birth: "",
    preferred_restaurant: "",
  });

  const [restaurants, setRestaurants] = useState([]);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [pickerModal, setPickerModal] = useState({ visible: false, type: "", data: [], title: "" });

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadProfile(), loadRestaurants()]);
      setLoading(false);
    };
    init();
  }, []);

  const loadRestaurants = async () => {
    try {
      const data = await fetchRestaurants();
      if (data) setRestaurants(data);
    } catch (err) {
      console.log("Restaurants Error:", err.message);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await fetchProfile();
      if (data) {
        setForm({
          full_name: data.full_name || "",
          email: data.email || "",
          mobile_number: data.mobile_number || "",
          gender: data.gender || "",
          date_of_birth: data.date_of_birth || "",
          preferred_restaurant: data.preferred_restaurant || "",
        });
      }
    } catch (err) {
      console.log("Profile Error:", err.message);
      Alert.alert("Error", "Could not load profile");
    }
  };

  const updateProfile = async () => {
    if (!form.full_name.trim()) {
      Alert.alert("Validation", "Full name is required");
      return;
    }

    try {
      setSaving(true);
      await updateProfileData({
        full_name: form.full_name,
        gender: form.gender,
        date_of_birth: form.date_of_birth,
        preferred_restaurant: form.preferred_restaurant,
      });
      Alert.alert("Success", "Profile updated");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const openPicker = (type) => {
    if (type === "gender") {
      setPickerModal({
        visible: true,
        type: "gender",
        title: "Select Gender",
        data: [
          { label: "Male", value: "male" },
          { label: "Female", value: "female" },
          { label: "Other", value: "other" },
        ],
      });
    } else if (type === "restaurant") {
      setPickerModal({
        visible: true,
        type: "restaurant",
        title: "Select Restaurant",
        data: restaurants.map((r) => ({ label: r.name, value: r.name })),
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.formCard}>
          <InputItem
            label="Full Name"
            value={form.full_name}
            onChangeText={(v) => setForm({ ...form, full_name: v })}
            icon="person-outline"
          />
          <InputItem label="Email" value={form.email} icon="mail-outline" disabled />
          <InputItem label="Mobile" value={form.mobile_number} icon="call-outline" disabled />

          <SelectField
            label="Gender"
            value={form.gender ? form.gender.charAt(0).toUpperCase() + form.gender.slice(1) : "Select Gender"}
            icon="male-female-outline"
            onPress={() => openPicker("gender")}
          />

          <SelectField
            label="Date of Birth"
            value={form.date_of_birth ? new Date(form.date_of_birth).toLocaleDateString("en-GB") : "Select Date"}
            icon="calendar-outline"
            onPress={() => setShowDobPicker(true)}
          />

          <SelectField
            label="Preferred Restaurant"
            value={form.preferred_restaurant || "Select Restaurant"}
            icon="restaurant-outline"
            onPress={() => openPicker("restaurant")}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={updateProfile} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>

      {showDobPicker && (
        <DateTimePicker
          value={form.date_of_birth ? new Date(form.date_of_birth) : new Date(new Date().setFullYear(new Date().getFullYear() - 18))}
          mode="date"
          display="spinner"
          onChange={(e, date) => {
            setShowDobPicker(false);
            if (date) setForm({ ...form, date_of_birth: date.toISOString().split("T")[0] });
          }}
        />
      )}

      <Modal
        visible={pickerModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerModal({ ...pickerModal, visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{pickerModal.title}</Text>
            <ScrollView style={{ marginBottom: 15 }}>
              {pickerModal.data.map((item, id) => (
                <TouchableOpacity
                  key={id}
                  style={styles.modalItem}
                  onPress={() => {
                    if (pickerModal.type === "gender") setForm({ ...form, gender: item.value });
                    else setForm({ ...form, preferred_restaurant: item.value });
                    setPickerModal({ ...pickerModal, visible: false });
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {(form.gender === item.value || form.preferred_restaurant === item.value) && (
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setPickerModal({ ...pickerModal, visible: false })}
            >
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const InputItem = ({ label, value, onChangeText, icon, disabled }) => (
  <View style={styles.inputCard}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputRow, disabled && styles.disabledRow]}>
      <Ionicons name={icon} size={18} color="#16a34a" style={{ width: 25 }} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        placeholderTextColor="#94A3B8"
      />
      {disabled && <Ionicons name="lock-closed" size={14} color="#94A3B8" />}
    </View>
  </View>
);

const SelectField = ({ label, value, icon, onPress }) => (
  <View style={styles.inputCard}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.inputRow} onPress={onPress}>
      <Ionicons name={icon} size={18} color="#16a34a" style={{ width: 25 }} />
      <Text style={[styles.input, value.includes("Select") && { color: "#94A3B8" }]}>{value}</Text>
      <Ionicons name="chevron-down" size={14} color="#CBD5E1" />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "#fff",
    elevation: 2,
    shadowOpacity: 0.05,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  backButton: { padding: 5 },
  scrollContent: { padding: 16 },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
    shadowOpacity: 0.04,
  },
  inputCard: { marginBottom: 10 },
  label: { fontSize: 10, fontWeight: "800", color: "#94A3B8", marginBottom: 4, textTransform: "uppercase" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  disabledRow: { backgroundColor: "#F8FAFC", opacity: 0.7 },
  input: { flex: 1, fontSize: 14, color: "#334155", fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#16a34a",
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    elevation: 3,
    shadowOpacity: 0.2,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 20, maxHeight: "70%" },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#1E293B", marginBottom: 20, textAlign: "center" },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalItemText: { fontSize: 15, color: "#475569", fontWeight: "600" },
  closeBtn: { marginTop: 10, paddingVertical: 12, alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 10 },
  closeText: { fontSize: 15, color: "#64748B", fontWeight: "700" },
});
