import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
    Text,
    TextInput,
    View,
    StyleSheet,
    Pressable,
    SafeAreaView,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const router = useRouter();
    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({ email: "", password: "", general: "" });
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        const newErrors = { email: "", password: "", general: "" };

        if (!emailAddress.trim()) {
            newErrors.email = "L'email est requis";
        } else if (!/\S+@\S+\.\S+/.test(emailAddress)) {
            newErrors.email = "L'email n'est pas valide";
        }

        if (!password.trim()) {
            newErrors.password = "Le mot de passe est requis";
        } else if (password.length < 6) {
            newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
        }

        setErrors(newErrors);
        return !newErrors.email && !newErrors.password;
    };

    const onSignInPress = async () => {
        if (!isLoaded || loading) return;

        if (!validateForm()) return;

        setLoading(true);
        try {
            const signInAttempt = await signIn.create({
                identifier: emailAddress,
                password,
            });

            if (signInAttempt.status === "complete") {
                await setActive({ session: signInAttempt.createdSessionId });
                router.replace("/(main)/(home)");
            } else {
                setErrors({ ...errors, general: "Connexion incomplète. Veuillez réessayer." });
            }
        } catch (err: any) {
            if (err?.errors) {
                const clerkError = err.errors[0];
                if (clerkError?.code === "form_identifier_not_found") {
                    setErrors({ ...errors, email: "Aucun compte trouvé avec cet email" });
                } else if (clerkError?.code === "form_password_incorrect") {
                    setErrors({ ...errors, password: "Mot de passe incorrect" });
                } else if (clerkError?.code === "form_password_pwned") {
                    setErrors({ ...errors, password: "Ce mot de passe a été compromis. Utilisez un mot de passe plus sûr." });
                } else {
                    setErrors({ ...errors, general: clerkError?.message || "Erreur de connexion" });
                }
            } else {
                setErrors({ ...errors, general: "Erreur de connexion. Veuillez réessayer." });
            }
        } finally {
            setLoading(false);
        }
    };

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
                            <Ionicons name="restaurant" size={48} color="#4CAF50" />
                        </View>
                        <Text style={styles.title}>Nutrition Tracker</Text>
                        <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
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
                            onPress={onSignInPress}
                            disabled={loading}
                        >
                            {loading ? (
                                <Text style={styles.buttonText}>Connexion...</Text>
                            ) : (
                                <Text style={styles.buttonText}>Se connecter</Text>
                            )}
                        </Pressable>

                        <View style={styles.signUpContainer}>
                            <Text style={styles.signUpText}>Vous n'avez pas de compte ?</Text>
                            <Link href="/(auth)/signup" asChild>
                                <Pressable>
                                    <Text style={styles.signUpLink}>Inscription</Text>
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
    signUpContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 4,
    },
    signUpText: {
        color: "#666",
        fontSize: 16,
    },
    signUpLink: {
        color: "#4CAF50",
        fontSize: 16,
        fontWeight: "600",
    },
});
