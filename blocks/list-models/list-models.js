const SAMPLE_DATA = [
  {
    name: '2026 IONIQ 5',
    description: 'Award-winning electric SUV with up to 320 hp and EPA-est. 303 mile range.',
    image_url: 'https://s7d1.scene7.com/is/image/hyundai/2025-ioniq-5-se-standard-range-rwd-digital-teal-ev-tool',
    price: '$35,000',
    category: 'Electric'
  },
  {
    name: '2026 Santa Fe',
    description: 'Adventurous compact SUV with aggressive front grille and available HTRAC AWD.',
    image_url: 'https://s7d1.scene7.com/is/image/hyundai/2026-santa-fe-calligraphy-fwd-earthy-brass-matte-vehicle-browse-hero',
    price: '$33,500',
    category: 'SUV'
  },
  {
    name: '2026 Palisade',
    description: 'Three-row upscale midsize SUV with premium comfort and technology.',
    image_url: 'https://s7d1.scene7.com/is/image/hyundai/2026-palisade-calligraphy-fwd-steelgraphite-vehicle-browse-hero',
    price: '$36,350',
    category: 'SUV'
  },
  {
    name: '2026 Elantra',
    description: 'Compact sedan featuring technical innovations and bold styling.',
    image_url: 'https://s7d1.scene7.com/is/image/hyundai/2025-elantra-ice-se-fwd-intense-blue-pearl-vehicle-browse-hero',
    price: '$22,625',
    category: 'Sedan'
  },
  {
    name: '2025 IONIQ 6',
    description: 'Aerodynamic electric sedan with ultra-fast charging and LED pixel lights.',
    image_url: 'https://s7d1.scene7.com/is/image/hyundai/2025-ioniq-6-limited-rwd-transmission-blue-pearl-global-nav?qlt=85&hei=600&fmt=webp-alpha',
    price: '$37,850',
    category: 'Electric'
  },
  {
    name: '2026 IONIQ 9',
    description: 'All-electric three-row SUV with spacious interior and IONIQ family innovations.',
    image_url: 'https://s7d1.scene7.com/is/image/hyundai/2026-ioniq-9-s-rwd-snow-white-vehicle-browse-hero',
    price: '$58,955',
    category: 'Electric'
  }
];

const PALETTE = ['#e7e7e7','#333333','#002c5e','#3860be','#555555'];
const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

function getThemedCardBg(palette) {
  if (!palette || !palette[0]) return null;
  let hex = palette[0].replace('#','');
  if(hex.length===3)hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  if(hex.length!==6)return null;
  let [r,g,b]=[parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];
  if(isNaN(r)||isNaN(g)||isNaN(b))return null;
  const lum=(c)=>{const s=c/255;return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4);};
  const relLum=(r,g,b)=>0.2126*lum(r)+0.7152*lum(g)+0.0722*lum(b);
  if(relLum(r,g,b)<=0.12)return{bg:`#${hex}`,fg:'#ffffff'};
  let lo=0,hi=1;
  for(let i=0;i<20;i++){const m=(lo+hi)/2;if(relLum(Math.round(r*m),Math.round(g*m),Math.round(b*m))>0.12)hi=m;else lo=m;}
  const dr=Math.round(r*lo),dg=Math.round(g*lo),db=Math.round(b*lo);
  return{bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`,fg:'#ffffff'};
}

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let items;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      items = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      items = structuredContent?.models || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';
  renderCarousel(block, items, bridge);
  
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

function renderCarousel(block, items, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const carousel = document.createElement('div');
  carousel.className = 'carousel';

  items.slice(0, 6).forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'card';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'card-image';

    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const colorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };

    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
      imageContainer.appendChild(img);
    } else {
      imageContainer.appendChild(colorDiv());
    }

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-on-image';
    ctaBtn.textContent = 'View Details';
    ctaBtn.setAttribute('aria-label', `View details for ${item.name}`);
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        bridge.sendMessage(`Tell me more about the ${item.name}`);
      });
    }
    imageContainer.appendChild(ctaBtn);

    card.appendChild(imageContainer);

    const content = document.createElement('div');
    content.className = 'card-content';
    content.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = item.name;
    content.appendChild(name);

    const priceRow = document.createElement('div');
    priceRow.className = 'card-price-row';

    const price = document.createElement('span');
    price.className = 'card-price';
    price.textContent = item.price;
    priceRow.appendChild(price);

    if (item.category) {
      const badge = document.createElement('span');
      badge.className = 'card-badge';
      badge.textContent = item.category;
      priceRow.appendChild(badge);
    }

    content.appendChild(priceRow);
    card.appendChild(content);
    carousel.appendChild(card);
  });

  wrapper.appendChild(carousel);

  const leftArrow = document.createElement('button');
  leftArrow.className = 'arrow arrow-left';
  leftArrow.setAttribute('aria-label', 'Scroll left');
  leftArrow.textContent = '◀';
  leftArrow.style.display = 'none';

  const rightArrow = document.createElement('button');
  rightArrow.className = 'arrow arrow-right';
  rightArrow.setAttribute('aria-label', 'Scroll right');
  rightArrow.textContent = '▶';

  const updateArrows = () => {
    const atStart = carousel.scrollLeft <= 1;
    const atEnd = carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth - 1;
    leftArrow.style.display = atStart ? 'none' : 'flex';
    rightArrow.style.display = atEnd ? 'none' : 'flex';
  };

  const scrollByCard = (direction) => {
    const cardWidth = 220 + 16;
    carousel.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };

  leftArrow.addEventListener('click', () => scrollByCard(-1));
  rightArrow.addEventListener('click', () => scrollByCard(1));
  leftArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollByCard(-1);
    }
  });
  rightArrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollByCard(1);
    }
  });

  carousel.addEventListener('scroll', updateArrows);
  updateArrows();

  const fade = document.createElement('div');
  fade.className = 'fade-right';
  fade.style.cssText = `position:absolute;top:0;right:0;height:100%;width:60px;background:linear-gradient(to right,transparent,${theme?.bg ?? '#1a1a1a'}cc);pointer-events:none;border-radius:0 10px 10px 0;`;
  wrapper.appendChild(fade);

  wrapper.appendChild(leftArrow);
  wrapper.appendChild(rightArrow);

  block.appendChild(wrapper);
}
