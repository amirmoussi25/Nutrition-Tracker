import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Stack } from "expo-router";

export default function AuthRoutesLayout() {
    const { isSignedIn } = useAuth();

    if (isSignedIn) {
        return <Redirect href={"/(main)/(home)"} />;
    }

    return (
        <Stack
            screenOptions={{
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
            <Stack.Screen
                name="login"
                options={{
                    title: "Connexion",
                    headerBackVisible: false,
                }}
            />
            <Stack.Screen
                name="signup"
                options={{
                    title: "Inscription",
                }}
            />
        </Stack>
    );
}
