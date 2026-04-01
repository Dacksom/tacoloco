export const loadGoogleMaps = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
            resolve();
            return;
        }

        if (document.getElementById('google-maps-script')) {
            // Script already added, wait for load
            const checkInterval = setInterval(() => {
                if (window.google && window.google.maps) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            return;
        }

        const script = document.createElement('script');
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

        if (!apiKey) {
            reject(new Error('Google Maps API Key not found in environment variables (VITE_GOOGLE_MAPS_KEY)'));
            return;
        }

        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            resolve();
        };

        script.onerror = (err) => {
            reject(err);
        };

        document.head.appendChild(script);
    });
};
