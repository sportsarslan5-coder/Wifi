import { GoogleGenAI, Type } from "@google/genai";
import type { WifiInfo } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const findWifiPassword = async (ssid: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a creative Wi-Fi password generator. For the Wi-Fi network named "${ssid}", generate a fun and plausible-sounding password. The password should be a single word or a short phrase, suitable for a public or semi-public network (like a cafe, library, or airport). Examples: 'coffeefirst', 'freewifi4you', 'readmorebooks', 'flyhigh2024'. Respond with ONLY the generated password and absolutely nothing else. Do not include quotes or any introductory text.`,
      config: {
        temperature: 0.8,
        maxOutputTokens: 20,
      }
    });

    const text = response.text;

    if (!text) {
      console.error("Gemini API returned an empty or blocked response:", JSON.stringify(response, null, 2));
      throw new Error("Received an empty response from the AI model.");
    }

    const password = text.trim().replace(/["']/g, ''); // Clean up any stray quotes
    
    if (!password) {
      throw new Error("Received an empty response from the AI model.");
    }
    
    return password;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to communicate with the AI model.");
  }
};

export const findNearbyWifiHotspots = async (latitude: number, longitude: number): Promise<WifiInfo[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Based on the location with latitude ${latitude} and longitude ${longitude}, identify 3 common public Wi-Fi network SSIDs that a person might find there (e.g., coffee shops, public parks, transport hubs). For each SSID, provide a commonly used or highly plausible password.`,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              ssid: {
                type: Type.STRING,
                description: 'The name of the Wi-Fi network (SSID).',
              },
              password: {
                type: Type.STRING,
                description: 'A common or plausible password for this network.',
              },
            },
            required: ['ssid', 'password'],
          },
        },
      },
    });

    const jsonStr = response.text;

    if (!jsonStr) {
      console.error("Gemini API returned an empty or blocked response:", JSON.stringify(response, null, 2));
      throw new Error("Received an empty response from the AI model.");
    }
    
    const data = JSON.parse(jsonStr.trim());
    return data as WifiInfo[];

  } catch (error) {
    console.error("Error calling Gemini API for nearby hotspots:", error);
    throw new Error("Failed to communicate with the AI model for nearby hotspots.");
  }
};

export const findWifiFromImage = async (base64Image: string, mimeType: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            text: `Analyze this screenshot of a Wi-Fi network list. Identify all the Wi-Fi network names (SSIDs) visible in the image. Exclude any text that is not an SSID, such as 'Saved', 'Wi-Fi Networks', or 'Add Network'. Respond ONLY with a JSON array of strings.`
          },
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: 'A Wi-Fi network SSID.',
          },
        },
      },
    });

    const jsonStr = response.text;
    if (!jsonStr) {
      console.error("Gemini API returned an empty or blocked response from image analysis:", JSON.stringify(response, null, 2));
      throw new Error("Received an empty response from the AI model during image analysis.");
    }

    const data = JSON.parse(jsonStr.trim());
    return data as string[];
    
  } catch (error) {
    console.error("Error calling Gemini API for image analysis:", error);
    throw new Error("Failed to communicate with the AI model for image analysis.");
  }
};
