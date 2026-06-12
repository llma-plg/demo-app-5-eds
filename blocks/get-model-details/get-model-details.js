// Sample data for standalone/preview mode.
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    "name": "2026 IONIQ 5",
    "description": "Award-winning electric SUV with up to 320 hp and EPA-est. 303 mile range.",
    "image_url": "https://s7d1.scene7.com/is/image/hyundai/2025-ioniq-5-se-standard-range-rwd-digital-teal-ev-tool",
    "price": "$35,000",
    "category": "Electric"
  },
  {
    "name": "2026 Santa Fe",
    "description": "Adventurous compact SUV with aggressive front grille and available HTRAC AWD.",
    "image_url": "https://s7d1.scene7.com/is/image/hyundai/2026-santa-fe-calligraphy-fwd-earthy-brass-matte-vehicle-browse-hero",
    "price": "$33,500",
    "category": "SUV"
  },
  {
    "name": "2026 Palisade",
    "description": "Three-row upscale midsize SUV with premium comfort and technology.",
    "image_url": "https://s7d1.scene7.com/is/image/hyundai/2026-palisade-calligraphy-fwd-steelgraphite-vehicle-browse-hero",
    "price": "$36,350",
    "category": "SUV"
  },
  {
    "name": "2026 Elantra",
    "description": "Compact sedan featuring technical innovations and bold styling.",
    "image_url": "https://s7d1.scene7.com/is/image/hyundai/2025-elantra-ice-se-fwd-intense-blue-pearl-vehicle-browse-hero",
    "price": "$22,625",
    "category": "Sedan"
  },
  {
    "name": "2025 IONIQ 6",
    "description": "Aerodynamic electric sedan with ultra-fast charging and LED pixel lights.",
    "image_url": "https://s7d1.scene7.com/is/image/hyundai/2025-ioniq-6-limited-rwd-transmission-blue-pearl-global-nav?qlt=85&hei=600&fmt=webp-alpha",
    "price": "$37,850",
    "category": "Electric"
  },
  {
    "name": "2026 IONIQ 9",
    "description": "All-electric three-row SUV with spacious interior and IONIQ family innovations.",
    "image_url": "https://s7d1.scene7.com/is/image/hyundai/2026-ioniq-9-s-rwd-snow-white-vehicle-browse-hero",
    "price": "$58,955",
    "category": "Electric"
  }
];

// Brand palette from action payload
const PALETTE = ['#e7e7e7','#333333','#002c5e','#3860be','#555555'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#', '');
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if (hex.length !== 6) return null;
  let [r, g, b] = [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  const lum = (c) => { const s=c/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4); };
  const relLum = (r,g,b) => 0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if (relLum(r,g,b) <= 0.12) return { bg: `#${hex}`, fg: '#ffffff' };
  let lo=0, hi=1;
  for (let i=0; i<20; i++) {
    const m=(lo+hi)/2;
    if (relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m)) > 0.12) hi=m; else lo=m;
  }
  const dr=Math.round(r*lo), dg=Math.round(g*lo), db=Math.round(b*lo);
  return {
    bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`,
    fg:'#ffffff'
  };
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let model;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      model = SAMPLE_DATA[0];
    } else {
      // Production - single object output (not array)
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      model = structuredContent;
    }
  } else {
    // Standalone EDS preview
    model = SAMPLE_DATA[0];
  }

  block.textContent = '';
  renderModelDetail(block, model, bridge);

  if (bridge) {
    bridge.reportSize(block.offsetWidth, block.offsetHeight);
    let resizeTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => bridge.reportSize(block.offsetWidth, block.offsetHeight), 150);
    });
    ro.observe(block);
  }
}

function renderModelDetail(block, model, bridge) {
  if (!model) {
    block.textContent = 'No model data available';
    return;
  }

  const card = document.createElement('div');
  card.className = 'model-card';

  // Left: Image with CTA
  const imageSection = document.createElement('div');
  imageSection.className = 'model-image';

  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];
  const fallbackColor = CARD_COLORS[0];
  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
    return d;
  };

  if (model.image_url) {
    const img = document.createElement('img');
    img.src = model.image_url;
    img.alt = model.name || 'Vehicle model';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => {
      if (img.parentNode) {
        img.parentNode.replaceChild(colorDiv(), img);
      }
    };
    imageSection.appendChild(img);
  } else {
    imageSection.appendChild(colorDiv());
  }

  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-on-image';
  ctaBtn.textContent = 'Build & Price';
  ctaBtn.setAttribute('aria-label', `Build and price ${model.name || 'this vehicle'}`);
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`I want to build and price the ${model.name}`);
    });
  }
  imageSection.appendChild(ctaBtn);

  card.appendChild(imageSection);

  // Right: Details with darkened palette background
  const detailsSection = document.createElement('div');
  detailsSection.className = 'model-details';
  detailsSection.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  const nameEl = document.createElement('h2');
  nameEl.className = 'model-name';
  nameEl.textContent = model.name || 'Unknown Model';
  detailsSection.appendChild(nameEl);

  const descEl = document.createElement('p');
  descEl.className = 'model-description';
  descEl.textContent = model.description || '';
  detailsSection.appendChild(descEl);

  const priceEl = document.createElement('div');
  priceEl.className = 'model-price';
  priceEl.textContent = model.price || model.starting_msrp ? `Starting at ${model.price || '$'+model.starting_msrp.toLocaleString()}` : '';
  detailsSection.appendChild(priceEl);

  if (model.category) {
    const categoryChip = document.createElement('span');
    categoryChip.className = 'category-chip';
    categoryChip.textContent = model.category;
    detailsSection.appendChild(categoryChip);
  }

  card.appendChild(detailsSection);
  block.appendChild(card);
}
