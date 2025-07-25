import * as SQLite from 'expo-sqlite';
import { Meal, CartItem } from '../types';

let db: SQLite.SQLiteDatabase;

export const initDatabase = async (): Promise<void> => {
    try {
        db = await SQLite.openDatabaseAsync('nutrition.db');

        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS meals (
                id TEXT PRIMARY KEY,
                date TEXT NOT NULL,
                totalCalories REAL NOT NULL,
                totalProteins REAL NOT NULL,
                totalFats REAL NOT NULL,
                totalCarbs REAL NOT NULL
            );
        `);

        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS foods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mealId TEXT NOT NULL,
                foodId TEXT NOT NULL,
                label TEXT NOT NULL,
                image TEXT,
                calories REAL NOT NULL,
                proteins REAL NOT NULL,
                fats REAL NOT NULL,
                carbs REAL NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY (mealId) REFERENCES meals (id) ON DELETE CASCADE
            );
        `);

        const tableInfo = await db.getAllAsync("PRAGMA table_info(foods)");
        const hasQuantityColumn = tableInfo.some((column: any) => column.name === 'quantity');

        if (!hasQuantityColumn) {
            await db.execAsync(`ALTER TABLE foods ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;`);
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données:', error);
        throw error;
    }
};

export const saveMeal = async (cartItems: CartItem[]): Promise<void> => {
    try {
        if (!db) {
            await initDatabase();
        }

        let totalCalories = 0;
        let totalProteins = 0;
        let totalFats = 0;
        let totalCarbs = 0;

        cartItems.forEach(item => {
            totalCalories += (item.food.nutrients.ENERC_KCAL || 0) * item.quantity;
            totalProteins += (item.food.nutrients.PROCNT || 0) * item.quantity;
            totalFats += (item.food.nutrients.FAT || 0) * item.quantity;
            totalCarbs += (item.food.nutrients.CHOCDF || 0) * item.quantity;
        });

        const mealId = Date.now().toString();
        const date = new Date().toISOString();

        await db.runAsync(
            'INSERT INTO meals (id, date, totalCalories, totalProteins, totalFats, totalCarbs) VALUES (?, ?, ?, ?, ?, ?)',
            [mealId, date, totalCalories, totalProteins, totalFats, totalCarbs]
        );

        for (const item of cartItems) {
            await db.runAsync(
                'INSERT INTO foods (mealId, foodId, label, image, calories, proteins, fats, carbs, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    mealId,
                    item.food.foodId,
                    item.food.label,
                    item.food.image || null,
                    item.food.nutrients.ENERC_KCAL || 0,
                    item.food.nutrients.PROCNT || 0,
                    item.food.nutrients.FAT || 0,
                    item.food.nutrients.CHOCDF || 0,
                    item.quantity
                ]
            );
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du repas:', error);
        throw error;
    }
};

export const getMeals = async (): Promise<Meal[]> => {
    try {
        if (!db) {
            await initDatabase();
        }

        const mealsResult = await db.getAllAsync('SELECT * FROM meals ORDER BY date DESC');

        const meals = await Promise.all(mealsResult.map(async (mealRow: any) => {
            const foodsResult = await db.getAllAsync('SELECT * FROM foods WHERE mealId = ?', [mealRow.id]);

            const foods: CartItem[] = foodsResult.map((foodRow: any) => ({
                food: {
                    foodId: foodRow.foodId,
                    label: foodRow.label,
                    image: foodRow.image,
                    nutrients: {
                        ENERC_KCAL: foodRow.calories,
                        PROCNT: foodRow.proteins,
                        FAT: foodRow.fats,
                        CHOCDF: foodRow.carbs
                    }
                },
                quantity: foodRow.quantity
            }));

            return {
                id: mealRow.id,
                date: mealRow.date,
                foods,
                totalCalories: mealRow.totalCalories,
                totalProteins: mealRow.totalProteins,
                totalFats: mealRow.totalFats,
                totalCarbs: mealRow.totalCarbs
            };
        }));

        return meals;
    } catch (error) {
        console.error('Erreur lors du chargement des repas:', error);
        return [];
    }
};

export const getMealById = async (id: string): Promise<Meal | null> => {
    try {
        if (!db) {
            await initDatabase();
        }

        const mealResult = await db.getFirstAsync('SELECT * FROM meals WHERE id = ?', [id]);

        if (!mealResult) return null;

        const foodsResult = await db.getAllAsync('SELECT * FROM foods WHERE mealId = ?', [id]);

        const foods: CartItem[] = foodsResult.map((foodRow: any) => ({
            food: {
                foodId: foodRow.foodId,
                label: foodRow.label,
                image: foodRow.image,
                nutrients: {
                    ENERC_KCAL: foodRow.calories,
                    PROCNT: foodRow.proteins,
                    FAT: foodRow.fats,
                    CHOCDF: foodRow.carbs
                }
            },
            quantity: foodRow.quantity
        }));

        return {
            id: (mealResult as any).id,
            date: (mealResult as any).date,
            foods,
            totalCalories: (mealResult as any).totalCalories,
            totalProteins: (mealResult as any).totalProteins,
            totalFats: (mealResult as any).totalFats,
            totalCarbs: (mealResult as any).totalCarbs
        };
    } catch (error) {
        console.error('Erreur lors du chargement du repas:', error);
        return null;
    }
};

export const deleteMeal = async (id: string): Promise<void> => {
    try {
        if (!db) {
            await initDatabase();
        }

        await db.runAsync('DELETE FROM meals WHERE id = ?', [id]);
        await db.runAsync('DELETE FROM foods WHERE mealId = ?', [id]);
    } catch (error) {
        console.error('Erreur lors de la suppression du repas:', error);
        throw error;
    }
};
