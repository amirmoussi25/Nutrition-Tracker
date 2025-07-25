import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { Slot } from "expo-router";
import { tokenCache } from "../libs/cache";
import { useEffect } from "react";
import { initDatabase } from "../services/sqlite";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
    throw new Error(
        "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
    );
}

const RootLayout = () => {
    useEffect(() => {
        initDatabase().catch(console.error);
    }, []);

    return (
        <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
            <ClerkLoaded>
                <Slot />
            </ClerkLoaded>
        </ClerkProvider>
    );
};

export default RootLayout;
