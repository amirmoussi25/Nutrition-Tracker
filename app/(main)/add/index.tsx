import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    FlatList,
    StyleSheet,
    Pressable,
    SafeAreaView,
    Image,
    Alert,
    ActivityIndicator,
    Modal,
    ScrollView,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Food, CartItem } from "../../../types";
import { searchFood } from "../../../services/edamam";
import { saveMeal } from "../../../services/sqlite";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get('window');

export default function AddMealScreen() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Food[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const router = useRouter();
    const { scannedFood } = useLocalSearchParams();
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            if (scannedFood) {
                try {
                    const food = JSON.parse(scannedFood as string);
                    addToCart(food);
                } catch (error) {
                    console.error("Erreur parsing scanned food:", error);
                }
            }
        }, [scannedFood])
    );

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (text.trim().length > 2) {
            searchTimeout.current = setTimeout(() => {
                performSearch(text);
            }, 1000);
        } else {
            setSearchResults([]);
        }
    };

    const performSearch = async (query: string) => {
        if (!query.trim()) return;

        setLoading(true);
        try {
            const results = await searchFood(query);
            setSearchResults(results);
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert("Erreur", error.message);
            } else {
                Alert.alert("Erreur", "Impossible de rechercher les aliments");
            }
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (food: Food) => {
        setCart(prev => {
            const existingItem = prev.find(item => item.food.foodId === food.foodId);
            if (existingItem) {
                return prev.map(item =>
                    item.food.foodId === food.foodId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { food, quantity: 1 }];
        });
    };

    const updateQuantity = (foodId: string, change: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.food.foodId === foodId) {
                    const newQuantity = Math.max(0, item.quantity + change);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            }).filter(item => item.quantity > 0);
        });
    };

    const removeFromCart = (foodId: string) => {
        setCart(prev => prev.filter(item => item.food.foodId !== foodId));
    };

    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    const getTotalCalories = () => {
        return cart.reduce((total, item) => total + (item.food.nutrients.ENERC_KCAL * item.quantity), 0);
    };

    const resetForm = () => {
        setCart([]);
        setSearchQuery("");
        setSearchResults([]);
    };

    const createMeal = async () => {
        if (cart.length === 0) {
            Alert.alert("Erreur", "Veuillez sélectionner au moins un aliment");
            return;
        }

        setSaving(true);
        try {
            await saveMeal(cart);
            Alert.alert(
                "Succès",
                "Recette créée avec succès",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            resetForm();
                            router.push("/(main)/(home)");
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            Alert.alert("Erreur", "Impossible de sauvegarder la recette. Veuillez réessayer.");
        } finally {
            setSaving(false);
        }
    };

    const renderSearchItem = ({ item }: { item: Food }) => (
        <Pressable style={styles.searchItem} onPress={() => addToCart(item)}>
            {item.image ? (
                <Image source={{ uri: item.image }} style={styles.foodImage} />
            ) : (
                <View style={[styles.foodImage, styles.placeholderImage]}>
                    <Text style={styles.placeholderText}>🍽️</Text>
                </View>
            )}
            <View style={styles.foodInfo}>
                <Text style={styles.foodName} numberOfLines={2}>{item.label}</Text>
                <Text style={styles.calories}>{Math.round(item.nutrients.ENERC_KCAL)} kcal</Text>
            </View>
            <Ionicons name="add-circle" size={24} color="#4CAF50" />
        </Pressable>
    );

    const renderCartItem = ({ item }: { item: CartItem }) => (
        <View style={styles.cartItem}>
            {item.food.image ? (
                <Image source={{ uri: item.food.image }} style={styles.cartImage} />
            ) : (
                <View style={[styles.cartImage, styles.placeholderImage]}>
                    <Text style={styles.placeholderText}>🍽️</Text>
                </View>
            )}
            <View style={styles.cartInfo}>
                <Text style={styles.cartName} numberOfLines={2}>{item.food.label}</Text>
                <Text style={styles.cartNutrition}>
                    {Math.round(item.food.nutrients.ENERC_KCAL * item.quantity)} kcal
                </Text>
                <View style={styles.nutritionDetails}>
                    <Text style={styles.nutritionText}>P: {(item.food.nutrients.PROCNT * item.quantity).toFixed(1)}g</Text>
                    <Text style={styles.nutritionText}>L: {(item.food.nutrients.FAT * item.quantity).toFixed(1)}g</Text>
                    <Text style={styles.nutritionText}>G: {(item.food.nutrients.CHOCDF * item.quantity).toFixed(1)}g</Text>
                </View>
            </View>
            <View style={styles.quantityControls}>
                <Pressable
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.food.foodId, -1)}
                >
                    <Ionicons name="remove" size={16} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <Pressable
                    style={styles.quantityButton}
                    onPress={() => updateQuantity(item.food.foodId, 1)}
                >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                </Pressable>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.content}>
                    <View style={styles.searchContainer}>
                        <View style={styles.searchInputContainer}>
                            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Rechercher un aliment..."
                                value={searchQuery}
                                onChangeText={handleSearchChange}
                                placeholderTextColor="#999"
                            />
                        </View>
                        <Pressable
                            style={styles.scanButton}
                            onPress={() => router.push("/(main)/add/camera")}
                        >
                            <Ionicons name="barcode" size={20} color="#FFFFFF" />
                            <Text style={styles.scanButtonText}>Scanner</Text>
                        </Pressable>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4CAF50" />
                            <Text style={styles.loadingText}>Recherche en cours...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={searchResults}
                            renderItem={renderSearchItem}
                            keyExtractor={(item, index) => `search-${index}-${item.foodId}`}
                            style={styles.searchResults}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.listContainer}
                            ListEmptyComponent={
                                searchQuery.length > 2 && !loading ? (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="search" size={48} color="#DDD" />
                                        <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
                                        <Text style={styles.emptySubtext}>Essayez avec d'autres mots-clés</Text>
                                    </View>
                                ) : searchQuery.length === 0 ? (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="restaurant" size={48} color="#DDD" />
                                        <Text style={styles.emptyText}>Recherchez vos aliments</Text>
                                        <Text style={styles.emptySubtext}>Ou scannez un code-barres</Text>
                                    </View>
                                ) : null
                            }
                        />
                    )}
                </View>

                {cart.length > 0 && (
                    <View style={styles.bottomContainer}>
                        <View style={styles.cartSummary}>
                            <Text style={styles.cartSummaryText}>
                                {getTotalItems()} aliment(s) • {Math.round(getTotalCalories())} kcal
                            </Text>
                        </View>
                        <View style={styles.buttonRow}>
                            <Pressable
                                style={styles.viewCartButton}
                                onPress={() => setModalVisible(true)}
                            >
                                <Ionicons name="eye" size={20} color="#4CAF50" />
                                <Text style={styles.viewCartButtonText}>Voir</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.createButton, saving && styles.buttonDisabled]}
                                onPress={createMeal}
                                disabled={saving}
                            >
                                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                                <Text style={styles.createButtonText}>
                                    {saving ? "Création..." : "Créer Recette"}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Aliments sélectionnés</Text>
                                <Pressable
                                    style={styles.closeButton}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Ionicons name="close" size={24} color="#333" />
                                </Pressable>
                            </View>
                            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                                {cart.map((item, index) => (
                                    <View key={`cart-${index}-${item.food.foodId}`}>
                                        {renderCartItem({ item })}
                                    </View>
                                ))}
                            </ScrollView>
                            <View style={styles.modalFooter}>
                                <Text style={styles.modalTotal}>
                                    Total: {Math.round(getTotalCalories())} kcal
                                </Text>
                            </View>
                        </View>
                    </View>
                </Modal>
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
    content: {
        flex: 1,
    },
    searchContainer: {
        padding: 16,
        flexDirection: "row",
        gap: 12,
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        height: 48,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#333",
    },
    scanButton: {
        backgroundColor: "#333",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    scanButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#666",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
        minHeight: height * 0.5,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#666",
        marginTop: 16,
        textAlign: "center",
    },
    emptySubtext: {
        fontSize: 14,
        color: "#999",
        marginTop: 8,
        textAlign: "center",
    },
    searchResults: {
        flex: 1,
    },
    listContainer: {
        padding: 16,
        paddingTop: 0,
        flexGrow: 1,
    },
    searchItem: {
        backgroundColor: "#FFFFFF",
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    foodImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
    },
    foodInfo: {
        flex: 1,
    },
    foodName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },
    calories: {
        fontSize: 14,
        color: "#666",
    },
    placeholderImage: {
        backgroundColor: "#F0F0F0",
        justifyContent: "center",
        alignItems: "center",
    },
    placeholderText: {
        fontSize: 18,
    },
    bottomContainer: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        paddingBottom: Platform.OS === "ios" ? 32 : 16,
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    cartSummary: {
        alignItems: "center",
        marginBottom: 12,
    },
    cartSummaryText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    buttonRow: {
        flexDirection: "row",
        gap: 12,
    },
    viewCartButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F0F9F0",
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: "#4CAF50",
    },
    viewCartButtonText: {
        color: "#4CAF50",
        fontSize: 16,
        fontWeight: "600",
    },
    createButton: {
        flex: 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#4CAF50",
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    createButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
    },
    closeButton: {
        padding: 4,
    },
    modalList: {
        maxHeight: height * 0.5,
    },
    cartItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    cartImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
    },
    cartInfo: {
        flex: 1,
    },
    cartName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },
    cartNutrition: {
        fontSize: 12,
        color: "#4CAF50",
        fontWeight: "600",
        marginBottom: 4,
    },
    nutritionDetails: {
        flexDirection: "row",
        gap: 8,
    },
    nutritionText: {
        fontSize: 10,
        color: "#666",
    },
    quantityControls: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    quantityButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#4CAF50",
        justifyContent: "center",
        alignItems: "center",
    },
    quantityText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        minWidth: 24,
        textAlign: "center",
    },
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#E0E0E0",
        alignItems: "center",
    },
    modalTotal: {
        fontSize: 18,
        fontWeight: "700",
        color: "#4CAF50",
    },
});
