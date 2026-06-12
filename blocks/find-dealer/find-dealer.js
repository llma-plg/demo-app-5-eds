// Sample data for standalone EDS preview (no bridge).
// In production, data comes dynamically from bridge.toolResult.
const SAMPLE_DATA = [
  {
    name: 'Hyundai of Downtown',
    address: '123 Main Street, Los Angeles, CA 90012',
    phone: '(555) 123-4567',
    distance_miles: 2.3,
    services: ['Sales', 'Service', 'Parts']
  },
  {
    name: 'Premier Hyundai',
    address: '456 Oak Avenue, Los Angeles, CA 90015',
    phone: '(555) 234-5678',
    distance_miles: 4.7,
    services: ['Sales', 'Service']
  }
];

// Brand palette from BuildWidgetRequest
const PALETTE = ['#e7e7e7', '#333333', '#002c5e', '#3860be', '#555555'];

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
  let dealers;
  let showSearch = true;

  if (bridge) {
    bridge.applyHostStyles();
    const isPreview = bridge.hostContext?.preview === true;
    if (isPreview) {
      dealers = SAMPLE_DATA;
    } else {
      const _result = await bridge.toolResult;
      const structuredContent = _result?.structuredContent || _result;
      // structuredContent.dealers — bare array outputSchema; key derived from actionName "find_dealer"
      dealers = structuredContent?.dealers || [];
      showSearch = !dealers || dealers.length === 0;
    }
  } else {
    dealers = SAMPLE_DATA;
    showSearch = false;
  }

  block.textContent = '';

  if (showSearch) {
    renderSearchCard(block, bridge);
  } else {
    renderDealers(block, dealers, bridge);
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

function renderSearchCard(block, bridge) {
  const container = document.createElement('div');
  container.className = 'find-dealer-search';

  const card = document.createElement('div');
  card.className = 'search-card';
  card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

  // Pin icon
  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'pin-icon';
  iconWrapper.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.7"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
  card.appendChild(iconWrapper);

  // Heading
  const heading = document.createElement('h2');
  heading.textContent = 'Find a store near you';
  heading.style.cssText = `color:${theme?.fg ?? '#fff'}`;
  card.appendChild(heading);

  // Input
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Enter ZIP code...';
  input.className = 'zip-input';
  input.setAttribute('aria-label', 'ZIP code');
  card.appendChild(input);

  // Button
  const button = document.createElement('button');
  button.className = 'search-btn';
  button.textContent = 'Find Dealers';
  button.style.cssText = `background:${PALETTE[0] ?? '#e7e7e7'};color:#333`;

  if (bridge) {
    button.addEventListener('click', () => {
      const zip = input.value.trim();
      if (zip) {
        bridge.sendMessage(`Find Hyundai dealers near ${zip}`);
      }
    });
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const zip = input.value.trim();
        if (zip) {
          bridge.sendMessage(`Find Hyundai dealers near ${zip}`);
        }
      }
    });
  }

  card.appendChild(button);
  container.appendChild(card);
  block.appendChild(container);
}

function renderDealers(block, dealers, bridge) {
  const container = document.createElement('div');
  container.className = 'find-dealer-results';

  const maxDisplay = Math.min(dealers.length, 2);
  for (let i = 0; i < maxDisplay; i++) {
    const dealer = dealers[i];
    const card = document.createElement('div');
    card.className = 'dealer-card';
    card.style.cssText = `background:${theme?.bg ?? '#1a3a5c'};color:${theme?.fg ?? '#fff'}`;

    // Pin circle
    const pinCircle = document.createElement('div');
    pinCircle.className = 'pin-circle';
    pinCircle.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    card.appendChild(pinCircle);

    // Name
    const name = document.createElement('h3');
    name.textContent = dealer.name;
    name.className = 'dealer-name';
    name.style.cssText = `color:${theme?.fg ?? '#fff'}`;
    card.appendChild(name);

    // Address
    const address = document.createElement('p');
    address.textContent = dealer.address;
    address.className = 'dealer-address';
    card.appendChild(address);

    // Phone
    if (dealer.phone) {
      const phone = document.createElement('p');
      phone.textContent = dealer.phone;
      phone.className = 'dealer-phone';
      phone.style.cssText = `color:${PALETTE[0] ?? '#e7e7e7'}`;
      card.appendChild(phone);
    }

    // Distance & Services
    if (dealer.distance_miles || dealer.services) {
      const meta = document.createElement('p');
      meta.className = 'dealer-meta';
      const parts = [];
      if (dealer.distance_miles) parts.push(`${dealer.distance_miles} mi`);
      if (dealer.services && dealer.services.length > 0) parts.push(dealer.services.join(', '));
      meta.textContent = parts.join(' • ');
      card.appendChild(meta);
    }

    container.appendChild(card);
  }

  block.appendChild(container);
}
