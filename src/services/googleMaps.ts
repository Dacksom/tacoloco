declare global {
  interface Window {
    google: any;
    initMap: () => void;
    googleMapsPromiseState?: 'loading' | 'ready' | 'error';
  }
}

export const loadGoogleMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    if (window.googleMapsPromiseState === 'loading') {
       const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
             clearInterval(checkInterval);
             resolve();
          }
       }, 100);
       return;
    }

    window.googleMapsPromiseState = 'loading';

    // Global callback for the Google Maps API
    window.initMap = () => {
      window.googleMapsPromiseState = 'ready';
      resolve();
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    // Remove onload since we rely on callback=initMap
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBiHIV3TsYTYWt-tPLy8HgENQXkPqmplEY&libraries=places&language=es&region=VE&callback=initMap`;
    script.async = true;
    script.defer = true;
    script.onerror = (err) => {
       window.googleMapsPromiseState = 'error';
       reject(err);
    };
    document.head.appendChild(script);
  });
};
