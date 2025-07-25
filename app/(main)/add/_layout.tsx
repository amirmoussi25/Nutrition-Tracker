import { Stack } from "expo-router";

export default function AddLayout() {
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
                    title: "Ajouter des aliments",
                }}
            />
            <Stack.Screen
                name="camera"
                options={{
                    title: "Scanner un code-barres",
                    presentation: "modal",
                }}
            />
        </Stack>
    );
}
