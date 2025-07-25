import {
    Text,
    TextInput,
    View,
    StyleSheet,
    Pressable,
    SafeAreaView,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { useSignUp } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";

export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const router = useRouter();
    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState("");
    const [errors, setErrors] = useState({ email: "", password: "", code: "", general: "" });
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors = { email: "", password: "", code: "", general: "" };

        if (!emailAddress.trim()) {
            newErrors.email = "L'email est requis";
        } else if (!/\S+@\S+\.\S+/.test(emailAddress)) {
            newErrors.email = "L'email n'est pas valide";
        }

        if (!password.trim()) {
            newErrors.password = "Le mot de passe est requis";
        } else if (password.length < 8) {
            newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";
        }

        setErrors(newErrors);
        return !newErrors.email && !newErrors.password;
    };

    const validateCode = () => {
        const newErrors = { email: "", password: "", code: "", general: "" };

        if (!code.trim()) {
            newErrors.code = "Le code de vérification est requis";
        } else if (code.length !== 6) {
            newErrors.code = "Le code doit contenir 6 chiffres";
        }

        setErrors(newErrors);
        return !newErrors.code;
    };

    const onSignUpPress = async () => {
        if (!isLoaded || loading) return;

        if (!validateForm()) return;

        setLoading(true);
        try {
            await signUp.create({
                emailAddress,
                password,
            });

            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err: any) {
            if (err?.errors) {
                const clerkError = err.errors[0];
                if (clerkError?.code === "form_identifier_exists") {
                    setErrors({ ...errors, email: "Un compte existe déjà avec cet email" });
                } else if (clerkError?.code === "form_password_pwned") {
                    setErrors({ ...errors, password: "Ce mot de passe a été compromis. Utilisez un mot de passe plus sûr." });
                } else if (clerkError?.code === "form_password_length_too_short") {
                    setErrors({ ...errors, password: "Le mot de passe doit contenir au moins 8 caractères" });
                } else {
                    setErrors({ ...errors, general: clerkError?.message || "Erreur lors de la création du compte" });
                }
            } else {
                setErrors({ ...errors, general: "Erreur lors de la création du compte. Veuillez réessayer." });
            }
        } finally {
            setLoading(false);
        }
    };

    const onVerifyPress = async () => {
        if (!isLoaded || loading) return;

        if (!validateCode()) return;

        setLoading(true);
        try {
            const signUpAttempt = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (signUpAttempt.status === "complete") {
                await setActive({ session: signUpAttempt.createdSessionId });
                router.replace("/(main)/(home)");
            } else {
                setErrors({ ...errors, general: "Vérification incomplète. Veuillez réessayer." });
            }
        } catch (err: any) {
            if (err?.errors) {
                const clerkError = err.errors[0];
                if (clerkError?.code === "form_code_incorrect") {
                    setErrors({ ...errors, code: "Code de vérification incorrect" });
                } else {
                    setErrors({ ...errors, general: clerkError?.message || "Erreur de vérification" });
                }
            } else {
                setErrors({ ...errors, general: "Erreur de vérification. Veuillez réessayer." });
            }
        } finally {
            setLoading(false);
        }
    };

    if (pendingVerification) {
        return (
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    style={styles.flex}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.header}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="mail" size={48} color="#4CAF50" />
                            </View>
                            <Text style={styles.title}>Vérifiez votre email</Text>
                            <Text style={styles.subtitle}>
                                Un code de vérification a été envoyé à
                            </Text>
                            <Text style={styles.email}>{emailAddress}</Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="keypad" size={20} color="#666" style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, errors.code ? styles.inputError : null]}
                                        value={code}
                                        placeholder="Code de vérification"
                                        placeholderTextColor="#999"
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        onChangeText={(text) => {
                                            setCode(text);
                                            if (errors.code) setErrors({ ...errors, code: "" });
                                        }}
                                    />
                                </View>
                                {errors.code ? <Text style={styles.errorText}>{errors.code}</Text> : null}
                            </View>

                            {errors.general ? <Text style={styles.errorText}>{errors.general}</Text> : null}

                            <Pressable
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={onVerifyPress}
                                disabled={loading}
                            >
                                {loading ? (
                                    <Text style={styles.buttonText}>Vérification...</Text>
                                ) : (
                                    <Text style={styles.buttonText}>Vérifier</Text>
                                )}
                            </Pressable>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="person-add" size={48} color="#4CAF50" />
                        </View>
                        <Text style={styles.title}>Créer un compte</Text>
                        <Text style={styles.subtitle}>Rejoignez Nutrition Tracker</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, errors.email ? styles.inputError : null]}
                                    autoCapitalize="none"
                                    value={emailAddress}
                                    placeholder="Entrez votre email"
                                    placeholderTextColor="#999"
                                    onChangeText={(text) => {
                                        setEmailAddress(text);
                                        if (errors.email) setErrors({ ...errors, email: "" });
                                    }}
                                />
                            </View>
                            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, errors.password ? styles.inputError : null]}
                                    value={password}
                                    placeholder="Entrez votre mot de passe"
                                    placeholderTextColor="#999"
                                    secureTextEntry={!showPassword}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        if (errors.password) setErrors({ ...errors, password: "" });
                                    }}
                                />
                                <Pressable
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.passwordToggle}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-off" : "eye"}
                                        size={20}
                                        color="#666"
                                    />
                                </Pressable>
                            </View>
                            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                        </View>

                        {errors.general ? <Text style={styles.errorText}>{errors.general}</Text> : null}

                        <Pressable
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={onSignUpPress}
                            disabled={loading}
                        >
                            {loading ? (
                                <Text style={styles.buttonText}>Création...</Text>
                            ) : (
                                <Text style={styles.buttonText}>Créer le compte</Text>
                            )}
                        </Pressable>

                        <View style={styles.signInContainer}>
                            <Text style={styles.signInText}>Vous avez déjà un compte ?</Text>
                            <Link href="/(auth)/login" asChild>
                                <Pressable>
                                    <Text style={styles.signInLink}>Connexion</Text>
                                </Pressable>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    flex: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    header: {
        alignItems: "center",
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#F0F9F0",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        marginBottom: 8,
        color: "#333",
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
    },
    email: {
        fontSize: 16,
        color: "#4CAF50",
        fontWeight: "600",
        textAlign: "center",
        marginTop: 4,
    },
    form: {
        width: "100%",
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#333",
    },
    passwordToggle: {
        padding: 4,
    },
    inputError: {
        borderColor: "#FF3B30",
    },
    errorText: {
        color: "#FF3B30",
        fontSize: 14,
        marginTop: 8,
        marginLeft: 4,
    },
    button: {
        backgroundColor: "#4CAF50",
        borderRadius: 12,
        height: 56,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "600",
    },
    signInContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
    },
    signInText: {
        color: "#666",
        fontSize: 16,
    },
    signInLink: {
        color: "#4CAF50",
        fontSize: 16,
        fontWeight: "600",
    },
});
