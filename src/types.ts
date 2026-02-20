
export interface MultiLanguageText {
    en: string;
    hi: string;
    mr: string;
    ta: string;
    te: string;
    bn: string;
    ml: string;
}

export type Language = keyof MultiLanguageText;

export interface FishResult {
    commonName?: string;
    scientificName?: string;
    features?: string[];
    habitat?: string;
    edibility?: string;
    confidence?: number;
    freshness?: {
        score: number;
        grade: 'Excellent' | 'Good' | 'Fair' | 'Poor';
        indicators: string[];
        assessment: string;
    };
    quality?: {
        score: number;
        grade: 'Premium' | 'Good' | 'Average' | 'Below Average';
        factors: string[];
        assessment: string;
    };
    error?: string;
}

export interface HistoryItem {
    id: string;
    timestamp: string;
    image: string;
    result: FishResult;
}

export interface User {
    id: string;
    name: string;
    email: string;
    picture: string;
    provider: string;
}

export interface UserLocation {
    lat: number;
    lng: number;
}

export interface Shop {
    name: string;
    address: string;
    distance: string;
    type: string;
    phone?: string;
    description?: string;
    lat?: number;
    lng?: number;
}

export interface OnlinePlatform {
    name: string;
    url: string;
    category: string;
    description: string;
    logo: string;
    specialties: string[];
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface FishData {
    id: number;
    name: MultiLanguageText;
    scientificName: string;
    description: MultiLanguageText;
    habitat: MultiLanguageText;
    color: string;
    category: 'Freshwater' | 'Saltwater' | 'Brackish';
}

export interface Department {
    name: string;
    telephone: string;
    fax: string;
    email: string;
}

export interface WeatherData {
    windSpeed: number;
    waveHeight: number;
    temperature: number;
    status: 'Safe' | 'Warning' | 'Danger' | 'Emergency';
    analysis: string;
    lastUpdated: string;
}
