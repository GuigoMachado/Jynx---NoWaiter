/**
 * Returns the SVG fragments for the food illustration endpoint based on the
 * item name. The implementation stays intentionally descriptive so it can be
 * used as a learning example.
 */
const getFoodSvgFragment = (name) => {
  if (name.includes('água') || name.includes('água com gás') || name.includes('tônica')) {
    return `<g><rect x="120" y="60" width="80" height="100" rx="5" fill="#E8F4F8" stroke="#4A90E2" stroke-width="2"/>
            <rect x="125" y="50" width="70" height="15" fill="#E8F4F8" stroke="#4A90E2" stroke-width="2" rx="3"/>
            <circle cx="135" cy="85" r="4" fill="#87CEEB"/><circle cx="155" cy="95" r="3" fill="#87CEEB"/>
            <circle cx="175" cy="80" r="5" fill="#87CEEB"/><circle cx="145" cy="110" r="3" fill="#87CEEB"/></g>`;
  }

  if (name.includes('café') || name.includes('cappuccino') || name.includes('expresso')) {
    return `<g><rect x="110" y="70" width="100" height="80" rx="5" fill="#D4A574" stroke="#8B6F47" stroke-width="2"/>
            <ellipse cx="160" cy="65" rx="55" ry="12" fill="#8B7355"/>
            <path d="M 170 70 Q 180 75 175 90" stroke="#8B6F47" stroke-width="2" fill="none"/>
            <circle cx="140" cy="95" r="3" fill="#F0E68C" opacity="0.7"/></g>`;
  }

  if (name.includes('suco') || name.includes('smoothie') || name.includes('laranja')) {
    return `<g><rect x="125" y="55" width="70" height="100" rx="8" fill="#FFA500" stroke="#FF8C00" stroke-width="2"/>
            <ellipse cx="160" cy="50" rx="40" ry="8" fill="#FFA500"/>
            <rect x="155" y="40" width="10" height="20" fill="#90EE90" stroke="#228B22" stroke-width="1"/></g>`;
  }

  if (name.includes('cerveja') || name.includes('beer')) {
    return `<g><rect x="120" y="60" width="80" height="95" rx="3" fill="#F4A460" stroke="#A0522D" stroke-width="2"/>
            <ellipse cx="160" cy="55" rx="45" ry="12" fill="#F5DEB3"/>
            <text x="160" y="110" text-anchor="middle" font-size="24">🍺</text></g>`;
  }

  if (name.includes('vinho') || name.includes('sangria')) {
    return `<g><path d="M 130 70 L 135 130 Q 160 140 185 130 L 190 70 Z" fill="#722F37" stroke="#5A1F22" stroke-width="2"/>
            <ellipse cx="160" cy="70" rx="30" ry="8" fill="#722F37"/></g>`;
  }

  if (name.includes('coquetel') || name.includes('mojito') || name.includes('margarita')) {
    return `<g><path d="M 130 80 L 125 130 Q 160 135 195 130 L 190 80 Z" fill="#FF69B4" stroke="#FF1493" stroke-width="2"/>
            <circle cx="160" cy="60" r="8" fill="#FF4500"/><path d="M 155 50 L 165 50" stroke="#228B22" stroke-width="2"/></g>`;
  }

  if (name.includes('bife') || name.includes('carne') || name.includes('steak') || name.includes('alcatra')) {
    return `<g><ellipse cx="160" cy="100" rx="50" ry="35" fill="#8B4513" stroke="#654321" stroke-width="2"/>
            <ellipse cx="140" cy="95" rx="8" ry="5" fill="#A0522D"/><ellipse cx="175" cy="105" rx="8" ry="5" fill="#A0522D"/>
            <path d="M 130 100 Q 145 92 160 100 Q 175 108 190 100" stroke="#654321" stroke-width="1" fill="none"/></g>`;
  }

  if (name.includes('frango') || name.includes('chicken') || name.includes('medalhão')) {
    return `<g><ellipse cx="160" cy="100" rx="45" ry="40" fill="#DAA520" stroke="#B8860B" stroke-width="2"/>
            <circle cx="150" cy="85" r="6" fill="#DC143C"/><circle cx="170" cy="88" r="5" fill="#DC143C"/>
            <path d="M 145 110 L 142 130 M 175 110 L 178 130" stroke="#DAA520" stroke-width="3"/></g>`;
  }

  if (name.includes('peixe') || name.includes('salmão') || name.includes('bacalhau')) {
    return `<g><ellipse cx="160" cy="100" rx="50" ry="30" fill="#FF8C69" stroke="#FF6347" stroke-width="2"/>
            <circle cx="145" cy="95" r="4" fill="#000"/><path d="M 150 95 L 140 90 L 140 100" fill="#FF8C69"/>
            <path d="M 200 90 L 220 80 L 220 110 Z" fill="#FF8C69"/></g>`;
  }

  if (name.includes('costela') || name.includes('ribs')) {
    return `<g><rect x="115" y="75" width="90" height="60" rx="5" fill="#8B4513" stroke="#654321" stroke-width="2"/>
            <line x1="125" y1="75" x2="125" y2="135" stroke="#654321" stroke-width="1"/><line x1="140" y1="75" x2="140" y2="135" stroke="#654321" stroke-width="1"/>
            <line x1="155" y1="75" x2="155" y2="135" stroke="#654321" stroke-width="1"/><line x1="170" y1="75" x2="170" y2="135" stroke="#654321" stroke-width="1"/>
            <line x1="185" y1="75" x2="185" y2="135" stroke="#654321" stroke-width="1"/></g>`;
  }

  if (name.includes('bruschetta') || name.includes('tomate')) {
    return `<g><rect x="120" y="85" width="80" height="50" rx="3" fill="#D2B48C" stroke="#8B7355" stroke-width="2"/>
            <ellipse cx="135" cy="95" rx="8" ry="6" fill="#DC143C"/><ellipse cx="160" cy="100" rx="8" ry="6" fill="#DC143C"/>
            <ellipse cx="185" cy="92" rx="8" ry="6" fill="#DC143C"/></g>`;
  }

  if (name.includes('queijo')) {
    return `<g><rect x="110" y="70" width="100" height="80" rx="8" fill="#FFD700" stroke="#FFA500" stroke-width="2"/>
            <circle cx="130" cy="90" r="5" fill="#FFE4B5" opacity="0.6"/><circle cx="160" cy="105" r="6" fill="#FFE4B5" opacity="0.6"/>
            <circle cx="185" cy="95" r="4" fill="#FFE4B5" opacity="0.6"/></g>`;
  }

  if (name.includes('bolinho')) {
    return `<g><circle cx="140" cy="90" r="20" fill="#DAA520" stroke="#B8860B" stroke-width="2"/>
            <circle cx="160" cy="100" r="22" fill="#DAA520" stroke="#B8860B" stroke-width="2"/>
            <circle cx="180" cy="90" r="19" fill="#DAA520" stroke="#B8860B" stroke-width="2"/></g>`;
  }

  if (name.includes('batata') || name.includes('frita') || name.includes('fritas')) {
    return `<g><rect x="125" y="60" width="15" height="80" fill="#DAA520" stroke="#B8860B" stroke-width="1"/>
            <rect x="145" y="50" width="15" height="90" fill="#F4A460" stroke="#B8860B" stroke-width="1"/>
            <rect x="165" y="65" width="15" height="75" fill="#DAA520" stroke="#B8860B" stroke-width="1"/>
            <rect x="185" y="55" width="15" height="85" fill="#F4A460" stroke="#B8860B" stroke-width="1"/></g>`;
  }

  if (name.includes('coxinha') || name.includes('croquete')) {
    return `<g><path d="M 160 60 L 145 110 L 175 110 Z" fill="#DAA520" stroke="#B8860B" stroke-width="2"/>
            <path d="M 160 65 L 150 105 L 170 105 Z" fill="#F4A460" opacity="0.7"/></g>`;
  }

  if (name.includes('salada')) {
    return `<g><ellipse cx="160" cy="105" rx="50" ry="35" fill="#90EE90" stroke="#228B22" stroke-width="2"/>
            <path d="M 140 85 Q 135 75 140 65" stroke="#228B22" stroke-width="2"/><path d="M 160 80 Q 155 68 160 55" stroke="#228B22" stroke-width="2"/>
            <path d="M 180 85 Q 185 75 180 65" stroke="#228B22" stroke-width="2"/>
            <circle cx="145" cy="105" r="4" fill="#DC143C"/><circle cx="160" cy="115" r="4" fill="#DC143C"/><circle cx="175" cy="108" r="4" fill="#DC143C"/></g>`;
  }

  if (name.includes('pasta') || name.includes('espaguete') || name.includes('lasanha')) {
    return `<g><ellipse cx="160" cy="110" rx="55" ry="40" fill="#F4A460" stroke="#8B4513" stroke-width="2"/>
            <path d="M 130 100 Q 140 95 160 95 Q 180 95 190 100" stroke="#F4A460" stroke-width="3"/>
            <path d="M 135 110 Q 150 105 160 110 Q 170 115 185 110" stroke="#FF6347" stroke-width="2"/></g>`;
  }

  if (name.includes('arroz') || name.includes('risoto')) {
    return `<g><circle cx="150" cy="95" r="3" fill="#F4A460"/><circle cx="160" cy="90" r="3" fill="#F4A460"/>
            <circle cx="170" cy="95" r="3" fill="#F4A460"/><circle cx="155" cy="105" r="3" fill="#F4A460"/>
            <circle cx="165" cy="105" r="3" fill="#F4A460"/><circle cx="160" cy="115" r="3" fill="#F4A460"/>
            <ellipse cx="160" cy="105" rx="60" ry="45" fill="none" stroke="#CD853F" stroke-width="2"/></g>`;
  }

  return `<g><ellipse cx="160" cy="100" rx="55" ry="45" fill="#FF6B6B" stroke="#DC143C" stroke-width="2"/>
          <path d="M 140 85 Q 160 70 180 85" stroke="#FFD700" stroke-width="3" fill="none"/>
          <circle cx="150" cy="105" r="5" fill="#FFD700"/><circle cx="170" cy="105" r="5" fill="#FFD700"/></g>`;
};

/**
 * Builds the complete SVG response for a menu item illustration.
 */
const buildItemImageSvg = (itemName) => {
  const decodedName = decodeURIComponent(itemName).toLowerCase();
  const foodSvg = getFoodSvgFragment(decodedName);

  return `<svg width="320" height="200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F0F0F0;stop-opacity:0.1" />
        <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:0.2" />
      </linearGradient>
    </defs>
    <rect width="320" height="200" fill="#FFFFFF" stroke="#EEEEEE" stroke-width="1"/>
    <rect width="320" height="200" fill="url(#grad)"/>
    ${foodSvg}
  </svg>`;
};

module.exports = {
  buildItemImageSvg,
};