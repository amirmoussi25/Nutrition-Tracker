import React from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView, Alert } from "react-native";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
    const { signOut } = useAuth();
    const { user } = useUser();

    const handleSignOut = async () => {
        Alert.alert(
            "Déconnexion",
            "Êtes-vous sûr de vouloir vous déconnecter ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Déconnexion",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (error) {
                            console.error("Erreur lors de la déconnexion:", error);
                            Alert.alert("Erreur", "Impossible de se déconnecter");
                        }
                    }
                }
            ]
        );
    };

    const formatEmail = (email: string) => {
        return email.length > 30 ? `${email.substring(0, 27)}...` : email;
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={48} color="#4CAF50" />
                    </View>
                    <Text style={styles.greeting}>
                        Bonjour !
                    </Text>
                    <Text style={styles.email}>
                        {formatEmail(user?.emailAddresses[0]?.emailAddress || "")}
                    </Text>
                </View>

                <Pressable style={styles.signOutButton} onPress={handleSignOut}>
                    <Ionicons name="log-out" size={20} color="#FFFFFF" />
                    <Text style={styles.signOutButtonText}>Se déconnecter</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    profileHeader: {
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 40,
        borderRadius: 20,
        marginBottom: 40,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        width: "100%",
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#F0F9F0",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },
    greeting: {
        fontSize: 28,
        fontWeight: "700",
        color: "#333",
        marginBottom: 12,
    },
    email: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 22,
    },
    signOutButton: {
        backgroundColor: "#FF3B30",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 24,
        gap: 8,
        width: "100%",
        shadowColor: "#FF3B30",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    signOutButtonText: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "600",
    },
});
