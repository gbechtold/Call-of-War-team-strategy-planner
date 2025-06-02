// Country flag emojis
export const countryFlags: Record<string, string> = {
  // Major Powers
  'Germany': '🇩🇪',
  'USA': '🇺🇸',
  'Soviet Union': '🇷🇺',
  'United Kingdom': '🇬🇧',
  'Japan': '🇯🇵',
  'Italy': '🇮🇹',
  'France': '🇫🇷',
  
  // Other Nations
  'Poland': '🇵🇱',
  'Spain': '🇪🇸',
  'Turkey': '🇹🇷',
  'Brazil': '🇧🇷',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'India': '🇮🇳',
  'China': '🇨🇳',
  'Mexico': '🇲🇽',
  'Argentina': '🇦🇷',
  'South Africa': '🇿🇦',
  'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪',
  'Norway': '🇳🇴',
  'Sweden': '🇸🇪',
  'Finland': '🇫🇮',
  'Denmark': '🇩🇰',
  'Romania': '🇷🇴',
  'Greece': '🇬🇷',
  'Yugoslavia': '🇷🇸',
  'Egypt': '🇪🇬',
  'Saudi Arabia': '🇸🇦',
  
  // Default
  'Unknown': '🏳️'
};

export function getCountryFlag(nation: string): string {
  // Try exact match first
  if (countryFlags[nation]) {
    return countryFlags[nation];
  }
  
  // Try case-insensitive match
  const lowerNation = nation.toLowerCase();
  for (const [key, value] of Object.entries(countryFlags)) {
    if (key.toLowerCase() === lowerNation) {
      return value;
    }
  }
  
  // Special cases and abbreviations
  if (lowerNation.includes('german')) return '🇩🇪';
  if (lowerNation.includes('america') || lowerNation.includes('us')) return '🇺🇸';
  if (lowerNation.includes('soviet') || lowerNation.includes('ussr') || lowerNation.includes('russia')) return '🇷🇺';
  if (lowerNation.includes('britain') || lowerNation.includes('uk') || lowerNation.includes('england')) return '🇬🇧';
  
  return '🏳️';
}