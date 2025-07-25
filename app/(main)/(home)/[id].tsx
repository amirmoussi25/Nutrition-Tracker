import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Image,
    ScrollView,
    Pressable,
    Alert,
    Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Meal } from "../../../types";
import { getMealById, deleteMeal } from "../../../services/sqlite";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

export default function MealDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [meal, setMeal] = useState<Meal | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadMeal();
    }, [id]);

    const loadMeal = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const loadedMeal = await getMealById(id);
            setMeal(loadedMeal);
        } catch (error) {
            console.error("Erreur lors du chargement du repas:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMeal = () => {
        Alert.alert(
            "Supprimer la recette",
            "Êtes-vous sûr de vouloir supprimer cette recette ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        if (id) {
                            try {
                                await deleteMeal(id);
                                router.back();
                            } catch (error) {
                                Alert.alert("Erreur", "Impossible de supprimer la recette");
                            }
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTotalItems = () => {
        if (!meal) return 0;
        return meal.foods.reduce((total, item) => total + item.quantity, 0);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Ionicons name="restaurant" size={48} color="#DDD" />
                    <Text style={styles.loadingText}>Chargement...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!meal) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Ionicons name="alert-circle" size={48} color="#FF3B30" />
                    <Text style={styles.loadingText}>Recette non trouvée</Text>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Retour</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.foodImagesContainer}>
                        {meal.foods.slice(0, 4).map((cartItem, index) =>
                            cartItem.food.image ? (
                                <View key={`${meal.id}-detail-food-${index}`} style={styles.imageContainer}>
                                    <Image
                                        source={{ uri: cartItem.food.image }}
                                        style={styles.foodImage}
                                    />
                                    {cartItem.quantity > 1 && (
                                        <View style={styles.quantityBadge}>
                                            <Text style={styles.quantityText}>{cartItem.quantity}</Text>
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View key={`${meal.id}-detail-placeholder-${index}`} style={[styles.foodImage, styles.placeholderImage]}>
                                    <Text style={styles.placeholderText}>🍽️</Text>
                                    {cartItem.quantity > 1 && (
                                        <View style={styles.quantityBadge}>
                                            <Text style={styles.quantityText}>{cartItem.quantity}</Text>
                                        </View>
                                    )}
                                </View>
                            )
                        )}
                        {meal.foods.length > 4 && (
                            <View style={[styles.foodImage, styles.moreIndicator]}>
                                <Text style={styles.moreText}>+{meal.foods.length - 4}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.title}>
                        Recette du {formatDate(meal.date)}
                    </Text>

                    <View style={styles.summaryStats}>
                        <View style={styles.statCard}>
                            <Ionicons name="restaurant" size={20} color="#4CAF50" />
                            <Text style={styles.statNumber}>{getTotalItems()}</Text>
                            <Text style={styles.statLabel}>Aliments</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="flame" size={20} color="#FF5722" />
                            <Text style={styles.statNumber}>{Math.round(meal.totalCalories)}</Text>
                            <Text style={styles.statLabel}>Kcal</Text>
                        </View>
                    </View>

                    <View style={styles.nutritionSummary}>
                        <View style={styles.nutritionCard}>
                            <Text style={styles.nutritionLabel}>Protéines</Text>
                            <Text style={styles.nutritionValue}>{meal.totalProteins.toFixed(1)}g</Text>
                        </View>
                        <View style={styles.nutritionCard}>
                            <Text style={styles.nutritionLabel}>Lipides</Text>
                            <Text style={styles.nutritionValue}>{meal.totalFats.toFixed(1)}g</Text>
                        </View>
                        <View style={styles.nutritionCard}>
                            <Text style={styles.nutritionLabel}>Glucides</Text>
                            <Text style={styles.nutritionValue}>{meal.totalCarbs.toFixed(1)}g</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.ingredientsSection}>
                    <Text style={styles.sectionTitle}>Aliments de la recette</Text>
                    {meal.foods.map((cartItem, index) => (
                        <View key={`${meal.id}-ingredient-${index}-${cartItem.food.foodId}`} style={styles.ingredientItem}>
                            <View style={styles.ingredientImageContainer}>
                                {cartItem.food.image ? (
                                    <Image
                                        source={{ uri: cartItem.food.image }}
                                        style={styles.ingredientImage}
                                    />
                                ) : (
                                    <View style={[styles.ingredientImage, styles.placeholderImage]}>
                                        <Text style={styles.placeholderText}>🍽️</Text>
                                    </View>
                                )}
                                <View style={styles.quantityIndicator}>
                                    <Text style={styles.quantityIndicatorText}>×{cartItem.quantity}</Text>
                                </View>
                            </View>

                            <View style={styles.ingredientInfo}>
                                <Text style={styles.ingredientName} numberOfLines={2}>{cartItem.food.label}</Text>
                                <Text style={styles.ingredientCalories}>
                                    {Math.round(cartItem.food.nutrients.ENERC_KCAL * cartItem.quantity)} kcal
                                </Text>
                                <View style={styles.ingredientNutrition}>
                                    <View style={styles.nutritionDetail}>
                                        <Text style={styles.nutritionDetailLabel}>P:</Text>
                                        <Text style={styles.nutritionDetailValue}>
                                            {(cartItem.food.nutrients.PROCNT * cartItem.quantity).toFixed(1)}g
                                        </Text>
                                    </View>
                                    <View style={styles.nutritionDetail}>
                                        <Text style={styles.nutritionDetailLabel}>L:</Text>
                                        <Text style={styles.nutritionDetailValue}>
                                            {(cartItem.food.nutrients.FAT * cartItem.quantity).toFixed(1)}g
                                        </Text>
                                    </View>
                                    <View style={styles.nutritionDetail}>
                                        <Text style={styles.nutritionDetailLabel}>G:</Text>
                                        <Text style={styles.nutritionDetailValue}>
                                            {(cartItem.food.nutrients.CHOCDF * cartItem.quantity).toFixed(1)}g
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                <Pressable style={styles.deleteButton} onPress={handleDeleteMeal}>
                    <Ionicons name="trash" size={20} color="#FFFFFF" />
                    <Text style={styles.deleteButtonText}>Supprimer la recette</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        paddingHorizontal: 40,
    },
    loadingText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
    },
    backButton: {
        backgroundColor: "#4CAF50",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        marginTop: 16,
    },
    backButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: "#FFFFFF",
        padding: 20,
        marginBottom: 16,
    },
    foodImagesContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 20,
        gap: 8,
        flexWrap: "wrap",
    },
    imageContainer: {
        position: "relative",
    },
    foodImage: {
        width: 60,
        height: 60,
        borderRadius: 12,
    },
    quantityBadge: {
        position: "absolute",
        top: -6,
        right: -6,
        backgroundColor: "#4CAF50",
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    quantityText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
    },
    placeholderImage: {
        backgroundColor: "#F0F0F0",
        justifyContent: "center",
        alignItems: "center",
    },
    placeholderText: {
        fontSize: 24,
    },
    moreIndicator: {
        backgroundColor: "#E0E0E0",
        justifyContent: "center",
        alignItems: "center",
    },
    moreText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#333",
        textAlign: "center",
        marginBottom: 20,
        lineHeight: 28,
    },
    summaryStats: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 20,
    },
    statCard: {
        alignItems: "center",
        backgroundColor: "#F8F9FA",
        padding: 16,
        borderRadius: 12,
        minWidth: 80,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: "700",
        color: "#333",
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: "#666",
        marginTop: 4,
    },
    nutritionSummary: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
    },
    nutritionCard: {
        flex: 1,
        backgroundColor: "#F8F9FA",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    nutritionLabel: {
        fontSize: 12,
        color: "#666",
        marginBottom: 4,
    },
    nutritionValue: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    ingredientsSection: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginBottom: 16,
    },
    ingredientItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    ingredientImageContainer: {
        position: "relative",
        marginRight: 16,
    },
    ingredientImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
    },
    quantityIndicator: {
        position: "absolute",
        bottom: -6,
        right: -6,
        backgroundColor: "#333",
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    quantityIndicatorText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "700",
    },
    ingredientInfo: {
        flex: 1,
    },
    ingredientName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },
    ingredientCalories: {
        fontSize: 14,
        color: "#4CAF50",
        fontWeight: "600",
        marginBottom: 8,
    },
    ingredientNutrition: {
        flexDirection: "row",
        gap: 16,
    },
    nutritionDetail: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    nutritionDetailLabel: {
        fontSize: 12,
        color: "#666",
        fontWeight: "600",
    },
    nutritionDetailValue: {
        fontSize: 12,
        color: "#333",
        fontWeight: "600",
    },
    deleteButton: {
        backgroundColor: "#FF3B30",
        marginHorizontal: 16,
        marginBottom: 32,
        padding: 16,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    deleteButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
});
