// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = {
  name: 'Sample Product',
  description: 'This is a sample product description that will be replaced with real data when the widget receives information from the bridge.',
  price: 99.99,
  category: 'Sample Category',
  materials: 'Sample materials and fabric composition',
  colors: ['Color 1', 'Color 2', 'Color 3'],
  image_url: 'https://via.placeholder.com/400x533/2563eb/ffffff?text=Product+Image'
};

// Brand palette from BuildWidgetRequest — empty palette uses fallback colors.
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

const theme = getThemedCardBg(PALETTE);

export default async function decorate(block, bridge) {
  let product;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      product = SAMPLE_DATA;
    } else {
      // Single object detail view — structuredContent is the product object
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      product = structuredContent || {};
    }
  } else {
    product = SAMPLE_DATA;
  }

  block.textContent = '';
  renderProduct(block, product, bridge);

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

function renderProduct(block, product, bridge) {
  const card = document.createElement('div');
  card.className = 'product-detail-card';

  // Image section (left)
  const imageSection = document.createElement('div');
  imageSection.className = 'product-image';

  const CARD_COLORS = ['#378ef0','#9256d9','#0fb5ae','#e68619','#d83790','#2dca72','#4046ca','#72b340'];
  const fallbackColor = CARD_COLORS[0];

  const colorDiv = () => {
    const d = document.createElement('div');
    d.style.cssText = `width:100%;height:100%;background-color:${fallbackColor};display:flex;align-items:center;justify-content:center;color:white;font-size:14px;text-align:center;padding:20px;box-sizing:border-box;`;
    d.textContent = product.name || 'Product Image';
    return d;
  };

  if (product.image_url) {
    const img = document.createElement('img');
    img.src = product.image_url;
    img.alt = product.name || 'Product image';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = () => img.parentNode.replaceChild(colorDiv(), img);
    imageSection.appendChild(img);
  } else {
    imageSection.appendChild(colorDiv());
  }

  // CTA button on image
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'cta-btn';
  ctaBtn.textContent = 'Shop Now';
  ctaBtn.setAttribute('aria-label', `Shop for ${product.name || 'this product'}`);
  if (bridge) {
    ctaBtn.addEventListener('click', () => {
      bridge.sendMessage(`I want to buy ${product.name || 'this product'}`);
    });
  }
  imageSection.appendChild(ctaBtn);

  card.appendChild(imageSection);

  // Content section (right)
  const contentSection = document.createElement('div');
  contentSection.className = 'product-content';
  contentSection.style.cssText = `background:${theme?.bg ?? '#1a1a1a'};color:${theme?.fg ?? '#fff'}`;

  // Category badge
  if (product.category) {
    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'category-badge';
    categoryBadge.textContent = product.category;
    contentSection.appendChild(categoryBadge);
  }

  // Product name
  const name = document.createElement('h2');
  name.className = 'product-name';
  name.textContent = product.name || 'Product Name';
  contentSection.appendChild(name);

  // Description
  const description = document.createElement('p');
  description.className = 'product-description';
  description.textContent = product.description || '';
  contentSection.appendChild(description);

  // Price
  if (product.price !== undefined && product.price !== null) {
    const priceEl = document.createElement('div');
    priceEl.className = 'product-price';
    priceEl.textContent = `$${Number(product.price).toFixed(2)}`;
    contentSection.appendChild(priceEl);
  }

  // Materials
  if (product.materials) {
    const materialsEl = document.createElement('div');
    materialsEl.className = 'product-materials';

    const materialsLabel = document.createElement('span');
    materialsLabel.className = 'materials-label';
    materialsLabel.textContent = 'Materials: ';
    materialsEl.appendChild(materialsLabel);

    const materialsText = document.createElement('span');
    materialsText.textContent = product.materials;
    materialsEl.appendChild(materialsText);

    contentSection.appendChild(materialsEl);
  }

  // Colors
  if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
    const colorsEl = document.createElement('div');
    colorsEl.className = 'product-colors';

    const colorsLabel = document.createElement('span');
    colorsLabel.className = 'colors-label';
    colorsLabel.textContent = 'Available Colors: ';
    colorsEl.appendChild(colorsLabel);

    const colorsText = document.createElement('span');
    colorsText.textContent = product.colors.join(', ');
    colorsEl.appendChild(colorsText);

    contentSection.appendChild(colorsEl);
  }

  card.appendChild(contentSection);
  block.appendChild(card);
}
