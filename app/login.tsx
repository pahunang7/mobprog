import { useAuth } from "@/contexts/auth-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

type LoginErrors = {
  identifier?: string;
  password?: string;
};

type ResetErrors = {
  identifier?: string;
  newPassword?: string;
  confirmPassword?: string;
};

type RegisterErrors = {
  name?: string;
  identifier?: string;
  password?: string;
  confirmPassword?: string;
};

// Turns an identifier into a readable display name when we have no
// registered name on file for it (e.g. logging in without registering first).
function fallbackDisplayName(identifier: string, role: "student" | "faculty") {
  if (role === "student") {
    return identifier ? `Student ${identifier}` : "Trailblazer";
  }
  const local = identifier.split("@")[0] || identifier;
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length === 0) return "Trailblazer";
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

export default function LoginScreen() {
  const { login, registerUser, getRegisteredName } = useAuth();
  const [role, setRole] = useState<"student" | "faculty">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});

  // --- Forgot password modal state ---
  const [forgotVisible, setForgotVisible] = useState(false);
  const [resetStep, setResetStep] = useState<"form" | "success">("form");
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetErrors, setResetErrors] = useState<ResetErrors>({});

  // --- Registration modal state ---
  const [registerVisible, setRegisterVisible] = useState(false);
  const [registerStep, setRegisterStep] = useState<"form" | "success">("form");
  const [registerRole, setRegisterRole] = useState<"student" | "faculty">("student");
  const [registerName, setRegisterName] = useState("");
  const [registerIdentifier, setRegisterIdentifier] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerErrors, setRegisterErrors] = useState<RegisterErrors>({});

  const isStudent = role === "student";
  const isRegisterStudent = registerRole === "student";

  const handleRoleChange = (newRole: "student" | "faculty") => {
    setRole(newRole);
    setEmail(""); // clear the field so old input format doesn't carry over
    setLoginErrors({});
  };

  const handleIdChange = (text: string) => {
    const next = isStudent ? text.replace(/[^0-9]/g, "") : text;
    setEmail(next);
    if (loginErrors.identifier) setLoginErrors((prev) => ({ ...prev, identifier: undefined }));
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (loginErrors.password) setLoginErrors((prev) => ({ ...prev, password: undefined }));
  };

  const validateLogin = (): LoginErrors => {
    const errors: LoginErrors = {};

    if (!email.trim()) {
      errors.identifier = isStudent ? "Student ID is required." : "Institutional email is required.";
    } else if (isStudent && email.length !== 10) {
      errors.identifier = `Student ID must be 10 digits (${email.length}/10).`;
    } else if (!isStudent && !email.includes("@")) {
      errors.identifier = "Enter a valid email address.";
    } else if (!isStudent && !email.toLowerCase().endsWith("@ustp.edu.ph")) {
      errors.identifier = "Use your @ustp.edu.ph email.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = `Must be at least 8 characters (${password.length}/8).`;
    }

    return errors;
  };

  const handleLogin = () => {
    const errors = validateLogin();
    setLoginErrors(errors);
    if (Object.keys(errors).length > 0) return;

    console.log("Logging in with", email, "Role:", role, "Remember device:", rememberDevice);
    const name = getRegisteredName(email) ?? fallbackDisplayName(email, role);
    login({ name, identifier: email, role });
    router.replace((role === "faculty" ? "/desk-admin" : "/(tabs)") as never);
  };

  // --- Forgot password handlers ---
  const openForgotModal = () => {
    setResetStep("form");
    setResetIdentifier(email); // pre-fill with whatever they already typed, if anything
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setResetErrors({});
    setForgotVisible(true);
  };

  const closeForgotModal = () => {
    setForgotVisible(false);
  };

  const validateReset = (): ResetErrors => {
    const errors: ResetErrors = {};

    if (!resetIdentifier.trim()) {
      errors.identifier = isStudent ? "Student ID is required." : "Institutional email is required.";
    } else if (isStudent && resetIdentifier.length !== 10) {
      errors.identifier = `Student ID must be 10 digits (${resetIdentifier.length}/10).`;
    } else if (!isStudent && !resetIdentifier.includes("@")) {
      errors.identifier = "Enter a valid email address.";
    } else if (!isStudent && !resetIdentifier.toLowerCase().endsWith("@ustp.edu.ph")) {
      errors.identifier = "Use your @ustp.edu.ph email.";
    }

    if (!newPassword) {
      errors.newPassword = "New password is required.";
    } else if (newPassword.length < 8) {
      errors.newPassword = `Must be at least 8 characters (${newPassword.length}/8).`;
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password.";
    } else if (newPassword && confirmPassword !== newPassword) {
      errors.confirmPassword = "Passwords don't match.";
    }

    return errors;
  };

  const handleResetPassword = () => {
    const errors = validateReset();
    setResetErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setResetLoading(true);
    // Simulate an async reset request (replace with your real API call)
    setTimeout(() => {
      setResetLoading(false);
      console.log("Password reset requested for", resetIdentifier);
      setResetStep("success");
    }, 900);
  };

  // --- Registration handlers ---
  const openRegisterModal = () => {
    setRegisterStep("form");
    setRegisterRole(role);
    setRegisterName("");
    setRegisterIdentifier("");
    setRegisterPassword("");
    setRegisterConfirmPassword("");
    setShowRegisterPassword(false);
    setRegisterErrors({});
    setRegisterVisible(true);
  };

  const closeRegisterModal = () => {
    setRegisterVisible(false);
  };

  const handleRegisterIdChange = (text: string) => {
    const next = isRegisterStudent ? text.replace(/[^0-9]/g, "") : text;
    setRegisterIdentifier(next);
    if (registerErrors.identifier) setRegisterErrors((prev) => ({ ...prev, identifier: undefined }));
  };

  const validateRegister = (): RegisterErrors => {
    const errors: RegisterErrors = {};

    if (!registerName.trim()) {
      errors.name = "Full name is required.";
    }

    if (!registerIdentifier.trim()) {
      errors.identifier = isRegisterStudent ? "Student ID is required." : "Institutional email is required.";
    } else if (isRegisterStudent && registerIdentifier.length !== 10) {
      errors.identifier = `Student ID must be 10 digits (${registerIdentifier.length}/10).`;
    } else if (!isRegisterStudent && !registerIdentifier.includes("@")) {
      errors.identifier = "Enter a valid email address.";
    } else if (!isRegisterStudent && !registerIdentifier.toLowerCase().endsWith("@ustp.edu.ph")) {
      errors.identifier = "Use your @ustp.edu.ph email.";
    }

    if (!registerPassword) {
      errors.password = "Password is required.";
    } else if (registerPassword.length < 8) {
      errors.password = `Must be at least 8 characters (${registerPassword.length}/8).`;
    }

    if (!registerConfirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (registerPassword && registerConfirmPassword !== registerPassword) {
      errors.confirmPassword = "Passwords don't match.";
    }

    return errors;
  };

  const handleRegister = () => {
    const errors = validateRegister();
    setRegisterErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setRegisterLoading(true);
    // Simulate an async registration request (replace with your real API call)
    setTimeout(() => {
      setRegisterLoading(false);
      console.log("Registering", { name: registerName, identifier: registerIdentifier, role: registerRole });
      registerUser(registerIdentifier, registerName);
      setRegisterStep("success");
    }, 900);
  };

  const handleRegisterSuccessClose = () => {
    // carry the new account's role + identifier over to the login form
    setRole(registerRole);
    setEmail(registerIdentifier);
    setPassword("");
    setLoginErrors({});
    closeRegisterModal();
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header badge */}
        <View style={styles.headerBadge}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={20} color="#fff" />
          </View>
          <View>
            <Text style={styles.brandTitle}>USTP Lost & Found</Text>
            <Text style={styles.brandSubtitle}>IDENTITY & ACCESS MANAGEMENT</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Sign in to Portal</Text>
        <Text style={styles.subtitle}>Access the USTP unified campus lost and found repository with your verified school account.</Text>

        {/* Role toggle */}
        <View style={styles.roleToggle}>
          <Pressable style={[styles.roleButton, isStudent && styles.roleButtonActive]} onPress={() => handleRoleChange("student")}>
            <Ionicons name="school-outline" size={16} color={isStudent ? "#fff" : "#111"} />
            <Text style={isStudent ? styles.roleButtonTextActive : styles.roleButtonText}>Student</Text>
          </Pressable>
          <Pressable style={[styles.roleButton, !isStudent && styles.roleButtonActive]} onPress={() => handleRoleChange("faculty")}>
            <Ionicons name="shield-outline" size={16} color={!isStudent ? "#fff" : "#111"} />
            <Text style={!isStudent ? styles.roleButtonTextActive : styles.roleButtonText}>Faculty</Text>
          </Pressable>
        </View>

        {/* ID / Email field */}
        <View style={styles.fieldHeader}>
          <Text style={styles.label}>{isStudent ? "Student ID" : "Institutional Email"}</Text>
          <Text style={styles.required}>Required</Text>
        </View>
        <View style={[styles.inputWrapper, loginErrors.identifier && styles.inputWrapperError]}>
          <Ionicons name={isStudent ? "briefcase-outline" : "mail-outline"} size={18} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={isStudent ? "Enter Student ID" : "e.g. j.delacruz@ustp.edu.ph"}
            keyboardType={isStudent ? "number-pad" : "email-address"}
            autoCapitalize="none"
            maxLength={isStudent ? 10 : undefined}
            value={email}
            onChangeText={handleIdChange}
          />
          {isStudent ? email.length === 10 && <Ionicons name="checkmark-circle" size={18} color="#16a34a" /> : email.includes("@") && <Ionicons name="checkmark-circle" size={18} color="#16a34a" />}
        </View>
        {loginErrors.identifier ? (
          <View style={styles.warningRow}>
            <Ionicons name="alert-circle" size={13} color="#dc2626" />
            <Text style={styles.warningText}>{loginErrors.identifier}</Text>
          </View>
        ) : (
          <View style={{ marginBottom: 6 }} />
        )}

        {/* Password field */}
        <View style={styles.fieldHeader}>
          <Text style={styles.label}>Password</Text>
          <Text style={styles.required}>Alphanumeric</Text>
        </View>
        <View style={[styles.inputWrapper, loginErrors.password && styles.inputWrapperError]}>
          <Ionicons name="lock-closed-outline" size={18} color="#888" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Enter your password" secureTextEntry={!showPassword} value={password} onChangeText={handlePasswordChange} />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#888" />
          </Pressable>
        </View>
        {loginErrors.password ? (
          <View style={styles.warningRow}>
            <Ionicons name="alert-circle" size={13} color="#dc2626" />
            <Text style={styles.warningText}>{loginErrors.password}</Text>
          </View>
        ) : (
          <View style={{ marginBottom: 6 }} />
        )}

        {/* Remember / forgot row */}
        <View style={styles.rememberRow}>
          <Pressable style={styles.rememberLeft} onPress={() => setRememberDevice(!rememberDevice)}>
            <View style={[styles.checkbox, !rememberDevice && styles.checkboxUnchecked]}>{rememberDevice && <Ionicons name="checkmark" size={12} color="#fff" />}</View>
            <Text style={styles.rememberText}>Remember this device</Text>
          </Pressable>
          <Pressable onPress={openForgotModal}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>
        </View>

        {/* Log in button */}
        <Pressable style={styles.signInButton} onPress={handleLogin}>
          <Text style={styles.signInButtonText}>Log In to Portal</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>

        {/* Register button */}
        <Pressable style={styles.registerButton} onPress={openRegisterModal}>
          <Ionicons name="person-add-outline" size={16} color="#111" />
          <Text style={styles.registerButtonText}>Create a New Account</Text>
        </Pressable>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR CONNECT WITH</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google button */}
        <Pressable style={styles.googleButton}>
          <Ionicons name="logo-google" size={18} color="#EA4335" />
          <Text style={styles.googleButtonText}>Google Workspace (@ustp.edu.ph)</Text>
        </Pressable>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Protected by USTP DSA & ICT Services</Text>
          <Text style={styles.footerLink}>Need help? Contact ICT Support Desk</Text>
          <View style={styles.footerLockRow}>
            <Ionicons name="lock-closed" size={12} color="#888" />
            <Text style={styles.footerLockText}>256-bit SSL Encrypted Connection</Text>
          </View>
        </View>
      </View>

      {/* Forgot Password Modal */}
      <Modal visible={forgotVisible} animationType="fade" transparent onRequestClose={closeForgotModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeForgotModal} />
          <View style={styles.modalCard}>
            {resetStep === "form" ? (
              <>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalTitle}>Reset Password</Text>
                  <Pressable onPress={closeForgotModal} hitSlop={10}>
                    <Ionicons name="close" size={20} color="#888" />
                  </Pressable>
                </View>
                <Text style={styles.modalSubtitle}>{isStudent ? "Enter your Student ID and choose a new password." : "Enter your institutional email and choose a new password."}</Text>

                <Text style={styles.label}>{isStudent ? "Student ID" : "Institutional Email"}</Text>
                <View style={[styles.inputWrapper, resetErrors.identifier && styles.inputWrapperError]}>
                  <Ionicons name={isStudent ? "briefcase-outline" : "mail-outline"} size={18} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={isStudent ? "Enter Student ID" : "e.g. j.delacruz@ustp.edu.ph"}
                    keyboardType={isStudent ? "number-pad" : "email-address"}
                    autoCapitalize="none"
                    maxLength={isStudent ? 10 : undefined}
                    value={resetIdentifier}
                    onChangeText={(t) => {
                      setResetIdentifier(isStudent ? t.replace(/[^0-9]/g, "") : t);
                      if (resetErrors.identifier) setResetErrors((prev) => ({ ...prev, identifier: undefined }));
                    }}
                  />
                </View>
                {resetErrors.identifier ? (
                  <View style={styles.warningRow}>
                    <Ionicons name="alert-circle" size={13} color="#dc2626" />
                    <Text style={styles.warningText}>{resetErrors.identifier}</Text>
                  </View>
                ) : (
                  <View style={{ marginBottom: 6 }} />
                )}

                <Text style={styles.label}>New Password</Text>
                <View style={[styles.inputWrapper, resetErrors.newPassword && styles.inputWrapperError]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="At least 8 characters"
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={(t) => {
                      setNewPassword(t);
                      if (resetErrors.newPassword) setResetErrors((prev) => ({ ...prev, newPassword: undefined }));
                    }}
                  />
                  <Pressable onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#888" />
                  </Pressable>
                </View>
                {resetErrors.newPassword ? (
                  <View style={styles.warningRow}>
                    <Ionicons name="alert-circle" size={13} color="#dc2626" />
                    <Text style={styles.warningText}>{resetErrors.newPassword}</Text>
                  </View>
                ) : (
                  <Text style={styles.hintText}>Must be at least 8 characters.</Text>
                )}

                <Text style={styles.label}>Confirm New Password</Text>
                <View style={[styles.inputWrapper, resetErrors.confirmPassword && styles.inputWrapperError]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#888" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter new password"
                    secureTextEntry={!showNewPassword}
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      if (resetErrors.confirmPassword) setResetErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                  />
                </View>
                {resetErrors.confirmPassword ? (
                  <View style={styles.warningRow}>
                    <Ionicons name="alert-circle" size={13} color="#dc2626" />
                    <Text style={styles.warningText}>{resetErrors.confirmPassword}</Text>
                  </View>
                ) : (
                  <View style={{ marginBottom: 6 }} />
                )}

                <Pressable style={[styles.signInButton, resetLoading && { opacity: 0.6 }, { marginTop: 8 }]} onPress={handleResetPassword} disabled={resetLoading}>
                  <Text style={styles.signInButtonText}>{resetLoading ? "Resetting..." : "Reset Password"}</Text>
                  {!resetLoading && <Ionicons name="checkmark" size={18} color="#fff" />}
                </Pressable>
              </>
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 10 }}>
                <Ionicons name="checkmark-circle" size={48} color="#16a34a" style={{ marginBottom: 12 }} />
                <Text style={styles.modalTitle}>Password Reset</Text>
                <Text style={[styles.modalSubtitle, { textAlign: "center" }]}>Your password has been updated. You can now log in with your new password.</Text>
                <Pressable style={[styles.signInButton, { marginTop: 8, width: "100%" }]} onPress={closeForgotModal}>
                  <Text style={styles.signInButtonText}>Back to Log In</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Registration Modal */}
      <Modal visible={registerVisible} animationType="fade" transparent onRequestClose={closeRegisterModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeRegisterModal} />
          <ScrollView contentContainerStyle={{ width: "100%", alignItems: "center" }} style={{ width: "100%", maxHeight: "90%" }}>
            <View style={styles.modalCard}>
              {registerStep === "form" ? (
                <>
                  <View style={styles.modalHeaderRow}>
                    <Text style={styles.modalTitle}>Create an Account</Text>
                    <Pressable onPress={closeRegisterModal} hitSlop={10}>
                      <Ionicons name="close" size={20} color="#888" />
                    </Pressable>
                  </View>
                  <Text style={styles.modalSubtitle}>Register with your verified USTP credentials to access the portal.</Text>

                  {/* Role toggle */}
                  <View style={[styles.roleToggle, { marginBottom: 14 }]}>
                    <Pressable
                      style={[styles.roleButton, isRegisterStudent && styles.roleButtonActive]}
                      onPress={() => {
                        setRegisterRole("student");
                        setRegisterErrors((prev) => ({ ...prev, identifier: undefined }));
                      }}
                    >
                      <Ionicons name="school-outline" size={16} color={isRegisterStudent ? "#fff" : "#111"} />
                      <Text style={isRegisterStudent ? styles.roleButtonTextActive : styles.roleButtonText}>Student</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.roleButton, !isRegisterStudent && styles.roleButtonActive]}
                      onPress={() => {
                        setRegisterRole("faculty");
                        setRegisterErrors((prev) => ({ ...prev, identifier: undefined }));
                      }}
                    >
                      <Ionicons name="shield-outline" size={16} color={!isRegisterStudent ? "#fff" : "#111"} />
                      <Text style={!isRegisterStudent ? styles.roleButtonTextActive : styles.roleButtonText}>Faculty</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.label}>Full Name</Text>
                  <View style={[styles.inputWrapper, registerErrors.name && styles.inputWrapperError]}>
                    <Ionicons name="person-outline" size={18} color="#888" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Juan Dela Cruz"
                      value={registerName}
                      onChangeText={(t) => {
                        setRegisterName(t);
                        if (registerErrors.name) setRegisterErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                    />
                  </View>
                  {registerErrors.name ? (
                    <View style={styles.warningRow}>
                      <Ionicons name="alert-circle" size={13} color="#dc2626" />
                      <Text style={styles.warningText}>{registerErrors.name}</Text>
                    </View>
                  ) : (
                    <View style={{ marginBottom: 6 }} />
                  )}

                  <Text style={styles.label}>{isRegisterStudent ? "Student ID" : "Institutional Email"}</Text>
                  <View style={[styles.inputWrapper, registerErrors.identifier && styles.inputWrapperError]}>
                    <Ionicons name={isRegisterStudent ? "briefcase-outline" : "mail-outline"} size={18} color="#888" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={isRegisterStudent ? "Enter Student ID" : "e.g. j.delacruz@ustp.edu.ph"}
                      keyboardType={isRegisterStudent ? "number-pad" : "email-address"}
                      autoCapitalize="none"
                      maxLength={isRegisterStudent ? 10 : undefined}
                      value={registerIdentifier}
                      onChangeText={handleRegisterIdChange}
                    />
                  </View>
                  {registerErrors.identifier ? (
                    <View style={styles.warningRow}>
                      <Ionicons name="alert-circle" size={13} color="#dc2626" />
                      <Text style={styles.warningText}>{registerErrors.identifier}</Text>
                    </View>
                  ) : (
                    <View style={{ marginBottom: 6 }} />
                  )}

                  <Text style={styles.label}>Password</Text>
                  <View style={[styles.inputWrapper, registerErrors.password && styles.inputWrapperError]}>
                    <Ionicons name="lock-closed-outline" size={18} color="#888" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="At least 8 characters"
                      secureTextEntry={!showRegisterPassword}
                      value={registerPassword}
                      onChangeText={(t) => {
                        setRegisterPassword(t);
                        if (registerErrors.password) setRegisterErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                    />
                    <Pressable onPress={() => setShowRegisterPassword(!showRegisterPassword)}>
                      <Ionicons name={showRegisterPassword ? "eye-off-outline" : "eye-outline"} size={18} color="#888" />
                    </Pressable>
                  </View>
                  {registerErrors.password ? (
                    <View style={styles.warningRow}>
                      <Ionicons name="alert-circle" size={13} color="#dc2626" />
                      <Text style={styles.warningText}>{registerErrors.password}</Text>
                    </View>
                  ) : (
                    <Text style={styles.hintText}>Must be at least 8 characters.</Text>
                  )}

                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={[styles.inputWrapper, registerErrors.confirmPassword && styles.inputWrapperError]}>
                    <Ionicons name="lock-closed-outline" size={18} color="#888" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter password"
                      secureTextEntry={!showRegisterPassword}
                      value={registerConfirmPassword}
                      onChangeText={(t) => {
                        setRegisterConfirmPassword(t);
                        if (registerErrors.confirmPassword) setRegisterErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }}
                    />
                  </View>
                  {registerErrors.confirmPassword ? (
                    <View style={styles.warningRow}>
                      <Ionicons name="alert-circle" size={13} color="#dc2626" />
                      <Text style={styles.warningText}>{registerErrors.confirmPassword}</Text>
                    </View>
                  ) : (
                    <View style={{ marginBottom: 6 }} />
                  )}

                  <Pressable style={[styles.signInButton, registerLoading && { opacity: 0.6 }, { marginTop: 8 }]} onPress={handleRegister} disabled={registerLoading}>
                    <Text style={styles.signInButtonText}>{registerLoading ? "Creating Account..." : "Sign In to Portal"}</Text>
                    {!registerLoading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
                  </Pressable>
                </>
              ) : (
                <View style={{ alignItems: "center", paddingVertical: 10 }}>
                  <Ionicons name="checkmark-circle" size={48} color="#16a34a" style={{ marginBottom: 12 }} />
                  <Text style={styles.modalTitle}>Account Created</Text>
                  <Text style={[styles.modalSubtitle, { textAlign: "center" }]}>Welcome, {registerName || "there"}! Your account is ready. You can now log in to the portal.</Text>
                  <Pressable style={[styles.signInButton, { marginTop: 8, width: "100%" }]} onPress={handleRegisterSuccessClose}>
                    <Text style={styles.signInButtonText}>Continue to Log In</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, backgroundColor: "#fff" },
  container: { padding: 20, paddingTop: 40 },

  headerBadge: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: { fontSize: 15, fontWeight: "700", color: "#111" },
  brandSubtitle: { fontSize: 10, color: "#888", letterSpacing: 0.5 },

  pillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  ssoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ssoPillText: { fontSize: 11, color: "#15803d", fontWeight: "600" },
  stepText: { fontSize: 11, color: "#888", fontWeight: "600" },

  title: { fontSize: 26, fontWeight: "700", color: "#111", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#666", marginBottom: 20, lineHeight: 18 },

  roleToggle: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  roleButtonActive: { backgroundColor: "#111" },
  roleButtonText: { fontSize: 12, color: "#111", fontWeight: "600" },
  roleButtonTextActive: { fontSize: 12, color: "#fff", fontWeight: "600" },

  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    marginTop: 4,
  },
  label: { fontSize: 12, fontWeight: "600", color: "#333" },
  required: { fontSize: 11, color: "#999" },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  inputWrapperError: {
    borderColor: "#dc2626",
    backgroundColor: "#fef2f2",
  },
  inputIcon: { marginRight: 2 },
  input: { flex: 1, fontSize: 14, color: "#111" },

  warningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: -8,
    marginBottom: 10,
  },
  warningText: { fontSize: 11, color: "#dc2626", flexShrink: 1 },
  hintText: { fontSize: 11, color: "#999", marginTop: -8, marginBottom: 10 },

  rememberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  rememberLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxUnchecked: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#ccc",
  },
  rememberText: { fontSize: 12, color: "#444" },
  forgotText: { fontSize: 12, color: "#d97706", fontWeight: "600" },

  signInButton: {
    flexDirection: "row",
    backgroundColor: "#f97316",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  signInButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  registerButton: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#111",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  registerButtonText: { fontSize: 14, fontWeight: "700", color: "#111" },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dividerText: { fontSize: 10, color: "#999", fontWeight: "600" },

  googleButton: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
  },
  googleButtonText: { fontSize: 13, fontWeight: "600", color: "#333" },

  footer: { alignItems: "center", gap: 4 },
  footerText: { fontSize: 11, color: "#999" },
  footerLink: { fontSize: 11, color: "#2563eb" },
  footerLockRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  footerLockText: { fontSize: 10, color: "#999" },

  // --- Modal styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  modalSubtitle: { fontSize: 12, color: "#666", marginBottom: 16, lineHeight: 17 },
});
