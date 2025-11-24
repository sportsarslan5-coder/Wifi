import React, { useState, useCallback, useRef } from 'react';
import { findWifiPassword, findNearbyWifiHotspots, findWifiFromImage } from './services/geminiService';
import type { WifiInfo } from './types';
import WifiCard from './components/WifiCard';
import Loader from './components/Loader';
import { WifiIcon, KeyIcon, MapPinIcon, ImageIcon } from './components/Icons';

const App: React.FC = () => {
  const [ssid, setSsid] = useState<string>('');
  const [wifiList, setWifiList] = useState<WifiInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleManualGenerate = useCallback(async () => {
    if (!ssid.trim()) {
      setError('Please enter a Wi-Fi network name.');
      return;
    }
    setLoadingMessage('Generating Password...');
    setIsLoading(true);
    setError(null);
    setWifiList([]);
    try {
      const password = await findWifiPassword(ssid);
      setWifiList([{ ssid, password }]);
    } catch (err) {
      setError('Failed to generate password. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [ssid]);

  const handleFindNearby = useCallback(() => {
    setLoadingMessage('Getting your location...');
    setIsLoading(true);
    setError(null);
    setWifiList([]);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLoadingMessage('Finding nearby hotspots...');
        try {
          const results = await findNearbyWifiHotspots(latitude, longitude);
          if (results.length === 0) {
            setError("Couldn't find any common Wi-Fi hotspots nearby.");
          }
          setWifiList(results);
        } catch (err) {
          setError('Failed to find hotspots. The AI may be busy!');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      },
      (geoError) => {
        setIsLoading(false);
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError("Location access denied. Please enable it in your browser settings.");
            break;
          case geoError.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case geoError.TIMEOUT:
            setError("The request to get user location timed out.");
            break;
          default:
            setError("An unknown error occurred while getting your location.");
            break;
        }
      },
      { timeout: 10000 }
    );
  }, []);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingMessage('Analyzing screenshot...');
    setError(null);
    setWifiList([]);

    try {
      const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = error => reject(error);
          reader.readAsDataURL(file);
      });

      const ssids = await findWifiFromImage(base64Image, file.type);
      if (ssids.length === 0) {
          setError("Couldn't find any Wi-Fi networks in the screenshot.");
          setIsLoading(false);
          return;
      }
      
      setLoadingMessage(`Found ${ssids.length} networks. Generating passwords...`);

      const wifiInfoPromises = ssids.map(async (ssid) => ({
          ssid,
          password: await findWifiPassword(ssid),
      }));
      
      const newWifiList = await Promise.all(wifiInfoPromises);
      setWifiList(newWifiList);

    } catch (err) {
        setError('Failed to analyze screenshot. Please try again.');
        console.error(err);
    } finally {
        setIsLoading(false);
        if (event.target) {
            event.target.value = '';
        }
    }
  }, []);


  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-700/[0.2] bg-[size:20px_20px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>

        <div className="relative z-10 w-full max-w-md text-center">
            <header className="mb-8">
                <div className="inline-block p-4 bg-cyan-500/10 rounded-full mb-4 border border-cyan-500/20">
                    <KeyIcon className="w-10 h-10 text-cyan-400" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-teal-300">
                    Instant Wi-Fi Connect
                </h1>
                <p className="mt-4 text-lg text-gray-400">
                    Get Wi-Fi passwords from a screenshot.
                </p>
            </header>

            <main className="w-full">
                 <div className="flex flex-col gap-3">
                     <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isLoading}
                      />
                     <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader /> : <ImageIcon className="w-5 h-5" />}
                        {isLoading ? loadingMessage : 'Analyze Wi-Fi Screenshot'}
                    </button>
                    
                    <div className="relative flex items-center">
                        <div className="flex-grow border-t border-gray-700"></div>
                        <span className="flex-shrink mx-4 text-gray-500 text-sm">Or</span>
                        <div className="flex-grow border-t border-gray-700"></div>
                    </div>
                 
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <button
                          onClick={handleFindNearby}
                          disabled={isLoading}
                          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                          <MapPinIcon className="w-5 h-5" />
                          Find Nearby
                      </button>
                      <div className="relative flex-grow">
                            <WifiIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={ssid}
                                onChange={(e) => {
                                  setSsid(e.target.value)
                                  setError(null)
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleManualGenerate()}
                                placeholder="Enter SSID..."
                                className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition duration-200 placeholder-gray-500"
                                disabled={isLoading}
                            />
                      </div>
                    </div>
                     <button
                        onClick={handleManualGenerate}
                        disabled={isLoading || !ssid}
                        className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center sm:hidden"
                    >
                        Generate
                    </button>
                </div>

                {error && <p className="mt-4 text-red-400">{error}</p>}

                <div className="mt-8 w-full space-y-4">
                    {wifiList.map((info) => (
                        <WifiCard key={info.ssid} ssid={info.ssid} password={info.password} />
                    ))}
                </div>
            </main>
        </div>

        <footer className="relative z-10 mt-12 text-center text-gray-500 text-sm">
            <p>Disclaimer: This tool is for entertainment purposes only.</p>
            <p>Passwords are AI-generated suggestions for public networks.</p>
        </footer>
    </div>
  );
};

export default App;