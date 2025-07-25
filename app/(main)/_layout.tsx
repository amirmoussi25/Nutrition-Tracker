import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

export default function MainLayout() {
    const { isSignedIn } = useAuth();

    if (!isSignedIn) {
        return <Redirect href={"/(auth)/login"} />;
    }

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#4CAF50",
                tabBarInactiveTintColor: "#8E8E93",
                tabBarStyle: {
                    backgroundColor: "#FFFFFF",
                    borderTopWidth: 1,
                    borderTopColor: "#E0E0E0",
                    paddingTop: 8,
                    paddingBottom: Platform.OS === "ios" ? 24 : 8,
                    height: Platform.OS === "ios" ? 88 : 64,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: "600",
                    marginTop: 4,
                },
                headerStyle: {
                    backgroundColor: "#F8F9FA",
                },
                headerTitleStyle: {
                    fontWeight: "700",
                    fontSize: 18,
                },
                headerTintColor: "#333",
                headerShadowVisible: false,
            }}
        >
            <Tabs.Screen
                name="(home)"
                options={{
                    title: "Recettes",
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="restaurant" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: "Ajouter",
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="add-circle" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profil",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
