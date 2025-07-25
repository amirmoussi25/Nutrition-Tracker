import AsyncStorage from '@react-native-async-storage/async-storage';
import { Meal, Food } from '../types';

const MEALS_KEY = 'meals';

export const saveMeal = async (foods: Food[]): Promise<void> => {
    try {
        const totalCalories = foods.reduce((sum, food) => sum + (food.nutrients.ENERC_KCAL || 0), 0);
        const totalProteins = foods.reduce((sum, food) => sum + (food.nutrients.PROCNT || 0), 0);
        const totalFats = foods.reduce((sum, food) => sum + (food.nutrients.FAT || 0), 0);
        const totalCarbs = foods.reduce((sum, food) => sum + (food.nutrients.CHOCDF || 0), 0);

        const meal: Meal = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            foods,
            totalCalories,
            totalProteins,
            totalFats,
            totalCarbs,
        };

        const existingMeals = await getMeals();
        const updatedMeals = [meal, ...existingMeals];

        await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(updatedMeals));
    } catch (error) {
        console.error('Erreur sauvegarde repas:', error);
        throw error;
    }
};

export const getMeals = async (): Promise<Meal[]> => {
    try {
        const mealsJson = await AsyncStorage.getItem(MEALS_KEY);
        return mealsJson ? JSON.parse(mealsJson) : [];
    } catch (error) {
        console.error('Erreur chargement repas:', error);
        return [];
    }
};

export const getMealById = async (id: string): Promise<Meal | null> => {
    try {
        const meals = await getMeals();
        return meals.find(meal => meal.id === id) || null;
    } catch (error) {
        console.error('Erreur chargement repas:', error);
        return null;
    }
};

export const deleteMeal = async (id: string): Promise<void> => {
    try {
        const meals = await getMeals();
        const updatedMeals = meals.filter(meal => meal.id !== id);
        await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(updatedMeals));
    } catch (error) {
        console.error('Erreur suppression repas:', error);
        throw error;
    }
};
