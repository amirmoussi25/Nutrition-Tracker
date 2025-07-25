import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Alert, Pressable, Dimensions } from "react-native";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { useRouter } from "expo-router";
import { searchFoodByBarcode } from "../../../services/edamam";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [isProcessing, setIsProcessing] = useState(false);
    const isProcessingRef = useRef(false);
    const router = useRouter();

    useEffect(() => {
        if (permission && !permission.granted && permission.canAskAgain) {
            requestPermission();
        }
    }, [permission]);

    const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
        if (isProcessingRef.current) return;

        console.log('Scan détecté:', data);

        isProcessingRef.current = true;
        setIsProcessing(true);

        try {
            const food = await searchFoodByBarcode(data);

            if (food) {
                Alert.alert(
                    "Produit trouvé",
                    `${food.label} a été trouvé dans notre base de données`,
                    [
                        {
                            text: "Annuler",
                            style: "cancel",
                            onPress: () => {
                                isProcessingRef.current = false;
                                setIsProcessing(false);
                            },
                        },
                        {
                            text: "Ajouter",
                            onPress: () => {
                                router.push({
                                    pathname: "/(main)/add",
                                    params: { scannedFood: JSON.stringify(food) }
                                });
                            },
                        },
                    ]
                );
            } else {
                Alert.alert(
                    "Produit non trouvé",
                    "Ce produit n'est pas reconnu dans notre base de données. Essayez avec la recherche manuelle.",
                    [
                        {
                            text: "Réessayer",
                            onPress: () => {
                                isProcessingRef.current = false;
                                setIsProcessing(false);
                            },
                        },
                        {
                            text: "Recherche manuelle",
                            onPress: () => {
                                router.push("/(main)/add");
                            },
                        },
                    ]
                );
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes('clés API')) {
                Alert.alert(
                    "Configuration requise",
                    "Veuillez configurer vos clés API Edamam dans le fichier .env",
                    [
                        {
                            text: "OK",
                            onPress: () => router.back(),
                        },
                    ]
                );
            } else {
                Alert.alert(
                    "Erreur",
                    "Impossible de scanner le code-barres. Vérifiez votre connexion internet.",
                    [
                        {
                            text: "Réessayer",
                            onPress: () => {
                                isProcessingRef.current = false;
                                setIsProcessing(false);
                            },
                        },
                        {
                            text: "Annuler",
                            onPress: () => router.back(),
                        },
                    ]
                );
            }
        }
    };

    if (!permission) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera" size={64} color="#DDD" />
                    <Text style={styles.message}>Chargement de la caméra...</Text>
                </View>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-off" size={64} color="#FF3B30" />
                    <Text style={styles.permissionTitle}>Accès à la caméra requis</Text>
                    <Text style={styles.permissionMessage}>
                        Nous avons besoin de votre permission pour utiliser la caméra et scanner les codes-barres.
                    </Text>
                    <Pressable style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={!isProcessing ? handleBarCodeScanned : undefined}
                barcodeScannerSettings={{
                    barcodeTypes: ["upc_a", "upc_e", "ean13", "ean8"],
                }}
            />
            <View style={styles.overlay}>
                <View style={styles.topOverlay}>
                    <Text style={styles.instructionTitle}>Scanner un code-barres</Text>
                    <Text style={styles.instructionText}>
                        Placez le code-barres dans le cadre pour l'analyser
                    </Text>
                </View>

                <View style={styles.scanFrame}>
                    <View style={styles.scanArea}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>

                    {!isProcessing && (
                        <View style={styles.scanLine} />
                    )}
                </View>

                <View style={styles.bottomOverlay}>
                    <View style={styles.statusContainer}>
                        {!isProcessing ? (
                            <>
                                <Ionicons name="scan" size={24} color="#4CAF50" />
                                <Text style={styles.statusText}>Recherche en cours...</Text>
                            </>
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                                <Text style={styles.statusText}>Code scanné !</Text>
                            </>
                        )}
                    </View>

                    <Pressable
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                        <Text style={styles.backButtonText}>Retour</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    camera: {
        flex: 1,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F8F9FA",
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#333",
        marginTop: 16,
        marginBottom: 8,
        textAlign: "center",
    },
    permissionMessage: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
    },
    permissionButton: {
        backgroundColor: "#4CAF50",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    permissionButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "space-between",
    },
    topOverlay: {
        backgroundColor: "rgba(0,0,0,0.7)",
        paddingTop: 60,
        paddingHorizontal: 40,
        paddingBottom: 40,
        alignItems: "center",
    },
    instructionTitle: {
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 8,
        textAlign: "center",
    },
    instructionText: {
        color: "#FFFFFF",
        fontSize: 16,
        textAlign: "center",
        opacity: 0.9,
        lineHeight: 22,
    },
    scanFrame: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    scanArea: {
        width: Math.min(width * 0.8, 280),
        height: 160,
        position: "relative",
    },
    corner: {
        position: "absolute",
        width: 30,
        height: 30,
        borderColor: "#4CAF50",
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderBottomWidth: 0,
        borderRightWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderBottomWidth: 0,
        borderLeftWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderTopWidth: 0,
        borderRightWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderTopWidth: 0,
        borderLeftWidth: 0,
    },
    scanLine: {
        position: "absolute",
        width: Math.min(width * 0.8, 280),
        height: 2,
        backgroundColor: "#4CAF50",
        opacity: 0.8,
    },
    bottomOverlay: {
        backgroundColor: "rgba(0,0,0,0.7)",
        paddingHorizontal: 40,
        paddingTop: 40,
        paddingBottom: 60,
        alignItems: "center",
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
        gap: 8,
    },
    statusText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    backButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    message: {
        textAlign: "center",
        fontSize: 16,
        color: "#666",
        marginTop: 16,
    },
});
