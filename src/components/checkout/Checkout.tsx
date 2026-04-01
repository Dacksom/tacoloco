import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, CustomerData } from '../../types';
import { loadGoogleMaps } from '../../services/googleMaps';
import { ChevronLeft } from 'lucide-react';

interface CheckoutProps {
  items: CartItem[];
  onBack: () => void;
  onSuccess: () => void;
  totalCart: number;
}

const RESTAURANT_LOCATION = { lat: 10.722921670369779, lng: -71.63266214541582 };

// Mocks de Pago para TacoLoco
const PAGO_MOVIL = { bank: 'Mercantil (0105)', phone: '0414-1234567', id: '12.345.678' };
const ZELLE_EMAIL = 'pagos@tacolocomcbo.com';
const WHATSAPP_NUMBER = '584000000000';
const EXCHANGE_RATE = 55.4; // Tasa Bs/$ ficticia

export default function Checkout({ items, onBack, onSuccess, totalCart }: CheckoutProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // States: Customer
  const [customer, setCustomer] = useState<CustomerData>({
    firstName: '',
    lastName: '',
    cedula: '',
    email: '',
    countryCode: '+58',
    phone: '',
    address: ''
  });

  // States: Config delivery
  const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'PICKUP' | null>(null);
  const [deliveryPrice, setDeliveryPrice] = useState(0);

  // States: Map & Autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  // States: Payment
  const [currency, setCurrency] = useState<'USD' | 'BS' | 'MIXED'>('USD');
  const [usdMethod, setUsdMethod] = useState<'EFECTIVO' | 'ZELLE' | 'BINANCE' | 'PAYPAL' | null>(null);
  const [mixedStep, setMixedStep] = useState(1);
  const [mixedUsdAmount, setMixedUsdAmount] = useState<number | null>(null);
  
  // States: Form Payment details
  const [titularName, setTitularName] = useState('');
  const [reference, setReference] = useState('');
  const [cashBillAmount, setCashBillAmount] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Map & Google API Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const geocoder = useRef<any>(null);

  // Totals calculations
  const totalUSD = totalCart + deliveryPrice;
  const totalBS = totalUSD * EXCHANGE_RATE;

  // Mixed Payment calculations
  const mixedBsRemaining = mixedUsdAmount ? ((totalUSD - mixedUsdAmount) * EXCHANGE_RATE) : 0;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Init Map if step 3 (Map)
  useEffect(() => {
    if (step === 3 && deliveryMethod === 'DELIVERY') {
      loadGoogleMaps().then(() => {
        setTimeout(() => {
          if (mapContainerRef.current && window.google) {
            // Inicializar map con estilo normal (blanco), NO oscurecido.
            const map = new window.google.maps.Map(mapContainerRef.current, {
              center: RESTAURANT_LOCATION,
              zoom: 14,
              mapTypeControl: false,
              streetViewControl: false,
              // Sin array de styles, para default mode (como Subday)
            });
            mapInstanceRef.current = map;

            // Instanciar servicios de Places y Geocoder
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
            placesService.current = new window.google.maps.places.PlacesService(map);
            geocoder.current = new window.google.maps.Geocoder();

            // Restaurant Marker
            new window.google.maps.Marker({
              position: RESTAURANT_LOCATION,
              map,
              label: { text: '🌮', fontSize: '24px' }
            });

            // Delivery Marker
            const destMarker = new window.google.maps.Marker({
              position: RESTAURANT_LOCATION,
              map,
              draggable: true,
              label: { text: '📍', fontSize: '24px' }
            });
            markerRef.current = destMarker;

            // Dragend event
            destMarker.addListener('dragend', () => {
              const pos = destMarker.getPosition();
              if (pos) {
                setCustomer(prev => ({ ...prev, location: { lat: pos.lat(), lng: pos.lng() } }));
                setDeliveryPrice(3.50); // Fijo por ahora
              }
            });

            // Map click event
            map.addListener('click', (e: any) => {
              destMarker.setPosition(e.latLng);
              setCustomer(prev => ({ ...prev, location: { lat: e.latLng.lat(), lng: e.latLng.lng() } }));
              setDeliveryPrice(3.50);
            });
          }
        }, 300);
      }).catch(console.error);
    }
  }, [step, deliveryMethod]);

  // Autocomplete suggestions effect
  useEffect(() => {
    if (!searchQuery || !autocompleteService.current) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      autocompleteService.current.getPlacePredictions({
        input: searchQuery,
        componentRestrictions: { country: 'VE' }, // Limitar a Venezuela
        locationBias: {
          radius: 20000, // 20km
          center: RESTAURANT_LOCATION
        }
      }, (predictions: any, status: any) => {
        setIsSearching(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
        } else {
          setSuggestions([]);
        }
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (prediction: any) => {
    setSearchQuery(prediction.structured_formatting.main_text);
    setShowSuggestions(false);
    
    if (geocoder.current && mapInstanceRef.current && markerRef.current) {
      geocoder.current.geocode({ placeId: prediction.place_id }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          mapInstanceRef.current.panTo(location);
          mapInstanceRef.current.setZoom(16);
          markerRef.current.setPosition(location);
          
          setCustomer(prev => ({
            ...prev,
            address: results[0].formatted_address,
            location: { lat: location.lat(), lng: location.lng() }
          }));
          setDeliveryPrice(3.50);
        }
      });
    }
  };

  const handleLocateMe = () => {
    setLocationDenied(false);
    if (navigator.geolocation && mapInstanceRef.current && markerRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          mapInstanceRef.current.panTo(pos);
          mapInstanceRef.current.setZoom(16);
          markerRef.current.setPosition(pos);
          
          setCustomer(prev => ({ ...prev, location: pos }));
          setDeliveryPrice(3.50);
        },
        () => {
          setLocationDenied(true);
        }
      );
    } else {
      setLocationDenied(true);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const navigate = (newStep: number) => {
    setDirection(newStep > step ? 1 : -1);
    setStep(newStep);
  };

  const prevStep = () => {
    if (step === 1) {
      onBack();
    } else if (step === 4 && deliveryMethod === 'PICKUP') {
      navigate(2);
    } else {
      navigate(step - 1);
    }
  };

  const handleConfirmOrder = () => {
    let msg = `🔥 *NUEVO PEDIDO - TACO LOCO* 🔥\n\n`;
    msg += `👤 *Cliente:* ${customer.firstName} ${customer.lastName}\n`;
    msg += `📞 *Tel:* ${customer.countryCode} ${customer.phone}\n`;
    msg += `🚚 *Método:* ${deliveryMethod === 'PICKUP' ? 'Retiro en Sambil' : 'Delivery'}\n`;
    if (deliveryMethod === 'DELIVERY') {
      msg += `📍 *Dirección:* ${customer.address}\n`;
      if (customer.location) {
        msg += `🗺️ *Mapa:* https://maps.google.com/?q=${customer.location.lat},${customer.location.lng}\n`;
      }
    }
    msg += `\n🛒 *ORDEN:*\n`;
    items.forEach(i => { msg += `- ${i.quantity}x ${i.name} ($${(i.quantity * i.price).toFixed(2)})\n`; });
    msg += `\n💵 *Subtotal:* $${totalCart.toFixed(2)}\n`;
    if (deliveryPrice > 0) msg += `🛵 *Delivery:* $${deliveryPrice.toFixed(2)}\n`;
    msg += `💰 *TOTAL A PAGAR: $${totalUSD.toFixed(2)} / Bs.${totalBS.toFixed(2)}*\n\n`;
    
    // Payment specific details
    msg += `💳 *PAGO:* ${currency === 'MIXED' ? 'Mixto (USD + Bs)' : (currency === 'USD' ? usdMethod : 'Pago Movil')}\n`;
    if (currency === 'BS' || usdMethod === 'ZELLE' || currency === 'MIXED') {
      msg += `🧾 *Referencia:* ${reference}\n`;
    }
    if (usdMethod === 'EFECTIVO') {
       msg += `💵 *Billete de:* $${cashBillAmount || 0}\n`;
    }

    if (preview) {
       msg += `📸 *(El cliente adjuntará comprobante en imagen en breve)*`;
    }

    window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(msg)}`, '_blank');
    onSuccess();
  };

  const isCustomerValid = () => {
    return customer.firstName.length > 2 && customer.phone.length >= 10;
  };

  const isLocationValid = () => {
    return customer.location !== undefined && customer.address.length > 4;
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '50%' : '-50%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? '50%' : '-50%', opacity: 0 })
  };

  // ----- RENDERIZADO DE PASOS -----
  const renderStepContent = () => {
    // 1. TUS DATOS
    if (step === 1) {
      return (
        <div className="space-y-6">
          <div className="bg-[#111] border border-yellow/20 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-8 bg-yellow rounded-full"></div>
              <h2 className="font-display text-3xl text-yellow tracking-[1px] m-0 leading-none">TUS DATOS LOCOS</h2>
            </div>
            <div className="space-y-4 font-body">
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] font-black text-white/50 uppercase ml-1 block mb-1">Nombre</label>
                   <input className="w-full bg-[#1A1A1A] text-white p-3 rounded-xl border border-white/5 focus:border-yellow outline-none font-bold" placeholder="Tu nombre" 
                     value={customer.firstName} onChange={e => setCustomer({...customer, firstName: e.target.value})} />
                </div>
                <div>
                   <label className="text-[10px] font-black text-white/50 uppercase ml-1 block mb-1">Apellido</label>
                   <input className="w-full bg-[#1A1A1A] text-white p-3 rounded-xl border border-white/5 focus:border-yellow outline-none font-bold" placeholder="Tu apellido" 
                     value={customer.lastName} onChange={e => setCustomer({...customer, lastName: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-white/50 uppercase ml-1 block mb-1">Cédula de Identidad</label>
                <input className="w-full bg-[#1A1A1A] text-white p-3 rounded-xl border border-white/5 focus:border-yellow outline-none font-bold" placeholder="12345678" 
                  value={customer.cedula} onChange={e => setCustomer({...customer, cedula: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-black text-white/50 uppercase ml-1 block mb-1">Teléfono</label>
                <div className="flex gap-2">
                  <select className="bg-[#1A1A1A] border border-white/5 rounded-xl px-2 text-white font-bold outline-none h-[50px] focus:border-yellow"
                    value={customer.countryCode} onChange={e => setCustomer({...customer, countryCode: e.target.value})}>
                    <option value="+58">🇻🇪 +58</option>
                    <option value="+1">🇺🇸 +1</option>
                  </select>
                  <input className="flex-1 min-w-0 bg-[#1A1A1A] text-white p-3 rounded-xl border border-white/5 focus:border-yellow outline-none font-bold" placeholder="4121234567" 
                    value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-white/50 uppercase ml-1 block mb-1">Correo (Opcional)</label>
                <input className="w-full bg-[#1A1A1A] text-white p-3 rounded-xl border border-white/5 focus:border-yellow outline-none font-bold" placeholder="tucorreo@ejemplo.com" type="email"
                  value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} />
              </div>
            </div>
          </div>
          <button 
            disabled={!isCustomerValid()}
            onClick={() => navigate(2)} 
            className="w-full btn-primary py-4 font-heading font-black text-2xl uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            Siguiente
          </button>
        </div>
      );
    }
    
    // 2. MÉTODO DE ENTREGA
    if (step === 2) {
      return (
        <div className="space-y-6">
          <div className="bg-[#111] border border-yellow/20 p-6 rounded-2xl">
             <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-yellow rounded-full"></div>
                <h2 className="font-display text-3xl text-yellow tracking-[1px] m-0 leading-none">¿CÓMO TE LO LLEVAMOS?</h2>
             </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setDeliveryMethod('DELIVERY')} className={`p-6 border-4 rounded-3xl flex flex-col items-center gap-3 transition-all ${deliveryMethod === 'DELIVERY' ? 'border-yellow bg-yellow/10 scale-105 shadow-xl shadow-yellow/10' : 'border-white/5 bg-[#1A1A1A] opacity-60 hover:opacity-100'}`}>
                <span className="text-4xl drop-shadow-lg">🛵</span>
                <span className="font-heading font-black text-yellow tracking-wider uppercase text-lg">Delivery VIP</span>
              </button>
              <button onClick={() => setDeliveryMethod('PICKUP')} className={`p-6 border-4 rounded-3xl flex flex-col items-center gap-3 transition-all ${deliveryMethod === 'PICKUP' ? 'border-yellow bg-yellow/10 scale-105 shadow-xl shadow-yellow/10' : 'border-white/5 bg-[#1A1A1A] opacity-60 hover:opacity-100'}`}>
                <span className="text-4xl drop-shadow-lg">🛍️</span>
                <span className="font-heading font-black text-yellow tracking-wider uppercase text-lg">Retiro Sambil</span>
              </button>
            </div>
          </div>
          <button 
            disabled={!deliveryMethod}
            onClick={() => navigate(deliveryMethod === 'PICKUP' ? 4 : 3)} 
            className="w-full btn-primary py-4 font-heading font-black text-2xl uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            Siguiente
          </button>
        </div>
      );
    }

    // 3. MAPA Y GEOLOCALIZACION (EL MISMO DE SUBDAY, BLANCO Y CON BUSCADOR)
    if (step === 3) {
      return (
        <div className="space-y-4">
          <div className="bg-[#111] rounded-[2rem] p-4 shadow-lg border border-yellow/20 relative">
            <h3 className="text-xl font-heading font-black text-yellow uppercase tracking-tighter mb-4 px-2">
              UBICACIÓN DE ENTREGA
            </h3>
            <p className="text-xs text-white/60 mb-2 px-2">Busca tu dirección con Google Maps o toca el mapa.</p>

            {/* Input Buscador */}
            <div className="flex gap-2 mb-4 relative z-[500] w-full">
              <div className="flex-1 min-w-0 relative">
                <form onSubmit={e => e.preventDefault()} className="flex bg-[#1A1A1A] border-2 border-white/10 rounded-xl overflow-hidden shadow-sm focus-within:border-yellow transition-colors">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Buscar dirección (ej: Chops, Sambil...)"
                    className="flex-1 min-w-0 px-3 py-3 text-base font-bold text-white placeholder:text-white/40 outline-none bg-transparent"
                    autoComplete="off"
                  />
                  <button type="submit" disabled={isSearching} className="bg-transparent px-3 text-yellow flex-shrink-0 border-l border-white/10">
                    {isSearching ? '...' : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                  </button>
                </form>
                <AnimatePresence>
                  {showSuggestions && searchQuery.length > 1 && (
                    <motion.ul
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 w-full bg-[#222] rounded-xl shadow-xl mt-2 border border-white/10 overflow-hidden z-[600] max-h-60 overflow-y-auto"
                    >
                      {suggestions.length === 0 && !isSearching ? (
                        <li className="px-4 py-3 text-xs text-white/40 italic text-center">Sin resultados.</li>
                      ) : (
                        suggestions.map((result) => (
                          <li key={result.place_id} onClick={() => handleSelectSuggestion(result)} className="px-4 py-3 hover:bg-yellow/20 cursor-pointer border-b border-white/5 last:border-0 flex items-start gap-2 transition-colors">
                            <div className="flex-grow">
                              <span className="text-xs font-bold text-white leading-tight block">{result.structured_formatting.main_text}</span>
                              <span className="text-[10px] text-white/50 leading-tight block">{result.structured_formatting.secondary_text}</span>
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
              className="w-full py-4 px-6 bg-[#1A1A1A] border-2 border-yellow/30 hover:border-yellow text-yellow rounded-2xl shadow-lg hover:bg-yellow/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 font-heading font-black uppercase text-sm tracking-wide mb-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Usar Mi Ubicación Actual
            </button>

            {locationDenied && (
                <div className="bg-red/10 border border-red/40 rounded-xl p-3 mb-4 text-xs text-white">
                  Permiso denegado. Busca tu dirección o mueve el pin en el mapa manualmente.
                </div>
            )}

            {/* Map Container */}
            <div className="relative w-full h-72 bg-gray-200 rounded-2xl overflow-hidden shadow-inner">
              <div ref={mapContainerRef} className="w-full h-full" />
              {deliveryPrice > 0 && (
                <div className="absolute bottom-4 left-4 z-[400] bg-black/95 px-4 py-2 rounded-xl shadow-lg border border-yellow/30">
                  <p className="text-[10px] font-black text-white/50 uppercase">Delivery VIP</p>
                  <p className="text-xl font-heading font-black text-yellow">${deliveryPrice.toFixed(2)}</p>
                </div>
              )}
            </div>

            <div className="mt-4 px-2">
              <label className="text-[10px] font-black text-white/50 uppercase ml-1 block mb-1">Punto de Referencia</label>
              <input name="address" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} className="w-full bg-[#1A1A1A] border-2 border-white/5 rounded-xl p-3 font-bold text-white focus:border-yellow outline-none text-sm placeholder:text-white/30" placeholder="Ej: Apto, piso, frente a la plaza..." />
            </div>
          </div>
          
          <button disabled={!isLocationValid()} onClick={() => navigate(4)} className={`w-full py-4 rounded-xl font-heading font-black text-2xl uppercase shadow-xl transition-all ${isLocationValid() ? 'bg-red text-white' : 'bg-white/10 text-white/30'}`}>Confirmar Ubicación</button>
        </div>
      );
    }

    // 4. RESUMEN Y MÉTODOS DE PAGO
    if (step === 4) {
      return (
        <div className="space-y-6">
          <div className="bg-[#111] rounded-[2rem] p-6 shadow-lg border border-yellow/20">
            <h3 className="text-2xl font-display text-yellow uppercase mb-4 tracking-[1px]">RESUMEN DE ORDEN</h3>
            <div className="space-y-4 max-h-48 overflow-y-auto pr-2 no-scrollbar">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 justify-between items-center border-b border-white/5 pb-3">
                  <div className="flex-grow">
                    <p className="text-sm font-heading font-bold uppercase text-white">{item.quantity}x {item.name}</p>
                  </div>
                  <span className="text-base font-black text-yellow">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-3 border-t border-dashed border-white/20 space-y-1">
              <div className="flex justify-between text-xs font-bold text-white/50 uppercase"><span>Subtotal</span><span>${totalCart.toFixed(2)}</span></div>
              {deliveryMethod === 'DELIVERY' && (
                <div className="flex justify-between text-xs font-bold text-white/50 uppercase"><span>Delivery</span><span>${deliveryPrice.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between text-3xl font-display font-black text-yellow mt-2"><span>Total</span><span>${totalUSD.toFixed(2)}</span></div>
            </div>
          </div>

          <div className="space-y-3">
            <button onClick={() => { setCurrency('USD'); navigate(5); }} className="w-full bg-[#1A1A1A] p-4 rounded-2xl shadow-md border-2 border-white/5 hover:border-yellow flex items-center justify-between group transition-all">
              <span className="font-heading font-black text-white text-lg tracking-widest uppercase flex items-center gap-2"><span className="text-2xl">💵</span> Dólares (Zelle/Efectivo)</span>
              <ChevronLeft className="w-6 h-6 text-white/30 group-hover:text-yellow rotate-180 transition-colors" />
            </button>
            <button onClick={() => { setCurrency('BS'); navigate(5); }} className="w-full bg-[#1A1A1A] p-4 rounded-2xl shadow-md border-2 border-white/5 hover:border-yellow flex items-center justify-between group transition-all">
              <span className="font-heading font-black text-white text-lg tracking-widest uppercase flex items-center gap-2"><span className="text-2xl">🇻🇪</span> Bolívares (Pago Móvil)</span>
              <ChevronLeft className="w-6 h-6 text-white/30 group-hover:text-yellow rotate-180 transition-colors" />
            </button>
            <button onClick={() => { 
                setCurrency('MIXED'); 
                setMixedStep(1); 
                setMixedUsdAmount(null); 
                setUsdMethod(null); 
                navigate(5); 
              }} 
              className="w-full bg-yellow/10 p-4 rounded-2xl shadow-md border-2 border-dashed border-yellow hover:border-white flex items-center justify-between group transition-all">
              <span className="font-heading font-black text-yellow text-lg tracking-widest uppercase flex items-center gap-2"><span className="text-2xl">⚖️</span> Pago Mixto (USD + BS)</span>
              <ChevronLeft className="w-6 h-6 text-yellow group-hover:text-white rotate-180 transition-colors" />
            </button>
          </div>
        </div>
      );
    }

    // 5. FLUJO DE PAGO ESPECÍFICO
    if (step === 5) {
      const isUsdValid = () => {
        if (currency !== 'USD') return reference.length >= 4;
        if (!usdMethod) return false;
        if (usdMethod === 'EFECTIVO') return preview !== null && (cashBillAmount ?? 0) >= totalUSD; // Photo required
        if (usdMethod === 'ZELLE' || usdMethod === 'BINANCE' || usdMethod === 'PAYPAL') return preview !== null && titularName.trim().length > 0;
        return false;
      };
      
      const isMixedValid = () => {
        if (!mixedUsdAmount || !usdMethod) return false;
        if (mixedStep === 1) return true; // Only going to step 2
        // If step 2 (BS), need BS reference
        if (mixedStep === 2 && reference.length >= 4) {
             if (usdMethod === 'EFECTIVO') return preview !== null;
             if (usdMethod === 'ZELLE') return preview !== null && titularName.trim().length > 0;
        }
        return false;
      };

      if (currency === 'MIXED') {
          return (
            <div className="space-y-6">
               <div className="bg-[#111] rounded-[2rem] p-6 shadow-lg border border-yellow/20 space-y-4">
                 <div className="text-center mb-6">
                    <span className="text-4xl">⚖️</span>
                    <h3 className="text-xl font-heading font-black text-yellow tracking-widest uppercase mt-2">PAGO MIXTO</h3>
                 </div>

                 {mixedStep === 1 ? (
                   // MIXED PASO 1: MONTOS
                   <div className="space-y-4">
                     <p className="text-sm text-center text-white/70">Tu total es de <strong className="text-yellow text-xl">${totalUSD.toFixed(2)}</strong>. ¿Cuántos USD tienes?</p>
                     
                     <div>
                       <label className="text-[10px] font-black text-white/50 uppercase ml-1 block mb-1 flex items-center gap-1">💵 Agrega monto USD aquí</label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-white">$</span>
                          <input
                             type="number"
                             max={totalUSD - 1} // Can't be equal or more, otherwise it's just USD payment
                             value={mixedUsdAmount || ''}
                             onChange={(e) => {
                               const val = parseFloat(e.target.value) || null;
                               setMixedUsdAmount(val);
                             }}
                             className="w-full bg-[#1A1A1A] border-2 border-white/10 rounded-xl p-3 pl-10 font-bold text-2xl text-yellow focus:border-yellow outline-none text-center"
                          />
                       </div>
                     </div>

                     {mixedUsdAmount && mixedUsdAmount > 0 && mixedUsdAmount < totalUSD && (
                        <div className="bg-red/10 border border-red/30 p-4 rounded-xl text-center">
                          <p className="text-xs text-white uppercase font-bold tracking-widest">Resto en Bolívares</p>
                          <p className="text-3xl font-heading font-black text-red">Bs. {mixedBsRemaining.toLocaleString('es-VE', {minimumFractionDigits: 2})}</p>
                        </div>
                     )}

                     <div className="mt-4">
                       <label className="text-[10px] font-black text-white/50 uppercase ml-1 block mb-2">¿Cómo darás los dólares?</label>
                       <div className="grid grid-cols-2 gap-3">
                         <button onClick={() => setUsdMethod('EFECTIVO')} className={`p-4 rounded-xl border-2 transition-all font-bold tracking-widest uppercase text-sm ${usdMethod === 'EFECTIVO' ? 'border-yellow bg-yellow/10 text-yellow' : 'bg-[#1A1A1A] border-white/10 text-white'}`}>💵 Efectivo</button>
                         <button onClick={() => setUsdMethod('ZELLE')} className={`p-4 rounded-xl border-2 transition-all font-bold tracking-widest uppercase text-sm ${usdMethod === 'ZELLE' ? 'border-yellow bg-yellow/10 text-yellow' : 'bg-[#1A1A1A] border-white/10 text-white'}`}>🟣 Zelle</button>
                       </div>
                     </div>

                     <button disabled={!mixedUsdAmount || mixedUsdAmount >= totalUSD || mixedUsdAmount <= 0 || !usdMethod} onClick={() => setMixedStep(2)} className="w-full btn-primary py-4 mt-4 disabled:opacity-30 disabled:cursor-not-allowed">Ir a depositar Bolívares</button>
                   </div>
                 ) : (
                   // MIXED PASO 2: RECIBOS
                   <div className="space-y-6">
                      <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 text-sm space-y-3">
                         <h4 className="font-heading font-black text-yellow text-center uppercase tracking-widest border-b border-white/10 pb-2">Datos Pago Móvil</h4>
                         <div className="flex justify-between items-center"><span className="text-white/60 font-bold">Monto:</span> <span className="text-red font-black text-lg">Bs. {mixedBsRemaining.toLocaleString('es-VE', {minimumFractionDigits:2})}</span></div>
                         <div className="flex justify-between items-center"><span className="text-white/60 font-bold">Banco:</span> <span className="text-white font-bold">{PAGO_MOVIL.bank}</span> <button onClick={() => copyToClipboard('0105', 'b')} className="text-xs bg-black px-2 py-1 rounded shadow-sm">{copiedField==='b' ? '✅' : '📋'}</button></div>
                         <div className="flex justify-between items-center"><span className="text-white/60 font-bold">Cédula:</span> <span className="text-white font-bold">{PAGO_MOVIL.id}</span> <button onClick={() => copyToClipboard('12345678', 'c')} className="text-xs bg-black px-2 py-1 rounded shadow-sm">{copiedField==='c' ? '✅' : '📋'}</button></div>
                         <div className="flex justify-between items-center"><span className="text-white/60 font-bold">Teléfono:</span> <span className="text-white font-bold">{PAGO_MOVIL.phone}</span> <button onClick={() => copyToClipboard('04141234567', 't')} className="text-xs bg-black px-2 py-1 rounded shadow-sm">{copiedField==='t' ? '✅' : '📋'}</button></div>
                         <input className="w-full bg-black text-white p-3 rounded-lg border border-yellow/30 focus:border-yellow outline-none mt-2 font-bold placeholder:text-white/20" placeholder="Ref. Pago Móvil" value={reference} onChange={e=>setReference(e.target.value)} />
                      </div>

                      <div className="border-t border-dashed border-white/20 pt-4">
                         <h4 className="font-heading font-black text-yellow uppercase mb-2">Comprobante Dólares ({usdMethod})</h4>
                         
                         {usdMethod === 'ZELLE' && (
                           <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 space-y-3 text-sm mb-4">
                              <div className="flex justify-between"><span className="text-white/60">Zelle:</span> <span className="text-yellow font-bold">{ZELLE_EMAIL}</span></div>
                              <input placeholder="Nombre del titular zelle" className="w-full bg-black text-white p-3 rounded-xl border border-white/10 focus:border-yellow outline-none font-bold" value={titularName} onChange={e=>setTitularName(e.target.value)} />
                           </div>
                         )}

                         <div className="relative border-4 border-dashed border-yellow/30 rounded-xl p-4 text-center hover:bg-yellow/5 transition-colors cursor-pointer block">
                            {preview ? (
                              <div className="relative h-32">
                                <img src={preview} className="h-full mx-auto rounded-lg shadow-sm" />
                                <button onClick={() => setPreview(null)} className="absolute top-0 right-0 bg-red text-white p-1 rounded-full shadow-md z-10"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg></button>
                              </div>
                            ) : (
                              <label className="cursor-pointer block py-4 font-bold text-yellow uppercase text-sm">
                                📷 Toca para subir {usdMethod === 'EFECTIVO' ? 'foto billete' : 'capture Zelle'}
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                              </label>
                            )}
                         </div>
                      </div>

                      <button disabled={!isMixedValid()} onClick={handleConfirmOrder} className="w-full btn-primary py-4 shadow-xl disabled:opacity-30 disabled:cursor-not-allowed uppercase font-heading font-black text-xl">Confirmar Pedido Mixto</button>
                   </div>
                 )}
               </div>
            </div>
          );
      }

      if (currency === 'USD' || currency === 'BS') {
        return (
          <div className="space-y-6">
            <div className="bg-[#111] rounded-[2rem] p-6 shadow-lg border border-yellow/20 space-y-4">
              <div className="text-center mb-6">
                <span className="text-5xl drop-shadow-lg">{currency === 'USD' ? '💵' : '🇻🇪'}</span>
                <h3 className="text-2xl font-display font-black text-yellow tracking-[1px] mt-2">{currency === 'USD' ? 'Pago en Divisas' : 'Pago Móvil (BS)'}</h3>

                <div className="flex flex-col items-center mt-4 p-4 bg-[#1A1A1A] rounded-2xl border-2 border-white/5">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Monto a Pagar</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-4xl font-black text-yellow font-heading tracking-widest">
                      {currency === 'USD' ? `$${totalUSD.toFixed(2)}` : `${totalBS.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`}
                    </span>
                    <button
                      onClick={() => copyToClipboard(currency === 'USD' ? totalUSD.toFixed(2) : totalBS.toFixed(2), 'amount')}
                      className="bg-black p-2 rounded-xl border border-white/10 hover:border-yellow active:scale-95 transition-all text-xl"
                    >
                      {copiedField === 'amount' ? '✅' : '📋'}
                    </button>
                  </div>
                  {copiedField === 'amount' && <span className="text-[10px] font-black text-yellow uppercase mt-1 animate-pulse">¡Copiado!</span>}
                </div>
              </div>

              {/* USD Method Icons */}
              {currency === 'USD' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <button onClick={() => { setUsdMethod('EFECTIVO'); setPreview(null); }} className={`p-4 flex flex-col items-center gap-2 border-4 rounded-2xl transition-all ${usdMethod === 'EFECTIVO' ? 'border-yellow bg-yellow/10' : 'border-white/5 bg-[#1A1A1A]'}`}>
                      <span className="text-2xl">💵</span>
                      <span className="text-xs font-black uppercase text-white tracking-widest">Efectivo</span>
                    </button>
                    <button onClick={() => { setUsdMethod('ZELLE'); setPreview(null); setTitularName(''); }} className={`p-4 flex flex-col items-center gap-2 border-4 rounded-2xl transition-all ${usdMethod === 'ZELLE' ? 'border-yellow bg-yellow/10' : 'border-white/5 bg-[#1A1A1A]'}`}>
                      <img src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/payment_methods/zelle_logo.png" alt="Zelle" className="h-6 w-auto object-contain brightness-0 invert" />
                      <span className="text-xs font-black uppercase text-white tracking-widest">Zelle</span>
                    </button>
                    <button onClick={() => { setUsdMethod('BINANCE'); setPreview(null); setTitularName(''); }} className={`p-4 flex flex-col items-center gap-2 border-4 rounded-2xl transition-all ${usdMethod === 'BINANCE' ? 'border-yellow bg-yellow/10' : 'border-white/5 bg-[#1A1A1A]'}`}>
                      <img src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/payment_methods/binance_logo.png" alt="Binance" className="h-6 w-auto object-contain brightness-0 invert" />
                      <span className="text-xs font-black uppercase text-white tracking-widest">Binance</span>
                    </button>
                    <button onClick={() => { setUsdMethod('PAYPAL'); setPreview(null); setTitularName(''); }} className={`p-4 flex flex-col items-center gap-2 border-4 rounded-2xl transition-all ${usdMethod === 'PAYPAL' ? 'border-yellow bg-yellow/10' : 'border-white/5 bg-[#1A1A1A]'}`}>
                      <img src="https://pub-e0bf5d8ae1044ad790b03ddcf9ceeb8a.r2.dev/payment_methods/paypal_logo.png" alt="PayPal" className="h-6 w-auto object-contain brightness-0 invert" />
                      <span className="text-xs font-black uppercase text-white tracking-widest">PayPal</span>
                    </button>
                  </div>

                  {usdMethod === 'EFECTIVO' && (
                      <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5">
                        <label className="text-xs font-bold uppercase text-white/50 block mb-2">💵 ¿Con cuánto billete pagarás?</label>
                        <div className="relative mb-4">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-white">$</span>
                           <input type="number" min={Math.ceil(totalUSD)} value={cashBillAmount || ''} onChange={(e) => setCashBillAmount(parseInt(e.target.value)||null)} placeholder={`Mínimo $${Math.ceil(totalUSD)}`} className="w-full bg-black border-2 border-white/10 rounded-xl p-3 pl-10 font-bold text-2xl text-yellow outline-none focus:border-yellow" />
                        </div>
                        {cashBillAmount && cashBillAmount > totalUSD && (
                          <div className="text-sm font-bold text-yellow mb-4">Vuelto: ${(cashBillAmount - totalUSD).toFixed(2)}</div>
                        )}
                        <label className="text-[10px] font-black text-white/50 uppercase ml-1 block mb-2">📸 Foto del Billete</label>
                         <div className="relative border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-yellow transition-colors">
                            {preview ? (
                              <div className="relative h-24">
                                <img src={preview} className="h-full mx-auto rounded-lg shadow-sm" />
                                <button onClick={() => setPreview(null)} className="absolute top-0 right-0 bg-red text-white p-1 rounded-full"><ChevronLeft className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <label className="cursor-pointer block text-yellow font-bold text-sm uppercase">📷 Toca para subir billete<input type="file" className="hidden" accept="image/*" onChange={handleFileChange} /></label>
                            )}
                         </div>
                      </div>
                  )}

                  {(usdMethod === 'ZELLE' || usdMethod === 'BINANCE' || usdMethod === 'PAYPAL') && (
                     <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 space-y-4">
                        <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                           <span className="font-bold text-white/50">Correo:</span>
                           <span className="font-black text-yellow tracking-wider">{usdMethod === 'ZELLE' ? ZELLE_EMAIL : usdMethod.toLowerCase() + '@test.com'}</span>
                           <button onClick={() => copyToClipboard(ZELLE_EMAIL, 'email')} className="bg-black p-2 rounded text-xs">{copiedField === 'email' ? '✅' : '📋'}</button>
                        </div>
                        <input className="w-full bg-black border border-white/10 text-white font-bold p-3 rounded-xl focus:border-yellow outline-none" placeholder="Nombre de quien envía" value={titularName} onChange={e => setTitularName(e.target.value)} />
                        
                        <div className="relative border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-yellow transition-colors">
                            {preview ? (
                              <div className="relative h-24">
                                <img src={preview} className="h-full mx-auto rounded-lg shadow-sm" />
                                <button onClick={() => setPreview(null)} className="absolute top-0 right-0 bg-red text-white p-1 rounded-full"><ChevronLeft className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <label className="cursor-pointer block text-yellow font-bold text-sm uppercase">📷 Toca para subir Capture<input type="file" className="hidden" accept="image/*" onChange={handleFileChange} /></label>
                            )}
                         </div>
                     </div>
                  )}
                </div>
              )}

              {/* BOLIVARES */}
              {currency === 'BS' && (
                <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 text-sm space-y-3">
                  <div className="flex justify-between items-center"><span className="font-bold text-white/50">Banco:</span> <span className="font-black text-yellow">{PAGO_MOVIL.bank}</span> <button onClick={() => copyToClipboard('0105', 'b')} className="text-xs bg-black px-2 py-1 rounded shadow-sm hover:border hover:border-yellow">{copiedField === 'b' ? '✅' : '📋'}</button></div>
                  <div className="flex justify-between items-center"><span className="font-bold text-white/50">Cédula:</span> <span className="font-black text-yellow">{PAGO_MOVIL.id}</span> <button onClick={() => copyToClipboard('12345678', 'c')} className="text-xs bg-black px-2 py-1 rounded shadow-sm hover:border hover:border-yellow">{copiedField === 'c' ? '✅' : '📋'}</button></div>
                  <div className="flex justify-between items-center"><span className="font-bold text-white/50">Teléfono:</span> <span className="font-black text-yellow">{PAGO_MOVIL.phone}</span> <button onClick={() => copyToClipboard('04141234567', 't')} className="text-xs bg-black px-2 py-1 rounded shadow-sm hover:border hover:border-yellow">{copiedField === 't' ? '✅' : '📋'}</button></div>
                  
                  <div className="border-t border-dashed border-white/10 pt-4 mt-4">
                    <input className="w-full bg-black text-white p-3 rounded-lg border border-yellow/30 focus:border-yellow outline-none font-bold placeholder:text-white/20 mb-4" placeholder="Referencia últimos 4 dígitos" type="text" value={reference} onChange={e => setReference(e.target.value)} />
                    
                    <div className="relative border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-yellow transition-colors">
                            {preview ? (
                              <div className="relative h-24">
                                <img src={preview} className="h-full mx-auto rounded-lg shadow-sm" />
                                <button onClick={() => setPreview(null)} className="absolute top-0 right-0 bg-red text-white p-1 rounded-full"><ChevronLeft className="w-4 h-4" /></button>
                              </div>
                            ) : (
                              <label className="cursor-pointer block text-yellow font-bold text-sm uppercase">📷 Toca para subir Capture<input type="file" className="hidden" accept="image/*" onChange={handleFileChange} /></label>
                            )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleConfirmOrder}
              disabled={currency==='USD' ? !isUsdValid() : (reference.length < 4 || preview === null)}
              className="w-full btn-primary py-4 font-heading font-black text-2xl uppercase shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              ENVIAR PEDIDO POR WHATSAPP
            </button>
          </div>
        );
      }
    }
  };

  return (
    <div className="bg-black text-white px-4 py-8 md:p-10 font-body relative overflow-x-hidden min-h-screen">
      {/* HEADER NAV */}
      <div className="max-w-2xl mx-auto flex items-center mb-8 relative z-10">
        <button onClick={prevStep} className="p-2 border border-white/20 hover:border-yellow bg-[#111] rounded-full transition-colors text-white">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 text-center font-display text-3xl tracking-[3px] text-white">
          Paso <span className="text-yellow">{step > 4 ? 4 : step}</span>/4
        </div>
      </div>

      <div className="max-w-2xl mx-auto relative h-auto min-h-[500px]">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute w-full"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
