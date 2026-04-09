export type LangCode = 'en' | 'hi' | 'kn' | 'ta'

export interface DriverTranslations {
  langName: string
  langCode: string    // BCP-47 for Web Speech API
  title: string
  subtitle: string
  navigation: string
  activeDelivery: string
  pendingShipments: string
  completedToday: string
  markDelivered: string
  start: string
  noActiveDelivery: string
  startPrompt: string
  from: string
  to: string
  eta: string
  mins: string
  vehicle: string
  deliveryProgress: string
  currentRoute: string
  aiSuggestions: string
  riskAlerts: string
  nextStop: string
  driverAvailable: string
  driverOnDelivery: string
  completionRate: string
  status: {
    in_transit: string
    delayed: string
    pending: string
    delivered: string
  }
  voice: {
    activeDelivery: string
    highRisk: string
    breakAlert: string
    nearDestination: string
    routeChanged: string
    delivered: string
  }
}

export const TRANSLATIONS: Record<LangCode, DriverTranslations> = {
  en: {
    langName: 'English',
    langCode: 'en-IN',
    title: 'Driver Execution Panel',
    subtitle: 'Manage deliveries with real-time AI guidance',
    navigation: 'Navigation',
    activeDelivery: 'Active Delivery',
    pendingShipments: 'Pending Shipments',
    completedToday: 'Completed Today',
    markDelivered: 'Mark as Delivered',
    start: 'Start',
    noActiveDelivery: 'No active delivery',
    startPrompt: 'Start a pending shipment below',
    from: 'From',
    to: 'To',
    eta: 'ETA',
    mins: 'min',
    vehicle: 'Vehicle',
    deliveryProgress: 'Delivery Progress',
    currentRoute: 'Current Route',
    aiSuggestions: 'AI Suggestions',
    riskAlerts: 'Risk Alerts',
    nextStop: 'Next Stop',
    driverAvailable: 'Available',
    driverOnDelivery: 'On Delivery',
    completionRate: 'Completion Rate',
    status: {
      in_transit: 'In Transit',
      delayed: 'Delayed',
      pending: 'Pending',
      delivered: 'Delivered',
    },
    voice: {
      activeDelivery: 'You have an active delivery. Please follow the route carefully.',
      highRisk: 'Warning! High risk zone detected ahead. Please switch to the alternate route immediately.',
      breakAlert: 'Please take a 15-minute break at the next stop. Stay alert.',
      nearDestination: 'You are approaching your destination. Prepare for delivery.',
      routeChanged: 'Route has been updated. Follow the new directions.',
      delivered: 'Delivery completed. Well done! Please confirm in the app.',
    },
  },

  hi: {
    langName: 'हिंदी',
    langCode: 'hi-IN',
    title: 'ड्राइवर पैनल',
    subtitle: 'AI गाइडेंस के साथ डिलीवरी प्रबंधित करें',
    navigation: 'नेविगेशन',
    activeDelivery: 'सक्रिय डिलीवरी',
    pendingShipments: 'लंबित शिपमेंट',
    completedToday: 'आज पूरा हुआ',
    markDelivered: 'डिलीवर किया गया',
    start: 'शुरू करें',
    noActiveDelivery: 'कोई सक्रिय डिलीवरी नहीं',
    startPrompt: 'नीचे एक शिपमेंट शुरू करें',
    from: 'से',
    to: 'तक',
    eta: 'समय',
    mins: 'मिनट',
    vehicle: 'वाहन',
    deliveryProgress: 'डिलीवरी प्रगति',
    currentRoute: 'वर्तमान मार्ग',
    aiSuggestions: 'AI सुझाव',
    riskAlerts: 'जोखिम अलर्ट',
    nextStop: 'अगला पड़ाव',
    driverAvailable: 'उपलब्ध',
    driverOnDelivery: 'डिलीवरी पर',
    completionRate: 'पूर्णता दर',
    status: {
      in_transit: 'यात्रा में',
      delayed: 'देरी हो गई',
      pending: 'प्रतीक्षारत',
      delivered: 'डिलीवर हो गया',
    },
    voice: {
      activeDelivery: 'आपके पास एक सक्रिय डिलीवरी है। कृपया मार्ग का ध्यानपूर्वक पालन करें।',
      highRisk: 'चेतावनी! आगे उच्च जोखिम क्षेत्र है। कृपया तुरंत वैकल्पिक मार्ग लें।',
      breakAlert: 'कृपया अगले पड़ाव पर पंद्रह मिनट का ब्रेक लें। सतर्क रहें।',
      nearDestination: 'आप अपने गंतव्य के पास पहुंच रहे हैं। डिलीवरी की तैयारी करें।',
      routeChanged: 'मार्ग बदल दिया गया है। नए दिशा-निर्देशों का पालन करें।',
      delivered: 'डिलीवरी पूरी हो गई। बहुत अच्छा! कृपया ऐप में पुष्टि करें।',
    },
  },

  kn: {
    langName: 'ಕನ್ನಡ',
    langCode: 'kn-IN',
    title: 'ಚಾಲಕ ಪ್ಯಾನಲ್',
    subtitle: 'AI ಮಾರ್ಗದರ್ಶನದೊಂದಿಗೆ ಡೆಲಿವರಿ ನಿರ್ವಹಿಸಿ',
    navigation: 'ನ್ಯಾವಿಗೇಷನ್',
    activeDelivery: 'ಸಕ್ರಿಯ ಡೆಲಿವರಿ',
    pendingShipments: 'ಬಾಕಿ ಶಿಪ್ಮೆಂಟ್‌ಗಳು',
    completedToday: 'ಇಂದು ಪೂರ್ಣಗೊಂಡಿದೆ',
    markDelivered: 'ಡೆಲಿವರ್ ಆಗಿದೆ',
    start: 'ಪ್ರಾರಂಭಿಸಿ',
    noActiveDelivery: 'ಯಾವುದೇ ಸಕ್ರಿಯ ಡೆಲಿವರಿ ಇಲ್ಲ',
    startPrompt: 'ಕೆಳಗೆ ಒಂದು ಶಿಪ್ಮೆಂಟ್ ಪ್ರಾರಂಭಿಸಿ',
    from: 'ಇಂದ',
    to: 'ಗೆ',
    eta: 'ಅಂದಾಜು ಸಮಯ',
    mins: 'ನಿಮಿಷ',
    vehicle: 'ವಾಹನ',
    deliveryProgress: 'ಡೆಲಿವರಿ ಪ್ರಗತಿ',
    currentRoute: 'ಪ್ರಸ್ತುತ ಮಾರ್ಗ',
    aiSuggestions: 'AI ಸಲಹೆಗಳು',
    riskAlerts: 'ಅಪಾಯ ಎಚ್ಚರಿಕೆಗಳು',
    nextStop: 'ಮುಂದಿನ ನಿಲ್ದಾಣ',
    driverAvailable: 'ಲಭ್ಯ',
    driverOnDelivery: 'ಡೆಲಿವರಿಯಲ್ಲಿ',
    completionRate: 'ಪೂರ್ಣತೆ ದರ',
    status: {
      in_transit: 'ಸಾಗಣೆಯಲ್ಲಿ',
      delayed: 'ವಿಳಂಬ',
      pending: 'ಬಾಕಿ ಇದೆ',
      delivered: 'ತಲುಪಿಸಲಾಗಿದೆ',
    },
    voice: {
      activeDelivery: 'ನಿಮಗೆ ಸಕ್ರಿಯ ಡೆಲಿವರಿ ಇದೆ. ದಯವಿಟ್ಟು ಮಾರ್ಗವನ್ನು ಎಚ್ಚರಿಕೆಯಿಂದ ಅನುಸರಿಸಿ.',
      highRisk: 'ಎಚ್ಚರಿಕೆ! ಮುಂದೆ ಹೆಚ್ಚಿನ ಅಪಾಯದ ಪ್ರದೇಶವಿದೆ. ದಯವಿಟ್ಟು ತಕ್ಷಣ ಪರ್ಯಾಯ ಮಾರ್ಗ ತೆಗೆದುಕೊಳ್ಳಿ.',
      breakAlert: 'ದಯವಿಟ್ಟು ಮುಂದಿನ ನಿಲ್ದಾಣದಲ್ಲಿ ಹದಿನೈದು ನಿಮಿಷ ವಿರಾಮ ತೆಗೆದುಕೊಳ್ಳಿ.',
      nearDestination: 'ನೀವು ನಿಮ್ಮ ಗಮ್ಯಸ್ಥಾನದ ಸಮೀಪ ಬರುತ್ತಿದ್ದೀರಿ. ಡೆಲಿವರಿಗೆ ಸಿದ್ಧರಾಗಿ.',
      routeChanged: 'ಮಾರ್ಗ ನವೀಕರಿಸಲಾಗಿದೆ. ಹೊಸ ನಿರ್ದೇಶನಗಳನ್ನು ಅನುಸರಿಸಿ.',
      delivered: 'ಡೆಲಿವರಿ ಪೂರ್ಣಗೊಂಡಿದೆ. ಅಭಿನಂದನೆಗಳು! ದಯವಿಟ್ಟು ಅಪ್ಲಿಕೇಶನ್‌ನಲ್ಲಿ ದೃಢೀಕರಿಸಿ.',
    },
  },

  ta: {
    langName: 'தமிழ்',
    langCode: 'ta-IN',
    title: 'டிரைவர் பேனல்',
    subtitle: 'AI வழிகாட்டுதலுடன் டெலிவரி நிர்வகிக்கவும்',
    navigation: 'வழிசெலுத்தல்',
    activeDelivery: 'செயலில் உள்ள டெலிவரி',
    pendingShipments: 'நிலுவை ஷிப்மெண்ட்',
    completedToday: 'இன்று முடிந்தது',
    markDelivered: 'டெலிவர் செய்யப்பட்டது',
    start: 'தொடங்கு',
    noActiveDelivery: 'செயலில் உள்ள டெலிவரி இல்லை',
    startPrompt: 'கீழே ஒரு ஷிப்மெண்ட் தொடங்கவும்',
    from: 'இருந்து',
    to: 'வரை',
    eta: 'வரும் நேரம்',
    mins: 'நிமிடம்',
    vehicle: 'வாகனம்',
    deliveryProgress: 'டெலிவரி முன்னேற்றம்',
    currentRoute: 'தற்போதைய வழி',
    aiSuggestions: 'AI பரிந்துரைகள்',
    riskAlerts: 'ஆபத்து எச்சரிக்கைகள்',
    nextStop: 'அடுத்த நிறுத்தம்',
    driverAvailable: 'கிடைக்கிறது',
    driverOnDelivery: 'டெலிவரியில்',
    completionRate: 'நிறைவு விகிதம்',
    status: {
      in_transit: 'வழியில் உள்ளது',
      delayed: 'தாமதமாகிவிட்டது',
      pending: 'காத்திருக்கிறது',
      delivered: 'டெலிவர் ஆனது',
    },
    voice: {
      activeDelivery: 'உங்களிடம் செயலில் உள்ள டெலிவரி உள்ளது. தயவுசெய்து வழியை கவனமாக பின்பற்றவும்.',
      highRisk: 'எச்சரிக்கை! முன்னே அதிக ஆபத்து பகுதி உள்ளது. உடனே மாற்று வழியை எடுக்கவும்.',
      breakAlert: 'தயவுசெய்து அடுத்த நிறுத்தத்தில் பதினைந்து நிமிட இடைவேளை எடுக்கவும்.',
      nearDestination: 'நீங்கள் உங்கள் இலக்கை நெருங்கி வருகிறீர்கள். டெலிவரிக்கு தயாராகுங்கள்.',
      routeChanged: 'வழி புதுப்பிக்கப்பட்டது. புதிய திசைகளை பின்பற்றவும்.',
      delivered: 'டெலிவரி முடிந்தது. சாபாஷ்! தயவுசெய்து செயலியில் உறுதிப்படுத்தவும்.',
    },
  },
}

/** Use Web Speech API to speak a message */
export function speakText(text: string, langCode: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance    = new SpeechSynthesisUtterance(text)
  utterance.lang     = langCode
  utterance.rate     = 0.92
  utterance.pitch    = 1.0
  utterance.volume   = 1.0
  window.speechSynthesis.speak(utterance)
}
