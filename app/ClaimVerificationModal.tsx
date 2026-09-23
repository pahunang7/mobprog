import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export type ClaimItem = {
  id: string;
  title: string;
  code?: string;
  deskLabel?: string;
};

type FormErrors = {
  studentId?: string;
  ownership?: string;
  proof?: string;
};

type Props = {
  visible: boolean;
  item: ClaimItem | null;
  onClose: () => void;
  onSubmitted?: (itemId: string) => void;
};

export default function ClaimVerificationModal({ visible, item, onClose, onSubmitted }: Props) {
  const [studentId, setStudentId] = useState("");
  const [ownership, setOwnership] = useState("");
  const [proofName, setProofName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Reset the form each time a new item is opened
  useEffect(() => {
    if (visible) {
      setStudentId("");
      setOwnership("");
      setProofName(null);
      setSubmitting(false);
      setSubmitted(false);
      setErrors({});
    }
  }, [visible, item?.id]);

  // Accept either a 10-digit Student ID, or an @ustp.edu.ph institutional email
  const idLooksValid = useMemo(() => {
    const trimmed = studentId.trim();
    const isTenDigitId = /^\d{10}$/.test(trimmed);
    const isInstitutionalEmail = /^[^\s@]+@ustp\.edu\.ph$/i.test(trimmed);
    return isTenDigitId || isInstitutionalEmail;
  }, [studentId]);

  const clearError = (key: keyof FormErrors) => {
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handlePickProof = () => {
    // Placeholder — wire up expo-image-picker / expo-document-picker here.
    setProofName("receipt_or_photo.jpg");
    clearError("proof");
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!studentId.trim()) next.studentId = "Student ID or institutional email is required.";
    else if (!idLooksValid) next.studentId = "Enter a 10-digit Student ID or your @ustp.edu.ph email.";

    if (!ownership.trim()) next.ownership = "Describe distinct marks or ownership details.";
    else if (ownership.trim().length < 15) next.ownership = "Please provide a bit more detail (at least 15 characters).";

    if (!proofName) next.proof = "Proof of ownership (photo or receipt) is required.";

    return next;
  };

  const handleSubmit = () => {
    if (!item) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setTimeout(() => {
      console.log("Submitting claim", { itemId: item.id, itemTitle: item.title, studentId, ownership, proofName });
      setSubmitting(false);
      setSubmitted(true);
      onSubmitted?.(item.id);

      // Let the "Submitted" state show briefly, then close the modal.
      setTimeout(() => {
        onClose();
      }, 900);
    }, 800);
  };

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Dimmed backdrop — Home screen (with its bottom nav) stays visible underneath */}
      <Pressable style={styles.backdrop} onPress={submitted ? undefined : onClose} />

      <View style={styles.overlayContent} pointerEvents="box-none">
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#f97316" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Claim Verification</Text>
                  <Text style={styles.headerSubtitle}>Step 4 of 4 • Security Verification</Text>
                </View>
              </View>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={20} color="#888" />
              </Pressable>
            </View>

            <View style={styles.claimingCard}>
              <View style={styles.claimingThumb}>
                <Ionicons name="cube-outline" size={20} color="#475569" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.claimingLabel}>CLAIMING ITEM</Text>
                <Text style={styles.claimingTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.code ? <Text style={styles.claimingCode}>{item.code}</Text> : null}
              </View>
              {item.deskLabel ? (
                <View style={styles.deskPill}>
                  <Text style={styles.deskPillText}>{item.deskLabel}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.labelRow}>
              <Text style={styles.label}>Student ID / Employee Email *</Text>
              {idLooksValid && (
                <View style={styles.verifiedInline}>
                  <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                  <Text style={styles.verifiedInlineText}>Verified USTP ID</Text>
                </View>
              )}
            </View>
            <View style={[styles.inputWrapper, errors.studentId && styles.inputWrapperError]}>
              <Ionicons name="briefcase-outline" size={16} color="#8b8fa8" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.input}
                placeholder="Enter Student ID or Institutional Email"
                placeholderTextColor="#a3a6bd"
                autoCapitalize="none"
                editable={!submitting && !submitted}
                value={studentId}
                onChangeText={(t) => {
                  setStudentId(t);
                  clearError("studentId");
                }}
              />
            </View>
            {errors.studentId ? <Text style={styles.errorText}>{errors.studentId}</Text> : <View style={{ marginBottom: 10 }} />}

            <Text style={styles.label}>Ownership Details & Distinct Marks *</Text>
            <View style={[styles.textAreaWrapper, errors.ownership && styles.inputWrapperError]}>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                editable={!submitting && !submitted}
                value={ownership}
                onChangeText={(t) => {
                  setOwnership(t);
                  clearError("ownership");
                }}
              />
            </View>
            {errors.ownership ? <Text style={styles.errorText}>{errors.ownership}</Text> : <View style={{ marginBottom: 10 }} />}

            <Text style={styles.label}>Proof of Ownership (Photo or Receipt) *</Text>
            <Pressable style={[styles.uploadBox, errors.proof && styles.inputWrapperError]} onPress={handlePickProof} disabled={submitting || submitted}>
              <Ionicons name="cloud-upload-outline" size={22} color="#f97316" />
              <Text style={styles.uploadTitle}>Upload receipt, warranty, or past photo</Text>
              <Text style={styles.uploadSubtitle}>PNG, JPG or PDF up to 10MB</Text>
            </Pressable>
            {proofName && (
              <View style={styles.filePill}>
                <Ionicons name="document-text-outline" size={15} color="#dc2626" />
                <Text style={styles.filePillText}>{proofName} (1.2 MB)</Text>
                <Pressable onPress={() => setProofName(null)} hitSlop={8} style={{ marginLeft: "auto" }}>
                  <Ionicons name="close" size={14} color="#888" />
                </Pressable>
              </View>
            )}
            {errors.proof ? <Text style={styles.errorText}>{errors.proof}</Text> : null}

            <View style={styles.noticeBox}>
              <Ionicons name="information-circle-outline" size={16} color="#a16207" />
              <Text style={styles.noticeText}>Claims are logged and verified against the USTP Student Registry. Dishonest claims are subject to student disciplinary action.</Text>
            </View>

            <Pressable style={[styles.submitButton, submitting && { opacity: 0.6 }, submitted && styles.submitButtonSuccess]} onPress={handleSubmit} disabled={submitting || submitted}>
              {submitted ? (
                <>
                  <Ionicons name="checkmark-circle" size={17} color="#fff" />
                  <Text style={styles.submitButtonText}>Submitted</Text>
                </>
              ) : (
                <>
                  <Text style={styles.submitButtonText}>{submitting ? "Submitting..." : "Submit Claim for Review"}</Text>
                  {!submitting && <Ionicons name="arrow-forward" size={17} color="#fff" />}
                </>
              )}
            </Pressable>

            {!submitted && (
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel & Return</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,15,25,0.55)" },
  overlayContent: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
    maxHeight: "88%",
  },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  headerSubtitle: { fontSize: 11, color: "#999", marginTop: 1 },

  claimingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 10,
    marginBottom: 18,
  },
  claimingThumb: {
    width: 42,
    height: 42,
    borderRadius: 9,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  claimingLabel: { fontSize: 9, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.4 },
  claimingTitle: { fontSize: 13, fontWeight: "700", color: "#111" },
  claimingCode: { fontSize: 10, color: "#999", marginTop: 1 },
  deskPill: { backgroundColor: "#dcfce7", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  deskPillText: { fontSize: 10, fontWeight: "700", color: "#15803d" },

  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  label: { fontSize: 12, fontWeight: "700", color: "#333" },
  verifiedInline: { flexDirection: "row", alignItems: "center", gap: 3 },
  verifiedInlineText: { fontSize: 10, color: "#16a34a", fontWeight: "700" },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  inputWrapperError: { borderColor: "#dc2626", backgroundColor: "#fef2f2" },
  input: { flex: 1, fontSize: 13, color: "#111" },
  errorText: { fontSize: 11, color: "#dc2626", marginTop: 4, marginBottom: 10 },

  textAreaWrapper: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
  },
  textArea: { fontSize: 13, color: "#111", minHeight: 80, textAlignVertical: "top" },

  uploadBox: {
    borderWidth: 1.5,
    borderColor: "#fdba74",
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 4,
    marginBottom: 8,
  },
  uploadTitle: { fontSize: 12, fontWeight: "700", color: "#9a3412", marginTop: 4 },
  uploadSubtitle: { fontSize: 10, color: "#c2703d" },

  filePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  filePillText: { fontSize: 11, color: "#333" },

  noticeBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#fefce8",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 18,
    alignItems: "flex-start",
  },
  noticeText: { flex: 1, fontSize: 10.5, color: "#854d0e", lineHeight: 15 },

  submitButton: {
    flexDirection: "row",
    backgroundColor: "#f97316",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },
  submitButtonSuccess: { backgroundColor: "#16a34a" },
  submitButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  cancelButton: { alignItems: "center", paddingVertical: 6 },
  cancelButtonText: { fontSize: 12, color: "#888", fontWeight: "600" },
});
