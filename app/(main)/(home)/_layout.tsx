import { Stack } from "expo-router";

export default function HomeLayout() {
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
                name="index"
                options={{
                    title: "Mes Recettes",
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    title: "Détails de la recette",
                }}
            />
        </Stack>
    );
}
