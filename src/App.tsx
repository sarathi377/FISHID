import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Fish, Loader2, Info, X, RefreshCw, MapPin, Navigation, Store, Phone, Mail, Building2, MessageCircle, Send, Book, ChevronRight, Brain, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Type definitions
type Language = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn' | 'ml';

interface MultiLanguageText {
  en: string;
  hi: string;
  mr: string;
  ta: string;
  te: string;
  bn: string;
  ml: string;
}

interface FishResult {
  commonName?: string;
  scientificName?: string;
  features?: string[];
  habitat?: string;
  edibility?: string;
  confidence?: number;
  error?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  provider: string;
}

interface UserLocation {
  lat: number;
  lng: number;
}

interface Shop {
  name: string;
  address: string;
  distance: string;
  type: string;
  phone?: string;
  description?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface FishData {
  id: number;
  name: MultiLanguageText;
  scientificName: string;
  description: MultiLanguageText;
  habitat: MultiLanguageText;
  color: string;
}

interface Department {
  name: string;
  telephone: string;
  fax: string;
  email: string;
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

      const base64Data = image.includes(',') ? image.split(',')[1] : image;

      const prompt = `Analyze this fish image and identify the species. Provide your response ONLY as valid JSON with no additional text, using this exact structure:
{
  "commonName": "name",
  "scientificName": "name",
  "features": ["feature1", "feature2", "feature3"],
  "habitat": "description",
  "edibility": "description",
  "confidence": 85
}
Be specific about identifying features like coloration, body shape, fin structure, and markings. If unsure, still provide your best identification with appropriate confidence level.`;

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: image.startsWith('data:image/png') ? "image/png" : "image/jpeg",
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      if (text) {
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : text;
          const fishData = JSON.parse(jsonString);
          if (fishData.commonName || fishData.scientificName) {
            setResult(fishData);
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
          alert("Unable to get your location. Please enable location services.");
        }
      );
    } else {
      setLoadingLocation(false);
      alert("Geolocation is not supported by your browser.");
    }
  };

  const findNearbyShops = async (lat: number, lng: number) => {
    setSearchingShops(true);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
      if (!apiKey) {
        setNearbyShops([]);
        setSearchingShops(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

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
          setNearbyShops(Array.isArray(shops) ? shops : []);
        } catch (parseError) {
          setNearbyShops([]);
        }
      } else {
        setNearbyShops([]);
      }
    } catch (error) {
      console.error('Shop search error:', error);
      setNearbyShops([]);
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
      description: { en: "The Hilsa is a popular food fish in South Asia.", hi: "हिल्सा दक्षिण एशिया में एक लोकप्रिय खाद्य मछली है।", mr: "हिल्सा ही दक्षिण आशियातील एक लोकप्रिय अन्न मासा आहे।", ta: "இலிசா தெற்காசியாவில் பிரபலமான உணவு மீன்.", te: "హిల్సా దక్షిణాసియాలో ప్రసిద్ధ ఆహార చేప.", bn: "ইলিশ দক্ষিণ এশিয়ার একটি জনপ্রিয় খাদ্য মাছ।", ml: "ഇലിഷ ദക്ഷിണേഷ്യയിലെ ഒരു പ്രശസ്ത ഭക്ഷ്യ മത്സ്യമാണ്." },
      habitat: { en: "Found in rivers and coastal waters.", hi: "नदियों और तटीय जल में पाई जाती है।", mr: "नद्या आणि किनारी पाण्यात आढळते।", ta: "ஆறுகள் மற்றும் கடலோர நீரில் காணப்படுகிறது.", te: "నదులు మరియు తీర జలాల్లో కనిపిస్తుంది.", bn: "নদী এবং উপকূলীয় জলে পাওয়া যায়।", ml: "നദികളിലും തീരദേശ ജലത്തിലും കാണപ്പെടുന്നു." },
      color: "#94a3b8"
    },
    {
      id: 2,
      name: { en: "Pomfret", hi: "पोमफ्रेट", mr: "पापलेट", ta: "வவ்வால்", te: "చంద్రమ", bn: "পমফ্রেট", ml: "ആവോലി" },
      scientificName: "Pampus argenteus",
      description: { en: "Silver Pomfret is a highly valued food fish.", hi: "सिल्वर पोमफ्रेट एक मूल्यवान खाद्य मछली है।", mr: "चांदी पापलेट एक मौल्यवान मासा आहे।", ta: "வெள்ளி வவ்வால் மதிப்புமிக்க உணவு மீன்.", te: "వెండి చంద్రమ విలువైన ఆహార చేప.", bn: "সিলভার পমফ্রেট একটি মূল্যবান মাছ।", ml: "വെള്ളി ആവോലി വിലപ്പെട്ട മത്സ്യമാണ്." },
      habitat: { en: "Indo-Pacific region.", hi: "हिंद-प्रशांत क्षेत्र।", mr: "हिंद-प्रशांत प्रदेश।", ta: "இந்தோ-பசிபிக் பகுதி.", te: "ఇండో-పసిఫిక్ ప్రాంతం.", bn: "ইন্দো-প্যাসিফিক অঞ্চল।", ml: "ഇൻഡോ-പസഫിക് മേഖല." },
      color: "#e2e8f0"
    },
    {
      id: 3,
      name: { en: "Mackerel", hi: "बंगड़ा", mr: "बांगडा", ta: "காஞ்சல்", te: "అయల", bn: "ম্যাকরেল", ml: "അയല" },
      scientificName: "Rastrelliger kanagurta",
      description: { en: "Indian Mackerel is a common food fish.", hi: "भारतीय बंगड़ा एक आम मछली है।", mr: "भारतीय बांगडा एक सामान्य मासा आहे।", ta: "இந்திய காஞ்சல் பொதுவான மீன்.", te: "భారతీయ అయల సాధారణ చేప.", bn: "ভারতীয় ম্যাকরেল একটি সাধারণ মাছ।", ml: "ഇന്ത്യൻ അയല സാധാരണ മത്സ്യമാണ്." },
      habitat: { en: "Coastal waters of Indian Ocean.", hi: "हिंद महासागर के तटीय जल।", mr: "हिंद महासागराचे किनारी पाणी।", ta: "இந்திய பெருங்கடலின் கடலோர நீர்.", te: "హిందూ మహాసముద్రం తీర జలాలు.", bn: "ভারত মহাসাগরের উপকূলীয় জল।", ml: "ഇന്ത്യൻ മഹാസമുദ്രത്തിലെ തീരദേശ ജലം." },
      color: "#60a5fa"
    },
    {
      id: 4,
      name: { en: "Rohu", hi: "रोहू", mr: "रोहू", ta: "ரோகு", te: "రోహు", bn: "রুই", ml: "രോഹു" },
      scientificName: "Labeo rohita",
      description: { en: "Rohu is a major carp species in rivers.", hi: "रोहू नदियों में पाई जाने वाली एक प्रमुख कार्प प्रजाति है।", mr: "रोहू नद्यांमध्ये आढळणारी प्रमुख कार्प प्रजाती आहे।", ta: "ரோகு ஆறுகளில் காணப்படும் முக்கிய கெண்டை மீன் இனமாகும்.", te: "రోహు నదులలో కనిపించే ప్రధాన కార్ప్ జాతి.", bn: "রুই নদীগুলির একটি প্রধান কার্প প্রজাতি।", ml: "നദികളിൽ കാണപ്പെടുന്ന പ്രധാന കാർപ്പ് ഇനമാണ് രോഹു." },
      habitat: { en: "Freshwater rivers and ponds.", hi: "मीठे पानी की नदियां और तालाब।", mr: "गोड्या पाण्यातील नद्या आणि तलाव।", ta: "நன்னீர் ஆறுகள் மற்றும் குளங்கள்.", te: "మంచినీటి నదులు మరియు చెరువులు.", bn: "মিষ্টি জলের নদী এবং পুকুর।", ml: "ശുദ്ധജല നദികളും കുളങ്ങളും." },
      color: "#9ca3af"
    },
    {
      id: 5,
      name: { en: "Catla", hi: "कतला", mr: "कटला", ta: "கட்லா", te: "బొచ్చె", bn: "কাতলা", ml: "കട്‌ല" },
      scientificName: "Labeo catla",
      description: { en: "Catla is a fast-growing Indian major carp.", hi: "कतला एक तेजी से बढ़ने वाली भारतीय प्रमुख कार्प है।", mr: "कटला वेगाने वाढणारी भारतीय प्रमुख कार्प आहे।", ta: "கட்லா வேகமாக வளரும் இந்திய முக்கிய கெண்டை மீன்.", te: "బొచ్చె వేగంగా పెరుగుతున్న ప్రధాన భారతీయ కార్ప్.", bn: "কাতলা একটি দ্রুত বর্ধনশীল ভারতীয় প্রধান কার্প।", ml: "വേഗത്തിൽ വളരുന്ന ഇന്ത്യൻ കാർപ്പ് ഇനമാണ് കട്‌ല." },
      habitat: { en: "Rivers and lakes of South Asia.", hi: "दक्षिण एशिया की नदियां और झीलें।", mr: "दक्षिण आशियातील नद्या आणि सरोवरे।", ta: "தெற்காசியாவின் ஆறுகள் மற்றும் ஏரிகள்.", te: "దక్షిణాసియా నదులు మరియు సరస్సులు.", bn: "দক্ষিণ এশিয়ার নদী ও হ্রদ।", ml: "ദക്ഷിണേഷ്യയിലെ നദികളും തടാകങ്ങളും." },
      color: "#cbd5e1"
    }
  ];

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
        model: "gemini-2.5-flash-lite",
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
                <div className="flex flex-col justify-end min-h-full pb-24">
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
                            : 'bg-white/5 border border-white/10 text-slate-100 rounded-2xl rounded-tl-sm hover:bg-white/10 transition-colors'}
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
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="absolute left-0 z-20 w-full px-4 bottom-6">
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

            <main>
              {activeTab === 'identify' && (
                <div className="p-6 glass-card rounded-3xl md:p-8 animate-fade-in">
                  <div className="mb-6 text-center">
                    <h2 className="mb-2 text-2xl font-bold">Identify Catch</h2>
                    <p className="text-sm text-slate-400">Upload a photo to detect species</p>
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
                      {identifying ? <><Loader2 className="w-6 h-6 animate-spin" /> Scanning...</> : <><Camera className="w-6 h-6" /> Identify Species</>}
                    </button>
                  )}

                  {result && !result.error && (
                    <div className="relative p-6 mt-6 overflow-hidden border bg-white/5 border-white/10 rounded-2xl">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600"></div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-cyan-500/20"><Fish className="w-6 h-6 text-cyan-400" /></div>
                          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">Analysis Result</h2>
                        </div>
                        <button onClick={clearImage} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white transition-colors">New Scan</button>
                      </div>

                      <div className="grid gap-4 mb-4 md:grid-cols-2">
                        <div className="p-4 border bg-slate-900/40 rounded-xl border-white/5">
                          <p className="mb-1 text-xs font-bold tracking-wider uppercase text-cyan-400">Common Name</p>
                          <p className="text-xl font-bold text-white">{result.commonName}</p>
                        </div>
                        <div className="p-4 border bg-slate-900/40 rounded-xl border-white/5">
                          <p className="mb-1 text-xs font-bold tracking-wider uppercase text-cyan-400">Scientific Name</p>
                          <p className="text-lg italic text-slate-300">{result.scientificName}</p>
                        </div>
                      </div>

                      {result.features && (
                        <div className="p-5 mb-4 border bg-slate-900/40 rounded-xl border-white/5">
                          <p className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-300"><Info className="w-4 h-4 text-cyan-400" /> Key Features</p>
                          <ul className="space-y-2">
                            {result.features.map((f, i) => (
                              <li key={i} className="flex gap-2 text-sm text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0"></span> {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.confidence && (
                        <div className="p-4 border bg-slate-900/40 rounded-xl border-white/5">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-slate-400">AI Confidence</span>
                            <span className="text-sm font-bold text-cyan-400">{result.confidence}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${result.confidence}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {result?.error && (
                    <div className="p-4 mt-6 text-sm text-center text-red-200 border bg-red-500/10 border-red-500/20 rounded-xl">
                      <p className="flex items-center justify-center gap-2 mb-2 font-bold"><Info className="w-4 h-4" /> Identification Failed</p>
                      <p className="opacity-80">{result.error}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'shops' && (
                <div className="p-6 glass-card rounded-3xl md:p-8 animate-fade-in">
                  <div className="mb-8 text-center">
                    <div className="inline-block p-4 mb-4 rounded-full shadow-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30">
                      <MapPin className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold">Nearby Shops</h2>
                    <p className="text-slate-400">Find fishing gear and marine supplies</p>
                  </div>

                  {!userLocation && !loadingLocation && (
                    <button onClick={getUserLocation} className="w-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02]">
                      <Navigation className="w-5 h-5 text-cyan-400" /> Enable Location & Search
                    </button>
                  )}

                  {(loadingLocation || searchingShops) && (
                    <div className="py-12 text-center">
                      <Loader2 className="w-10 h-10 mx-auto mb-4 text-cyan-400 animate-spin" />
                      <p className="text-slate-400 animate-pulse">{loadingLocation ? "Locating you..." : "Scouting nearby stores..."}</p>
                    </div>
                  )}

                  {userLocation && nearbyShops.length > 0 && !searchingShops && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2 text-sm text-slate-400">
                        <span>{nearbyShops.length} locations found</span>
                        <button onClick={() => findNearbyShops(userLocation.lat, userLocation.lng)} className="flex items-center gap-1 text-cyan-400 hover:text-white"><RefreshCw className="w-3 h-3" /> Refresh</button>
                      </div>
                      {nearbyShops.map((shop, i) => (
                        <div
                          key={i}
                          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.name + " " + shop.address)}`, '_blank')}
                          className="relative p-5 transition-all border cursor-pointer bg-slate-900/60 rounded-xl border-white/5 hover:border-cyan-500/30 hover:bg-slate-800/80 group"
                        >
                          <div className="absolute transition-opacity opacity-0 top-4 right-4 group-hover:opacity-100">
                            <ExternalLink className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div className="flex items-start justify-between pr-8">
                            <div>
                              <h3 className="font-bold text-white transition-colors group-hover:text-cyan-400">{shop.name}</h3>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">{shop.type}</span>
                            </div>
                            <span className="px-2 py-1 text-xs rounded bg-slate-800 text-slate-300">{shop.distance}</span>
                          </div>
                          <div className="mt-3 space-y-1 text-sm text-slate-400">
                            {shop.address && <p className="flex gap-2"><MapPin className="w-4 h-4 shrink-0" /> {shop.address}</p>}
                            {shop.phone && <p className="ml-6 text-slate-500">📞 {shop.phone}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'coastguard' && (
                <div className="p-6 glass-card rounded-3xl md:p-8 animate-fade-in">
                  <div className="mb-8 text-center">
                    <div className="inline-block p-4 mb-4 rounded-full shadow-lg bg-gradient-to-br from-red-500 to-orange-600 shadow-red-500/30">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold">Coast Guard</h2>
                    <p className="text-slate-400">Emergency & Department Contacts</p>
                  </div>
                  <div className="space-y-4">
                    {coastGuardDepartments.map((dept, i) => (
                      <div key={i} className="p-5 transition-colors border-l-4 border-red-500 bg-slate-900/60 rounded-r-xl hover:bg-slate-800/80">
                        <h3 className="mb-2 text-lg font-bold text-white">{dept.name}</h3>
                        <div className="space-y-2 text-sm">
                          <a href={`tel:${dept.telephone}`} className="flex items-center gap-3 text-slate-300 hover:text-white"><Phone className="w-4 h-4 text-red-400" /> {dept.telephone}</a>
                          <a href={`mailto:${dept.email}`} className="flex items-center gap-3 break-all text-slate-300 hover:text-white"><Mail className="w-4 h-4 text-red-400" /> {dept.email}</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'encyclopedia' && (
                <div className="p-6 glass-card rounded-3xl md:p-8 animate-fade-in">
                  {!selectedFish ? (
                    <>
                      <h2 className="mb-6 text-2xl font-bold text-center">Fish Database</h2>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {fishDatabase.map(fish => (
                          <button key={fish.id} onClick={() => setSelectedFish(fish)} className="flex items-center gap-4 p-4 text-left transition-all border bg-slate-900/60 rounded-xl border-white/5 hover:border-cyan-500/30 hover:bg-slate-800/80 group">
                            <div className="flex items-center justify-center w-16 h-16 text-3xl transition-transform rounded-full shadow-lg group-hover:scale-110" style={{ backgroundColor: fish.color }}>🐟</div>
                            <div>
                              <h3 className="text-lg font-bold text-white group-hover:text-cyan-400">{fish.name[language]}</h3>
                              <p className="text-xs italic text-slate-500">{fish.scientificName}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 ml-auto text-slate-700 group-hover:text-cyan-400" />
                          </button>
                        ))}
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
              { id: 'shops', icon: Store, label: 'Shops' },
              { id: 'coastguard', icon: Building2, label: 'Guard' },
              { id: 'chat', icon: MessageCircle, label: 'Chat' },
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