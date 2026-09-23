import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import BottomNav from "./BottomNav";

type Mode = "lost" | "found";

type FormErrors = {
  itemName?: string;
  category?: string;
  dateTime?: string;
  location?: string;
  contact?: string;
};

const CATEGORIES = ["Electronics & Gadgets", "Bottles & Containers", "Bags & Backpacks", "Documents & Cards", "Clothing & Accessories", "Other"];

export default function ReportItemScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === "found" ? "found" : "lost");

  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const clearError = (key: keyof FormErrors) => {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!itemName.trim()) next.itemName = "Item name is required.";
    if (!category) next.category = "Please select a category.";
    if (!dateTime.trim()) next.dateTime = mode === "lost" ? "When did you lose it?" : "When did you find it?";
    if (!location.trim()) next.location = "Campus location is required.";
    if (!contact.trim()) next.contact = "A contact number is required so we can reach you.";
    else if (contact.replace(/[^0-9]/g, "").length < 10) next.contact = "Enter a valid contact number.";
    return next;
  };

  const handlePickPhoto = () => {
    // Placeholder — wire up expo-image-picker here for a real device picker.
    setPhotoName(mode === "lost" ? "lost_item_photo.jpg" : "found_item_photo.jpg");
  };

  const handleSubmit = () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      console.log("Submitting report", { mode, itemName, category, dateTime, location, contact, photoName });
      Alert.alert(mode === "lost" ? "Lost item reported" : "Found item reported", "Your report has been added to the Campus Registry Feed for matching.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }, 800);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Report an Item</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Lost / Found toggle */}
      <View style={styles.modeToggle}>
        <Pressable
          style={[styles.modeButton, mode === "lost" && styles.modeButtonActiveLost]}
          onPress={() => {
            setMode("lost");
            setErrors({});
          }}
        >
          <Ionicons name="search" size={15} color={mode === "lost" ? "#fff" : "#333"} />
          <Text style={mode === "lost" ? styles.modeButtonTextActive : styles.modeButtonText}>Report Lost</Text>
        </Pressable>
        <Pressable
          style={[styles.modeButton, mode === "found" && styles.modeButtonActiveFound]}
          onPress={() => {
            setMode("found");
            setErrors({});
          }}
        >
          <Ionicons name="document-text-outline" size={15} color={mode === "found" ? "#111" : "#333"} />
          <Text style={mode === "found" ? styles.modeButtonTextActiveFound : styles.modeButtonText}>Report Found</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        <Text style={styles.formIntro}>Fill in the key details below to broadcast and match against the USTP campus security registry.</Text>

        <Text style={styles.label}>ITEM NAME</Text>
        <View style={[styles.inputWrapper, errors.itemName && styles.inputWrapperError]}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Dell XPS 13 Laptop Charger & Dongle"
            placeholderTextColor="#8b8fa8"
            value={itemName}
            onChangeText={(t) => {
              setItemName(t);
              clearError("itemName");
            }}
          />
        </View>
        {errors.itemName ? <Text style={styles.errorText}>{errors.itemName}</Text> : null}

        <Text style={styles.label}>CATEGORY</Text>
        <Pressable style={[styles.inputWrapper, styles.selectWrapper, errors.category && styles.inputWrapperError]} onPress={() => setCategoryOpen((o) => !o)}>
          <Text style={[styles.input, !category && { color: "#8b8fa8" }]}>{category || "Select a category"}</Text>
          <Ionicons name={categoryOpen ? "chevron-up" : "chevron-down"} size={16} color="#8b8fa8" />
        </Pressable>
        {categoryOpen && (
          <View style={styles.dropdown}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c}
                style={styles.dropdownItem}
                onPress={() => {
                  setCategory(c);
                  setCategoryOpen(false);
                  clearError("category");
                }}
              >
                <Text style={styles.dropdownItemText}>{c}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}

        <Text style={styles.label}>DATE / TIME</Text>
        <View style={[styles.inputWrapper, errors.dateTime && styles.inputWrapperError]}>
          <Ionicons name="time-outline" size={16} color="#8b8fa8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.input}
            placeholder="e.g. Oct 24, 2:30 PM"
            placeholderTextColor="#8b8fa8"
            value={dateTime}
            onChangeText={(t) => {
              setDateTime(t);
              clearError("dateTime");
            }}
          />
        </View>
        {errors.dateTime ? <Text style={styles.errorText}>{errors.dateTime}</Text> : null}

        <Text style={styles.label}>CAMPUS LOCATION</Text>
        <View style={[styles.inputWrapper, errors.location && styles.inputWrapperError]}>
          <Ionicons name="location-outline" size={16} color="#8b8fa8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.input}
            placeholder="e.g. ICT Building - 3rd Floor Lab 304"
            placeholderTextColor="#8b8fa8"
            value={location}
            onChangeText={(t) => {
              setLocation(t);
              clearError("location");
            }}
          />
        </View>
        {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}

        <Text style={styles.label}>CONTACT NUMBER</Text>
        <View style={[styles.inputWrapper, errors.contact && styles.inputWrapperError]}>
          <Ionicons name="call-outline" size={16} color="#8b8fa8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.input}
            placeholder="+63 917 555 1234"
            placeholderTextColor="#8b8fa8"
            keyboardType="phone-pad"
            value={contact}
            onChangeText={(t) => {
              setContact(t);
              clearError("contact");
            }}
          />
        </View>
        {errors.contact ? <Text style={styles.errorText}>{errors.contact}</Text> : null}

        <Text style={styles.label}>PHOTO (OPTIONAL)</Text>
        <Text style={styles.helperText}>JPG or PNG, max 10MB</Text>
        <Pressable style={styles.uploadBox} onPress={handlePickPhoto}>
          <View style={styles.uploadIconCircle}>
            <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
          </View>
          <Text style={styles.uploadText}>Upload or drag photo here</Text>
          {photoName && (
            <View style={styles.filePill}>
              <Ionicons name="image-outline" size={14} color="#333" />
              <Text style={styles.filePillText}>{photoName}</Text>
              <Pressable onPress={() => setPhotoName(null)} hitSlop={8}>
                <Ionicons name="close" size={14} color="#888" />
              </Pressable>
            </View>
          )}
        </Pressable>

        <Pressable style={[styles.submitButton, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitButtonText}>{submitting ? "Submitting..." : "Submit Report"}</Text>
          {!submitting && <Ionicons name="arrow-forward" size={17} color="#fff" />}
        </Pressable>
      </ScrollView>

      <BottomNav active="report" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#1e2340" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepBadge: { backgroundColor: "#f97316", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  stepBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },

  modeToggle: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 16 },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    paddingVertical: 11,
  },
  modeButtonActiveLost: { backgroundColor: "#f97316" },
  modeButtonActiveFound: { backgroundColor: "#fff" },
  modeButtonText: { color: "#cbd5e1", fontSize: 13, fontWeight: "600" },
  modeButtonTextActive: { color: "#fff", fontSize: 13, fontWeight: "700" },
  modeButtonTextActiveFound: { color: "#111", fontSize: 13, fontWeight: "700" },

  form: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, flexGrow: 1 },
  formIntro: { fontSize: 12, color: "#666", lineHeight: 17, marginBottom: 18 },

  label: { fontSize: 11, fontWeight: "700", color: "#555", letterSpacing: 0.4, marginBottom: 6, marginTop: 4 },
  helperText: { fontSize: 10, color: "#999", marginBottom: 8, marginTop: -4 },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 4,
  },
  inputWrapperError: { borderColor: "#dc2626", backgroundColor: "#fef2f2" },
  selectWrapper: { justifyContent: "space-between" },
  input: { flex: 1, fontSize: 13, color: "#111" },
  errorText: { fontSize: 11, color: "#dc2626", marginBottom: 10, marginTop: 2 },

  dropdown: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
  },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  dropdownItemText: { fontSize: 13, color: "#333" },

  uploadBox: {
    borderWidth: 1.5,
    borderColor: "#fdba74",
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
    marginTop: 4,
    marginBottom: 22,
  },
  uploadIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: { fontSize: 12, color: "#9a3412", fontWeight: "600" },
  filePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
  filePillText: { fontSize: 11, color: "#333" },

  submitButton: {
    flexDirection: "row",
    backgroundColor: "#f97316",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
