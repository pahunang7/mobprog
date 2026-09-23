import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

type Mode = "lost" | "found";

type FormErrors = {
  itemName?: string;
  category?: string;
  dateTime?: string;
  location?: string;
  contact?: string;
};

const CATEGORIES = ["Electronics & Gadgets", "Bottles & Containers", "Bags & Backpacks", "Documents & Cards", "Clothing & Accessories", "Other"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_BACK = 14; // how many past days the picker offers — nothing further back, nothing in the future

function dayLabel(daysAgo: number, date: Date) {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function to24Hour(hour12: number, period: "AM" | "PM") {
  if (period === "AM") return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

export default function ReportItemScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === "found" ? "found" : "lost");

  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // --- Date/Time picker state ---
  const [dateTime, setDateTime] = useState(""); // final formatted value, e.g. "Today, 2:30 PM"
  const [pickerVisible, setPickerVisible] = useState(false);
  const [dayIndex, setDayIndex] = useState(0); // 0 = today, 1 = yesterday, ...
  const [hour12, setHour12] = useState(12);
  const [minute, setMinute] = useState(0); // 0,5,10 ... 55
  const [period, setPeriod] = useState<"AM" | "PM">("PM");

  const now = new Date();

  const days = useMemo(() => {
    return Array.from({ length: DAYS_BACK }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      return { daysAgo: i, date: d, label: dayLabel(i, d) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When "Today" is selected, the time can't be later than right now.
  const isTodaySelected = dayIndex === 0;
  const wouldBeFuture = (h: number, m: number, p: "AM" | "PM") => {
    if (!isTodaySelected) return false;
    const h24 = to24Hour(h, p);
    if (h24 > now.getHours()) return true;
    if (h24 === now.getHours() && m > now.getMinutes()) return true;
    return false;
  };

  const openPicker = () => {
    // Default to "now" (clamped to a 5-min step) each time it's opened fresh
    if (!dateTime) {
      let h = now.getHours() % 12;
      if (h === 0) h = 12;
      setHour12(h);
      setMinute(Math.floor(now.getMinutes() / 5) * 5);
      setPeriod(now.getHours() >= 12 ? "PM" : "AM");
      setDayIndex(0);
    }
    setPickerVisible(true);
  };

  const stepMinute = (dir: 1 | -1) => {
    setMinute((m) => {
      let next = m + dir * 5;
      if (next > 55) next = 0;
      if (next < 0) next = 55;
      if (wouldBeFuture(hour12, next, period)) return m; // blocked — would land in the future
      return next;
    });
  };

  const stepHour = (dir: 1 | -1) => {
    setHour12((h) => {
      let next = h + dir;
      if (next > 12) next = 1;
      if (next < 1) next = 12;
      if (wouldBeFuture(next, minute, period)) return h;
      return next;
    });
  };

  const togglePeriod = () => {
    setPeriod((p) => {
      const next = p === "AM" ? "PM" : "AM";
      if (wouldBeFuture(hour12, minute, next)) return p;
      return next;
    });
  };

  const confirmDateTime = () => {
    const label = days[dayIndex].label;
    const formatted = `${label}, ${hour12}:${String(minute).padStart(2, "0")} ${period}`;
    setDateTime(formatted);
    if (errors.dateTime) setErrors((prev) => ({ ...prev, dateTime: undefined }));
    setPickerVisible(false);
  };

  const clearError = (key: keyof FormErrors) => {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // PH mobile numbers: digits only, must start with "09", exactly 11 digits total (e.g. 09171234567)
  const handleContactChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "").slice(0, 11);
    setContact(digits);
    clearError("contact");
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!itemName.trim()) next.itemName = "Item name is required.";
    if (!category) next.category = "Please select a category.";
    if (!dateTime) next.dateTime = mode === "lost" ? "When did you lose it?" : "When did you find it?";
    if (!location.trim()) next.location = "Campus location is required.";
    if (!contact.trim()) next.contact = "A contact number is required so we can reach you.";
    else if (!/^09\d{9}$/.test(contact)) next.contact = `Must start with 09 and have 11 digits (${contact.length}/11).`;
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
      console.log("Submitting report", { mode, itemName, category, dateTime, location, contact, photoName });
      setSubmitting(false);
      setSubmitted(true);

      // Let the "Submitted" state show briefly, then dismiss the modal.
      setTimeout(() => {
        router.back();
      }, 900);
    }, 800);
  };

  return (
    <View style={styles.overlay}>
      {/* Tapping the dimmed backdrop dismisses, same as tapping the X */}
      <Pressable style={StyleSheet.absoluteFill} onPress={submitted ? undefined : () => router.back()} />

      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Report an Item</Text>
          <Pressable onPress={submitted ? undefined : () => router.back()} hitSlop={10} disabled={submitted}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
        </View>

        {/* Lost / Found switcher — single pill bar, active side gets the filled capsule */}
        <View style={styles.modeBarWrap}>
          <View style={styles.modeBar}>
            <Pressable
              style={[styles.modeSegment, mode === "lost" && styles.modeSegmentActiveLost]}
              onPress={() => {
                setMode("lost");
                setErrors({});
              }}
            >
              <Ionicons name="search" size={16} color={mode === "lost" ? "#fff" : "#8b90a8"} />
              {mode === "lost" && <Text style={styles.modeSegmentTextActive}>Report Lost</Text>}
            </Pressable>
            <Pressable
              style={[styles.modeSegment, mode === "found" && styles.modeSegmentActiveFound]}
              onPress={() => {
                setMode("found");
                setErrors({});
              }}
            >
              <Ionicons name="document-text-outline" size={16} color={mode === "found" ? "#111" : "#8b90a8"} />
              {mode === "found" && <Text style={styles.modeSegmentTextActiveFound}>Report Found</Text>}
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
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
          <Pressable style={[styles.inputWrapper, errors.dateTime && styles.inputWrapperError]} onPress={openPicker}>
            <Ionicons name="time-outline" size={16} color="#8b8fa8" style={{ marginRight: 6 }} />
            <Text style={[styles.input, !dateTime && { color: "#8b8fa8" }]}>{dateTime || "Select date & time"}</Text>
            <Ionicons name="chevron-down" size={16} color="#8b8fa8" />
          </Pressable>
          <Text style={styles.helperNote}>Can't be a future date or time.</Text>
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
            <TextInput style={styles.input} placeholder="09171234567" placeholderTextColor="#8b8fa8" keyboardType="number-pad" maxLength={11} value={contact} onChangeText={handleContactChange} />
            {contact.length === 11 && /^09\d{9}$/.test(contact) && <Ionicons name="checkmark-circle" size={16} color="#16a34a" />}
          </View>
          {errors.contact ? <Text style={styles.errorText}>{errors.contact}</Text> : <Text style={styles.helperNote}>Format: 09XXXXXXXXX (11 digits)</Text>}

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

          <Pressable style={[styles.submitButton, submitting && { opacity: 0.6 }, submitted && styles.submitButtonSuccess]} onPress={handleSubmit} disabled={submitting || submitted}>
            {submitted ? (
              <>
                <Ionicons name="checkmark-circle" size={17} color="#fff" />
                <Text style={styles.submitButtonText}>Submitted</Text>
              </>
            ) : (
              <>
                <Text style={styles.submitButtonText}>{submitting ? "Submitting..." : "Submit Report"}</Text>
                {!submitting && <Ionicons name="arrow-forward" size={17} color="#fff" />}
              </>
            )}
          </Pressable>

          {!submitted && (
            <Pressable style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      {/* Date/Time picker modal */}
      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <Pressable style={styles.pickerBackdrop} onPress={() => setPickerVisible(false)} />
        <View style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>When?</Text>

          <Text style={styles.pickerSectionLabel}>DAY</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {days.map((d) => {
              const active = d.daysAgo === dayIndex;
              return (
                <Pressable
                  key={d.daysAgo}
                  style={[styles.dayChip, active && styles.dayChipActive]}
                  onPress={() => {
                    setDayIndex(d.daysAgo);
                    // if switching to "today" and the current time is now in the future, pull it back to now
                    if (d.daysAgo === 0 && wouldBeFuture(hour12, minute, period)) {
                      let h = now.getHours() % 12;
                      if (h === 0) h = 12;
                      setHour12(h);
                      setMinute(Math.floor(now.getMinutes() / 5) * 5);
                      setPeriod(now.getHours() >= 12 ? "PM" : "AM");
                    }
                  }}
                >
                  <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{d.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.pickerSectionLabel, { marginTop: 16 }]}>TIME</Text>
          <View style={styles.timeRow}>
            <View style={styles.stepperGroup}>
              <Pressable style={styles.stepperButton} onPress={() => stepHour(-1)} hitSlop={6}>
                <Ionicons name="chevron-down" size={16} color="#333" />
              </Pressable>
              <Text style={styles.stepperValue}>{hour12}</Text>
              <Pressable style={styles.stepperButton} onPress={() => stepHour(1)} hitSlop={6}>
                <Ionicons name="chevron-up" size={16} color="#333" />
              </Pressable>
            </View>

            <Text style={styles.timeColon}>:</Text>

            <View style={styles.stepperGroup}>
              <Pressable style={styles.stepperButton} onPress={() => stepMinute(-1)} hitSlop={6}>
                <Ionicons name="chevron-down" size={16} color="#333" />
              </Pressable>
              <Text style={styles.stepperValue}>{String(minute).padStart(2, "0")}</Text>
              <Pressable style={styles.stepperButton} onPress={() => stepMinute(1)} hitSlop={6}>
                <Ionicons name="chevron-up" size={16} color="#333" />
              </Pressable>
            </View>

            <Pressable style={styles.periodToggle} onPress={togglePeriod}>
              <Text style={styles.periodToggleText}>{period}</Text>
            </Pressable>
          </View>
          {isTodaySelected && <Text style={styles.pickerHint}>Locked to no later than right now.</Text>}

          <Pressable style={styles.pickerConfirm} onPress={confirmDateTime}>
            <Ionicons name="checkmark" size={17} color="#fff" />
            <Text style={styles.pickerConfirmText}>Set Date & Time</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,15,25,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "88%",
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e2340",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },

  modeBarWrap: { backgroundColor: "#1e2340", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18 },
  modeBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    padding: 5,
    gap: 4,
  },
  modeSegment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 10,
  },
  modeSegmentActiveLost: { backgroundColor: "#f97316", flex: 1.6 },
  modeSegmentActiveFound: { backgroundColor: "#fff", flex: 1.6 },
  modeSegmentTextActive: { color: "#fff", fontSize: 13, fontWeight: "700" },
  modeSegmentTextActiveFound: { color: "#111", fontSize: 13, fontWeight: "700" },

  form: { backgroundColor: "#fff", padding: 20, paddingTop: 24 },
  formIntro: { fontSize: 12, color: "#666", lineHeight: 17, marginBottom: 18 },

  label: { fontSize: 11, fontWeight: "700", color: "#555", letterSpacing: 0.4, marginBottom: 6, marginTop: 4 },
  helperText: { fontSize: 10, color: "#999", marginBottom: 8, marginTop: -4 },
  helperNote: { fontSize: 10, color: "#aaa", marginTop: 4, marginBottom: 6 },

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
    marginBottom: 8,
  },
  submitButtonSuccess: { backgroundColor: "#16a34a" },
  submitButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  cancelButton: { alignItems: "center", paddingVertical: 6 },
  cancelButtonText: { fontSize: 12, color: "#888", fontWeight: "600" },

  // --- Date/Time picker modal ---
  pickerBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,15,25,0.55)" },
  pickerCard: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "28%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  pickerTitle: { fontSize: 15, fontWeight: "700", color: "#111", marginBottom: 12 },
  pickerSectionLabel: { fontSize: 10, fontWeight: "700", color: "#999", letterSpacing: 0.5, marginBottom: 8 },

  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dayChipActive: { backgroundColor: "#111", borderColor: "#111" },
  dayChipText: { fontSize: 12, fontWeight: "600", color: "#444" },
  dayChipTextActive: { color: "#fff" },

  timeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepperGroup: { alignItems: "center", backgroundColor: "#f8fafc", borderRadius: 12, paddingVertical: 6, width: 56 },
  stepperButton: { paddingVertical: 4, paddingHorizontal: 14 },
  stepperValue: { fontSize: 18, fontWeight: "700", color: "#111", paddingVertical: 2 },
  timeColon: { fontSize: 18, fontWeight: "700", color: "#111" },
  periodToggle: {
    marginLeft: 4,
    backgroundColor: "#111",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  periodToggleText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  pickerHint: { fontSize: 10, color: "#f97316", marginTop: 10 },

  pickerConfirm: {
    flexDirection: "row",
    backgroundColor: "#f97316",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  pickerConfirmText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
