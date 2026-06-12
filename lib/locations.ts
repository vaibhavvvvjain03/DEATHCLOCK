export interface LocationData {
  name: string;
  lat: number;
  lng: number;
  type: "city" | "state" | "region";
  country: string;
  carbonIntensity: number; // 0.0 (cleanest) to 1.0 (most carbon intensive)
  flag: string; // Emoji flag
}

export const TIER_1_LOCATIONS: LocationData[] = [
  // --- AFRICA ---
  { name: "Lagos", lat: 6.5244, lng: 3.3792, type: "city", country: "Nigeria", carbonIntensity: 0.75, flag: "🇳🇬" },
  { name: "Cairo", lat: 30.0444, lng: 31.2357, type: "city", country: "Egypt", carbonIntensity: 0.82, flag: "🇪🇬" },
  { name: "Nairobi", lat: -1.2921, lng: 36.8219, type: "city", country: "Kenya", carbonIntensity: 0.35, flag: "🇰🇪" },
  { name: "Johannesburg", lat: -26.2041, lng: 28.0473, type: "city", country: "South Africa", carbonIntensity: 0.88, flag: "🇿🇦" },
  { name: "Kinshasa", lat: -4.4419, lng: 15.2663, type: "city", country: "DR Congo", carbonIntensity: 0.50, flag: "🇨🇩" },
  { name: "Casablanca", lat: 33.5731, lng: -7.5898, type: "city", country: "Morocco", carbonIntensity: 0.65, flag: "🇲🇦" },
  { name: "Addis Ababa", lat: 9.0192, lng: 38.7468, type: "city", country: "Ethiopia", carbonIntensity: 0.28, flag: "🇪🇹" },
  { name: "Accra", lat: 5.6037, lng: -0.1870, type: "city", country: "Ghana", carbonIntensity: 0.58, flag: "🇬🇭" },

  // --- ASIA-PACIFIC ---
  { name: "Tokyo", lat: 35.6762, lng: 139.6503, type: "city", country: "Japan", carbonIntensity: 0.45, flag: "🇯🇵" },
  { name: "Beijing", lat: 39.9042, lng: 116.4074, type: "city", country: "China", carbonIntensity: 0.85, flag: "🇨🇳" },
  { name: "Shanghai", lat: 31.2304, lng: 121.4737, type: "city", country: "China", carbonIntensity: 0.78, flag: "🇨🇳" },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777, type: "city", country: "India", carbonIntensity: 0.68, flag: "🇮🇳" },
  { name: "Delhi", lat: 28.7041, lng: 77.1025, type: "city", country: "India", carbonIntensity: 0.92, flag: "🇮🇳" },
  { name: "Dhaka", lat: 23.8103, lng: 90.4125, type: "city", country: "Bangladesh", carbonIntensity: 0.84, flag: "🇧🇩" },
  { name: "Jakarta", lat: -6.2088, lng: 106.8456, type: "city", country: "Indonesia", carbonIntensity: 0.80, flag: "🇮🇩" },
  { name: "Manila", lat: 14.5995, lng: 120.9842, type: "city", country: "Philippines", carbonIntensity: 0.72, flag: "🇵🇭" },
  { name: "Karachi", lat: 24.8607, lng: 67.0011, type: "city", country: "Pakistan", carbonIntensity: 0.86, flag: "🇵🇰" },
  { name: "Osaka", lat: 34.6937, lng: 135.5022, type: "city", country: "Japan", carbonIntensity: 0.42, flag: "🇯🇵" },
  { name: "Seoul", lat: 37.5665, lng: 126.9780, type: "city", country: "South Korea", carbonIntensity: 0.60, flag: "🇰🇷" },
  { name: "Bangkok", lat: 13.7563, lng: 100.5018, type: "city", country: "Thailand", carbonIntensity: 0.62, flag: "🇹🇭" },
  { name: "Ho Chi Minh City", lat: 10.8231, lng: 106.6297, type: "city", country: "Vietnam", carbonIntensity: 0.68, flag: "🇻🇳" },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639, type: "city", country: "India", carbonIntensity: 0.74, flag: "🇮🇳" },
  { name: "Chennai", lat: 13.0827, lng: 80.2707, type: "city", country: "India", carbonIntensity: 0.66, flag: "🇮🇳" },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946, type: "city", country: "India", carbonIntensity: 0.52, flag: "🇮🇳" },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867, type: "city", country: "India", carbonIntensity: 0.65, flag: "🇮🇳" },
  { name: "Pune", lat: 18.5204, lng: 73.8567, type: "city", country: "India", carbonIntensity: 0.58, flag: "🇮🇳" },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714, type: "city", country: "India", carbonIntensity: 0.76, flag: "🇮🇳" },

  // --- EUROPE ---
  { name: "London", lat: 51.5074, lng: -0.1278, type: "city", country: "United Kingdom", carbonIntensity: 0.38, flag: "🇬🇧" },
  { name: "Paris", lat: 48.8566, lng: 2.3522, type: "city", country: "France", carbonIntensity: 0.20, flag: "🇫🇷" },
  { name: "Berlin", lat: 52.5200, lng: 13.4050, type: "city", country: "Germany", carbonIntensity: 0.50, flag: "🇩🇪" },
  { name: "Madrid", lat: 40.4168, lng: -3.7038, type: "city", country: "Spain", carbonIntensity: 0.34, flag: "🇪🇸" },
  { name: "Rome", lat: 41.9028, lng: 12.4964, type: "city", country: "Italy", carbonIntensity: 0.44, flag: "🇮🇹" },
  { name: "Amsterdam", lat: 52.3676, lng: 4.9041, type: "city", country: "Netherlands", carbonIntensity: 0.40, flag: "🇳🇱" },
  { name: "Warsaw", lat: 52.2297, lng: 21.0122, type: "city", country: "Poland", carbonIntensity: 0.82, flag: "🇵🇱" },
  { name: "Istanbul", lat: 41.0082, lng: 28.9784, type: "city", country: "Turkey", carbonIntensity: 0.58, flag: "🇹🇷" },
  { name: "Moscow", lat: 55.7558, lng: 37.6173, type: "city", country: "Russia", carbonIntensity: 0.70, flag: "🇷🇺" },
  { name: "Kyiv", lat: 50.4501, lng: 30.5234, type: "city", country: "Ukraine", carbonIntensity: 0.52, flag: "🇺🇦" },

  // --- AMERICAS ---
  { name: "New York", lat: 40.7128, lng: -74.0060, type: "city", country: "United States", carbonIntensity: 0.42, flag: "🇺🇸" },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437, type: "city", country: "United States", carbonIntensity: 0.38, flag: "🇺🇸" },
  { name: "São Paulo", lat: -23.5505, lng: -46.6333, type: "city", country: "Brazil", carbonIntensity: 0.28, flag: "🇧🇷" },
  { name: "Mexico City", lat: 19.4326, lng: -99.1332, type: "city", country: "Mexico", carbonIntensity: 0.64, flag: "🇲🇽" },
  { name: "Buenos Aires", lat: -34.6037, lng: -58.3816, type: "city", country: "Argentina", carbonIntensity: 0.48, flag: "🇦🇷" },
  { name: "Chicago", lat: 41.8781, lng: -87.6298, type: "city", country: "United States", carbonIntensity: 0.55, flag: "🇺🇸" },
  { name: "Toronto", lat: 43.6532, lng: -79.3832, type: "city", country: "Canada", carbonIntensity: 0.30, flag: "🇨🇦" },
  { name: "Lima", lat: -12.0464, lng: -77.0428, type: "city", country: "Peru", carbonIntensity: 0.40, flag: "🇵🇪" },
  { name: "Bogotá", lat: 4.7110, lng: -74.0721, type: "city", country: "Colombia", carbonIntensity: 0.36, flag: "🇨🇴" },
  { name: "Santiago", lat: -33.4489, lng: -70.6693, type: "city", country: "Chile", carbonIntensity: 0.45, flag: "🇨🇱" },

  // --- MIDDLE EAST ---
  { name: "Dubai", lat: 25.2048, lng: 55.2708, type: "city", country: "United Arab Emirates", carbonIntensity: 0.78, flag: "🇦🇪" },
  { name: "Riyadh", lat: 24.7136, lng: 46.6753, type: "city", country: "Saudi Arabia", carbonIntensity: 0.85, flag: "🇸🇦" },
  { name: "Tehran", lat: 35.6892, lng: 51.3890, type: "city", country: "Iran", carbonIntensity: 0.76, flag: "🇮🇷" },
  { name: "Baghdad", lat: 33.3152, lng: 44.3661, type: "city", country: "Iraq", carbonIntensity: 0.80, flag: "🇮🇶" }
];

export const TIER_2_LOCATIONS: LocationData[] = [
  // --- INDIA STATES ---
  { name: "Andhra Pradesh", lat: 15.9129, lng: 79.7400, type: "state", country: "India", carbonIntensity: 0.70, flag: "🇮🇳" },
  { name: "Arunachal Pradesh", lat: 28.2180, lng: 94.7278, type: "state", country: "India", carbonIntensity: 0.25, flag: "🇮🇳" },
  { name: "Assam", lat: 26.2006, lng: 92.9376, type: "state", country: "India", carbonIntensity: 0.58, flag: "🇮🇳" },
  { name: "Bihar", lat: 25.0961, lng: 85.3131, type: "state", country: "India", carbonIntensity: 0.78, flag: "🇮🇳" },
  { name: "Chhattisgarh", lat: 21.2787, lng: 81.8661, type: "state", country: "India", carbonIntensity: 0.94, flag: "🇮🇳" },
  { name: "Goa", lat: 15.2993, lng: 74.1240, type: "state", country: "India", carbonIntensity: 0.40, flag: "🇮🇳" },
  { name: "Gujarat", lat: 22.2587, lng: 71.1924, type: "state", country: "India", carbonIntensity: 0.80, flag: "🇮🇳" },
  { name: "Haryana", lat: 29.0588, lng: 76.0856, type: "state", country: "India", carbonIntensity: 0.88, flag: "🇮🇳" },
  { name: "Himachal Pradesh", lat: 31.1048, lng: 77.1734, type: "state", country: "India", carbonIntensity: 0.20, flag: "🇮🇳" },
  { name: "Jharkhand", lat: 23.6102, lng: 85.2799, type: "state", country: "India", carbonIntensity: 0.92, flag: "🇮🇳" },
  { name: "Karnataka", lat: 15.3173, lng: 75.7139, type: "state", country: "India", carbonIntensity: 0.50, flag: "🇮🇳" },
  { name: "Kerala", lat: 10.8505, lng: 76.2711, type: "state", country: "India", carbonIntensity: 0.38, flag: "🇮🇳" },
  { name: "Madhya Pradesh", lat: 22.9734, lng: 78.6569, type: "state", country: "India", carbonIntensity: 0.78, flag: "🇮🇳" },
  { name: "Maharashtra", lat: 19.7515, lng: 75.7139, type: "state", country: "India", carbonIntensity: 0.68, flag: "🇮🇳" },
  { name: "Manipur", lat: 24.6637, lng: 93.9063, type: "state", country: "India", carbonIntensity: 0.45, flag: "🇮🇳" },
  { name: "Meghalaya", lat: 25.4670, lng: 91.3662, type: "state", country: "India", carbonIntensity: 0.38, flag: "🇮🇳" },
  { name: "Mizoram", lat: 23.1645, lng: 92.9376, type: "state", country: "India", carbonIntensity: 0.30, flag: "🇮🇳" },
  { name: "Nagaland", lat: 26.1584, lng: 94.5624, type: "state", country: "India", carbonIntensity: 0.35, flag: "🇮🇳" },
  { name: "Odisha", lat: 20.9517, lng: 85.0985, type: "state", country: "India", carbonIntensity: 0.86, flag: "🇮🇳" },
  { name: "Punjab", lat: 31.1471, lng: 75.3412, type: "state", country: "India", carbonIntensity: 0.82, flag: "🇮🇳" },
  { name: "Rajasthan", lat: 27.0238, lng: 74.2179, type: "state", country: "India", carbonIntensity: 0.85, flag: "🇮🇳" },
  { name: "Sikkim", lat: 27.5330, lng: 88.5122, type: "state", country: "India", carbonIntensity: 0.15, flag: "🇮🇳" },
  { name: "Tamil Nadu", lat: 11.1271, lng: 78.6569, type: "state", country: "India", carbonIntensity: 0.58, flag: "🇮🇳" },
  { name: "Telangana", lat: 18.1124, lng: 79.0193, type: "state", country: "India", carbonIntensity: 0.72, flag: "🇮🇳" },
  { name: "Tripura", lat: 23.9408, lng: 91.9882, type: "state", country: "India", carbonIntensity: 0.48, flag: "🇮🇳" },
  { name: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, type: "state", country: "India", carbonIntensity: 0.86, flag: "🇮🇳" },
  { name: "Uttarakhand", lat: 30.0668, lng: 79.0193, type: "state", country: "India", carbonIntensity: 0.25, flag: "🇮🇳" },
  { name: "West Bengal", lat: 22.9868, lng: 87.8550, type: "state", country: "India", carbonIntensity: 0.80, flag: "🇮🇳" },
  { name: "Delhi (NCT)", lat: 28.7041, lng: 77.1025, type: "state", country: "India", carbonIntensity: 0.92, flag: "🇮🇳" },
  { name: "Jammu & Kashmir", lat: 33.7782, lng: 76.5762, type: "state", country: "India", carbonIntensity: 0.45, flag: "🇮🇳" },
  { name: "Ladakh", lat: 34.1526, lng: 77.5771, type: "state", country: "India", carbonIntensity: 0.30, flag: "🇮🇳" },
  { name: "Puducherry", lat: 11.9416, lng: 79.8083, type: "state", country: "India", carbonIntensity: 0.55, flag: "🇮🇳" },
  { name: "Chandigarh", lat: 30.7333, lng: 76.7794, type: "state", country: "India", carbonIntensity: 0.60, flag: "🇮🇳" },
  { name: "Andaman & Nicobar", lat: 11.7401, lng: 92.6586, type: "state", country: "India", carbonIntensity: 0.62, flag: "🇮🇳" }
];

export const ALL_LOCATIONS = [...TIER_1_LOCATIONS, ...TIER_2_LOCATIONS];
export const INDIA_COORDINATES = { lat: 20.5937, lng: 78.9629 };
