import React, { useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Pressable,
    SafeAreaView,
    Image,
    Dimensions,
    RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Meal } from "../../../types";
import { getMeals } from "../../../services/sqlite";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const [meals, setMeals] = useState<Meal[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const loadMeals = async () => {
        try {
            const loadedMeals = await getMeals();
            setMeals(loadedMeals);
        } catch (error) {
            console.error("Erreur lors du chargement des repas:", error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadMeals();
        setRefreshing(false);
    };

    useFocusEffect(
        React.useCallback(() => {
            loadMeals();
        }, [])
    );

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

    const getTotalItems = (meal: Meal) => {
        return meal.foods.reduce((total, item) => total + item.quantity, 0);
    };

    const getMainFoods = (meal: Meal) => {
        return meal.foods.slice(0, 2).map(item =>
            item.quantity > 1 ? `${item.food.label} (${item.quantity})` : item.food.label
        ).join(", ");
    };

    const renderMealItem = ({ item }: { item: Meal }) => (
        <Pressable
            style={styles.mealCard}
            onPress={() => router.push(`/(main)/(home)/${item.id}`)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.foodImages}>
                    {item.foods.slice(0, 3).map((cartItem, index) =>
                        cartItem.food.image ? (
                            <View key={`${item.id}-food-${index}`} style={styles.imageContainer}>
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
                            <View key={`${item.id}-placeholder-${index}`} style={[styles.foodImage, styles.placeholderImage]}>
                                <Text style={styles.placeholderText}>🍽️</Text>
                                {cartItem.quantity > 1 && (
                                    <View style={styles.quantityBadge}>
                                        <Text style={styles.quantityText}>{cartItem.quantity}</Text>
                                    </View>
                                )}
                            </View>
                        )
                    )}
                    {item.foods.length > 3 && (
                        <View style={[styles.foodImage, styles.moreIndicator]}>
                            <Text style={styles.moreText}>+{item.foods.length - 3}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.mealInfo}>
                    <Text style={styles.mealTitle} numberOfLines={2}>
                        {getMainFoods(item)}
                        {item.foods.length > 2 && "..."}
                    </Text>
                    <Text style={styles.mealDate}>
                        {formatDate(item.date)}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Ionicons name="restaurant" size={16} color="#4CAF50" />
                    <Text style={styles.statText}>{getTotalItems(item)} aliments</Text>
                </View>
                <View style={styles.statItem}>
                    <Ionicons name="flame" size={16} color="#FF5722" />
                    <Text style={styles.statText}>{Math.round(item.totalCalories)} kcal</Text>
                </View>
            </View>

            <View style={styles.nutritionRow}>
                <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>Protéines</Text>
                    <Text style={styles.nutritionValue}>{item.totalProteins.toFixed(1)}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>Lipides</Text>
                    <Text style={styles.nutritionValue}>{item.totalFats.toFixed(1)}g</Text>
                </View>
                <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionLabel}>Glucides</Text>
                    <Text style={styles.nutritionValue}>{item.totalCarbs.toFixed(1)}g</Text>
                </View>
            </View>
        </Pressable>
    );

    return (
        <SafeAreaView style={styles.container}>
            {meals.length === 0 && !refreshing ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="restaurant-outline" size={64} color="#DDD" />
                    <Text style={styles.emptyTitle}>Aucune recette</Text>
                    <Text style={styles.emptyText}>Commencez par créer votre première recette</Text>
                    <Pressable
                        style={styles.addButton}
                        onPress={() => router.push("/(main)/add")}
                    >
                        <Ionicons name="add" size={20} color="#FFFFFF" />
                        <Text style={styles.addButtonText}>Créer une recette</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    data={meals}
                    renderItem={renderMealItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#4CAF50"]}
                            tintColor="#4CAF50"
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#333",
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#4CAF50",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    addButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    listContainer: {
        padding: 16,
    },
    mealCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    foodImages: {
        flexDirection: "row",
        marginRight: 12,
    },
    imageContainer: {
        position: "relative",
        marginRight: 4,
    },
    foodImage: {
        width: 40,
        height: 40,
        borderRadius: 8,
    },
    quantityBadge: {
        position: "absolute",
        top: -6,
        right: -6,
        backgroundColor: "#4CAF50",
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },
    quantityText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "700",
    },
    placeholderImage: {
        backgroundColor: "#F0F0F0",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    placeholderText: {
        fontSize: 16,
    },
    moreIndicator: {
        backgroundColor: "#E0E0E0",
        justifyContent: "center",
        alignItems: "center",
    },
    moreText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#666",
    },
    mealInfo: {
        flex: 1,
    },
    mealTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },
    mealDate: {
        fontSize: 12,
        color: "#666",
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },
    nutritionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#F8F9FA",
        padding: 12,
        borderRadius: 8,
    },
    nutritionItem: {
        alignItems: "center",
    },
    nutritionLabel: {
        fontSize: 12,
        color: "#666",
        marginBottom: 2,
    },
    nutritionValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },
});
