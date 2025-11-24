import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface WifiQRCodeProps {
  ssid: string;
  password: string;
}

const WifiQRCode: React.FC<WifiQRCodeProps> = ({ ssid, password }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      // Format for Wi-Fi QR codes: WIFI:T:<authentication type>;S:<SSID>;P:<password>;;
      // WPA is the most common authentication type for public networks.
      const wifiString = `WIFI:T:WPA;S:${ssid};P:${password};;`;
      
      QRCode.toCanvas(canvasRef.current, wifiString, { width: 200, margin: 1 }, (error) => {
        if (error) {
            console.error('Failed to generate QR Code:', error);
            // Optionally render an error message on the canvas itself
            const context = canvasRef.current?.getContext('2d');
            if (context) {
                context.clearRect(0, 0, 200, 200);
                context.font = '16px sans-serif';
                context.fillStyle = 'red';
                context.fillText('QR Error', 10, 20);
            }
        }
      });
    }
  }, [ssid, password]);

  return <canvas ref={canvasRef} width="200" height="200" />;
};

export default WifiQRCode;