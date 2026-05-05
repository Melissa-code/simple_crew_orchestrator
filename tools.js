// Les outils: appel météo, lire/ecrire dans files ... 

import 'dotenv/config';
import { Tool } from './core.js';
import fs from 'fs/promises'; //const fs = require('fs').promises; // pour lire/ecrire dans des fichiers
const LM_API_URL = process.env.LM_API_URL;
const LM_MODEL = process.env.LM_MODEL; 
const WEATHER_API_KEY = process.env.WEATHER_API_KEY; 
const TRANSLATE_API_KEY = process.env.TRANSLATE_API_KEY; 

if (!LM_API_URL || !LM_MODEL) {
    throw new Error("LM_API_URL et LM_MODEL doivent être définis dans le fichier .env");
    process.exit(1);
}   

/**
 * Outil pour interagir avec LLM Llama via une API en envoyant un prompt 
 * et en recevant une réponse générée par le modèle
 */
const lmStudioTool = new Tool('lmStudio', async (input, systemPrompt=null) => {
    const messages = []; 

    if (systemPrompt) {
        // role: user, bot ou system pour différencier les messages et permettre au modèle de mieux comprendre le contexte
        messages.push({ role: 'system', content: systemPrompt });
    }
    // message du user/human 
    messages.push({ role: 'user', content: input }); 
    // reponse de l'IA 
    console.log('Prompt envoyé au modèle:', input);

    const response = await fetch(LM_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: LM_MODEL,
            messages: messages,
        }),
    });

    const data = await response.json();
    console.log('Réponse brute du modèle:', data);

    const result = data.choices && data.choices.length > 0 ? data.choices[0].message.content : ''; // reponse 1 par defaut 
    console.log('Résultat extrait de la réponse du modèle:', result);
    return result;
}); 

/**
 * Outil pour effectuer une requête HTTP GET à une URL donnée 
 * et retourner le contenu texte de la page
 */
const fetchTool = new Tool('fetch', async (url) => {
    console.log(`Outil fetch appelé avec l'URL: ${url}`);
    const response = await fetch(url, {
        header: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    const result = await response.text();
    console.log('Respone du fetch:', result.substring(0, 200)); //  200 premiers caract
    return result.replace(/<script[8s8S]*?>.*?<\/script>/g, '') // enlever les scripts pour éviter les problèmes de sécurité
                .replace(/<style[8s8S]*?>.*?<\/style>/g, '') // enlever les styles pour se concentrer sur le contenu textuel
                .replace(/<[^>]+>/g, '') // enlever les balises HTML pour ne garder que le texte brut
                .trim(); // enlever les espaces inutiles au début et à la fin du texte
});

/**
 * Outil pour écrire du contenu dans un fichier local: l'agent peut spécifier le nom du fichier et le contenu à écrire
 */
const fileWriteTool = new Tool('fileWrite', async ({ fileName, content }) => {
    console.log(`Fichier écrit: ${fileName}`); 
    console.log(`Fichier écrit: ${content}`.substring(0, 200)); // 200 premiers caract
    
    await fs.writeFile(fileName, content);
    const result = `Contenu écrit dans le fichier ${fileName}`;
    console.log(result);
    return result;
});

/*  
 Outil pour générer un QR code à partir d'une URL (ou texte) en utilisant l'API de qrserver.com
 return l'URL du QR code généré pour que l'agent puisse l'utiliser (le télécharger, l'afficher...)
*/
const generateQRCodeTool = new Tool('generateQRCode', async (text_url) => {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=00f&data=${encodeURIComponent(text_url)}`;
    return url; 
});

/**
 * Outil pour traduire du texte français en anglais en utilisant l'API de traduction de MyMemory
 * @param {string} text - Le texte en français à traduire
 * @returns {Promise<string>} - Le texte traduit en anglais
 */
const translateToEnglishTool = new Tool('translateToEnglish', async (text) => {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=fr|en&de=${encodeURIComponent(TRANSLATE_API_KEY)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.responseData.translatedText;
});


/**
 * Outil pour récupérer les données météo d'une localisation donnée en utilisant l'API 
 * L'agent fournit une localisation (ex: "Paris") et l'outil retourne les conditions météo actuelles 
 */
const weatherTool = new Tool('weather', async (location) => {
    console.log(`Outil météo appelé pour la localisation: ${location}`);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${WEATHER_API_KEY}&units=metric`;
    console.log(`URL de l'API météo: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    console.log(`Données météo pour ${location}:`, JSON.stringify(data));

    if (data.error || data.cod !== 200) {
        const errorMsg = `Erreur lors de la récupération des données météo pour ${location}: ${data.message || 'Unknown error'}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
        return errorMsg;
    }
    
    const result = `${location}: ${data.weather[0].description}, Température: ${data.main.temp}°C, Humidité: ${data.main.humidity}%`;

    return result;
});


export { lmStudioTool, fetchTool, fileWriteTool, generateQRCodeTool, translateToEnglishTool, weatherTool };
