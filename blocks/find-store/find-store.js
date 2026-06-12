// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [];

// Brand palette from BuildWidgetRequest.
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
  let stores;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      stores = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.stores — bare array outputSchema; key derived from actionName "find_store"
      stores = structuredContent?.stores || [];
    }
  } else {
    stores = SAMPLE_DATA;
  }

  block.textContent = '';

  if (!stores || stores.length === 0) {
    renderEmptyState(block, bridge);
  } else {
    renderStores(block, stores, bridge);
  }

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

function renderEmptyState(block, bridge) {
  const card = document.createElement('div');
  card.className = 'find-store-empty';
  card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'pin-icon';
  iconWrapper.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
  card.appendChild(iconWrapper);

  const heading = document.createElement('h2');
  heading.textContent = 'Find a store near you';
  card.appendChild(heading);

  const form = document.createElement('form');
  form.className = 'search-form';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'zip-input';
  input.placeholder = 'Enter ZIP code...';
  input.setAttribute('aria-label', 'ZIP code');
  form.appendChild(input);

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'search-btn';
  button.textContent = 'Find Nearby';
  form.appendChild(button);

  if (bridge) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const zip = input.value.trim();
      if (zip) {
        bridge.sendMessage(`Find stores near ${zip}`);
      }
    });
  }

  card.appendChild(form);
  block.appendChild(card);
}

function renderStores(block, stores, bridge) {
  const container = document.createElement('div');
  container.className = 'find-store-results';

  const displayStores = stores.slice(0, 2);

  displayStores.forEach(store => {
    const card = document.createElement('div');
    card.className = 'store-card';
    card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    const iconCircle = document.createElement('div');
    iconCircle.className = 'store-icon';
    iconCircle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
    card.appendChild(iconCircle);

    const name = document.createElement('h3');
    name.className = 'store-name';
    name.textContent = store.name || 'Store';
    card.appendChild(name);

    if (store.address) {
      const address = document.createElement('p');
      address.className = 'store-address';
      address.textContent = store.address;
      card.appendChild(address);
    }

    if (store.phone) {
      const phone = document.createElement('a');
      phone.className = 'store-phone';
      phone.href = `tel:${store.phone}`;
      phone.textContent = store.phone;
      card.appendChild(phone);
    }

    if (store.hours) {
      const hours = document.createElement('p');
      hours.className = 'store-hours';
      hours.textContent = store.hours;
      card.appendChild(hours);
    }

    if (store.distance) {
      const distance = document.createElement('p');
      distance.className = 'store-distance';
      distance.textContent = store.distance;
      card.appendChild(distance);
    }

    container.appendChild(card);
  });

  block.appendChild(container);
}
