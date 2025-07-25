export interface Food {
    foodId: string;
    label: string;
    image?: string;
    nutrients: {
        ENERC_KCAL: number;
        PROCNT: number;
        FAT: number;
        CHOCDF: number;
    };
}

export interface CartItem {
    food: Food;
    quantity: number;
}

export interface Meal {
    id: string;
    date: string;
    foods: CartItem[];
    totalCalories: number;
    totalProteins: number;
    totalFats: number;
    totalCarbs: number;
}

export interface EdamamResponse {
    parsed: Array<{
        food: {
            foodId: string;
            label: string;
            image?: string;
            nutrients: {
                ENERC_KCAL: number;
                PROCNT: number;
                FAT: number;
                CHOCDF: number;
            };
        };
    }>;
    hints: Array<{
        food: {
            foodId: string;
            label: string;
            image?: string;
            nutrients: {
                ENERC_KCAL: number;
                PROCNT: number;
                FAT: number;
                CHOCDF: number;
            };
        };
    }>;
}
