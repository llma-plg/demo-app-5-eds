const SAMPLE_DATA = [
  {
    name: 'Men\'s Nano Puff Jacket',
    price: 249,
    category: 'Jackets & Vests',
    image_url: 'https://www.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dw3f8e8f3e/images/hi-res/84212_NPTR.jpg',
    product_url: 'https://www.patagonia.com/product/mens-nano-puff-jacket/84212.html'
  },
  {
    name: 'Women\'s Better Sweater Fleece Jacket',
    price: 149,
    category: 'Fleece',
    image_url: 'https://www.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dw8c3f5d8a/images/hi-res/25542_NVYB.jpg',
    product_url: 'https://www.patagonia.com/product/womens-better-sweater-fleece-jacket/25542.html'
  },
  {
    name: 'Men\'s Capilene Thermal Weight Crew',
    price: 99,
    category: 'Baselayers',
    image_url: 'https://www.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dw4a7e6f2b/images/hi-res/43660_BLK.jpg',
    product_url: 'https://www.patagonia.com/product/mens-capilene-thermal-weight-crew/43660.html'
  },
  {
    name: 'Black Hole Duffel 55L',
    price: 149,
    category: 'Bags & Packs',
    image_url: 'https://www.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dw8f3e5c7a/images/hi-res/49341_BLK.jpg',
    product_url: 'https://www.patagonia.com/product/black-hole-duffel-bag-55-liters/49341.html'
  },
  {
    name: 'Men\'s Torrentshell 3L Jacket',
    price: 179,
    category: 'Jackets & Vests',
    image_url: 'https://www.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dw6e8f4d2a/images/hi-res/85240_SNBL.jpg',
    product_url: 'https://www.patagonia.com/product/mens-torrentshell-3l-rain-jacket/85240.html'
  }
];

const PALETTE = [];

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
  return { bg:`#${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')}`, fg:'#ffffff' };
}

const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];

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
      items = structuredContent?.products || [];
    }
  } else {
    items = SAMPLE_DATA;
  }

  block.textContent = '';

  if (!items || items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const p = document.createElement('p');
    p.textContent = 'No products found.';
    empty.appendChild(p);
    block.appendChild(empty);
    if (bridge) {
      bridge.reportSize(block.offsetWidth, block.offsetHeight);
    }
    return;
  }

  const theme = getThemedCardBg(PALETTE);
  renderCarousel(block, items, theme, bridge);

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

function renderCarousel(block, items, theme, bridge) {
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-wrapper';

  const container = document.createElement('div');
  container.className = 'carousel-container';

  items.slice(0, 5).forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imageDiv = document.createElement('div');
    imageDiv.className = 'product-image';

    const fallbackColor = CARD_COLORS[i % CARD_COLORS.length];
    const createColorDiv = () => {
      const d = document.createElement('div');
      d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};`;
      return d;
    };

    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.name || '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
      img.onerror = () => {
        if (img.parentNode) {
          img.parentNode.replaceChild(createColorDiv(), img);
        }
      };
      imageDiv.appendChild(img);
    } else {
      imageDiv.appendChild(createColorDiv());
    }

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'cta-btn';
    ctaBtn.textContent = 'View Details';
    ctaBtn.setAttribute('aria-label', `View details for ${item.name || 'product'}`);
    if (bridge) {
      ctaBtn.addEventListener('click', () => {
        if (item.product_url) {
          bridge.openLink(item.product_url);
        } else {
          bridge.sendMessage(`Tell me more about ${item.name}`);
        }
      });
    }
    imageDiv.appendChild(ctaBtn);

    card.appendChild(imageDiv);

    const info = document.createElement('div');
    info.className = 'product-info';
    const bgColor = theme?.bg || '#1a1a1a';
    const fgColor = theme?.fg || '#fff';
    info.style.cssText = `background:${bgColor};color:${fgColor};`;

    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = item.name || 'Product';
    name.style.color = fgColor;
    info.appendChild(name);

    const meta = document.createElement('div');
    meta.className = 'product-meta';

    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = item.price ? `$${item.price}` : '';
    price.style.color = fgColor;
    meta.appendChild(price);

    if (item.category) {
      const category = document.createElement('span');
      category.className = 'product-category';
      category.textContent = item.category;
      meta.appendChild(category);
    }

    info.appendChild(meta);
    card.appendChild(info);
    container.appendChild(card);
  });

  wrapper.appendChild(container);

  const navLeft = document.createElement('button');
  navLeft.className = 'carousel-nav nav-left hidden';
  navLeft.innerHTML = '◀';
  navLeft.setAttribute('aria-label', 'Scroll left');
  navLeft.addEventListener('click', () => scrollCarousel(container, -1, navLeft, navRight));
  navLeft.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollCarousel(container, -1, navLeft, navRight);
    }
  });

  const navRight = document.createElement('button');
  navRight.className = 'carousel-nav nav-right';
  navRight.innerHTML = '▶';
  navRight.setAttribute('aria-label', 'Scroll right');
  navRight.addEventListener('click', () => scrollCarousel(container, 1, navLeft, navRight));
  navRight.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollCarousel(container, 1, navLeft, navRight);
    }
  });

  wrapper.appendChild(navLeft);
  wrapper.appendChild(navRight);

  const fade = document.createElement('div');
  fade.className = 'fade-right';
  const fadeEndColor = theme?.bg || '#1a1a1a';
  fade.style.cssText = `background:linear-gradient(to right, transparent, ${fadeEndColor}cc);`;
  wrapper.appendChild(fade);

  container.addEventListener('scroll', () => updateNavButtons(container, navLeft, navRight));
  updateNavButtons(container, navLeft, navRight);

  block.appendChild(wrapper);
}

function scrollCarousel(container, direction, navLeft, navRight) {
  const cardWidth = 220 + 16;
  container.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  setTimeout(() => updateNavButtons(container, navLeft, navRight), 300);
}

function updateNavButtons(container, navLeft, navRight) {
  const atStart = container.scrollLeft <= 1;
  const atEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 1;
  navLeft.classList.toggle('hidden', atStart);
  navRight.classList.toggle('hidden', atEnd);
}