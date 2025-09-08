export interface FontOption {
  id: string;
  name: string;
  family: string;
  source: 'google' | 'bunny';
  variants: string[];
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  previewText?: string;
}

export const AVAILABLE_FONTS: FontOption[] = [
  // Google Fonts - Popular choices for subtitles
  {
    id: 'roboto',
    name: 'Roboto',
    family: 'Roboto',
    source: 'google',
    variants: ['300', '400', '500', '700', '900'],
    category: 'sans-serif',
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    family: 'Open Sans',
    source: 'google',
    variants: ['300', '400', '600', '700', '800'],
    category: 'sans-serif',
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    family: 'Montserrat',
    source: 'google',
    variants: ['300', '400', '500', '600', '700', '800', '900'],
    category: 'sans-serif',
  },
  {
    id: 'poppins',
    name: 'Poppins',
    family: 'Poppins',
    source: 'google',
    variants: ['300', '400', '500', '600', '700', '800', '900'],
    category: 'sans-serif',
  },
  {
    id: 'fredoka',
    name: 'Fredoka',
    family: 'Fredoka',
    source: 'google',
    variants: ['300', '400', '500', '600', '700'],
    category: 'sans-serif',
  },
  {
    id: 'inter',
    name: 'Inter',
    family: 'Inter',
    source: 'google',
    variants: ['300', '400', '500', '600', '700', '800', '900'],
    category: 'sans-serif',
  },
  {
    id: 'nunito',
    name: 'Nunito',
    family: 'Nunito',
    source: 'google',
    variants: ['300', '400', '600', '700', '800', '900'],
    category: 'sans-serif',
  },
  {
    id: 'raleway',
    name: 'Raleway',
    family: 'Raleway',
    source: 'google',
    variants: ['300', '400', '500', '600', '700', '800', '900'],
    category: 'sans-serif',
  },
  {
    id: 'lato',
    name: 'Lato',
    family: 'Lato',
    source: 'google',
    variants: ['300', '400', '700', '900'],
    category: 'sans-serif',
  },
  {
    id: 'oswald',
    name: 'Oswald',
    family: 'Oswald',
    source: 'google',
    variants: ['300', '400', '500', '600', '700'],
    category: 'sans-serif',
  },

  // Display fonts for impact
  {
    id: 'bebas-neue',
    name: 'Bebas Neue',
    family: 'Bebas Neue',
    source: 'google',
    variants: ['400'],
    category: 'display',
  },
  {
    id: 'anton',
    name: 'Anton',
    family: 'Anton',
    source: 'google',
    variants: ['400'],
    category: 'display',
  },
  {
    id: 'archivo-black',
    name: 'Archivo Black',
    family: 'Archivo Black',
    source: 'google',
    variants: ['400'],
    category: 'display',
  },

  // Serif fonts
  {
    id: 'playfair-display',
    name: 'Playfair Display',
    family: 'Playfair Display',
    source: 'google',
    variants: ['400', '500', '600', '700', '800', '900'],
    category: 'serif',
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    family: 'Merriweather',
    source: 'google',
    variants: ['300', '400', '700', '900'],
    category: 'serif',
  },

  // Bunny Fonts alternatives
  {
    id: 'system-ui',
    name: 'System UI',
    family: 'system-ui',
    source: 'bunny',
    variants: ['400', '500', '700'],
    category: 'sans-serif',
  },
  {
    id: 'segoe-ui',
    name: 'Segoe UI',
    family: 'Segoe UI',
    source: 'bunny',
    variants: ['400', '500', '600', '700'],
    category: 'sans-serif',
  },
  {
    id: 'helvetica',
    name: 'Helvetica',
    family: 'Helvetica',
    source: 'bunny',
    variants: ['300', '400', '500', '700'],
    category: 'sans-serif',
  },
  {
    id: 'arial',
    name: 'Arial',
    family: 'Arial',
    source: 'bunny',
    variants: ['400', '500', '700'],
    category: 'sans-serif',
  },
];

export const getFontByFamily = (family: string): FontOption | undefined => {
  return AVAILABLE_FONTS.find(font => font.family.toLowerCase() === family.toLowerCase());
};

export const getFontsByCategory = (category: string): FontOption[] => {
  return AVAILABLE_FONTS.filter(font => font.category === category);
};

export const loadGoogleFont = (font: FontOption, variants: string[] = ['400']): void => {
  if (font.source !== 'google') return;

  const existingLink = document.getElementById(`font-${font.id}`);
  if (existingLink) return;

  const weightParams = variants.join(';');
  const fontUrl = `https://fonts.googleapis.com/css2?family=${font.family.replace(/\s+/g, '+')}:wght@${weightParams}&display=swap`;
  
  const link = document.createElement('link');
  link.id = `font-${font.id}`;
  link.rel = 'stylesheet';
  link.href = fontUrl;
  document.head.appendChild(link);
};

export const getFontCSS = (font: FontOption): string => {
  if (font.source === 'google') {
    return `"${font.family}", sans-serif`;
  }
  return font.family;
};