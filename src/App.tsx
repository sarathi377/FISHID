import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Fish, Loader2, Info, X, RefreshCw, MapPin, Navigation, Store, Phone, Mail, Building2, MessageCircle, Send, Book, ChevronRight, Brain, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenerativeAI } from "@google/generative-ai";
import FishAnalysisDashboard from './components/FishAnalysisDashboard';

import {
  Language,
  FishResult,
  HistoryItem,
  User,
  UserLocation,
  Shop,
  OnlinePlatform,
  ChatMessage,
  FishData,
  Department,
  WeatherData
} from './types';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [result, setResult] = useState<FishResult | null>(null);
  const [activeTab, setActiveTab] = useState('identify');
  const [_selectedDepartment, _setSelectedDepartment] = useState<Department | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [nearbyShops, setNearbyShops] = useState<Shop[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [searchingShops, setSearchingShops] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showUserId, setShowUserId] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [_user, setUser] = useState<User | null>(null);
  const [selectedFish, setSelectedFish] = useState<FishData | null>(null);
  const [language, _setLanguage] = useState<Language>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [scanHistory, setScanHistory] = useState<HistoryItem[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [shopMode, setShopMode] = useState<'online' | 'offline'>('online');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Weather simulation cycle (Legacy - kept for fallback or removed if real API preferred)
  // Removed static scenarios to use dynamic data

  const getRiskStatus = (wave: number, wind: number) => {
    if (wave >= 4.0 || wind >= 60) return 'Emergency';
    if (wave >= 2.5 || wind >= 40) return 'Danger';
    if (wave >= 1.5 || wind >= 25) return 'Warning';
    return 'Safe';
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Emergency': return 'bg-red-500/20 text-red-100 border-red-500/50';
      case 'Danger': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  const getFreshnessGradeClass = (grade: string) => {
    switch (grade) {
      case 'Excellent': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'Good': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50';
      case 'Fair': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'Poor': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const getQualityGradeClass = (grade: string) => {
    switch (grade) {
      case 'Premium': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'Good': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'Average': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'Below Average': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  const analyzeWeatherWithGemini = async (metrics: any) => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
      if (!apiKey) return "Normal sea conditions detected. Stay alert.";

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Act as a marine safety expert. Analyze these current metrics:
Wind Speed: ${metrics.windSpeed} km/h
Wave Height: ${metrics.waveHeight} m
Sea Temperature: ${metrics.temperature}°C

Provide a concise (1-2 sentence) safety recommendation.
If conditions are dangerous, be firm. If safe, mention any fishing advantages.
Return ONLY the text.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      return "Unable to generate AI analysis at this time.";
    }
  };

  const fetchMarineWeather = async (lat: number, lng: number) => {
    setLoadingWeather(true);
    try {
      // Open-Meteo Marine API
      const response = await fetch(`https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wind_speed_10m&hourly=sea_surface_temperature`);
      const data = await response.json();

      const currentWave = data.current.wave_height;
      const currentWind = data.current.wind_speed_10m;
      // Get latest sea surface temp if available
      const currentTemp = data.hourly?.sea_surface_temperature?.[0] || 25;

      const risk = getRiskStatus(currentWave, currentWind);

      // Get AI Analysis
      const aiMsg = await analyzeWeatherWithGemini({
        windSpeed: currentWind,
        waveHeight: currentWave,
        temperature: currentTemp
      });

      setWeatherData({
        windSpeed: currentWind,
        waveHeight: currentWave,
        temperature: currentTemp,
        status: risk,
        analysis: aiMsg,
        lastUpdated: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error("Weather fetch failed:", error);
    } finally {
      setLoadingWeather(false);
    }
  };

  // Auto-fetch weather when location is available
  useEffect(() => {
    if (userLocation && activeTab === 'weather' && !weatherData) {
      fetchMarineWeather(userLocation.lat, userLocation.lng);
    }
  }, [userLocation, activeTab]);

  const onlinePlatforms: OnlinePlatform[] = [
    {
      name: "Amazon India",
      url: "https://www.amazon.in/s?k=fishing+equipment",
      category: "E-commerce",
      description: "Wide range of fishing rods, reels, tackle boxes, and marine equipment",
      logo: "🛒",
      specialties: ["Fishing Rods", "Reels", "Tackle Boxes", "Marine Electronics"]
    },
    {
      name: "Flipkart",
      url: "https://www.flipkart.com/search?q=fishing+gear",
      category: "E-commerce",
      description: "Fishing gear, nets, hooks, and outdoor equipment",
      logo: "🛍️",
      specialties: ["Fishing Nets", "Hooks & Lures", "Camping Gear", "Safety Equipment"]
    },
    {
      name: "Decathlon",
      url: "https://www.decathlon.in/fishing",
      category: "Sports & Outdoor",
      description: "Quality fishing equipment and outdoor sports gear",
      logo: "⛺",
      specialties: ["Budget-Friendly Gear", "Beginner Sets", "Fishing Apparel"]
    },
    {
      name: "IndiaMART",
      url: "https://www.indiamart.com/impcat/fishing-equipment.html",
      category: "B2B Marketplace",
      description: "Bulk fishing supplies, nets, and commercial marine equipment",
      logo: "🏭",
      specialties: ["Bulk Orders", "Commercial Nets", "Marine Supplies", "Wholesale"]
    },
    {
      name: "Meesho",
      url: "https://www.meesho.com/fishing-equipment/pl/3g8z",
      category: "Social Commerce",
      description: "Affordable fishing accessories and basic equipment",
      logo: "💰",
      specialties: ["Budget Options", "Basic Accessories", "Small Tools"]
    },
    {
      name: "eBay India",
      url: "https://www.ebay.in/b/Fishing-Equipment-Supplies/1492/bn_1851042",
      category: "Marketplace",
      description: "New and used fishing equipment from various sellers",
      logo: "🌐",
      specialties: ["Used Equipment", "Rare Items", "International Brands"]
    }
  ];

  // Demo shops for testing/demonstration (shown when no location is available)
  const demoShops: Shop[] = [
    {
      name: "Marine Supply Co.",
      address: "123 Harbor Street, Mumbai, Maharashtra 400001",
      distance: "2.3 km",
      type: "Fishing Equipment",
      phone: "+91 22 1234 5678",
      description: "Complete fishing gear and marine supplies",
      lat: 18.9220,
      lng: 72.8347
    },
    {
      name: "Ocean Nets & Tackle",
      address: "45 Coastal Road, Kochi, Kerala 682001",
      distance: "3.7 km",
      type: "Net Shop",
      phone: "+91 484 987 6543",
      description: "Specialized in fishing nets and tackle boxes",
      lat: 9.9312,
      lng: 76.2673
    },
    {
      name: "Fisher's Paradise",
      address: "78 Beach Avenue, Chennai, Tamil Nadu 600001",
      distance: "1.5 km",
      type: "Fishing Store",
      phone: "+91 44 5555 1234",
      description: "Rods, reels, and fishing accessories",
      lat: 13.0827,
      lng: 80.2707
    },
    {
      name: "Coastal Marine Equipment",
      address: "56 Port Road, Visakhapatnam, Andhra Pradesh 530001",
      distance: "4.2 km",
      type: "Marine Supplies",
      phone: "+91 891 234 5678",
      description: "Professional marine and fishing equipment",
      lat: 17.6869,
      lng: 83.2185
    },
    {
      name: "Bay Fishing Gear",
      address: "34 Marina Drive, Goa 403001",
      distance: "5.8 km",
      type: "Fishing Equipment",
      phone: "+91 832 765 4321",
      description: "Quality fishing gear and boat supplies",
      lat: 15.2993,
      lng: 74.1240
    }
  ];


  // Generate unique user ID
  const generateUserId = () => {
    return 'FISH-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  // Initialize user ID on mount
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const stored = await window.storage.get('user_id');
        if (stored && stored.value) {
          setUserId(stored.value);
        } else {
          const newId = generateUserId();
          await window.storage.set('user_id', newId);
          setUserId(newId);
        }

        const userProfile = await window.storage.get('user_profile');
        if (userProfile && userProfile.value) {
          setUser(JSON.parse(userProfile.value));
        }

        const history = await window.storage.get('scan_history');
        if (history && history.value) {
          setScanHistory(JSON.parse(history.value));
        }
      } catch (error) {
        const newId = generateUserId();
        setUserId(newId);
      }
    };
    initializeUser();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          setImage(e.target.result);
          setResult(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImage(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const identifyFish = async () => {
    if (!image) return;

    setIdentifying(true);
    setResult(null);

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
      if (!apiKey) {
        setResult({
          error: "API key not configured."
        });
        setIdentifying(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const base64Data = image.includes(',') ? image.split(',')[1] : image;

      const prompt = `Analyze this fish image and identify the species. Also assess the freshness and quality of the fish. Provide your response ONLY as valid JSON. Do not use markdown formatting. Use this exact structure:
{
  "commonName": "name",
  "scientificName": "name",
  "features": ["feature1", "feature2", "feature3"],
  "habitat": "description",
  "edibility": "description",
  "confidence": 85,
  "freshness": {
    "score": 85,
    "grade": "Excellent",
    "indicators": ["bright eyes", "firm flesh", "fresh smell"],
    "assessment": "The fish appears very fresh based on visual indicators."
  },
  "quality": {
    "score": 80,
    "grade": "Good",
    "factors": ["good size", "proper handling", "no visible damage"],
    "assessment": "The fish shows good quality characteristics."
  }
}
For freshness, analyze: eye clarity and brightness, skin/scales condition, gill color, flesh firmness (if visible), and overall appearance. Grade: Excellent (90-100), Good (70-89), Fair (50-69), Poor (0-49).
For quality, analyze: size appropriateness, handling marks, damage, texture, and overall condition. Grade: Premium (90-100), Good (70-89), Average (50-69), Below Average (0-49).
Be specific about identifying features like coloration, body shape, fin structure, and markings. If unsure, still provide your best identification with appropriate confidence level.`;

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: image.startsWith('data:image/png') ? "image/png" : "image/jpeg",
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      let text = response.text();
      console.log("Raw identification response:", text);

      if (text) {
        // Clean markdown if present
        text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : text;
          const fishData = JSON.parse(jsonString);

          if (fishData.commonName || fishData.scientificName) {
            setResult(fishData);

            // Save to history (non-blocking)
            try {
              const newHistoryItem: HistoryItem = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                image: image,
                result: fishData
              };
              const updatedHistory = [newHistoryItem, ...scanHistory].slice(0, 10);
              setScanHistory(updatedHistory);
              await window.storage.set('scan_history', JSON.stringify(updatedHistory));
            } catch (storageError) {
              console.error("Failed to save history:", storageError);
              // Continue without saving history
            }
          } else {
            throw new Error('Invalid response format');
          }
        } catch (parseError) {
          console.error("JSON Parse Error", parseError);
          setResult({ error: "Could not parse identification results." });
        }
      } else {
        setResult({ error: "No response received from the API." });
      }
    } catch (error: any) {
      console.error('Identification error:', error);
      const errorMessage = error?.message || 'Unknown error';
      setResult({ error: `Failed to identify fish: ${errorMessage}.` });
    } finally {
      setIdentifying(false);
    }
  };

  const getUserLocation = () => {
    setLoadingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoadingLocation(false);
          findNearbyShops(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLoadingLocation(false);
          // Show offline shops as fallback
          setNearbyShops(demoShops);
          alert("Unable to get precise location. Showing demo shops instead.");
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    } else {
      setLoadingLocation(false);
      setNearbyShops(demoShops);
      alert("Geolocation is not supported. Showing demo shops.");
    }
  };

  const findNearbyShops = async (lat: number, lng: number) => {
    setSearchingShops(true);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
      if (!apiKey) {
        // Fallback to demo shops when no API key
        setNearbyShops(demoShops);
        setSearchingShops(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Find fishing net shops, marine supply stores, and fishing equipment stores near coordinates ${lat}, ${lng}. Search for boat net shops, fishing gear stores, and marine equipment suppliers in this area. Provide response as JSON array with this structure:
[
  {
    "name": "Shop Name",
    "address": "Full address",
    "distance": "2.3 km",
    "type": "Fishing Net Shop",
    "phone": "phone number if available",
    "description": "brief description"
  }
]
Provide at least 5-8 results if possible. Return ONLY the JSON array.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (text) {
        try {
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          const jsonString = jsonMatch ? jsonMatch[0] : text;
          const shops = JSON.parse(jsonString);
          if (Array.isArray(shops) && shops.length > 0) {
            setNearbyShops(shops);
          } else {
            // Fallback to demo shops if no results
            setNearbyShops(demoShops);
          }
        } catch (parseError) {
          // Fallback to demo shops on parse error
          setNearbyShops(demoShops);
        }
      } else {
        // Fallback to demo shops on empty response
        setNearbyShops(demoShops);
      }
    } catch (error) {
      console.error('Shop search error:', error);
      // Fallback to demo shops on network error
      setNearbyShops(demoShops);
    } finally {
      setSearchingShops(false);
    }
  };

  const coastGuardDepartments: Department[] = [
    { name: "Public Relations", telephone: "+91-11-23115153", fax: "+91-11-23387926", email: "pro@indiancoastguard.nic.in" },
    { name: "Recruitment", telephone: "+91-120-2201335", fax: "+91-120-2414395", email: "dte-rect@indiancoastguard.nic.in" },
    { name: "Operations", telephone: "+91-11-23115090", fax: "+91-11-23383196", email: "dte-ops@indiancoastguard.nic.in" },
    { name: "Information & Technology", telephone: "+91-11-23115242", fax: "-", email: "dte-it@indiancoastguard.nic.in" }
  ];

  const languages: Record<Language, { name: string; flag: string }> = {
    en: { name: 'English', flag: '🇬🇧' },
    hi: { name: 'हिंदी', flag: '🇮🇳' },
    mr: { name: 'मराठी', flag: '🇮🇳' },
    ta: { name: 'தமிழ்', flag: '🇮🇳' },
    te: { name: 'తెలుగు', flag: '🇮🇳' },
    bn: { name: 'বাংলা', flag: '🇮🇳' },
    ml: { name: 'മലയാളം', flag: '🇮🇳' },
  };

  const fishDatabase: FishData[] = [
    {
      id: 1,
      name: { en: "Hilsa", hi: "इलिश", mr: "हिलसा", ta: "உல்லம்", te: "పులస", bn: "ইলিশ", ml: "ഇലിഷ" },
      scientificName: "Tenualosa ilisha",
      description: { en: "The Hilsa is a popular food fish in South Asia.", hi: "हिल्सा दक्षिण एशिया में एक लोकप्रिय खाद्य मछली है।", mr: "हिल्सा ही दक्षिण आशियातील एक लोकप्रिय अन्न मासा आहे।", ta: "இலிசா தெற்காசியாவில் பிரபலமான உணவு மீன்.", te: "హిల్సా దక్షిణాసియాలో ప్రసిద్ధ ఆహార చేప.", bn: "ইলিশ দক্ষিণ এশিয়ার একটি জনপ্রিয় খাদ্য মাছ।", ml: "ഇലിഷ ദക്ഷിണേഷ്യയിലെ ഒരു പ്രശസ്ത ഭക്ഷ్య മത്സ്യമാണ്." },
      habitat: { en: "Found in rivers and coastal waters.", hi: "नदियों और तटीय जल में पाई जाती है।", mr: "नद्या आणि किनारी पाण्यात आढळते।", ta: "ஆறுகள் மற்றும் கடலோர நீரில் காணப்படுகிறது.", te: "నదులు మరియు తీర జలాల్లో కనిపిస్తుంది.", bn: "নদী এবং উপকূলীয় জলে পাওয়া যায়।", ml: "ഇന്ത്യൻ മഹാസമുദ്രത്തിലെ തീരദേശ ജലം." },
      color: "#94a3b8",
      category: "Brackish"
    },
    {
      id: 2,
      name: { en: "Pomfret", hi: "पोमफ्रेट", mr: "पापलेट", ta: "வவ்வால்", te: "చంద్రమ", bn: "পমফ্রেট", ml: "ആവോലി" },
      scientificName: "Pampus argenteus",
      description: { en: "Silver Pomfret is a highly valued food fish.", hi: "सिल्वर पोमफ्रेट एक मूल्यवान खाद्य मछली है।", mr: "चांदी पापलेट एक मौल्यवान मासा आहे।", ta: "வெள்ளி வவ்வால் மதிப்புமிக்க உணவு மீன்.", te: "వెండి చంద్రమ విలువైన ఆహార చేప.", bn: "সিলভার পমফ্রেট একটি মূল্যবান মাছ।", ml: "വെള്ളി ആവോലി വിലപ്പെട്ട മത്സ്യമാണ്." },
      habitat: { en: "Indo-Pacific region.", hi: "हिंद-प्रशांत क्षेत्र।", mr: "हिंद-प्रशांत प्रदेश।", ta: "இந்தோ-பசிபிக் பகுதி.", te: "ఇండో-పసిఫిక్ ప్రాంతం.", bn: "ইন্দো-প্যাसिফিক অঞ্চল।", ml: "ഇൻഡോ-പസഫിക് മേഖല." },
      color: "#e2e8f0",
      category: "Saltwater"
    },
    {
      id: 3,
      name: { en: "Mackerel", hi: "बंगड़ा", mr: "बांगडा", ta: "காஞ்சல்", te: "అయల", bn: "ম্যাকরেল", ml: "അയല" },
      scientificName: "Rastrelliger kanagurta",
      description: { en: "Indian Mackerel is a common food fish.", hi: "भारतीय बंगड़ा एक आम मछली है।", mr: "भारतीय बांगडा एक सामान्य मासा आहे।", ta: "இந்திய காஞ்சல் பொதுவான மீன்.", te: "భారతీయ అయల సాధారణ చేప.", bn: "ভারতীয় ম্যাকरेल একটি সাধারণ মাছ।", ml: "ഇന്ത്യൻ അയല സാധാരണ മത്സ്യമാണ്." },
      habitat: { en: "Coastal waters of Indian Ocean.", hi: "हिंद महासागर के तटीय जल।", mr: "हिंद महासागराचे किनारी पाणी।", ta: "இந்திய பெருங்கடலின் கடலோர நீர்.", te: "హిందూ మహాసముద్రం తీర జలాలు.", bn: "ভারত মহাসাগরের উপকূলীয় জল।", ml: "ഇന്ത്യൻ മഹാസമുദ്രത്തിലെ തീരദേശ ജലം." },
      color: "#60a5fa",
      category: "Saltwater"
    },
    {
      id: 4,
      name: { en: "Rohu", hi: "रोहू", mr: "रोहू", ta: "ரோகு", te: "రోహు", bn: "রুই", ml: "രോഹു" },
      scientificName: "Labeo rohita",
      description: { en: "Rohu is a major carp species in rivers.", hi: "रोहू नदियों में पाई जाने वाली एक प्रमुख कार्प प्रजाति है।", mr: "रोहू नद्यांमध्ये आढळणारी प्रमुख कार्प प्रजाती आहे।", ta: "ரோகு ஆறுகளில் காணப்படும் முக்கிய கெண்டை மீன் இனமாகும்.", te: "రోహు నదులలో కనిపించే ప్రధాన కార్प జాతి.", bn: "রুই নদীগুলির একটি প্রধান কার্প প্রজাতি।", ml: "നദികളിൽ കാണപ്പെടുന്ന പ്രധാന കാർപ്പ് ഇനമാണ് രോഹു." },
      habitat: { en: "Freshwater rivers and ponds.", hi: "मीठे पानी की नदियां और तालाब।", mr: "गोड्या पाण्यातील नद्या आणि तलाव।", ta: "நன்னீர் ஆறுகள் மற்றும் குளங்கள்.", te: "మంచినీటి నదులు మరియు చెరువులు.", bn: "মিষ্টি জলের নদী এবং পুকুর।", ml: "ശുദ്ധജല നദികളും കുളങ്ങളും." },
      color: "#9ca3af",
      category: "Freshwater"
    },
    {
      id: 5,
      name: { en: "Catla", hi: "कतला", mr: "कटला", ta: "கட்லா", te: "బొచ్చె", bn: "কাতলা", ml: "കട്‌ല" },
      scientificName: "Labeo catla",
      description: { en: "Catla is a fast-growing Indian major carp.", hi: "कतला एक तेजी से बढ़ने वाली भारतीय प्रमुख कार्प है।", mr: "कटला वेगाने वाढणारी भारतीय प्रमुख कार्प आहे।", ta: "கட்லா வேகமாக வளரும் இந்திய முக்கிய கெண்டை மீன்.", te: "బొచ్చె వేగంగా పెరుగుతున్న ప్రధాన భారతీయ కార్ప్.", bn: "কাতলা একটি দ্রুত বর্ধনশীল ভারতীয় প্রধান কার্প।", ml: "വേഗത്തിൽ വളരുന്ന ഇന്ത്യൻ കാർപ്പ് ഇനമാണ് കട്‌ല." },
      habitat: { en: "Rivers and lakes of South Asia.", hi: "दक्षिण एशिया की नदियां और झीलें।", mr: "दक्षिण आशियातील नद्या आणि सरोवरे।", ta: "தெற்காசியாவின் ஆறுகள் மற்றும் ஏரிகள்.", te: "దక్షిణాసియా నదులు மற்றும் సరస్సులు.", bn: "দক্ষিণ এশিয়ার নদী ও হ্রদ।", ml: "ദക്ഷിണേഷ്യയിലെ നദികളും തടാകങ്ങളും." },
      color: "#cbd5e1",
      category: "Freshwater"
    },
    {
      id: 6,
      name: { en: "Mrigal", hi: "मृगल", mr: "मृगल", ta: "மிர்கல்", te: "మృగల్", bn: "মৃগেল", ml: "മൃഗൽ" },
      scientificName: "Cirrhinus cirrhosus",
      description: { en: "Mrigal is a popular food fish, bottom feeder.", hi: "मृगल एक लोकप्रिय खाद्य मछली है।", mr: "मृगल एक लोकप्रिय खाद्य मासा आहे।", ta: "Mrigal is a popular food fish.", te: "Mrigal is a popular food fish.", bn: "Mrigal is a popular food fish.", ml: "Mrigal is a popular food fish." },
      habitat: { en: "Rivers and ponds.", hi: "नदियां और तालाब।", mr: "नद्या आणि तलाव।", ta: "Rivers and ponds.", te: "Rivers and ponds.", bn: "Rivers and ponds.", ml: "Rivers and ponds." },
      color: "#d1d5db",
      category: "Freshwater"
    },
    {
      id: 7,
      name: { en: "Tilapia", hi: "तिलापिया", mr: "तिलापिया", ta: "திலேபியா", te: "తిలాపియా", bn: "তেলাপিয়া", ml: "തിലാപ്പിയ" },
      scientificName: "Oreochromis niloticus",
      description: { en: "Tilapia is a common freshwater fish.", hi: "तिलापिया एक आम मीठे पानी की मछली है।", mr: "तिलापिया एक सामान्य गोड्या पाण्यातील मासा आहे।", ta: "Tilapia is a common freshwater fish.", te: "Tilapia is a common freshwater fish.", bn: "Tilapia is a common freshwater fish.", ml: "Tilapia is a common freshwater fish." },
      habitat: { en: "Ponds and lakes.", hi: "तालाब और झीलें।", mr: "तलाव आणि सरोवरे।", ta: "Ponds and lakes.", te: "Ponds and lakes.", bn: "Ponds and lakes.", ml: "Ponds and lakes." },
      color: "#9ca3af",
      category: "Freshwater"
    },
    {
      id: 8,
      name: { en: "Common Carp", hi: "कॉमन कार्प", mr: "कॉमन कार्प", ta: "கெண்டை", te: "బంగారు తీగ", bn: "কমন কার্প", ml: "കരിമീൻ" },
      scientificName: "Cyprinus carpio",
      description: { en: "Common Carp is a widespread freshwater fish.", hi: "कॉमन कार्प एक व्यापक मीठे पानी की मछली है।", mr: "कॉमन कार्प एक व्यापक गोड्या पाण्यातील मासा आहे।", ta: "Common Carp is a widespread freshwater fish.", te: "Common Carp is a widespread freshwater fish.", bn: "Common Carp is a widespread freshwater fish.", ml: "Common Carp is a widespread freshwater fish." },
      habitat: { en: "Lakes and slow rivers.", hi: "झीलें और धीमी नदियां।", mr: "सरोवरे आणि संथ नद्या।", ta: "Lakes and slow rivers.", te: "Lakes and slow rivers.", bn: "Lakes and slow rivers.", ml: "Lakes and slow rivers." },
      color: "#fbbf24",
      category: "Freshwater"
    },
    {
      id: 9,
      name: { en: "Grass Carp", hi: "ग्रास कार्प", mr: "ग्रास कार्प", ta: "புல் கெண்டை", te: "గడ్డి చేప", bn: "গ্রাস কার্প", ml: "ഗ്രാസ് കാർപ്പ്" },
      scientificName: "Ctenopharyngodon idella",
      description: { en: "Grass Carp is a large herbivorous fish.", hi: "ग्रास कार्प एक बड़ी शाकाहारी मछली है।", mr: "ग्रास कार्प एक मोठी शाकाहारी मासा आहे।", ta: "Grass Carp is a large herbivorous fish.", te: "Grass Carp is a large herbivorous fish.", bn: "Grass Carp is a large herbivorous fish.", ml: "Grass Carp is a large herbivorous fish." },
      habitat: { en: "Vegetated lakes and rivers.", hi: "वनस्पति युक्त झीलें और नदियां।", mr: "वनस्पती युक्त सरोवरे आणि नद्या।", ta: "Vegetated lakes and rivers.", te: "Vegetated lakes and rivers.", bn: "Vegetated lakes and rivers.", ml: "Vegetated lakes and rivers." },
      color: "#a3e635",
      category: "Freshwater"
    },
    {
      id: 10,
      name: { en: "Silver Carp", hi: "सिल्वर कार्प", mr: "सिल्वर कार्प", ta: "வெள்ளி கெண்டை", te: "వెండి చేప", bn: "সিলভার কার্প", ml: "സിൽവർ കാർപ്പ്" },
      scientificName: "Hypophthalmichthys molitrix",
      description: { en: "Silver Carp is a filter-feeding fish.", hi: "सिल्वर कार्प एक फिल्टर-फीडिंग मछली है।", mr: "सिल्वर कार्प एक फिल्टर-फीडिंग मासा आहे।", ta: "Silver Carp is a filter-feeding fish.", te: "Silver Carp is a filter-feeding fish.", bn: "Silver Carp is a filter-feeding fish.", ml: "Silver Carp is a filter-feeding fish." },
      habitat: { en: "Large rivers and lakes.", hi: "बड़ी नदियां और झीलें।", mr: "मोठ्या नद्या आणि सरोवरे।", ta: "Large rivers and lakes.", te: "Large rivers and lakes.", bn: "Large rivers and lakes.", ml: "Large rivers and lakes." },
      color: "#e2e8f0",
      category: "Freshwater"
    },
    {
      id: 11,
      name: { en: "Catfish", hi: "कैटफ़िश (मगुर)", mr: "मगुर", ta: "கెలிறு", te: "జెల్ల", bn: "মাগুর", ml: "മുഷി" },
      scientificName: "Clariidae",
      description: { en: "Catfish are known for their barbels.", hi: "कैटफ़िश अपने मूंछों के लिए जानी जाती है।", mr: "कैटफ़िश त्याच्या मिशांसाठी ओळखली जाते।", ta: "Catfish are known for their barbels.", te: "Catfish are known for their barbels.", bn: "Catfish are known for their barbels.", ml: "Catfish are known for their barbels." },
      habitat: { en: "Muddy rivers and ponds.", hi: "कीचड़ वाली नदियां और तालाब।", mr: "गाळलेल्या नद्या आणि तलाव।", ta: "Muddy rivers and ponds.", te: "Muddy rivers and ponds.", bn: "Muddy rivers and ponds.", ml: "Muddy rivers and ponds." },
      color: "#475569",
      category: "Freshwater"
    },
    {
      id: 12,
      name: { en: "Murrel", hi: "मुररेल (साँल)", mr: "मुरळ", ta: "விரால்", te: "కొర్రమీను", bn: "শোল", ml: "വരാൽ" },
      scientificName: "Channa striata",
      description: { en: "Murrel is a predatory snakehead fish.", hi: "मुररेल एक शिकारी स्नेकहेड मछली है।", mr: "मुरळ एक शिकारी स्नेकहेड मासा आहे।", ta: "Murrel is a predatory snakehead fish.", te: "Murrel is a predatory snakehead fish.", bn: "Murrel is a predatory snakehead fish.", ml: "Murrel is a predatory snakehead fish." },
      habitat: { en: "Swamps and slow rivers.", hi: "दलदल और धीमी नदियां।", mr: "दलदल आणि संथ नद्या।", ta: "Swamps and slow rivers.", te: "Swamps and slow rivers.", bn: "Swamps and slow rivers.", ml: "Swamps and slow rivers." },
      color: "#3f3f46",
      category: "Freshwater"
    },
    {
      id: 13,
      name: { en: "Tuna", hi: "टूना", mr: "टूना", ta: "சூரை", te: "తూర", bn: "টুনা", ml: "ചൂര" },
      scientificName: "Thunnini",
      description: { en: "Tuna is a saltwater fish belonging to the mackerel family.", hi: "टूना एक खारे पानी की मछली है।", mr: "टूना एक खाऱ्या पाण्यातील मासा आहे।", ta: "Tuna is a saltwater fish.", te: "Tuna is a saltwater fish.", bn: "Tuna is a saltwater fish.", ml: "Tuna is a saltwater fish." },
      habitat: { en: "Open ocean.", hi: "खुला महासागर।", mr: "खुला महासागर।", ta: "Open ocean.", te: "Open ocean.", bn: "Open ocean.", ml: "Open ocean." },
      color: "#1e3a8a",
      category: "Saltwater"
    },
    {
      id: 14,
      name: { en: "Sardine", hi: "सार्डिन", mr: "तरली", ta: "மத்தி", te: "కవళ్ళు", bn: "সার্ডিন", ml: "മത്തി" },
      scientificName: "Sardina pilchardus",
      description: { en: "Sardines are small, oily, nutrient-rich fish.", hi: "सार्डिन छोटी, तैलीय, पोषक तत्वों से भरपूर मछली है।", mr: "सार्डिन लहान, तेलकट, पोषक तत्वांनी युक्त मासा आहे।", ta: "Sardines are small, oily fish.", te: "Sardines are small, oily fish.", bn: "Sardines are small, oily fish.", ml: "Sardines are small, oily fish." },
      habitat: { en: "Coastal pelagic zone.", hi: "तटीय पेलाजिक क्षेत्र।", mr: "किनारी पेलाजिक क्षेत्र।", ta: "Coastal pelagic zone.", te: "Coastal pelagic zone.", bn: "Coastal pelagic zone.", ml: "Coastal pelagic zone." },
      color: "#94a3b8",
      category: "Saltwater"
    },
    {
      id: 15,
      name: { en: "King Fish", hi: "सुरमई", mr: "सुरमई", ta: "வஞ்சிரம்", te: "వంజరం", bn: "পমফ্রেট", ml: "നെയ്‌മീൻ" },
      scientificName: "Scomberomorus commerson",
      description: { en: "King Fish is a popular delicacy.", hi: "सुरमई एक लोकप्रिय व्यंजन है।", mr: "सुरमई एक लोकप्रिय डिश आहे।", ta: "King Fish is a popular delicacy.", te: "King Fish is a popular delicacy.", bn: "King Fish is a popular delicacy.", ml: "King Fish is a popular delicacy." },
      habitat: { en: "Coastal waters.", hi: "तटीय जल।", mr: "किनारी पाणी।", ta: "Coastal waters.", te: "Coastal waters.", bn: "Coastal waters.", ml: "Coastal waters." },
      color: "#cbd5e1",
      category: "Saltwater"
    },
    {
      id: 16,
      name: { en: "Red Snapper", hi: "रेड स्नैपर", mr: "तांबसा", ta: "சங்கரா", te: "ఎర్ర మట్ట", bn: "রাঙ্গা কৈ", ml: "പഹരി" },
      scientificName: "Lutjanu campechanus",
      description: { en: "Red Snapper is known for its red skin and white meat.", hi: "रेड स्नैपर अपनी लाल त्वचा के लिए जाना जाता है।", mr: "रेड स्नैपर त्याच्या लाल त्वचेसाठी ओळखला जातो।", ta: "Red Snapper is known for its red skin.", te: "Red Snapper is known for its red skin.", bn: "Red Snapper is known for its red skin.", ml: "Red Snapper is known for its red skin." },
      habitat: { en: "Reefs and rocky bottoms.", hi: "चट्टानें और पथरीले तल।", mr: "खडक आणि खडकाळ तळ।", ta: "Reefs and rocky bottoms.", te: "Reefs and rocky bottoms.", bn: "Reefs and rocky bottoms.", ml: "Reefs and rocky bottoms." },
      color: "#ef4444",
      category: "Saltwater"
    },
    {
      id: 17,
      name: { en: "Barracuda", hi: "बैराकुडा", mr: "शिलाव", ta: "ஊழி", te: "కొరమీను", bn: "ব্যারাকুডা", ml: "തിരാ" },
      scientificName: "Sphyraena",
      description: { en: "Barracuda is a large, predatory ray-finned fish.", hi: "बैराकुडा एक बड़ी शिकारी मछली है।", mr: "बैराकुडा एक मोठा शिकारी मासा आहे।", ta: "Barracuda is a large predatory fish.", te: "Barracuda is a large predatory fish.", bn: "Barracuda is a large predatory fish.", ml: "Barracuda is a large predatory fish." },
      habitat: { en: "Tropical and subtropical oceans.", hi: "उष्णकटिबंधीय महासागर।", mr: "उष्णकटिबंधीय महासागर।", ta: "Tropical oceans.", te: "Tropical oceans.", bn: "Tropical oceans.", ml: "Tropical oceans." },
      color: "#64748b",
      category: "Saltwater"
    },
    {
      id: 18,
      name: { en: "Grouper", hi: "ग्रूपर", mr: "गोबरा", ta: "கலவா", te: "బోంత", bn: "ভেউলা", ml: "കലവ" },
      scientificName: "Epinephelinae",
      description: { en: "Groupers are stout-bodied teleost fishes.", hi: "ग्रूपर मजबूत शरीर वाली मछलियां हैं।", mr: "ग्रूपर मजबूत शरीर वाले मासे आहेत।", ta: "Groupers are stout-bodied fishes.", te: "Groupers are stout-bodied fishes.", bn: "Groupers are stout-bodied fishes.", ml: "Groupers are stout-bodied fishes." },
      habitat: { en: "Coral reefs.", hi: "मूंगा चट्टानें।", mr: "प्रवाळ खडक।", ta: "Coral reefs.", te: "Coral reefs.", bn: "Coral reefs.", ml: "Coral reefs." },
      color: "#57534e",
      category: "Saltwater"
    },
    {
      id: 19,
      name: { en: "Goldfish", hi: "गोल्डफिश", mr: "सुवर्णमासा", ta: "தங்க மீன்", te: "బంగారు చేప", bn: "গোল্ডফিশ", ml: "സ്വർണ്ണ മത്സ്യം" },
      scientificName: "Carassius auratus",
      description: { en: "Goldfish is a freshwater fish in the family Cyprinidae.", hi: "गोल्डफिश साइप्रिनिडे परिवार की एक मछली है।", mr: "गोल्डफिश साइप्रिनिडे कुटुंबातील एक मासा आहे।", ta: "Goldfish is a freshwater fish.", te: "Goldfish is a freshwater fish.", bn: "Goldfish is a freshwater fish.", ml: "Goldfish is a freshwater fish." },
      habitat: { en: "Freshwater aquariums.", hi: "मीठे पानी के एक्वैरियम।", mr: "गोड्या पाण्याचे एक्वैरियम।", ta: "Freshwater aquariums.", te: "Freshwater aquariums.", bn: "Freshwater aquariums.", ml: "Freshwater aquariums." },
      color: "#f59e0b",
      category: "Freshwater"
    },
    {
      id: 20,
      name: { en: "Guppy", hi: "गप्पी", mr: "गप्पी", ta: "கப்பி", te: "గుప్పి", bn: "গাপ্পি", ml: "ഗപ്പി" },
      scientificName: "Poecilia reticulata",
      description: { en: "Guppy is one of the most widely distributed tropical fish.", hi: "गप्पी सबसे व्यापक रूप से वितरित उष्णकटिबंधीय मछली है।", mr: "गप्पी सर्वात व्यापक उष्णकटिबंधीय मासा आहे।", ta: "Guppy is a popular tropical fish.", te: "Guppy is a popular tropical fish.", bn: "Guppy is a popular tropical fish.", ml: "Guppy is a popular tropical fish." },
      habitat: { en: "Freshwater streams and aquariums.", hi: "नदियां और एक्वैरियम।", mr: "नद्या आणि एक्वैरियम।", ta: "Freshwater streams.", te: "Freshwater streams.", bn: "Freshwater streams.", ml: "Freshwater streams." },
      color: "#ec4899",
      category: "Freshwater"
    },
    {
      id: 21,
      name: { en: "Betta (Fighter Fish)", hi: "बेटा मछली", mr: "बेटा मासा", ta: "சண்டை மீன்", te: "బెట్టా", bn: "ফাইটার ফিশ", ml: "ഫൈറ്റർ ഫിഷ്" },
      scientificName: "Betta splendens",
      description: { en: "Siamese fighting fish are known for their brilliant colors.", hi: "सियामी लड़ाकू मछली अपने रंगों के लिए जानी जाती है।", mr: "सियामी लढाऊ मासा त्याच्या रंगांसाठी ओळखला जातो।", ta: "Known for brilliant colors.", te: "Known for brilliant colors.", bn: "Known for brilliant colors.", ml: "Known for brilliant colors." },
      habitat: { en: "Paddy fields and aquariums.", hi: "धान के खेत और एक्वैरियम।", mr: "भातशेती आणि एक्वैरियम।", ta: "Paddy fields.", te: "Paddy fields.", bn: "Paddy fields.", ml: "Paddy fields." },
      color: "#dc2626",
      category: "Freshwater"
    },
    {
      id: 22,
      name: { en: "Angelfish", hi: "एंजेलफिश", mr: "एंजेलफिश", ta: "ಏಂಜೆಲ್ ಮೀನು", te: "ఏంజెల్ ఫిష్", bn: "অ্যাঞ্জেলফিশ", ml: "ഏഞ്ചൽ ഫിഷ്" },
      scientificName: "Pterophyllum",
      description: { en: "Freshwater angelfish are cichlids known for their unique shape.", hi: "एंजेलफिश अपने अनोखे आकार के लिए जानी जाती है।", mr: "एंजेलफिश त्याच्या अनन्य आकारासाठी ओळखली जाते।", ta: "Known for unique shape.", te: "Known for unique shape.", bn: "Known for unique shape.", ml: "Known for unique shape." },
      habitat: { en: "Tropical rivers and aquariums.", hi: "उष्णकटिबंधीय नदियां।", mr: "उष्णकटिबंधीय नद्या।", ta: "Tropical rivers.", te: "Tropical rivers.", bn: "Tropical rivers.", ml: "Tropical rivers." },
      color: "#e2e8f0",
      category: "Freshwater"
    },
    {
      id: 23,
      name: { en: "Neon Tetra", hi: "नियोन टेट्रा", mr: "नियोन टेट्रा", ta: "நியான்", te: "నియాన్", bn: "নিয়ন টেট্রা", ml: "നിയോൺ" },
      scientificName: "Paracheirodon innesi",
      description: { en: "The neon tetra is a small freshwater fish.", hi: "नियोन टेट्रा एक छोटी मछली है।", mr: "नियोन टेट्रा एक लहान मासा आहे।", ta: "Small freshwater fish.", te: "Small freshwater fish.", bn: "Small freshwater fish.", ml: "Small freshwater fish." },
      habitat: { en: "Blackwater streams and aquariums.", hi: "काली नदियां और एक्वैरियम।", mr: "काळ्या नद्या आणि एक्वैरियम।", ta: "Blackwater streams.", te: "Blackwater streams.", bn: "Blackwater streams.", ml: "Blackwater streams." },
      color: "#06b6d4",
      category: "Freshwater"
    },
    {
      id: 24,
      name: { en: "Oscar", hi: "ऑस्कर", mr: "ऑस्कर", ta: "ஆஸ்கார்", te: "ఆస్కార్", bn: "অস্কার", ml: "ഓസ്കാർ" },
      scientificName: "Astronotus ocellatus",
      description: { en: "Oscar is a species of fish from the cichlid family.", hi: "ऑस्कर सिचलिड परिवार की एक मछली है।", mr: "ऑस्कर सिचलिड कुटुंबातील एक मासा आहे।", ta: "Species of cichlid.", te: "Species of cichlid.", bn: "Species of cichlid.", ml: "Species of cichlid." },
      habitat: { en: "Slow-moving rivers and aquariums.", hi: "धीमी नदियां और एक्वैरियम।", mr: "संथ नद्या आणि एक्वैरियम।", ta: "Slow rivers.", te: "Slow rivers.", bn: "Slow rivers.", ml: "Slow rivers." },
      color: "#a16207",
      category: "Freshwater"
    }
  ];

  const filteredFish = fishDatabase.filter(fish => {
    const matchesSearch = fish.name[language].toLowerCase().includes(searchQuery.toLowerCase()) ||
      fish.scientificName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || fish.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
      if (!apiKey) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: "API key not configured." }]);
        setChatLoading(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `You are a helpful fishing assistant. Respond in ${languages[language].name}.`
      });

      const chat = model.startChat({
        history: chatMessages.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        })),
      });

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.text() }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
  };

  return (
    <div className="relative flex flex-col w-full h-screen overflow-hidden font-sans bg-slate-950 text-slate-50 selection:bg-cyan-500/30">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 z-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px] animate-pulse-ring"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse-ring" style={{ animationDelay: '1s' }}></div>
      </div>

      {activeTab === 'chat' ? (
        <div className="relative z-10 flex flex-col flex-1 w-full overflow-hidden">
          {/* Chat Tab - Full Height */}
          <div className="relative flex flex-col w-full h-full max-w-4xl pb-4 mx-auto animate-fade-in">
            {/* Chat Header */}
            <div className="sticky top-0 z-10 flex items-center gap-4 p-4 border-b shadow-lg bg-slate-900/60 backdrop-blur-xl border-white/5 shadow-black/20">
              <div className="relative">
                <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2.5 rounded-2xl shadow-lg shadow-cyan-500/20">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-white">FishID AI</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-cyan-400">Online</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                  <p className="text-xs text-slate-400">Expert in marine life</p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60 min-h-[400px]">
                  <div className="bg-gradient-to-b from-slate-800 to-slate-900/50 p-8 rounded-[2rem] mb-6 border border-white/5 shadow-2xl">
                    <Fish className="w-16 h-16 text-cyan-400 opacity-80" />
                  </div>
                  <p className="mb-2 text-xl font-bold text-slate-200">How can I help you?</p>
                  <p className="max-w-xs mx-auto text-sm leading-relaxed text-slate-400">Ask about fish identification, specific species, or fishing spots nearby.</p>
                </div>
              ) : (
                <div className="flex flex-col justify-end min-h-full pb-0">
                  <div className="flex-1" />
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex w-full animate-message-in items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-3'}`}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center justify-center w-8 h-8 mt-1 border rounded-full bg-slate-800 border-white/10 shrink-0">
                          <Brain className="w-4 h-4 text-cyan-400" />
                        </div>
                      )}
                      <div
                        className={`
                            max-w-[85%] px-5 py-3.5 text-[15px] leading-relaxed shadow-md backdrop-blur-sm relative group whitespace-pre-wrap
                            ${msg.role === 'user'
                            ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-2xl rounded-tr-sm shadow-cyan-900/20'
                            : 'bg-slate-800/80 border border-cyan-500/20 text-slate-100 rounded-2xl rounded-tl-sm hover:bg-slate-800 transition-colors shadow-lg shadow-black/20'}
                          `}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="markdown-content"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start w-full gap-3 animate-message-in">
                      <div className="flex items-center justify-center w-8 h-8 mt-1 border rounded-full bg-slate-800 border-white/10 shrink-0">
                        <Brain className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="bg-white/5 border border-white/10 px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5 min-h-[50px] min-w-[80px]">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 typing-dot"></div>
                        <div className="w-2 h-2 rounded-full bg-cyan-400 typing-dot"></div>
                        <div className="w-2 h-2 rounded-full bg-cyan-400 typing-dot"></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} className="h-48" />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="absolute left-0 z-20 w-full px-4 bottom-28">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-2 p-2 pl-4 transition-all duration-300 border rounded-full shadow-2xl bg-slate-900/90 backdrop-blur-2xl border-white/10 shadow-black/50 focus-within:border-cyan-500/50 ring-1 ring-white/5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask anything..."
                    className="flex-1 bg-transparent border-none px-2 py-3 text-white placeholder-slate-500 focus:ring-0 focus:outline-none min-h-[44px] text-base"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || chatLoading}
                    className="flex items-center justify-center p-3 text-white transition-all rounded-full shadow-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:grayscale shadow-cyan-500/20 hover:shadow-cyan-500/40 active:scale-90 w-11 h-11 shrink-0"
                  >
                    <Send className="w-5 h-5 ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex-1 w-full pb-32 overflow-x-hidden overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          <div className="max-w-md px-4 pt-8 mx-auto md:max-w-xl lg:max-w-4xl">
            {/* Header for Non-Chat Tabs */}
            <header className="mb-10 text-center animate-float">
              <div className="inline-block p-4 mb-4 shadow-xl rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-cyan-500/20">
                <Fish className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-100 via-cyan-100 to-white drop-shadow-sm font-['Outfit'] tracking-tight">
                FishID
              </h1>
              <p className="mt-2 font-medium text-slate-400">Smart Marine Identification</p>

              {userId && (
                <div className="flex justify-center mt-4">
                  <button onClick={() => setShowUserId(!showUserId)} className="flex items-center gap-1 text-xs transition-colors text-slate-500 hover:text-cyan-400">
                    <Info className="w-3 h-3" /> {showUserId ? userId : 'Show ID'}
                  </button>
                </div>
              )}
            </header>

            <main key={activeTab}>
              {activeTab === 'identify' && (
                <div className="p-6 glass-card rounded-3xl md:p-8 animate-fade-in">
                  <div className="mb-6 text-center">
                    <h2 className="mb-2 text-2xl font-bold">Scan Fish</h2>
                    <p className="text-sm text-slate-400">Upload a photo to identify species, assess freshness & quality</p>
                  </div>

                  <label className="relative flex flex-col items-center justify-center w-full overflow-hidden transition-all border-2 border-dashed cursor-pointer h-72 border-white/20 rounded-2xl hover:border-cyan-400/50 hover:bg-white/5 group bg-slate-900/50">
                    {image ? (
                      <>
                        <img src={image} alt="Uploaded fish" className="relative z-10 object-contain w-full h-full p-2" />
                        {identifying && <div className="z-20 animate-scan"></div>}
                        <button onClick={(e) => { e.preventDefault(); clearImage(); }} className="absolute z-30 p-2 text-white transition-all rounded-full top-4 right-4 bg-black/50 hover:bg-red-500 backdrop-blur-md">
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center p-8 transition-transform duration-300 group-hover:scale-105">
                        <div className="p-5 mb-4 rounded-full bg-gradient-to-br from-blue-600/20 to-cyan-400/20 ring-1 ring-white/10">
                          <Upload className="w-10 h-10 text-cyan-400" />
                        </div>
                        <p className="text-lg font-semibold text-slate-200">Upload Photo</p>
                        <p className="mt-1 text-sm text-slate-500">JPG, PNG, WEBP</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>

                  {image && !result && (
                    <button
                      onClick={identifyFish} disabled={identifying}
                      className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-lg py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      {identifying ? <><Loader2 className="w-6 h-6 animate-spin" /> Analyzing...</> : <><Camera className="w-6 h-6" /> Scan Fish (Species, Freshness & Quality)</>}
                    </button>
                  )}

                  {result && !result.error && (
                    <div className="mt-8">
                      <FishAnalysisDashboard result={result} image={image} onNewScan={clearImage} />
                    </div>
                  )}
                  {result?.error && (
                    <div className="p-4 mt-6 text-sm text-center text-red-200 border bg-red-500/10 border-red-500/20 rounded-xl">
                      <p className="flex items-center justify-center gap-2 mb-2 font-bold"><Info className="w-4 h-4" /> Identification Failed</p>
                      <p className="opacity-80">{result.error}</p>
                    </div>
                  )}

                  {!identifying && !result && scanHistory.length > 0 && (
                    <div className="mt-12">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold tracking-wider uppercase text-slate-500">Recent Scans</h3>
                        <button
                          onClick={async () => {
                            setScanHistory([]);
                            await window.storage.delete('scan_history');
                          }}
                          className="text-[10px] font-bold text-slate-600 hover:text-red-400 uppercase tracking-tighter"
                        >
                          Clear History
                        </button>
                      </div>
                      <div className="flex gap-4 pb-4 overflow-x-auto scrollbar-hide">
                        {scanHistory.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setImage(item.image);
                              setResult(item.result);
                            }}
                            className="flex-shrink-0 w-24 text-left transition-transform group hover:scale-105"
                          >
                            <div className="relative w-24 h-24 mb-2 overflow-hidden border bg-slate-900 rounded-2xl border-white/5 group-hover:border-cyan-500/50">
                              <img src={item.image} alt={item.result.commonName} className="object-cover w-full h-full transition-opacity opacity-60 group-hover:opacity-100" />
                              <div className="absolute inset-x-0 bottom-0 p-1 text-[8px] font-bold text-center text-white bg-gradient-to-t from-black/80 to-transparent">
                                {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 truncate w-full group-hover:text-cyan-400">
                              {item.result.commonName || item.result.scientificName}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'shops' && (
                <div className="p-6 glass-card rounded-3xl md:p-8 animate-fade-in">
                  <div className="mb-8 text-center">
                    <div className="inline-block p-4 mb-4 rounded-full shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30">
                      {shopMode === 'offline' ? <MapPin className="w-8 h-8 text-white" /> : <Store className="w-8 h-8 text-white" />}
                    </div>
                    <h2 className="mb-2 text-2xl font-bold">{shopMode === 'offline' ? 'Physical Stores' : 'Online Stores'}</h2>
                    <p className="text-slate-400">Find fishing gear and marine supplies</p>
                  </div>

                  {/* Mode Toggle */}
                  <div className="flex gap-2 p-1 mb-6 border rounded-xl bg-slate-900/60 border-white/10">
                    <button
                      onClick={() => setShopMode('offline')}
                      className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${shopMode === 'offline'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      <MapPin className="w-4 h-4" />
                      Physical Stores
                    </button>
                    <button
                      onClick={() => setShopMode('online')}
                      className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${shopMode === 'online'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      <Store className="w-4 h-4" />
                      Online Stores
                    </button>
                  </div>

                  {shopMode === 'offline' ? (
                    <>
                      {!userLocation && !loadingLocation && (
                        <button onClick={getUserLocation} className="w-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02]">
                          <Navigation className="w-5 h-5 text-cyan-400" /> Enable Location & Search
                        </button>
                      )}

                      {(loadingLocation || searchingShops) && (
                        <div className="py-12 text-center">
                          <Loader2 className="w-10 h-10 mx-auto mb-4 text-cyan-400 animate-spin" />
                          <p className="text-slate-400 animate-pulse">{loadingLocation ? "Locating you..." : "Scouting nearby physical stores..."}</p>
                        </div>
                      )}

                      {userLocation && nearbyShops.length > 0 && !searchingShops && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between mb-2 text-sm text-slate-400">
                            <span>{nearbyShops.length} locations found</span>
                            <button onClick={() => findNearbyShops(userLocation.lat, userLocation.lng)} className="flex items-center gap-1 text-cyan-400 hover:text-white"><RefreshCw className="w-3 h-3" /> Refresh Physical Stores</button>
                          </div>
                          {nearbyShops.map((shop, i) => {
                            // Build Google Maps URL - use coordinates if available, otherwise use search query
                            const mapsUrl = shop.lat && shop.lng
                              ? `https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name + " " + shop.address)}`;

                            return (
                              <div
                                key={i}
                                className="relative p-5 transition-all border bg-slate-900/60 rounded-xl border-white/5 hover:border-cyan-500/30 hover:bg-slate-800/80 group"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-bold text-white transition-colors">{shop.name}</h3>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">{shop.type}</span>
                                  </div>
                                  <span className="px-2 py-1 text-xs rounded bg-slate-800 text-slate-300">{shop.distance}</span>
                                </div>
                                <div className="mt-3 space-y-1 text-sm text-slate-400">
                                  {shop.address && <p className="flex gap-2"><MapPin className="w-4 h-4 shrink-0" /> {shop.address}</p>}
                                  {shop.phone && <p className="ml-6 text-slate-500">📞 {shop.phone}</p>}
                                </div>

                                {/* View on Maps Button */}
                                <button
                                  onClick={() => window.open(mapsUrl, '_blank')}
                                  className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-green-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                  <MapPin className="w-4 h-4" />
                                  View on Google Maps
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <p className="mb-4 text-sm text-center text-slate-400">Browse popular online fishing equipment stores</p>
                      {onlinePlatforms.map((platform, i) => (
                        <div
                          key={i}
                          className="relative p-5 transition-all border bg-slate-900/60 rounded-xl border-white/5 hover:border-cyan-500/30 hover:bg-slate-800/80 group"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-12 h-12 text-3xl rounded-lg shrink-0 bg-slate-800">
                              {platform.logo}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-white">{platform.name}</h3>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">{platform.category}</span>
                              <p className="mt-2 text-sm text-slate-400">{platform.description}</p>
                              <div className="flex flex-wrap gap-2 mt-3">
                                {platform.specialties.map((spec, j) => (
                                  <span key={j} className="px-2 py-1 text-xs border rounded bg-slate-800/50 text-slate-300 border-white/5">
                                    {spec}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Visit Store Button */}
                          <button
                            onClick={() => window.open(platform.url, '_blank')}
                            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
                          >
                            <Store className="w-4 h-4" />
                            Visit Store
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'weather' && (
                <div className="p-6 glass-card rounded-3xl md:p-8 animate-fade-in min-h-[500px]">
                  <div className="mb-8 text-center text-slate-800">
                    <div className="inline-block p-4 mb-4 rounded-full shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30">
                      <RefreshCw className={`w-8 h-8 text-white ${loadingWeather ? 'animate-spin' : 'animate-spin-slow'}`} />
                    </div>
                    {weatherData && (
                      <div className={`mx-auto mb-4 w-fit px-4 py-1.5 rounded-full border text-sm font-bold backdrop-blur-md transition-all ${getStatusClass(weatherData.status)}`}>
                        Status: {weatherData.status}
                      </div>
                    )}
                    <h2 className="mb-2 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-700">Marine Dashboard</h2>
                    <p className="text-slate-500">Live monitoring & disaster alerts</p>
                  </div>

                  {!userLocation && !loadingLocation && (
                    <div className="py-12 text-center">
                      <div className="p-6 mb-6 border rounded-2xl bg-slate-100 border-slate-200">
                        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50 text-slate-400" />
                        <h3 className="mb-2 text-lg font-bold text-slate-800">Location Required</h3>
                        <p className="text-sm text-slate-500">Enable location to get real-time marine weather for your area.</p>
                      </div>
                      <button onClick={getUserLocation} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-xl shadow-cyan-900/10">
                        <Navigation className="w-5 h-5" /> Activate GPS Search
                      </button>
                    </div>
                  )}

                  {(loadingLocation || loadingWeather) && (
                    <div className="py-24 text-center">
                      <Loader2 className="w-12 h-12 mx-auto mb-4 text-cyan-500 animate-spin" />
                      <p className="font-medium text-slate-500 animate-pulse">Gathering sea telemetry...</p>
                    </div>
                  )}

                  {userLocation && weatherData && !loadingWeather && (
                    <>
                      <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-4">
                        {[
                          { label: 'Wind Speed', value: `${weatherData.windSpeed} km/h`, icon: Navigation, desc: 'At 10m height' },
                          { label: 'Wave Height', value: `${weatherData.waveHeight} m`, icon: Fish, desc: 'Significant' },
                          { label: 'Temperature', value: `${weatherData.temperature.toFixed(1)}°C`, icon: Info, desc: 'Sea surface' },
                          { label: 'Last Sync', value: weatherData.lastUpdated, icon: RefreshCw, desc: 'Local time' },
                        ].map((item, i) => (
                          <div key={i} className="p-4 transition-all border bg-white/40 rounded-2xl border-slate-200/50 hover:bg-white/60 hover:border-cyan-200">
                            <div className="flex items-center gap-2 mb-2">
                              <item.icon className="w-3.5 h-3.5 text-cyan-500" />
                              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{item.label}</p>
                            </div>
                            <p className="text-2xl font-black text-slate-800">{item.value}</p>
                            <p className="text-[9px] text-slate-400 mt-1">{item.desc}</p>
                          </div>
                        ))}
                      </div>

                      <div className="p-6 border bg-slate-50 rounded-2xl border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                          <Brain className="w-5 h-5 text-cyan-600" />
                          <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500">AI Safety Analysis</h3>
                        </div>
                        <div className="relative">
                          <div className="absolute top-0 bottom-0 w-1 rounded-full -left-3 bg-cyan-500/20"></div>
                          <p className="pl-4 text-lg italic font-medium leading-relaxed text-slate-700">"{weatherData.analysis}"</p>
                        </div>
                      </div>

                      <button
                        onClick={() => fetchMarineWeather(userLocation.lat, userLocation.lng)}
                        className="flex items-center justify-center w-full gap-2 py-3 mt-8 text-xs font-bold tracking-widest uppercase transition-colors text-slate-400 hover:text-cyan-600"
                      >
                        <RefreshCw className="w-3 h-3" /> Force Update Telemetry
                      </button>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'sos' && (
                <div className="p-4 glass-card rounded-[2.5rem] md:p-10 animate-fade-in overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>

                  <div className="mb-10 text-center">
                    <h2 className="mb-1 text-3xl font-black tracking-tighter text-white">EMERGENCY</h2>
                    <p className="mb-8 text-sm font-bold tracking-widest text-red-500 uppercase">Marine Helpline 1554</p>

                    <div className="relative w-48 h-48 mx-auto mb-10 group">
                      <div className="absolute inset-0 transition-opacity bg-red-600 rounded-full blur-3xl opacity-20 group-hover:opacity-40 animate-pulse"></div>
                      <a
                        href="tel:1554"
                        className="relative flex flex-col items-center justify-center w-48 h-48 overflow-hidden text-white no-underline transition-all border-8 rounded-full shadow-2xl bg-gradient-to-b from-red-500 to-red-700 shadow-red-900/50 border-red-400/30 hover:scale-105 active:scale-95 group"
                      >
                        <span className="mb-1 text-5xl font-black tracking-tighter">SOS</span>
                        <span className="text-[10px] font-black bg-red-900/50 px-3 py-1 rounded-full border border-red-100/20">CALL NOW</span>
                        <div className="absolute transition-transform duration-1000 -translate-x-full skew-x-12 -inset-2 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full"></div>
                      </a>
                    </div>
                  </div>

                  <div className="p-6 mb-8 border shadow-inner bg-slate-900/80 border-white/10 rounded-3xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-red-500/20 rounded-xl"><MapPin className="w-5 h-5 text-red-400" /></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Live Tracking</p>
                        <h4 className="text-xs font-bold text-white uppercase">Current GPS Coordinates</h4>
                      </div>
                    </div>
                    <div className="p-4 text-center border bg-black/40 rounded-xl border-white/5">
                      <div className="font-mono text-xl font-black text-cyan-400">
                        {userLocation ? `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}` : (
                          <button onClick={getUserLocation} className="flex items-center justify-center w-full gap-2 text-sm text-slate-400 hover:text-white">
                            <RefreshCw className="w-4 h-4 animate-spin-slow" /> Click to Locate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-center text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Emergency Contacts</h3>
                    <div className="grid gap-4">
                      {coastGuardDepartments.slice(0, 2).map((dept, i) => (
                        <div key={i} className="flex items-center justify-between p-4 transition-colors border bg-white/5 border-white/5 rounded-2xl hover:bg-white/10">
                          <div>
                            <p className="mb-1 text-xs font-bold text-white">{dept.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{dept.telephone}</p>
                          </div>
                          <a href={`tel:${dept.telephone}`} className="p-3 transition-all bg-slate-800 rounded-xl hover:bg-red-500/20 hover:text-red-400">
                            <Phone className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'encyclopedia' && (
                <div className="p-6 glass-card rounded-3xl md:p-8 animate-fade-in min-h-[500px]">
                  {!selectedFish ? (
                    <>
                      <div className="mb-8 text-center">
                        <h2 className="mb-2 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Species Guide</h2>
                        <p className="text-sm text-slate-500">Explore and learn about local marine life</p>
                      </div>

                      {/* Search and Filter UI */}
                      <div className="flex flex-col gap-4 mb-8">
                        <div className="relative group">
                          <input
                            type="text"
                            placeholder="Search fish name or scientific name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-5 py-3 pl-12 transition-all border outline-none bg-slate-100/50 rounded-2xl border-slate-200 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
                          />
                          <Fish className="absolute w-5 h-5 transition-colors -translate-y-1/2 left-4 top-1/2 text-slate-400 group-focus-within:text-cyan-500" />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {['All', 'Freshwater', 'Saltwater', 'Brackish'].map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat
                                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 scale-105'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {filteredFish.length > 0 ? (
                          filteredFish.map(fish => (
                            <button key={fish.id} onClick={() => setSelectedFish(fish)} className="flex items-center gap-4 p-4 text-left transition-all border bg-white/40 rounded-2xl border-slate-200/50 hover:border-cyan-400/50 hover:bg-white/80 group hover:shadow-xl hover:shadow-cyan-500/5">
                              <div className="flex items-center justify-center w-16 h-16 text-3xl transition-transform rounded-full shadow-lg group-hover:scale-110" style={{ backgroundColor: fish.color }}>🐟</div>
                              <div>
                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-cyan-600">{fish.name[language]}</h3>
                                <p className="text-xs italic text-slate-500">{fish.scientificName}</p>
                                <span className="text-[10px] uppercase font-bold text-cyan-500 mt-1 block">{fish.category}</span>
                              </div>
                              <ChevronRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-cyan-400" />
                            </button>
                          ))
                        ) : (
                          <div className="py-12 text-center col-span-full text-slate-400">
                            <Info className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No species found matching your search.</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="animate-fade-in">
                      <button onClick={() => setSelectedFish(null)} className="flex items-center gap-1 mb-4 text-sm font-bold text-cyan-400 hover:text-white">← Back to List</button>
                      <div className="flex flex-col gap-6 md:flex-row">
                        <div className="flex items-center justify-center w-32 h-32 mx-auto text-6xl shadow-2xl md:w-48 md:h-48 rounded-3xl" style={{ backgroundColor: selectedFish.color }}>🐟</div>
                        <div className="flex-1">
                          <h2 className="mb-1 text-3xl font-bold text-white">{selectedFish.name[language]}</h2>
                          <p className="mb-4 text-lg italic text-slate-400">{selectedFish.scientificName}</p>
                          <div className="space-y-4">
                            <div className="p-4 border bg-slate-900/60 rounded-xl border-white/5">
                              <h4 className="mb-1 text-xs font-bold uppercase text-cyan-400">Description</h4>
                              <p className="text-sm leading-relaxed text-slate-300">{selectedFish.description[language]}</p>
                            </div>
                            <div className="p-4 border bg-slate-900/60 rounded-xl border-white/5">
                              <h4 className="mb-1 text-xs font-bold uppercase text-cyan-400">Habitat</h4>
                              <p className="text-sm leading-relaxed text-slate-300">{selectedFish.habitat[language]}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
        <div className="border shadow-2xl glass backdrop-blur-xl bg-slate-900/80 rounded-2xl border-white/10 shadow-black/50">
          <div className="flex items-center justify-between p-2">
            {[
              { id: 'identify', icon: Camera, label: 'Scan' },
              { id: 'weather', icon: RefreshCw, label: 'Weather' },
              { id: 'sos', icon: Phone, label: 'SOS' },
              { id: 'shops', icon: Store, label: 'Shops' },
              { id: 'chat', icon: MessageCircle, label: 'AI Chat' },
              { id: 'encyclopedia', icon: Book, label: 'Wiki' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center w-full py-3 rounded-xl transition-all duration-300 ${activeTab === tab.id
                  ? 'text-cyan-400 bg-white/5 scale-110 shadow-lg shadow-cyan-900/20'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
              >
                <tab.icon className={`w-5 h-5 mb-1 ${activeTab === tab.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}