import React, { useState } from 'react';
import { ClipboardIcon, CheckIcon, QrCodeIcon } from './Icons';
import WifiQRCode from './WifiQRCode';

interface WifiCardProps {
  ssid: string;
  password: string;
}

const WifiCard: React.FC<WifiCardProps> = ({ ssid, password }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 md:p-6 shadow-2xl backdrop-blur-sm animate-fade-in-up w-full text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-gray-400 text-sm">Network (SSID)</p>
          <p className="text-lg font-medium text-white break-all">{ssid}</p>
        </div>
        <div className="w-full sm:w-auto">
          <p className="text-gray-400 text-sm">Generated Password</p>
          <div className="flex items-stretch gap-1 mt-1 bg-gray-900 border border-gray-600 rounded-md p-1">
            <p className="px-2 py-1 text-lg font-mono text-cyan-400 break-all">{password}</p>
            <button
              onClick={handleCopy}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors duration-200 text-gray-400 hover:text-white flex-shrink-0"
              aria-label="Copy password"
            >
              {isCopied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <ClipboardIcon className="w-5 h-5" />}
            </button>
             <button
              onClick={() => setShowQr(!showQr)}
              className="p-2 rounded-md hover:bg-gray-700 transition-colors duration-200 text-gray-400 hover:text-white flex-shrink-0"
              aria-label="Show QR Code"
            >
              <QrCodeIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {showQr && (
        <div className="mt-4 pt-4 border-t border-gray-700 flex flex-col items-center">
            <p className="text-sm text-gray-400 mb-2">Scan with your phone to connect</p>
            <div className="p-2 bg-white rounded-lg">
                <WifiQRCode ssid={ssid} password={password} />
            </div>
        </div>
      )}
    </div>
  );
};

const style = document.createElement('style');
style.innerHTML = `
  @keyframes fade-in-up {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in-up {
    animation: fade-in-up 0.5s ease-out forwards;
  }
  
  @keyframes grid {
    0% { transform: translateY(0); }
    100% { transform: translateY(-20px); }
  }

  .bg-grid-gray-700\\[\\/0\\.2\\] {
    background-image:
      linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 1px, transparent 1px);
    animation: grid 2s linear infinite;
  }

`;
document.head.appendChild(style);

export default WifiCard;