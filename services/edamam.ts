import { EdamamResponse, Food } from '../types';

const API_BASE_URL = 'https://api.edamam.com/api/food-database/v2';
const APP_ID = process.env.EXPO_PUBLIC_EDAMAM_APP_ID;
const APP_KEY = process.env.EXPO_PUBLIC_EDAMAM_APP_KEY;

const checkApiKeys = () => {
    if (!APP_ID || !APP_KEY) {
        throw new Error('Les clés API Edamam ne sont pas configurées. Veuillez les ajouter dans le fichier .env');
    }
};

export const searchFood = async (query: string): Promise<Food[]> => {
    try {
        checkApiKeys();

        const response = await fetch(
            `${API_BASE_URL}/parser?app_id=${APP_ID}&app_key=${APP_KEY}&ingr=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Clés API Edamam invalides');
            }
            if (response.status === 403) {
                throw new Error('Limite API Edamam atteinte');
            }
            throw new Error(`Erreur API: ${response.status}`);
        }

        const data: EdamamResponse = await response.json();

        const foods: Food[] = [];

        if (data.parsed && data.parsed.length > 0) {
            foods.push(...data.parsed.map(item => item.food));
        }

        if (data.hints && data.hints.length > 0) {
            foods.push(...data.hints.slice(0, 10).map(item => item.food));
        }

        return foods;
    } catch (error) {
        console.error('Erreur API Edamam:', error);
        throw error;
    }
};

export const searchFoodByBarcode = async (barcode: string): Promise<Food | null> => {
    try {
        checkApiKeys();

        const response = await fetch(
            `${API_BASE_URL}/parser?app_id=${APP_ID}&app_key=${APP_KEY}&upc=${barcode}`
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Clés API Edamam invalides');
            }
            if (response.status === 403) {
                throw new Error('Limite API Edamam atteinte');
            }
            console.log(`Code-barres non trouvé: ${response.status}`);
            return null;
        }

        const data: EdamamResponse = await response.json();

        if (data.parsed && data.parsed.length > 0) {
            return data.parsed[0].food;
        }

        if (data.hints && data.hints.length > 0) {
            return data.hints[0].food;
        }

        return null;
    } catch (error) {
        console.error('Erreur recherche code-barres:', error);
        if (error instanceof Error && error.message.includes('clés API')) {
            throw error;
        }
        return null;
    }
};
