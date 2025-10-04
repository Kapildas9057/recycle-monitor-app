import { supabase } from "@/integrations/supabase/client";

const tamilToEnglishMap: Record<string, string> = {
  'பிளாஸ்டிக்': 'Plastic',
  'காகிதம்': 'Paper',
  'இயற்கை': 'Organic',
  'உலோகம்': 'Metal',
  'கண்ணாடி': 'Glass',
  'மின்னணு': 'Electronic',
  'அட்டை': 'Cardboard',
  'துணி': 'Textile',
  'மரம்': 'Wood',
  'பேட்டரி': 'Battery',
  'வேதியியல்': 'Chemical',
  'உணவு கழிவு': 'Food Waste',
  'அலுமினியம்': 'Aluminum',
  'ரப்பர்': 'Rubber',
  'மட்பாண்டம்': 'Ceramic',
  'நுரை': 'Foam',
};

export async function translateTamilToEnglish(text: string): Promise<string> {
  // First check if we have a cached translation
  if (tamilToEnglishMap[text]) {
    return tamilToEnglishMap[text];
  }

  // If not cached, use the AI translation
  try {
    const { data, error } = await supabase.functions.invoke('translate-tamil', {
      body: { text }
    });

    if (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }

    return data.translatedText || text;
  } catch (error) {
    console.error('Translation failed:', error);
    return text; // Return original text if translation fails
  }
}
