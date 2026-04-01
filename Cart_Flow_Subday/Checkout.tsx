import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomizedSub, Order, CustomerData } from '../types';
import { loadGoogleMaps } from '../services/googleMaps';
import { api } from '../services/api';

interface ConfirmedOrderInfo {
  short_id: string;
  total_amount: number;
  customer_name: string;
}

interface CheckoutProps {
  items: CustomizedSub[];
  onBack: () => void;
  onConfirm: (orderData: Omit<Order, 'id' | 'shortId' | 'status' | 'timestamp'>) => Promise<ConfirmedOrderInfo>;
}

// Coordenadas ACTUALIZADAS del restaurante (Av 8 Sta Rita)
const RESTAURANT_LOCATION = { lat: 10.673634, lng: -71.610117 };

// Valid Venezuelan phone prefixes (without leading 0)
const VALID_VE_PREFIXES = ['412', '414', '416', '422', '424', '426'];

interface GooglePlaceResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// Declaración global para evitar errores de TypeScript con window.google
declare global {
  interface Window {
    google: any;
  }
}

const Checkout: React.FC<CheckoutProps> = ({ items, onBack, onConfirm }) => {
  // Saved Customer Detection
  const [savedCustomer, setSavedCustomer] = useState<CustomerData | null>(null);
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrderInfo | null>(null);
  const [businessWhatsApp, setBusinessWhatsApp] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'BS' | 'MIXED' | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // USD Payment Method State
  const [usdMethod, setUsdMethod] = useState<'EFECTIVO' | 'ZELLE' | 'PAYPAL' | 'BINANCE' | 'BANESCO' | null>(null);
  const [titularName, setTitularName] = useState('');
  const [cashBillAmount, setCashBillAmount] = useState<number | null>(null);

  // MIXED Payment State
  const [mixedUsdAmount, setMixedUsdAmount] = useState<number | null>(null);
  const [mixedUsdProof, setMixedUsdProof] = useState<string | null>(null);
  const [mixedBsProof, setMixedBsProof] = useState<string | null>(null);
  const [mixedStep, setMixedStep] = useState<1 | 2>(1); // 1=USD, 2=BS

  // Delivery State
  const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'PICKUP' | null>(null);
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);

  // Search & Autocomplete State (Google Maps)
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GooglePlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(300);

  // Google Services
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const sessionToken = useRef<any>(null);
  const geocoder = useRef<any>(null);
  const directionsService = useRef<any>(null);
  const directionsRenderer = useRef<any>(null);

  // Google Maps Refs (replacing Leaflet) - use 'any' since types load dynamically
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const restaurantMarkerRef = useRef<any>(null);

  const [customerData, setCustomerData] = useState<CustomerData>({
    firstName: '',
    lastName: '',
    cedula: '',
    email: '',
    countryCode: '+58',
    phone: '',
    address: '',
    location: undefined
  });

  // Load saved customer from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('subday_customer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.firstName && parsed.phone) {
          setSavedCustomer(parsed);
          setShowWelcomeBack(true);
        }
      } catch (e) {
        console.error('Error parsing saved customer:', e);
      }
    }
  }, []);

  // Handle "Yes, it's me" - use saved data and skip to step 2
  const handleConfirmSavedCustomer = () => {
    if (savedCustomer) {
      setCustomerData(savedCustomer);
      setShowWelcomeBack(false);
      setStep(2); // Skip to delivery method
      setDirection(1);
    }
  };

  // Handle "No, not me" - clear saved data and start fresh
  const handleRejectSavedCustomer = () => {
    localStorage.removeItem('subday_customer');
    setSavedCustomer(null);
    setShowWelcomeBack(false);
  };

  const itemsTotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const totalUSD = itemsTotal + deliveryPrice;
  const totalBS = totalUSD * exchangeRate;

  // Pago Móvil Settings
  const [pagoMovil, setPagoMovil] = useState({
    bank_name: 'Venezuela',
    bank_code: '0102',
    cedula: '28530030',
    phone: '04146074230'
  });

  // USD Payment Methods Settings
  const [paymentMethods, setPaymentMethods] = useState({
    zelle: { titular: 'Angelicas Group LLC', email: 'angelicasgroup@gmail.com' },
    paypal: { email: 'Nerginsonpp31@gmail.com' },
    binance: { email: 'Nerginsonpp31@gmail.com' },
    banesco: { titular: 'Nerginson Parra', tipo: 'Ahorro', cuenta: '221020584757' }
  });

  // Load settings on mount
  useEffect(() => {
    api.getSettings('exchange_rate').then(rate => {
      if (rate) setExchangeRate(rate);
    }).catch(console.error);

    api.getSettings('pago_movil').then(pm => {
      if (pm) setPagoMovil(pm);
    }).catch(console.error);

    api.getSettings('payment_methods').then(pm => {
      if (pm) setPaymentMethods(pm);
    }).catch(console.error);

    // Load business WhatsApp number from pago_movil phone
    api.getSettings('whatsapp_number').then(num => {
      if (num) setBusinessWhatsApp(num);
    }).catch(() => {
      // Fallback: try pago_movil phone
      api.getSettings('pago_movil').then(pm => {
        if (pm?.phone) setBusinessWhatsApp(pm.phone);
      }).catch(console.error);
    });
  }, []);

  // Iconos para Google Maps markers
  const restaurantIconUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40" height="40">
      <path fill="#006837" stroke="white" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="2.5" fill="white"/>
    </svg>`);

  const userIconUrl = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
      <path fill="#FFCC00" stroke="#006837" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="3" fill="#006837"/>
    </svg>`);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Inicializar Servicios de Google Maps
  useEffect(() => {
    const initGoogleServices = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        if (!autocompleteService.current) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService();
        }
        if (!placesService.current) {
          placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
        }
        if (!sessionToken.current) {
          sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
        }
        if (!geocoder.current) {
          geocoder.current = new window.google.maps.Geocoder();
        }
      }
    };

    loadGoogleMaps()
      .then(() => { initGoogleServices(); })
      .catch((error) => { console.error("Error loading Google Maps:", error); });
  }, []);

  // Function to close fullscreen
  const closeFullscreenMap = () => {
    setIsMapFullscreen(false);
    // Trigger resize after modal closes
    setTimeout(() => {
      if (mapInstance.current) {
        window.google?.maps?.event?.trigger(mapInstance.current, 'resize');
      }
    }, 100);
  };

  // Trigger resize when entering/exiting fullscreen
  useEffect(() => {
    if (mapInstance.current) {
      setTimeout(() => {
        window.google?.maps?.event?.trigger(mapInstance.current, 'resize');
      }, 100);
    }
  }, [isMapFullscreen]);

  const isSelectingRef = useRef(false);

  // --- Lógica de Búsqueda con Google Places Autocomplete ---
  useEffect(() => {
    if (searchQuery.length <= 1) {
      setSuggestions([]);
      return;
    }
    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      if (!autocompleteService.current) return;
      setIsSearching(true);
      const request = {
        input: searchQuery,
        sessionToken: sessionToken.current,
        componentRestrictions: { country: 've' },
        locationBias: new window.google.maps.Circle({
          center: RESTAURANT_LOCATION,
          radius: 25000
        })
      };

      autocompleteService.current.getPlacePredictions(request, (predictions: any[], status: any) => {
        setIsSearching(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions.map(p => ({
            place_id: p.place_id,
            description: p.description,
            structured_formatting: p.structured_formatting
          })));
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // --- Lógica de Mapa y Google Directions API ---
  const placeUserMarker = (lat: number, lng: number) => {
    if (!mapInstance.current) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstance.current,
        icon: {
          url: userIconUrl,
          scaledSize: new window.google.maps.Size(48, 48),
          anchor: new window.google.maps.Point(24, 48)
        },
        draggable: true,
        zIndex: 100
      });

      userMarkerRef.current.addListener('dragend', () => {
        const pos = userMarkerRef.current?.getPosition();
        if (pos) calculateRoute(pos.lat(), pos.lng());
      });
    } else {
      userMarkerRef.current.setPosition({ lat, lng });
    }

    mapInstance.current.panTo({ lat, lng });
    mapInstance.current.setZoom(15);
    calculateRoute(lat, lng);
  };

  const calculateRoute = async (lat: number, lng: number) => {
    setIsCalculatingRoute(true);
    try {
      if (!directionsService.current || !directionsRenderer.current) return;

      const request = {
        origin: RESTAURANT_LOCATION,
        destination: { lat, lng },
        travelMode: window.google.maps.TravelMode.DRIVING
      };

      directionsService.current.route(request, (result: any, status: any) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          directionsRenderer.current.setDirections(result);

          // Get distance from route
          const route = result.routes[0];
          const leg = route.legs[0];
          const distKm = leg.distance.value / 1000;

          setDistanceKm(distKm);

          let finalPrice = 0;
          if (distKm <= 1) finalPrice = 1.20;
          else if (distKm <= 3) finalPrice = 2.40;
          else if (distKm <= 5) finalPrice = 3.60;
          else if (distKm <= 8) finalPrice = 4.80;
          else if (distKm <= 12) finalPrice = 6.00;
          else if (distKm <= 15) finalPrice = 7.20;
          else if (distKm <= 18) finalPrice = 8.40;
          else if (distKm <= 30) finalPrice = 9.60;
          else finalPrice = 999;

          setDeliveryPrice(parseFloat(finalPrice.toFixed(2)));
          setCustomerData(prev => ({ ...prev, location: { lat, lng } }));
        }
        setIsCalculatingRoute(false);
      });
    } catch (err) {
      console.error(err);
      setIsCalculatingRoute(false);
    }
  };

  useEffect(() => {
    let mapTimer: any;

    // Solo inicializar mapa en el paso 3 (MAPA)
    if (step === 3) {
      mapTimer = setTimeout(() => {
        if (!mapContainer.current || !window.google) return;

        // Clean up existing map
        if (mapInstance.current) {
          userMarkerRef.current?.setMap(null);
          restaurantMarkerRef.current?.setMap(null);
          directionsRenderer.current?.setMap(null);
          userMarkerRef.current = null;
          restaurantMarkerRef.current = null;
        }

        // Create new Google Map
        const map = new window.google.maps.Map(mapContainer.current, {
          center: RESTAURANT_LOCATION,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false, // Disable POI click to avoid extra API calls
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_TOP
          }
        });

        mapInstance.current = map;

        // Initialize Directions Service and Renderer
        directionsService.current = new window.google.maps.DirectionsService();
        directionsRenderer.current = new window.google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: true, // We'll use custom markers
          polylineOptions: {
            strokeColor: '#006837',
            strokeWeight: 5,
            strokeOpacity: 0.7
          }
        });

        // Add restaurant marker
        restaurantMarkerRef.current = new window.google.maps.Marker({
          position: RESTAURANT_LOCATION,
          map: map,
          icon: {
            url: restaurantIconUrl,
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 40)
          },
          zIndex: 50
        });

        // Add click listener to place user marker
        map.addListener('click', (e: any) => {
          setSearchQuery(''); // Clear search when manually clicking
          placeUserMarker(e.latLng.lat(), e.latLng.lng());
        });

      }, 500);
    }

    return () => {
      clearTimeout(mapTimer);
      if (step !== 3 && mapInstance.current) {
        userMarkerRef.current?.setMap(null);
        restaurantMarkerRef.current?.setMap(null);
        directionsRenderer.current?.setMap(null);
        userMarkerRef.current = null;
        restaurantMarkerRef.current = null;
        mapInstance.current = null;
      }
    };
  }, [step]);

  const handleSelectSuggestion = (result: GooglePlaceResult) => {
    isSelectingRef.current = true;
    setSearchQuery(result.description);
    setSuggestions([]);
    setShowSuggestions(false);
    setIsSearching(true);

    if (placesService.current && result.place_id) {
      const request = {
        placeId: result.place_id,
        fields: ['geometry'],
        sessionToken: sessionToken.current
      };

      placesService.current.getDetails(request, (place: any, status: any) => {
        setIsSearching(false);
        sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();

        if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          placeUserMarker(lat, lng);
        } else {
          console.error("Place Details error: " + status);
        }
      });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return alert("Tu navegador no soporta geolocalización");
    setLocationDenied(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        placeUserMarker(latitude, longitude);
        setSearchQuery("Mi ubicación actual");
        setLocationDenied(false);
      },
      () => {
        setLocationDenied(true);
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'cedula') {
      const numericValue = value.replace(/\D/g, '');
      setCustomerData({ ...customerData, [name]: numericValue });
    } else if (name === 'phone') {
      let numericValue = value.replace(/\D/g, '');

      // For Venezuela (+58), validate as user types
      // Only valid patterns: 4xx... or 04xx... (0 is removed when prefix complete)
      if (customerData.countryCode === '+58' && numericValue.length > 0) {
        // Check first character: must be 0 or 4
        if (numericValue[0] !== '0' && numericValue[0] !== '4') {
          return; // Block: can only start with 0 or 4
        }

        // If starts with 0, the SECOND character must be 4
        if (numericValue[0] === '0' && numericValue.length >= 2) {
          if (numericValue[1] !== '4') {
            return; // Block: after 0, must be 4 (e.g., 04xx)
          }
        }

        // Get normalized version for validation (without leading 0)
        let normalized = numericValue;
        if (normalized.startsWith('0')) {
          normalized = normalized.substring(1);
        }

        // Validate the normalized prefix (must be 4xx pattern)
        if (normalized.length >= 2) {
          const secondDigit = normalized[1];
          if (!['1', '2'].includes(secondDigit)) {
            return; // Block: second digit of prefix must be 1 or 2
          }
        }

        if (normalized.length >= 3) {
          const prefix = normalized.substring(0, 3);
          if (!VALID_VE_PREFIXES.includes(prefix)) {
            return; // Block: invalid prefix
          }
        }

        // Only remove the leading 0 once we have more digits (so user can see the 0 while typing)
        // Remove 0 when we have at least 4 digits (04xx -> 4xx)
        if (numericValue.startsWith('0') && numericValue.length >= 4) {
          numericValue = numericValue.substring(1);
        }
      }

      setCustomerData({ ...customerData, [name]: numericValue });
    } else {
      setCustomerData({ ...customerData, [name]: value });
    }
  };

  const [paymentFile, setPaymentFile] = useState<File | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress image to max 200KB
    const compressImage = (file: File, maxSizeKB: number = 200): Promise<File> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Start with original dimensions, then reduce if needed
            let quality = 0.8;
            const maxSize = maxSizeKB * 1024; // Convert to bytes

            // Scale down large images first
            const maxDimension = 1200;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height / width) * maxDimension;
                width = maxDimension;
              } else {
                width = (width / height) * maxDimension;
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);

            // Reduce quality until under maxSize
            const tryCompress = (q: number): void => {
              canvas.toBlob((blob) => {
                if (!blob) {
                  resolve(file);
                  return;
                }
                if (blob.size > maxSize && q > 0.1) {
                  tryCompress(q - 0.1);
                } else {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                }
              }, 'image/jpeg', q);
            };

            tryCompress(quality);
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    };

    try {
      const compressedFile = await compressImage(file);
      console.log(`Original: ${(file.size / 1024).toFixed(1)}KB → Compressed: ${(compressedFile.size / 1024).toFixed(1)}KB`);
      setPaymentFile(compressedFile);
      setPreview(URL.createObjectURL(compressedFile));
    } catch (err) {
      console.error('Compression failed, using original:', err);
      setPaymentFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      }).catch(err => console.error('Async: Could not copy text: ', err));
    } else {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      } catch (err) {
        console.error('Fallback: Could not copy text: ', err);
      }
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleFinalConfirm = async () => {
    if (!currency || isSaving) return;
    setIsSaving(true);
    try {
      const orderInfo = await onConfirm({
        customer: customerData,
        items,
        total: totalUSD,
        deliveryPrice,
        currency,
        reference,
        paymentProof: currency === 'MIXED' ? mixedBsProof || undefined : preview || undefined,
        paymentFile: paymentFile || undefined,
        usd_payment_method: usdMethod || undefined,
        zelle_email: titularName || undefined,
        cash_bill_amount: cashBillAmount || undefined,
        delivery_method: deliveryMethod || undefined,
        // MIXED payment fields
        usd_payment_amount: currency === 'MIXED' ? mixedUsdAmount || undefined : undefined,
        usd_payment_proof: currency === 'MIXED' ? mixedUsdProof || undefined : undefined
      });
      // Save returned order info for WhatsApp button
      if (orderInfo) setConfirmedOrder(orderInfo);
      // Save customer data for future orders
      localStorage.setItem('subday_customer', JSON.stringify(customerData));
      nextStep();
    } catch (error) {
      console.error("Error in handleFinalConfirm:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = () => {
    if (step === 2) {
      if (deliveryMethod === 'PICKUP') {
        setDeliveryPrice(0);
        setCustomerData(prev => ({ ...prev, address: 'PICKUP - RETIRO EN TIENDA', location: undefined }));
        setStep(4); // Skip Map (Step 3) - Go directly to Payment (Step 4)
      } else {
        setCustomerData(prev => ({
          ...prev,
          address: prev.address === 'PICKUP - RETIRO EN TIENDA' ? '' : prev.address
        }));
        setStep(3); // Go to Map
      }
    } else {
      setStep(prev => prev + 1);
    }
    setDirection(1);
  };

  const prevStep = () => {
    if (step === 4 && deliveryMethod === 'PICKUP') {
      setStep(2); // Back to Method
    } else if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      onBack();
    }
    setDirection(-1);
  };

  // Normalize Venezuelan phone number (remove leading 0 if present)
  const normalizeVEPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, ''); // Remove non-digits
    if (cleaned.startsWith('0')) {
      return cleaned.substring(1); // Remove leading 0
    }
    return cleaned;
  };

  // Check if Venezuelan phone has valid prefix
  const isValidVEPhone = (phone: string): boolean => {
    const normalized = normalizeVEPhone(phone);
    if (normalized.length < 3) return false;
    const prefix = normalized.substring(0, 3);
    return VALID_VE_PREFIXES.includes(prefix);
  };

  const isCustomerValid = () => {
    const baseValid = customerData.firstName.trim() !== '' &&
      customerData.lastName.trim() !== '' &&
      customerData.cedula.trim() !== '' &&
      customerData.phone.trim() !== '';

    // If Venezuela (+58), validate phone prefix
    if (customerData.countryCode === '+58') {
      return baseValid && isValidVEPhone(customerData.phone);
    }

    return baseValid;
    // Email is now optional
  };

  const isLocationValid = () => {
    if (deliveryMethod === 'PICKUP') return true;
    return customerData.location !== undefined && deliveryPrice > 0;
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? '100%' : '-100%', opacity: 0 })
  };

  const renderContent = () => {
    switch (step) {
      case 1: // DATOS
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 space-y-4">
              <h3 className="text-xl font-black text-[#006837] font-brand uppercase tracking-tighter mb-2 flex items-center gap-3">
                <span className="w-2 h-7 bg-[#FFCC00] rounded-full"></span> Tus Datos
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nombre</label>
                  <input name="firstName" value={customerData.firstName} onChange={handleInputChange} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-[#006837] focus:border-[#FFCC00] outline-none text-base" placeholder="Tu nombre" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Apellido</label>
                  <input name="lastName" value={customerData.lastName} onChange={handleInputChange} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-[#006837] focus:border-[#FFCC00] outline-none text-base" placeholder="Tu apellido" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Cédula de Identidad</label>
                <input name="cedula" value={customerData.cedula} onChange={handleInputChange} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-[#006837] focus:border-[#FFCC00] outline-none text-base" placeholder="12345678" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Teléfono</label>
                <div className="flex gap-2 w-full overflow-hidden">
                  <select
                    name="countryCode"
                    value={customerData.countryCode}
                    onChange={handleInputChange}
                    className="bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-[#006837] focus:border-[#FFCC00] outline-none flex-shrink-0 w-[100px] text-base"
                  >
                    <option value="+58">🇻🇪 +58</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+57">🇨🇴 +57</option>
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+56">🇨🇱 +56</option>
                  </select>
                  <input
                    name="phone"
                    type="tel"
                    value={customerData.phone}
                    onChange={handleInputChange}
                    className="flex-1 min-w-0 bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-[#006837] focus:border-[#FFCC00] outline-none text-base"
                    placeholder="4121234567"
                  />
                </div>
                {customerData.countryCode === '+58' && (
                  <p className="text-[10px] text-gray-400 mt-1 ml-1">Prefijos válidos: 412, 414, 416, 422, 424, 426</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Correo Electrónico <span className="text-gray-300">(opcional)</span></label>
                <input name="email" type="email" value={customerData.email} onChange={handleInputChange} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-[#006837] focus:border-[#FFCC00] outline-none text-base" placeholder="tucorreo@ejemplo.com" />
              </div>
            </div>
            <button disabled={!isCustomerValid()} onClick={nextStep} className={`w-full py-4 rounded-2xl font-black uppercase shadow-xl transition-all ${isCustomerValid() ? 'bg-[#006837] text-white' : 'bg-gray-200 text-gray-400'}`}>Siguiente</button>
          </div>
        );

      case 2: // TIPO DE ENTREGA
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-[#006837] font-brand uppercase tracking-tighter text-center">
              ¿Cómo deseas recibir tu pedido?
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setDeliveryMethod('DELIVERY'); }}
                className={`flex flex-col items-center justify-center gap-2 p-6 rounded-3xl border-4 transition-all ${deliveryMethod === 'DELIVERY' ? 'border-[#006837] bg-green-50 shadow-lg scale-105' : 'border-gray-100 bg-white opacity-60 hover:opacity-100'}`}
              >
                <div className="text-4xl">🛵</div>
                <div className="font-black text-[#006837] uppercase text-sm">Delivery</div>
              </button>

              <button
                onClick={() => { setDeliveryMethod('PICKUP'); }}
                className={`flex flex-col items-center justify-center gap-2 p-6 rounded-3xl border-4 transition-all ${deliveryMethod === 'PICKUP' ? 'border-[#FFCC00] bg-yellow-50 shadow-lg scale-105' : 'border-gray-100 bg-white opacity-60 hover:opacity-100'}`}
              >
                <div className="text-4xl">🛍️</div>
                <div className="font-black text-[#FFCC00] uppercase text-sm drop-shadow-sm" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>Pickup</div>
              </button>
            </div>

            <button disabled={!deliveryMethod} onClick={nextStep} className={`w-full py-4 rounded-2xl font-black uppercase shadow-xl transition-all ${deliveryMethod ? 'bg-[#006837] text-white' : 'bg-gray-200 text-gray-400'}`}>
              Siguiente
            </button>
            <button onClick={prevStep} className="w-full text-center text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-[#006837]">Volver</button>
          </div>
        );

      case 3: // UBICACIÓN (MAPA)
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-[2rem] p-4 shadow-lg border border-gray-100 relative">
              <h3 className="text-xl font-black text-[#006837] font-brand uppercase tracking-tighter mb-4 px-2">
                Ubicación de Entrega
              </h3>
              <p className="text-xs text-gray-500 mb-2 px-2">Busca tu dirección con Google Maps o toca el mapa.</p>

              <div className="flex gap-2 mb-4 relative z-[500] w-full">
                <div className="flex-1 min-w-0 relative">
                  <form onSubmit={handleSearchSubmit} className="flex bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm focus-within:border-[#FFCC00] transition-colors">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Buscar dirección (ej: Chops, Sambil...)"
                      className="flex-1 min-w-0 px-3 py-3 text-base font-bold text-gray-800 placeholder:text-gray-400 outline-none bg-white"
                      autoComplete="off"
                    />
                    <button type="submit" disabled={isSearching} className="bg-white px-3 border-l border-gray-100 text-[#006837] flex-shrink-0">
                      {isSearching ? '...' : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                    </button>
                  </form>
                  <AnimatePresence>
                    {showSuggestions && searchQuery.length > 1 && (
                      <motion.ul
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 w-full bg-white rounded-xl shadow-xl mt-2 border border-gray-100 overflow-hidden z-[600] max-h-60 overflow-y-auto"
                      >
                        {suggestions.length === 0 && !isSearching ? (
                          <li className="px-4 py-3 text-xs text-gray-400 italic text-center">Sin resultados.</li>
                        ) : (
                          suggestions.map((result) => (
                            <li key={result.place_id} onClick={() => handleSelectSuggestion(result)} className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-start gap-2">
                              <div className="flex-grow">
                                <span className="text-xs font-bold text-gray-800 leading-tight block">{result.structured_formatting.main_text}</span>
                                <span className="text-[10px] text-gray-500 leading-tight block">{result.structured_formatting.secondary_text}</span>
                              </div>
                            </li>
                          ))
                        )}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Botón grande de ubicación actual */}
              <button
                onClick={handleLocateMe}
                className="w-full py-4 px-6 bg-[#006837] text-white rounded-2xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 font-black uppercase text-sm tracking-wide"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Usar Mi Ubicación Actual
              </button>

              {/* Banner de ayuda cuando se niega el permiso de ubicación */}
              <AnimatePresence>
                {locationDenied && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-2"
                  >
                    <p className="text-sm font-bold text-amber-800 flex items-center gap-2">
                      <span className="text-lg">⚠️</span> Permiso de ubicación denegado
                    </p>
                    <p className="text-xs text-amber-700">No te preocupes, puedes seleccionar tu ubicación de estas formas:</p>
                    <div className="space-y-1">
                      <p className="text-xs text-amber-700 flex items-center gap-2">
                        <span className="text-base">🔍</span> <strong>Busca tu dirección</strong> en el buscador de arriba
                      </p>
                      <p className="text-xs text-amber-700 flex items-center gap-2">
                        <span className="text-base">👆</span> <strong>Toca el mapa</strong> directamente en tu ubicación
                      </p>
                      <p className="text-xs text-amber-700 flex items-center gap-2">
                        <span className="text-base">📌</span> <strong>Arrastra el pin</strong> para ajustar la posición
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Map Container - Expands to fullscreen when isMapFullscreen is true */}
              <div className={`${isMapFullscreen ? 'fixed inset-0 z-[9999] bg-white flex flex-col' : 'relative w-full h-80 bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-200 shadow-inner'}`}>
                {/* Fullscreen Header */}
                {isMapFullscreen && (
                  <div className="bg-white p-4 shadow-lg flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={closeFullscreenMap}
                      className="p-2 hover:bg-gray-100 rounded-xl"
                    >
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="flex-1 relative">
                      <form onSubmit={handleSearchSubmit} className="flex items-center bg-gray-100 rounded-xl overflow-hidden">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => setShowSuggestions(true)}
                          placeholder="Buscar dirección..."
                          className="flex-1 bg-transparent px-4 py-3 outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400"
                          autoComplete="off"
                        />
                        <button type="submit" disabled={isSearching} className="bg-transparent px-4 text-[#006837] flex-shrink-0">
                          {isSearching ? '...' : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                        </button>
                      </form>
                      {/* Suggestions dropdown */}
                      <AnimatePresence>
                        {showSuggestions && searchQuery.length > 1 && suggestions.length > 0 && (
                          <motion.ul
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[9999] max-h-60 overflow-y-auto"
                          >
                            {suggestions.map((result) => (
                              <li key={result.place_id} onClick={() => { handleSelectSuggestion(result); closeFullscreenMap(); }} className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b border-gray-50 last:border-0">
                                <span className="text-sm font-bold text-gray-800 block">{result.structured_formatting.main_text}</span>
                                <span className="text-xs text-gray-500 block">{result.structured_formatting.secondary_text}</span>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Map */}
                <div ref={mapContainer} className={`${isMapFullscreen ? 'flex-1' : 'w-full h-full'} bg-gray-200`} />

                {/* Expand/Collapse button */}
                <button
                  onClick={() => isMapFullscreen ? closeFullscreenMap() : setIsMapFullscreen(true)}
                  className={`absolute ${isMapFullscreen ? 'top-20 right-4' : 'top-3 right-3'} z-[400] bg-white/95 backdrop-blur p-2.5 rounded-xl shadow-lg border border-gray-200 hover:bg-[#006837] hover:text-white transition-colors group`}
                  title={isMapFullscreen ? "Cerrar mapa grande" : "Ver mapa grande"}
                >
                  <svg className="w-5 h-5 text-[#006837] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMapFullscreen
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    }
                  </svg>
                </button>

                {/* Locate me button in fullscreen */}
                {isMapFullscreen && (
                  <button
                    onClick={handleLocateMe}
                    className="absolute bottom-24 right-4 z-[400] bg-[#006837] text-white p-4 rounded-full shadow-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}

                {/* Delivery price */}
                {deliveryPrice > 0 && (
                  <div className={`absolute ${isMapFullscreen ? 'bottom-24 left-4' : 'bottom-4 left-4'} z-[400] bg-white/95 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-gray-200`}>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Delivery ({distanceKm.toFixed(1)} km)</p>
                    <p className="text-xl font-black text-[#006837]">{isCalculatingRoute ? '...' : (deliveryPrice > 100 ? 'N/A' : `$${deliveryPrice.toFixed(2)}`)}</p>
                  </div>
                )}

                {/* Fullscreen Footer */}
                {isMapFullscreen && (
                  <div className="bg-white p-4 safe-area-bottom flex-shrink-0">
                    <button
                      onClick={closeFullscreenMap}
                      className="w-full py-4 bg-[#006837] text-white rounded-2xl font-black uppercase shadow-lg"
                    >
                      Confirmar
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 px-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Punto de Referencia</label>
                <input name="address" value={customerData.address} onChange={handleInputChange} className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-bold text-[#006837] focus:border-[#FFCC00] outline-none text-base" placeholder="Ej: Casa blanca, frente a la plaza..." />
              </div>
            </div>
            <button disabled={!isLocationValid()} onClick={nextStep} className={`w-full py-4 rounded-2xl font-black uppercase shadow-xl transition-all ${isLocationValid() ? 'bg-[#006837] text-white' : 'bg-gray-200 text-gray-400'}`}>Confirmar Ubicación</button>
            <button onClick={prevStep} className="w-full text-center text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-[#006837] mt-2">Volver</button>
          </div>
        );

      case 4: // RESUMEN Y PAGO
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-black text-[#006837] font-brand uppercase tracking-tighter mb-4">Resumen</h3>
              <div className="space-y-4 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                {items.map(item => {
                  const qty = item.quantity || 1;
                  const itemTotal = item.price * qty;

                  // Determine display name based on item type
                  let displayName = 'Item';
                  let subtitle = '';

                  if (item.type === 'PIZZA') {
                    displayName = 'Pizza Subday';
                    subtitle = qty > 1 ? `x${qty}` : '';
                  } else if (item.type === 'OTHER') {
                    displayName = item.name || item.protein?.name || 'Item';
                    subtitle = qty > 1 ? `x${qty}` : '';
                  } else if (item.type === 'SALAD') {
                    displayName = item.protein?.name || 'Ensalada';
                    subtitle = 'Ensalada';
                  } else {
                    // SANDWICH
                    displayName = item.protein?.name || 'Sub';
                    subtitle = item.bread?.name || '';
                  }

                  // Get image - prioritize protein image, fallback to a placeholder
                  const itemImage = item.protein?.image || '';

                  return (
                    <div key={item.id} className="flex gap-3 items-center border-b border-gray-50 pb-2">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {itemImage ? (
                          <img src={itemImage} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">{item.type === 'PIZZA' ? '🍕' : (item.type === 'OTHER' ? '🍽️' : '🥪')}</span>
                        )}
                      </div>
                      <div className="flex-grow">
                        <p className="text-xs font-black uppercase">{displayName}</p>
                        {subtitle && <p className="text-[10px] text-gray-400 uppercase">{subtitle}</p>}
                      </div>
                      <span className="text-sm font-black text-[#006837]">${itemTotal.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              {/* Arrow indicator when there are many items */}
              {items.length > 3 && (
                <div className="flex justify-center py-1">
                  <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </div>
              )}
              <div className="mt-4 pt-2 border-t border-dashed border-gray-200 space-y-1">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase"><span>Subtotal</span><span>${itemsTotal.toFixed(2)}</span></div>
                {deliveryMethod === 'DELIVERY' && (
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase"><span>Delivery ({distanceKm.toFixed(1)}km)</span><span>${deliveryPrice.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between text-xl font-black text-[#006837] mt-2"><span>Total</span><span>${totalUSD.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={() => { setCurrency('USD'); nextStep(); }} className="w-full bg-white p-4 rounded-2xl shadow-md border-2 border-white hover:border-[#FFCC00] flex items-center justify-between group transition-all">
                <span className="font-black text-[#006837] uppercase">💵 Dólares (Efectivo/Zelle)</span>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-[#FFCC00]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </button>
              <button onClick={() => { setCurrency('BS'); nextStep(); }} className="w-full bg-white p-4 rounded-2xl shadow-md border-2 border-white hover:border-[#FFCC00] flex items-center justify-between group transition-all">
                <span className="font-black text-[#006837] uppercase">🇻🇪 Bolívares (Pago Móvil)</span>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-[#FFCC00]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </button>
              <button onClick={() => { setCurrency('MIXED'); setMixedStep(1); setMixedUsdAmount(null); setMixedUsdProof(null); setMixedBsProof(null); setUsdMethod(null); nextStep(); }} className="w-full bg-gradient-to-r from-green-50 to-yellow-50 p-4 rounded-2xl shadow-md border-2 border-dashed border-[#FFCC00] hover:border-[#006837] flex items-center justify-between group transition-all">
                <span className="font-black text-[#006837] uppercase">⚖️ Pago Mixto (USD + Bolívares)</span>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-[#006837]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <button onClick={prevStep} className="w-full text-center text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-[#006837]">Volver</button>
          </div>
        );

      case 5: // FINALIZAR (PAGO)
        // Validation for USD payments
        const isUsdValid = () => {
          if (currency !== 'USD') return reference.length >= 4;
          if (!usdMethod) return false;
          if (usdMethod === 'EFECTIVO') return preview !== null; // Photo required
          if (usdMethod === 'ZELLE') return preview !== null && titularName.trim().length > 0; // Screenshot + titular required
          if (usdMethod === 'PAYPAL') return preview !== null && titularName.trim().length > 0; // Screenshot + titular required
          if (usdMethod === 'BINANCE') return preview !== null && titularName.trim().length > 0; // Screenshot + titular required
          if (usdMethod === 'BANESCO') return preview !== null && titularName.trim().length > 0; // Screenshot + titular required
          return false;
        };

        // USD or BS payment flow
        if (currency === 'USD' || currency === 'BS') {
          return (
            <div className="space-y-6">
              <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 space-y-4">
                <div className="text-center mb-6">
                  <span className="text-4xl">{currency === 'USD' ? '💵' : '🇻🇪'}</span>
                  <h3 className="text-xl font-black text-[#006837] uppercase mt-2">{currency === 'USD' ? 'Pago en Divisas' : 'Pago en Bolívares'}</h3>

                  <div className="flex flex-col items-center mt-4 p-4 bg-yellow-50 rounded-2xl border-2 border-[#FFCC00]">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Monto a Pagar</span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-4xl font-black text-[#006837]">
                        {currency === 'USD' ? `$${totalUSD.toFixed(2)}` : `${totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`}
                      </span>
                      <button
                        onClick={() => copyToClipboard(currency === 'USD' ? totalUSD.toFixed(2) : totalBS.toFixed(2), 'amount')}
                        className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all text-xl"
                      >
                        {copiedField === 'amount' ? '✅' : '📋'}
                      </button>
                    </div>
                    {copiedField === 'amount' && <span className="text-[10px] font-black text-[#006837] uppercase mt-1 animate-pulse">¡Monto Copiado!</span>}
                  </div>
                </div>

                {/* USD Payment Method Selection */}
                {currency === 'USD' && (
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-500 uppercase ml-1 mb-2 block">¿Cómo vas a pagar?</label>
                    <div className="grid grid-cols-3 gap-3">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setUsdMethod('EFECTIVO'); setPreview(null); setCashBillAmount(null); }}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-4 transition-all ${usdMethod === 'EFECTIVO' ? 'border-[#006837] bg-green-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                      >
                        <span className="text-3xl">💵</span>
                        <span className="font-black text-[#006837] uppercase text-xs">Efectivo</span>
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setUsdMethod('ZELLE'); setPreview(null); setTitularName(''); }}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-4 transition-all ${usdMethod === 'ZELLE' ? 'border-[#006837] bg-green-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                      >
                        <img src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/payment_methods/zelle_logo.png" alt="Zelle" className="h-10 w-auto object-contain" />
                        <span className="font-black text-[#006837] uppercase text-xs">Zelle</span>
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setUsdMethod('PAYPAL'); setPreview(null); setTitularName(''); }}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-4 transition-all ${usdMethod === 'PAYPAL' ? 'border-[#006837] bg-green-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                      >
                        <img src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/payment_methods/paypal_logo.png" alt="PayPal" className="h-10 w-auto object-contain" />
                        <span className="font-black text-[#006837] uppercase text-xs">PayPal</span>
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setUsdMethod('BINANCE'); setPreview(null); setTitularName(''); }}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-4 transition-all ${usdMethod === 'BINANCE' ? 'border-[#006837] bg-green-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                      >
                        <img src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/payment_methods/binance_logo.png" alt="Binance" className="h-10 w-auto object-contain" />
                        <span className="font-black text-[#006837] uppercase text-xs">Binance</span>
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setUsdMethod('BANESCO'); setPreview(null); setTitularName(''); }}
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-4 transition-all ${usdMethod === 'BANESCO' ? 'border-[#006837] bg-green-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                      >
                        <img src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/payment_methods/banescopanama_logo.png" alt="Banesco Panamá" className="h-10 w-auto object-contain" />
                        <span className="font-black text-[#006837] uppercase text-xs">Banesco</span>
                      </motion.button>
                    </div>

                    {/* EFECTIVO: Monto de pago */}
                    {usdMethod === 'EFECTIVO' && (() => {
                      // totalUSD already includes itemsTotal + deliveryPrice (see line 118)
                      const minPayment = Math.ceil(totalUSD); // Mínimo redondeado hacia arriba
                      return (
                        <div className="mt-4 p-4 bg-green-50 rounded-xl border-2 border-[#006837]/20 space-y-4">
                          {/* Input de monto */}
                          <div>
                            <label className="text-[10px] font-black text-[#006837] uppercase ml-1 flex items-center gap-1">
                              💵 ¿Con cuánto pagarás? <span className="text-red-500">*</span>
                            </label>
                            <p className="text-[10px] text-gray-500 mb-2 ml-1">
                              Tu pedido es <span className="font-bold text-[#006837]">${totalUSD.toFixed(2)}</span> — ingresa un monto igual o mayor
                            </p>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-[#006837]">$</span>
                              <input
                                type="number"
                                min={minPayment}
                                step="1"
                                value={cashBillAmount || ''}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || null;
                                  setCashBillAmount(val);
                                }}
                                placeholder={`Mínimo $${minPayment}`}
                                className="w-full bg-white border-2 border-gray-200 rounded-xl p-3 pl-10 font-black text-2xl text-[#006837] focus:border-[#006837] outline-none text-center"
                              />
                            </div>
                            {/* Quick amount buttons */}
                            <div className="flex gap-2 mt-2">
                              {[minPayment, 10, 20, 50, 100].filter((v, i, a) => a.indexOf(v) === i && v >= minPayment).slice(0, 4).map(amount => (
                                <button
                                  key={amount}
                                  onClick={() => setCashBillAmount(amount)}
                                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${cashBillAmount === amount
                                    ? 'bg-[#006837] text-white'
                                    : 'bg-white border border-gray-200 text-[#006837] hover:border-[#006837]'
                                    }`}
                                >
                                  ${amount}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Mostrar vuelto si aplica */}
                          {cashBillAmount && cashBillAmount >= totalUSD && (
                            <div className={`p-3 rounded-xl ${cashBillAmount > totalUSD ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-green-100 border-2 border-[#006837]'}`}>
                              {cashBillAmount > totalUSD ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">💰</span>
                                  <div>
                                    <p className="font-black text-yellow-800">Se requiere vuelto</p>
                                    <p className="text-sm font-bold text-yellow-700">
                                      Vuelto a entregar: ${(cashBillAmount - totalUSD).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">✅</span>
                                  <p className="font-black text-[#006837]">Monto exacto - Sin vuelto</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Warning if amount too low */}
                          {cashBillAmount && cashBillAmount < totalUSD && (
                            <div className="p-3 rounded-xl bg-red-100 border-2 border-red-400">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">⚠️</span>
                                <p className="font-black text-red-700">El monto debe ser mayor o igual a ${totalUSD.toFixed(2)}</p>
                              </div>
                            </div>
                          )}

                          {/* Foto del billete */}
                          <div>
                            <label className="text-[10px] font-black text-[#006837] uppercase ml-1 flex items-center gap-1">
                              📸 Foto del Billete <span className="text-red-500">*</span>
                            </label>
                            <p className="text-[10px] text-gray-500 mb-2 ml-1">Sube una foto clara del billete para verificación</p>
                            <div className="relative border-4 border-dashed border-[#006837]/30 rounded-xl p-4 text-center hover:bg-white transition-colors">
                              {preview ? (
                                <div className="relative h-32">
                                  <img src={preview} className="h-full mx-auto rounded-lg shadow-sm" />
                                  <button onClick={() => setPreview(null)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full shadow-md"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg></button>
                                </div>
                              ) : (
                                <label className="cursor-pointer block py-4">
                                  <span className="text-[#006837] text-sm font-bold uppercase">📷 Toca para subir foto</span>
                                  <input type="file" className="hidden" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleFileChange} />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    {/* ZELLE: Captura + Email */}
                    <AnimatePresence mode="wait">
                      {usdMethod === 'ZELLE' && (
                        <motion.div
                          key="zelle-section"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="mt-6 p-5 bg-blue-50 rounded-2xl border-2 border-blue-200"
                        >
                          <div className="space-y-5">
                            {/* Account Info */}
                            <div className="bg-white p-4 rounded-xl border border-blue-200 space-y-3">
                              <div className="flex items-center justify-center gap-2 mb-3">
                                <img src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/payment_methods/zelle_logo.png" alt="Zelle" className="h-12 w-auto" />
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="font-bold text-gray-500">Titular:</span>
                                  <span className="font-black text-blue-700">{paymentMethods.zelle.titular}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="font-bold text-gray-500">Correo:</span>
                                  <span className="font-black text-blue-700">{paymentMethods.zelle.email}</span>
                                </div>
                                <button onClick={() => copyToClipboard(paymentMethods.zelle.email, 'zelle-email')} className="w-full mt-2 text-sm bg-blue-100 px-4 py-2.5 rounded-xl shadow-sm font-bold text-blue-700 hover:bg-blue-200 transition-colors">{copiedField === 'zelle-email' ? '✅ Copiado!' : '📋 Copiar Correo'}</button>
                              </div>
                              <div className="bg-yellow-50 p-3 rounded-lg border border-[#FFCC00]/50 mt-2">
                                <p className="text-xs text-yellow-800 font-bold text-center">⚠️ Enviar CAPTURE y nombre del TITULAR de la cuenta</p>
                                <p className="text-xs text-yellow-800 font-bold text-center">💵 MONTO MÍNIMO $5</p>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-black text-blue-700 uppercase ml-1 flex items-center gap-1 mb-2">
                                📸 Captura de Zelle <span className="text-red-500">*</span>
                              </label>
                              <div className="relative border-4 border-dashed border-blue-300 rounded-xl p-6 text-center hover:bg-white transition-colors">
                                {preview ? (
                                  <div className="relative h-40">
                                    <img src={preview} className="h-full mx-auto rounded-lg shadow-sm" />
                                    <button onClick={() => setPreview(null)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full shadow-md"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg></button>
                                  </div>
                                ) : (
                                  <label className="cursor-pointer block py-6">
                                    <span className="text-blue-600 text-base font-bold uppercase">📷 Toca para subir captura</span>
                                    <input type="file" className="hidden" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleFileChange} />
                                  </label>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-black text-blue-700 uppercase ml-1 flex items-center gap-1 mb-2">
                                👤 Nombre del titular de la cuenta <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={titularName}
                                onChange={e => setTitularName(e.target.value)}
                                className="w-full bg-white border-2 border-blue-200 rounded-xl p-4 font-bold text-blue-800 focus:border-blue-400 outline-none placeholder:text-blue-300"
                                placeholder="Ej: Juan Pérez"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* PAYPAL: Captura */}
                    <AnimatePresence mode="wait">
                      {usdMethod === 'PAYPAL' && (
                        <motion.div
                          key="paypal-section"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="mt-6 p-5 bg-indigo-50 rounded-2xl border-2 border-indigo-200"
                        >
                          <div className="space-y-5">
                            <div className="bg-white p-4 rounded-xl border border-indigo-200 space-y-3">
                              <div className="flex items-center justify-center gap-2 mb-3">
                                <img src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/payment_methods/paypal_logo.png" alt="PayPal" className="h-12 w-auto" />
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-gray-500">Correo:</span>
                                <span className="font-black text-indigo-700">{paymentMethods.paypal.email}</span>
                              </div>
                              <button onClick={() => copyToClipboard(paymentMethods.paypal.email, 'paypal-email')} className="w-full mt-2 text-sm bg-indigo-100 px-4 py-2.5 rounded-xl shadow-sm font-bold text-indigo-700 hover:bg-indigo-200 transition-colors">{copiedField === 'paypal-email' ? '✅ Copiado!' : '📋 Copiar Correo'}</button>
                              <div className="bg-yellow-50 p-3 rounded-lg border border-[#FFCC00]/50 mt-2">
                                <p className="text-xs text-yellow-800 font-bold text-center">⚠️ Enviar CAPTURE y nombre del TITULAR de la cuenta</p>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-black text-indigo-700 uppercase ml-1 flex items-center gap-1 mb-2">
                                📸 Captura de PayPal <span className="text-red-500">*</span>
                              </label>
                              <div className="relative border-4 border-dashed border-indigo-300 rounded-xl p-6 text-center hover:bg-white transition-colors">
                                {preview ? (
                                  <div className="relative h-40">
                                    <img src={preview} className="h-full mx-auto rounded-lg shadow-sm" />
                                    <button onClick={() => setPreview(null)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full shadow-md"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg></button>
                                  </div>
                                ) : (
                                  <label className="cursor-pointer block py-6">
                                    <span className="text-indigo-600 text-base font-bold uppercase">📷 Toca para subir captura</span>
                                    <input type="file" className="hidden" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleFileChange} />
                                  </label>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-black text-indigo-700 uppercase ml-1 flex items-center gap-1 mb-2">
                                👤 Nombre del titular de la cuenta <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={titularName}
                                onChange={e => setTitularName(e.target.value)}
                                className="w-full bg-white border-2 border-indigo-200 rounded-xl p-4 font-bold text-indigo-800 focus:border-indigo-400 outline-none placeholder:text-indigo-300"
                                placeholder="Ej: Juan Pérez"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* BINANCE: Captura */}
                    <AnimatePresence mode="wait">
                      {usdMethod === 'BINANCE' && (
                        <motion.div
                          key="binance-section"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="mt-6 p-5 bg-yellow-50 rounded-2xl border-2 border-yellow-300"
                        >
                          <div className="space-y-5">
                            <div className="bg-white p-4 rounded-xl border border-yellow-200 space-y-3">
                              <div className="flex items-center justify-center gap-2 mb-3">
                                <img src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/payment_methods/binance_logo.png" alt="Binance" className="h-12 w-auto" />
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-gray-500">Correo:</span>
                                <span className="font-black text-yellow-700">{paymentMethods.binance.email}</span>
                              </div>
                              <button onClick={() => copyToClipboard(paymentMethods.binance.email, 'binance-email')} className="w-full mt-2 text-sm bg-yellow-100 px-4 py-2.5 rounded-xl shadow-sm font-bold text-yellow-700 hover:bg-yellow-200 transition-colors">{copiedField === 'binance-email' ? '✅ Copiado!' : '📋 Copiar Correo'}</button>
                              <div className="bg-yellow-100 p-3 rounded-lg border border-yellow-300 mt-2">
                                <p className="text-xs text-yellow-800 font-bold text-center">⚠️ Enviar CAPTURE y nombre del TITULAR de la cuenta</p>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-black text-yellow-700 uppercase ml-1 flex items-center gap-1 mb-2">
                                📸 Captura de Binance <span className="text-red-500">*</span>
                              </label>
                              <div className="relative border-4 border-dashed border-yellow-300 rounded-xl p-6 text-center hover:bg-white transition-colors">
                                {preview ? (
                                  <div className="relative h-40">
                                    <img src={preview} className="h-full mx-auto rounded-lg shadow-sm" />
                                    <button onClick={() => setPreview(null)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full shadow-md"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg></button>
                                  </div>
                                ) : (
                                  <label className="cursor-pointer block py-6">
                                    <span className="text-yellow-700 text-base font-bold uppercase">📷 Toca para subir captura</span>
                                    <input type="file" className="hidden" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleFileChange} />
                                  </label>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-black text-yellow-700 uppercase ml-1 flex items-center gap-1 mb-2">
                                👤 Nombre del titular de la cuenta <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={titularName}
                                onChange={e => setTitularName(e.target.value)}
                                className="w-full bg-white border-2 border-yellow-200 rounded-xl p-4 font-bold text-yellow-800 focus:border-yellow-400 outline-none placeholder:text-yellow-300"
                                placeholder="Ej: Juan Pérez"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* BANESCO PANAMÁ: Captura */}
                    <AnimatePresence mode="wait">
                      {usdMethod === 'BANESCO' && (
                        <motion.div
                          key="banesco-section"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="mt-6 p-5 bg-teal-50 rounded-2xl border-2 border-teal-200"
                        >
                          <div className="space-y-5">
                            <div className="bg-white p-4 rounded-xl border border-teal-200 space-y-3">
                              <div className="flex items-center justify-center gap-2 mb-3">
                                <img src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/payment_methods/banescopanama_logo.png" alt="Banesco Panamá" className="h-12 w-auto" />
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="font-bold text-gray-500">Titular:</span>
                                  <span className="font-black text-teal-700">{paymentMethods.banesco.titular}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="font-bold text-gray-500">Tipo:</span>
                                  <span className="font-black text-teal-700">{paymentMethods.banesco.tipo}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="font-bold text-gray-500">Cuenta:</span>
                                  <span className="font-black text-teal-700">{paymentMethods.banesco.cuenta}</span>
                                </div>
                                <button onClick={() => copyToClipboard(paymentMethods.banesco.cuenta, 'banesco-cuenta')} className="w-full mt-2 text-sm bg-teal-100 px-4 py-2.5 rounded-xl shadow-sm font-bold text-teal-700 hover:bg-teal-200 transition-colors">{copiedField === 'banesco-cuenta' ? '✅ Copiado!' : '📋 Copiar Cuenta'}</button>
                              </div>
                              <div className="bg-yellow-50 p-3 rounded-lg border border-[#FFCC00]/50 mt-2">
                                <p className="text-xs text-yellow-800 font-bold text-center">⚠️ Enviar CAPTURE y nombre del TITULAR de la cuenta</p>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-black text-teal-700 uppercase ml-1 flex items-center gap-1 mb-2">
                                📸 Captura de transferencia <span className="text-red-500">*</span>
                              </label>
                              <div className="relative border-4 border-dashed border-teal-300 rounded-xl p-6 text-center hover:bg-white transition-colors">
                                {preview ? (
                                  <div className="relative h-40">
                                    <img src={preview} className="h-full mx-auto rounded-lg shadow-sm" />
                                    <button onClick={() => setPreview(null)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full shadow-md"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg></button>
                                  </div>
                                ) : (
                                  <label className="cursor-pointer block py-6">
                                    <span className="text-teal-700 text-base font-bold uppercase">📷 Toca para subir captura</span>
                                    <input type="file" className="hidden" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleFileChange} />
                                  </label>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-black text-teal-700 uppercase ml-1 flex items-center gap-1 mb-2">
                                👤 Nombre del titular de la cuenta <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={titularName}
                                onChange={e => setTitularName(e.target.value)}
                                className="w-full bg-white border-2 border-teal-200 rounded-xl p-4 font-bold text-teal-800 focus:border-teal-400 outline-none placeholder:text-teal-300"
                                placeholder="Ej: Juan Pérez"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {currency === 'BS' && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm space-y-3">
                    <div className="text-center mb-2">
                      <span className="text-2xl">📱</span>
                      <h4 className="font-black text-[#006837] uppercase text-sm">Pago Móvil</h4>
                    </div>
                    <div className="flex justify-between items-center"><span className="font-bold text-gray-500">Banco:</span> <span className="font-black text-[#006837]">{pagoMovil.bank_name} ({pagoMovil.bank_code})</span> <button onClick={() => copyToClipboard(pagoMovil.bank_code, 'b')} className="text-xs bg-white px-2 py-1 rounded shadow-sm">{copiedField === 'b' ? '✅' : '📋'}</button></div>
                    <div className="flex justify-between items-center"><span className="font-bold text-gray-500">Cédula:</span> <span className="font-black text-[#006837]">V-{pagoMovil.cedula.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3')}</span> <button onClick={() => copyToClipboard(pagoMovil.cedula, 'c')} className="text-xs bg-white px-2 py-1 rounded shadow-sm">{copiedField === 'c' ? '✅' : '📋'}</button></div>
                    <div className="flex justify-between items-center"><span className="font-bold text-gray-500">Teléfono:</span> <span className="font-black text-[#006837]">{pagoMovil.phone.replace(/(\d{4})(\d{7})/, '$1-$2')}</span> <button onClick={() => copyToClipboard(pagoMovil.phone, 't')} className="text-xs bg-white px-2 py-1 rounded shadow-sm">{copiedField === 't' ? '✅' : '📋'}</button></div>
                    <div className="bg-yellow-50 p-3 rounded-lg border-2 border-[#FFCC00]/50 mt-2">
                      <p className="text-xs text-yellow-800 font-bold text-center">⚠️ Por favor enviar CAPTURE donde la REFERENCIA sea LEGIBLE</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`📱 Pago Móvil\nBanco: ${pagoMovil.bank_name} (${pagoMovil.bank_code})\nCédula: V-${pagoMovil.cedula}\nTeléfono: ${pagoMovil.phone}\nMonto: ${totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs`, 'all')}
                      className="w-full mt-3 py-3 bg-[#006837] text-white font-black uppercase text-sm rounded-xl shadow-md hover:bg-[#004d29] active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      {copiedField === 'all' ? '✅ ¡Copiado!' : '📋 Copiar Todo'}
                    </button>
                  </div>
                )}

                {/* Reference field - only for BS payments */}
                {currency === 'BS' && (
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Referencia</label>
                    <div className="relative">
                      <input
                        value={reference}
                        onChange={e => setReference(e.target.value)}
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-4 pr-20 font-black text-xl text-[#006837] focus:border-[#FFCC00] outline-none tracking-widest placeholder:text-gray-300 placeholder:font-bold"
                        placeholder="123456"
                      />
                      <button
                        onClick={async () => {
                          if (navigator.clipboard && navigator.clipboard.readText) {
                            try {
                              const text = await navigator.clipboard.readText();
                              if (text) setReference(text);
                            } catch (e) {
                              const input = document.querySelector('input[placeholder="123456"]') as HTMLInputElement;
                              input?.focus();
                            }
                          } else {
                            (document.querySelector('input[placeholder="123456"]') as HTMLInputElement)?.focus();
                          }
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg px-3 py-1 font-bold text-[10px] uppercase shadow-sm active:scale-95 transition-all"
                        title="Pegar"
                      >
                        Pegar
                      </button>
                    </div>
                  </div>
                )}

                {/* Comprobante for BS only */}
                {currency === 'BS' && (
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 flex items-center gap-1">Comprobante del Pago <span className="text-red-500">*</span></label>
                    <div className="relative border-4 border-dashed border-gray-100 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors">
                      {preview ? (
                        <div className="relative h-24">
                          <img src={preview} className="h-full mx-auto rounded-lg shadow-sm" />
                          <button onClick={() => setPreview(null)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full shadow-md"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg></button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <span className="text-gray-400 text-xs font-bold uppercase">Toca para subir foto</span>
                          <input type="file" className="hidden" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleFileChange} />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                disabled={currency === 'USD' ? !isUsdValid() || isSaving : reference.length < 4 || preview === null || isSaving}
                onClick={handleFinalConfirm}
                className={`w-full py-4 rounded-2xl font-black uppercase shadow-xl transition-all ${((currency === 'USD' ? isUsdValid() : (reference.length >= 4 && preview !== null)) && !isSaving) ? 'bg-[#FFCC00] text-[#006837]' : 'bg-gray-200 text-gray-400'}`}
              >
                {isSaving ? 'Enviando...' : 'Enviar Pedido'}
              </button>
              <button onClick={prevStep} className="w-full text-center text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-[#006837]">Volver</button>
            </div>
          );
        }

        // MIXED PAYMENT FLOW
        if (currency === 'MIXED') {
          const remainingUsd = mixedUsdAmount ? Math.max(0, totalUSD - mixedUsdAmount) : totalUSD;
          const remainingBs = remainingUsd * exchangeRate;

          const isMixedValid = () => {
            if (!usdMethod || mixedUsdAmount === null || mixedUsdAmount <= 0) return false;
            if (mixedUsdAmount > totalUSD) return false;
            if (!mixedUsdProof) return false;
            if (usdMethod !== 'EFECTIVO' && !titularName.trim()) return false;
            // If there's a remaining amount, need BS payment
            if (remainingUsd > 0.01) {
              if (!mixedBsProof || reference.length < 4) return false;
            }
            return true;
          };

          const handleMixedFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'usd' | 'bs') => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              if (type === 'usd') {
                setMixedUsdProof(ev.target?.result as string);
              } else {
                setMixedBsProof(ev.target?.result as string);
              }
            };
            reader.readAsDataURL(file);
          };

          return (
            <div className="space-y-6">
              <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 space-y-4">
                <div className="text-center mb-4">
                  <span className="text-4xl">⚖️</span>
                  <h3 className="text-xl font-black text-[#006837] uppercase mt-2">Pago Mixto</h3>
                  <p className="text-gray-500 text-sm mt-1">Paga una parte en USD y el resto en Bolívares</p>
                  <div className="mt-3 px-4 py-2 bg-yellow-50 rounded-xl border border-[#FFCC00] inline-block">
                    <span className="text-xs text-gray-500 uppercase font-bold">Total: </span>
                    <span className="text-lg font-black text-[#006837]">${totalUSD.toFixed(2)}</span>
                  </div>
                </div>

                {/* STEP 1: USD Payment Method */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">1. Pago en USD</h4>

                  {/* Method Selection */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => { setUsdMethod('EFECTIVO'); setMixedUsdProof(null); setTitularName(''); }}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-4 transition-all ${usdMethod === 'EFECTIVO' ? 'border-[#006837] bg-green-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                      <span className="text-3xl">💵</span>
                      <span className="font-black text-[#006837] uppercase text-xs">Efectivo</span>
                    </button>
                    <button
                      onClick={() => { setUsdMethod('ZELLE'); setMixedUsdProof(null); setTitularName(''); }}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-4 transition-all ${usdMethod === 'ZELLE' ? 'border-[#006837] bg-green-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                      <img src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/payment_methods/zelle_logo.png" alt="Zelle" className="h-10 w-auto object-contain" />
                      <span className="font-black text-[#006837] uppercase text-xs">Zelle</span>
                    </button>
                    <button
                      onClick={() => { setUsdMethod('PAYPAL'); setMixedUsdProof(null); setTitularName(''); }}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-4 transition-all ${usdMethod === 'PAYPAL' ? 'border-[#006837] bg-green-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                      <img src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/payment_methods/paypal_logo.png" alt="PayPal" className="h-10 w-auto object-contain" />
                      <span className="font-black text-[#006837] uppercase text-xs">PayPal</span>
                    </button>
                    <button
                      onClick={() => { setUsdMethod('BINANCE'); setMixedUsdProof(null); setTitularName(''); }}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-4 transition-all ${usdMethod === 'BINANCE' ? 'border-[#006837] bg-green-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                      <img src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/payment_methods/binance_logo.png" alt="Binance" className="h-10 w-auto object-contain" />
                      <span className="font-black text-[#006837] uppercase text-xs">Binance</span>
                    </button>
                    <button
                      onClick={() => { setUsdMethod('BANESCO'); setMixedUsdProof(null); setTitularName(''); }}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-4 transition-all ${usdMethod === 'BANESCO' ? 'border-[#006837] bg-green-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                      <img src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/payment_methods/banescopanama_logo.png" alt="Banesco" className="h-10 w-auto object-contain" />
                      <span className="font-black text-[#006837] uppercase text-xs">Banesco</span>
                    </button>
                  </div>

                  {usdMethod && (
                    <div className="space-y-3 p-4 bg-green-50 rounded-xl border border-green-200">
                      {/* Amount Input */}
                      <div>
                        <label className="text-xs font-black text-[#006837] uppercase mb-2 block">
                          {usdMethod === 'EFECTIVO' ? '¿Cuántos $ en efectivo?' : 'Monto en USD'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-[#006837]">$</span>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            value={mixedUsdAmount || ''}
                            onChange={(e) => setMixedUsdAmount(parseInt(e.target.value) || null)}
                            placeholder="Ej: 15, 25, 100..."
                            className="w-full bg-white border-2 border-gray-200 rounded-xl p-3 pl-10 font-bold text-xl text-[#006837] focus:border-[#006837] outline-none"
                          />
                        </div>
                        {usdMethod === 'EFECTIVO' && (
                          <p className="text-xs text-gray-500 mt-1">Suma todos tus billetes (Ej: $10 + $5 = $15)</p>
                        )}
                      </div>

                      {/* Titular Name (for digital methods) */}
                      {usdMethod !== 'EFECTIVO' && (
                        <div>
                          <label className="text-xs font-black text-[#006837] uppercase mb-1 block">Nombre del Titular</label>
                          <input
                            type="text"
                            value={titularName}
                            onChange={(e) => setTitularName(e.target.value)}
                            placeholder="Ej: Juan Pérez"
                            className="w-full bg-white border-2 border-gray-200 rounded-xl p-3 font-bold text-[#006837] focus:border-[#006837] outline-none"
                          />
                        </div>
                      )}

                      {/* USD Proof Upload */}
                      <div>
                        <label className="text-xs font-black text-[#006837] uppercase mb-1 block">
                          {usdMethod === 'EFECTIVO' ? '📸 Foto del Billete' : '📸 Captura del Pago'}
                        </label>
                        <div className="relative border-2 border-dashed border-[#006837]/30 rounded-xl p-4 text-center hover:bg-white transition-colors">
                          {mixedUsdProof ? (
                            <div className="relative h-24">
                              <img src={mixedUsdProof} className="h-full mx-auto rounded-lg shadow-sm" />
                              <button onClick={() => setMixedUsdProof(null)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full">✕</button>
                            </div>
                          ) : (
                            <label className="cursor-pointer block py-2">
                              <span className="text-[#006837] text-sm font-bold uppercase">📷 Subir foto</span>
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMixedFileChange(e, 'usd')} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 2: BS Payment (if remaining > 0) */}
                {mixedUsdAmount && mixedUsdAmount < totalUSD && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">2. Restante en Bolívares</h4>

                    <div className="p-4 bg-yellow-50 rounded-xl border-2 border-[#FFCC00]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold text-gray-600">Restante USD:</span>
                        <span className="text-lg font-black text-[#006837]">${remainingUsd.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-600">A pagar en Bs:</span>
                        <span className="text-2xl font-black text-[#006837]">{remainingBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</span>
                      </div>
                    </div>

                    {/* Pago Movil Info */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm space-y-2">
                      <div className="text-center mb-2">
                        <span className="text-2xl">📱</span>
                        <h4 className="font-black text-[#006837] uppercase text-sm">Pago Móvil</h4>
                      </div>
                      <div className="flex justify-between items-center"><span className="font-bold text-gray-500">Banco:</span> <span className="font-black text-[#006837]">{pagoMovil.bank_name} ({pagoMovil.bank_code})</span> <button onClick={() => copyToClipboard(pagoMovil.bank_code, 'mb')} className="text-xs bg-white px-2 py-1 rounded shadow-sm">{copiedField === 'mb' ? '✅' : '📋'}</button></div>
                      <div className="flex justify-between items-center"><span className="font-bold text-gray-500">Cédula:</span> <span className="font-black text-[#006837]">V-{pagoMovil.cedula}</span> <button onClick={() => copyToClipboard(pagoMovil.cedula, 'mc')} className="text-xs bg-white px-2 py-1 rounded shadow-sm">{copiedField === 'mc' ? '✅' : '📋'}</button></div>
                      <div className="flex justify-between items-center"><span className="font-bold text-gray-500">Teléfono:</span> <span className="font-black text-[#006837]">{pagoMovil.phone}</span> <button onClick={() => copyToClipboard(pagoMovil.phone, 'mt')} className="text-xs bg-white px-2 py-1 rounded shadow-sm">{copiedField === 'mt' ? '✅' : '📋'}</button></div>
                      <button
                        onClick={() => copyToClipboard(`Pago Móvil\nBanco: ${pagoMovil.bank_code}\nCédula: ${pagoMovil.cedula}\nTeléfono: ${pagoMovil.phone}\nMonto: ${remainingBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs`, 'mall')}
                        className="w-full mt-2 bg-[#006837] text-white py-2.5 rounded-xl font-black text-xs uppercase hover:bg-[#00522b] transition-colors"
                      >
                        {copiedField === 'mall' ? '✅ ¡Copiado!' : '📋 Copiar Todo'}
                      </button>
                    </div>

                    {/* Reference */}
                    <div>
                      <label className="text-xs font-black text-gray-400 uppercase mb-1 block">Referencia</label>
                      <input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Últimos 6 dígitos"
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl p-3 font-black text-lg text-[#006837] focus:border-[#FFCC00] outline-none"
                      />
                    </div>

                    {/* BS Proof Upload */}
                    <div>
                      <label className="text-xs font-black text-gray-400 uppercase mb-1 block">📸 Captura Pago Móvil</label>
                      <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors">
                        {mixedBsProof ? (
                          <div className="relative h-24">
                            <img src={mixedBsProof} className="h-full mx-auto rounded-lg shadow-sm" />
                            <button onClick={() => setMixedBsProof(null)} className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full">✕</button>
                          </div>
                        ) : (
                          <label className="cursor-pointer block py-2">
                            <span className="text-gray-400 text-sm font-bold uppercase">📷 Subir captura</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleMixedFileChange(e, 'bs')} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* If paying exact or more in USD */}
                {mixedUsdAmount && mixedUsdAmount >= totalUSD && (
                  <div className="p-4 bg-green-100 rounded-xl border-2 border-green-400">
                    <p className="text-center font-black text-green-700">
                      ✅ {mixedUsdAmount > totalUSD ? `Vuelto: $${(mixedUsdAmount - totalUSD).toFixed(2)}` : 'Monto exacto - Sin vuelto'}
                    </p>
                  </div>
                )}
              </div>

              <button
                disabled={!isMixedValid() || isSaving}
                onClick={handleFinalConfirm}
                className={`w-full py-4 rounded-2xl font-black uppercase shadow-xl transition-all ${(isMixedValid() && !isSaving) ? 'bg-[#FFCC00] text-[#006837]' : 'bg-gray-200 text-gray-400'}`}
              >
                {isSaving ? 'Enviando...' : 'Enviar Pedido'}
              </button>
              <button onClick={prevStep} className="w-full text-center text-[10px] font-black uppercase text-gray-400 tracking-widest hover:text-[#006837]">Volver</button>
            </div>
          );
        }
        return null;

      case 6: // FIN
        const whatsappMessage = confirmedOrder
          ? `Hola! Acabo de hacer un pedido en Subday 🥖\nOrden #${confirmedOrder.short_id}\nNombre: ${confirmedOrder.customer_name}\nTotal: $${confirmedOrder.total_amount?.toFixed(2)}\n\n¡Quedo atento a la confirmación!`
          : `Hola! Acabo de hacer un pedido en Subday 🥖\nNombre: ${customerData.firstName} ${customerData.lastName}\n\n¡Quedo atento a la confirmación!`;

        // Build WhatsApp number: use business number or fallback to pago_movil phone
        let waNumber = businessWhatsApp.replace(/\D/g, '');
        if (waNumber && !waNumber.startsWith('58')) waNumber = '58' + waNumber;

        const whatsappUrl = waNumber
          ? `https://wa.me/${waNumber}?text=${encodeURIComponent(whatsappMessage)}`
          : '';

        return (
          <div className="text-center pt-10 space-y-6">
            <div className="w-24 h-24 bg-[#FFCC00] rounded-full flex items-center justify-center mx-auto shadow-xl border-4 border-white animate-bounce">
              <svg className="w-12 h-12 text-[#006837]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-[#006837] font-brand uppercase tracking-tighter">¡Pedido Enviado!</h2>
              {confirmedOrder && (
                <p className="text-lg font-black text-[#006837]/80 mt-1">Orden #{confirmedOrder.short_id}</p>
              )}
              <p className="text-gray-500 font-medium mt-2">Gracias {customerData.firstName}, estamos procesando tu orden.</p>
            </div>

            {/* WhatsApp Confirmation Button */}
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black uppercase rounded-2xl shadow-xl transition-all active:scale-95 text-lg"
              >
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Confirmar por WhatsApp
              </a>
            ) : (
              <div className="bg-green-50 border-2 border-[#006837]/20 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-4xl">📱</span>
                <div className="text-left">
                  <p className="text-[#006837] font-black text-lg">¡Pronto serás contactado!</p>
                  <p className="text-gray-600 font-bold text-sm">Te escribiremos por WhatsApp para confirmar tu pedido</p>
                </div>
              </div>
            )}

            <button onClick={onBack} className="w-full bg-[#006837] text-white px-8 py-3 rounded-xl font-black uppercase shadow-lg hover:bg-[#00522b] transition-colors">Volver al Inicio</button>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#006837] text-white pt-8 pb-6 px-6 rounded-b-[2.5rem] shadow-xl flex-shrink-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button onClick={prevStep} className={`p-2 bg-white/10 rounded-xl ${step === 6 ? 'invisible' : ''}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg></button>
          <h2 className="font-black font-brand uppercase tracking-tighter text-xl">Checkout</h2>
          <div className="w-8 h-8 flex items-center justify-center bg-[#FFCC00] text-[#006837] font-black rounded-lg text-xs">{step}/6</div>
        </div>
      </div>

      <div className="flex-grow p-6">
        <div className="max-w-md mx-auto relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Welcome Back Modal */}
      <AnimatePresence>
        {showWelcomeBack && savedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-[#FFCC00] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl">👋</span>
              </div>
              <h3 className="text-2xl font-black text-[#006837] mb-2 font-brand uppercase tracking-tighter">
                ¡Hola de nuevo!
              </h3>
              <p className="text-gray-600 mb-6">
                ¿Eres <span className="font-black text-[#006837]">{savedCustomer.firstName} {savedCustomer.lastName}</span>?
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleConfirmSavedCustomer}
                  className="w-full bg-[#006837] text-white py-4 rounded-2xl font-black uppercase shadow-lg hover:bg-[#00522b] transition-colors"
                >
                  ¡Sí, soy yo! 🎉
                </button>
                <button
                  onClick={handleRejectSavedCustomer}
                  className="w-full bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  No, soy otra persona
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
