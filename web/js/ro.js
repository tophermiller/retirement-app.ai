
/* Icons */
function icon(name){
  const wrap = document.createElement('span'); wrap.className = 'icon';
  const svgs = {
    basics: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7aa2f7"/><stop offset="1" stop-color="#89dceb"/></linearGradient></defs>
        <path fill="url(#g1)" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.239-8 5v1h16v-1c0-2.761-3.58-5-8-5Z"/>
      </svg>`,
    results: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <g fill="#7aa2f7">
          <rect x="4" y="13" width="3" height="7" rx="1"/>
          <rect x="10.5" y="9" width="3" height="11" rx="1"/>
          <rect x="17" y="5" width="3" height="15" rx="1"/>
        </g>
      </svg>`,
    growth: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#cba6f7" d="M3 17h2.5V8.5L10 13l4-4 3.5 3.5L21 10v7h-2v-3.59l-2.5 2.5L13 12.5l-4 4-3.5-3.5V17Z"/>
      </svg>`,
    liquid: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="drop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#89dceb"/><stop offset="1" stop-color="#7aa2f7"/>
          </linearGradient>
        </defs>
        <path fill="url(#drop)" d="M12 2s6 6.5 6 11a6 6 0 0 1-12 0C6 8.5 12 2 12 2Z"/>
        <circle cx="15" cy="10" r="1.5" fill="rgba(255,255,255,0.6)"/>
      </svg>`,
    realestate: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#fab387" d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"/>
      </svg>`,
    income: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <g fill="#a6e3a1">
          <path d="M12 3 3 7v2h18V7l-9-4z"/>
          <rect x="5" y="9" width="2" height="8" rx="1"/>
          <rect x="11" y="9" width="2" height="8" rx="1"/>
          <rect x="17" y="9" width="2" height="8" rx="1"/>
          <rect x="3" y="17" width="18" height="2" rx="1"/>
          <path d="M11 5v6H8l4 4 4-4h-3V5z"/>
        </g>
      </svg>`,
    expenses: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <g fill="#f7768e">
          <path d="M7 3h10a2 2 0 0 1 2 2v11.8l-1.5-.9-1.5.9-1.5-.9-1.5.9-1.5-.9-1.5.9-1.5-.9-1.5.9V5a2 2 0 0 1 2-2z"/>
          <path d="M12 7l-4 4h3v5h2v-5h3z"/>
        </g>
      </svg>`
  };
  wrap.innerHTML = svgs[name] || '';
  return wrap;
}

/* Sections & State */
const sections = [
  { key:'alpha',   label:'Basics',        mode:'single', lipsum:'Enter some basics about your retirement plan here.', icon:'basics' },
  { key:'beta',    label:'Growth Rates',  mode:'single', lipsum:'Enter your money growth assumptions here.  Use the selection lists to base your choices on historical data.', icon:'growth' },
  { key:'gamma',   label:'Liquid Assets', mode:'multi',  lipsum:'Enter your cash/liquid assets here by account type.   To set retirement withdrawal order, drag and drop in the collapsed area.', icon:'liquid' },
  { key:'delta',   label:'Real Estate',   mode:'multi',  lipsum:'Add properties you own, including your home and any rental/income properties.', icon:'realestate' },
  { key:'epsilon', label:'Income',        mode:'multi',  lipsum:'Enter any retirement income, including pensions, Social Security, etc., with date ranges.', icon:'income' },
  { key:'zeta',    label:'Expenses',      mode:'multi',  lipsum:'Enter your retirement spending budget here with date ranges.  Do not include income taxes, as they are computed for you.   Also do not include mortgage payments that you entered in the Real Estate section.', icon:'expenses' },
];

const state = Object.fromEntries(sections.map(s => [s.key, s.mode==='single'
  ? (s.key==='alpha'
      ? { single:{ age:'', retire:'', life:'', spouseAge:'', spouseLife:'', stateCode:'CA', heirsTarget:'' } }
      // Growth Rates defaults
      : { single:{
            inflation:{ roi:'', stdev:'' },
            liquid:{ usStocks:{roi:'', stdev:''}, usBonds:{roi:'', stdev:''}, internationalStocks:{roi:'', stdev:''}, customYears:[] },
            realEstate:{ roi:'', stdev:'' }
        } } )
  : { items:[], nextId:1 }
]));

let active = sections[0].key;
let jsonMode = false;

/* DOM refs */
const navEl      = document.getElementById('nav');
const titleEl    = document.getElementById('sectionTitle');
const lipsumEl   = document.getElementById('sectionText');

const singleBasics   = document.getElementById('singleBasics');
const singleGrowth   = document.getElementById('singleGrowth');

const dockWrap = document.getElementById('dockWrap');
const dockEl   = document.getElementById('dock');
const itemsEl  = document.getElementById('items');

const panelFooter = document.getElementById('panelFooter');
const addBtn    = document.getElementById('addItemBtn');
const collapseAllBtn = document.getElementById('collapseAllBtn'); // NEW

const sidebar   = document.getElementById('sidebar');
const overlay   = document.getElementById('overlay');
const hamburger = document.getElementById('hamburger');

const jsonBox   = document.getElementById('jsonBox');
const previewBtn= document.getElementById('previewJsonBtn');
const submitBtn = document.getElementById('submitBtn');
 
const panelNextFooter = document.getElementById('panelNextFooter');
const backSectionBtn  = document.getElementById('backSectionBtn');
const nextSectionBtn  = document.getElementById('nextSectionBtn');

const toastEl   = document.getElementById('toast');
// ---- Error Panel helpers ----
function ensureErrorPanel(){
  let panel = document.getElementById('errorPanel');
  let list  = document.getElementById('errorList');
  if(!panel){
    // Fallback: create just under the CTA container if not present
    const topbarCta = document.querySelector('.topbar-cta');
    panel = document.createElement('div');
    panel.id = 'errorPanel';
    panel.className = 'error-panel';
    panel.setAttribute('role','alert');
    panel.setAttribute('aria-live','polite');
    panel.hidden = true;
    const header = document.createElement('div');
    header.className = 'error-header';
    header.textContent = 'Please fix the following:';
    list = document.createElement('ul');
    list.id = 'errorList';
    panel.appendChild(header);
    panel.appendChild(list);
    if(topbarCta && topbarCta.parentNode){
      topbarCta.parentNode.insertBefore(panel, topbarCta.nextSibling);
    }else{
      document.body.prepend(panel);
    }
  }
  if(!list){ list = document.getElementById('errorList'); }
  return {panel, list};
}

function showErrorPanel(errors){
  const {panel, list} = ensureErrorPanel();
  list.innerHTML = '';
  errors.forEach(msg=>{
    const li = document.createElement('li');
    li.textContent = msg;
    list.appendChild(li);
  });
  panel.hidden = false;
  // Scroll into view just under the CTA area
  panel.scrollIntoView({behavior:'smooth', block:'nearest'});
}

function hideErrorPanel(){
  const panel = document.getElementById('errorPanel');
  if(panel){ panel.hidden = true; }
}


document.getElementById('submitBtnDup')?.addEventListener('click', () => submitBtn.click());

/* Helpers for section-specific labels/titles */
function addLabelFor(sectionKey){
  const map = { gamma:'Add Asset', delta:'Add Property', epsilon:'Add Income', zeta:'Add Expense' };
  return map[sectionKey] || 'Add Item';
}
function baseNounFor(sectionKey){
  const map = { gamma:'Asset', delta:'Property', epsilon:'Income', zeta:'Expense' };
  return map[sectionKey] || 'Item';
}
function defaultTitle(sectionKey, id){
  return `${baseNounFor(sectionKey)} #${id}`;
}


/* Helper: jump to a section key, mirroring nav behavior */
function gotoSection(key){
  const s = sections.find(x=>x.key===key);
  if(!s) return;
  active = s.key;
  if(jsonMode){
    jsonMode = false;
    jsonBox.classList.add('hidden');
    previewBtn.textContent = 'Preview JSON';
  }
  render();
    try{ updateActiveNav(); }catch(e){}
// On narrow screens, close sidebar/overlay if open
  sidebar?.classList.remove('open'); overlay?.classList.remove('show');
}

/* Build nav */
function buildNav(){
  navEl.innerHTML = '';
  let sepInserted = false;
  sections.forEach(s=>{
    if(s.key==='results' && !sepInserted){
      const sep = document.createElement('div'); sep.className='nav-sep';
      navEl.appendChild(sep); sepInserted = true;
    }
    const b = document.createElement('button');
    b.dataset.key = s.key;
    b.appendChild(icon(s.icon));
    const span = document.createElement('span'); span.textContent = s.label;
    b.appendChild(span);

    b.className = (s.key===active?'active':'' );
    b.setAttribute('role','tab');
    b.setAttribute('aria-selected', String(s.key===active));
    if (s.key===active) b.setAttribute('aria-current','page');
    b.addEventListener('click', ()=>{
      active = s.key;
      if(jsonMode){
        jsonMode = false;
        jsonBox.classList.add('hidden');
        previewBtn.textContent = 'Preview JSON';
      }
      render();
          try{ updateActiveNav(); }catch(e){}
sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });

    navEl.appendChild(b);
  });
}

/* Results support */
let resultsData = null;
function ensureResultsSection(){
  const exists = sections.some(s=>s.key==='results');
  if(!exists){
    sections.push({ key:'results', label:'Results', mode:'results', lipsum:'Server results for your plan.', icon:'results' });
  }
}
function showResults(data){
  resultsData = data || resultsData;
  const rp = document.getElementById('resultsPanel');
  const rj = document.getElementById('resultsJson');
  if(rj) rj.textContent = JSON.stringify(resultsData ?? {}, null, 2);
    /* JSON display removed per new UI */
  if(rp){ rp.classList.remove('hidden'); }
  active = 'results';
  buildNav();
  render();
}

buildNav();

/* Mobile sidebar */
hamburger?.addEventListener('click', ()=>{
  sidebar.classList.add('open'); overlay.classList.add('show');
});
overlay?.addEventListener('click', ()=>{
  sidebar.classList.remove('open'); overlay.classList.remove('show');
});

/* Formatting helpers */
const numOnly = v => (v ?? '').toString().replace(/[^0-9.-]/g,'').trim();
function fmtYear(v){ const n = parseInt(numOnly(v),10); return Number.isFinite(n)? String(n):''; }
function fmtDollars(v){ const n = Math.round(parseFloat(numOnly(v))); return Number.isFinite(n)? n.toLocaleString('en-US'):''; }
function fmtPercent(v){ const n = parseFloat(numOnly(v)); return Number.isFinite(n)? `${n}`:''; }

function onBlurYear(input){ const v = fmtYear(input.value); input.dataset.raw = v; input.value = v; }
function onBlurDollar(input){ const v = fmtDollars(input.value); input.dataset.raw = v.replaceAll(',',''); input.value = v? `$${v}`:''; }
function onBlurPercent(input){ const v = fmtPercent(input.value); input.dataset.raw = v; input.value = v? `${v}%`:''; }
function onFocusNumeric(input){ input.value = input.dataset.raw ?? numOnly(input.value); }

/* ===== Spouse Retirement Pseudo-Card ===== */
function updateSpouseRetireCard(){
  const out = document.getElementById('spRetireText');
  if(!out) return;
  const yourAge = parseInt(numOnly(document.getElementById('ageInput')?.value||''),10);
  const retireAge = parseInt(numOnly(document.getElementById('retireInput')?.value||''),10);
  const spouseAge = parseInt(numOnly(document.getElementById('ageInputSpouse')?.value||''),10);
  if(Number.isFinite(yourAge) && Number.isFinite(retireAge) && Number.isFinite(spouseAge)){
    const delta = retireAge - yourAge;
    if(delta >= 0){
      out.textContent = `Retires with you at ${spouseAge + delta}`;
      return;
    }
  }
  out.textContent = 'Retires with you';
}

/* ===== Help buttons (wire) ===== */
function wireHelpButtons(){
  document.querySelectorAll('button[data-help]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const topic = btn.getAttribute('data-help');
      if (typeof window.helpMeChoose === 'function') {
        window.helpMeChoose(topic);
      } else {
        console.info('[Help] Implement window.helpMeChoose(topic). Topic =', topic);
      }
    });
  });
}

/* ===== Eligible proceeds accounts (Cash or Taxable Investment) ===== */
function getProceedsAccountOptions(){
  const assets = state.gamma?.items || [];
  return assets
    .filter(a => a.atype === 'Cash' || a.atype === 'Taxable Investment')
    .map(a => a.title?.trim() || defaultTitle('gamma', a.id));
}

/* Create new item for multi sections (now supports overrides/flags) */
function createItem(sectionKey, overrides = {}, lockedFlag /* optional */) {
  const s = state[sectionKey];
  const id = s.nextId++;

  // Base defaults (locked false by default)
  const base = { id, title: defaultTitle(sectionKey, id), collapsed: false, locked: false };

  // Section-specific defaults
  if (sectionKey === 'gamma') {
    Object.assign(base, {
      atype: 'Cash',
      amount: '', interest: '',
      costBasis: '', unrealized: '',
      rmd: false,
      rmdProceedsAccount: 'DEFAULT Taxable Investment Account', // NEW
      showROI: false, roi: '', stdev: ''
    ,
      taxTreatment: 'ordinary',
      inheritance:false,
      inheritanceYear: '__ALREADY_OWNED__'
    });
  } else if (sectionKey === 'delta') {
    Object.assign(base, {
      currentValue: '',
      purchaseYear: '__ALREADY_OWNED__',
      showROI: false, roi: '', stdev: '',
  showMortgage: false, loanOrigYear: '', loanTerm: '', loanRate: '', monthlyPayment: '', downPaymentPct: '',
      showRental: false, annualExpenses: '', annualIncome: '', rentGrowth: '',
      showSale: false, saleYear: '__NEVER_SELL__', purchasePrice: '', improvements: '', sellCost: '',
      saleProceedsAccount: 'DEFAULT Taxable Investment Account' // NEW
    });
  } else if (sectionKey === 'epsilon' || sectionKey === 'zeta') {
    Object.assign(base, {
      startYear: '__RETIREMENT__', endYear: '__END_OF_PLAN__', amount: '',
      showInflation: false, roi: ''
    });
  if (sectionKey === 'epsilon' && !base.taxTreatment) {
    base.taxTreatment = 'Ordinary Income';
  }

  } else {
    Object.assign(base, { year: '', dollars: '', percent: '' });
  }

  // Pull locked from overrides if present (we'll apply after overrides merge)
  const hasLockedInOverrides = Object.prototype.hasOwnProperty.call(overrides, 'locked');
  const lockedFromOverrides = hasLockedInOverrides ? !!overrides.locked : undefined;
  if (hasLockedInOverrides) {
    overrides = { ...overrides };
    delete overrides.locked;
  }

  // Apply overrides
  Object.assign(base, overrides);

  // Apply locked from either source. Prefer 'true' if any says true.
  if (typeof lockedFlag === 'boolean') base.locked = lockedFlag;
  if (lockedFromOverrides !== undefined) base.locked = lockedFromOverrides || base.locked;

  s.items.push(base);
  return base;
}
/* Render */

// --- injected helper to keep left-nav highlighting in sync
function updateActiveNav(){
if (!navEl || !navEl.children) return;
Array.from(navEl.children).forEach(btn => {
  const isActive = (btn.dataset && btn.dataset.key === active);
  if (btn.classList) btn.classList.toggle('active', isActive);
  if (btn.setAttribute) {
    btn.setAttribute('aria-selected', String(!!isActive));
    if (isActive) btn.setAttribute('aria-current','page');
    else btn.removeAttribute('aria-current');
  }
});

}


function render(){
  hideProcessingModal();
  const resultsPanel = document.getElementById('resultsPanel');
  const mainPanel = document.querySelector('main .panel:not(#resultsPanel)');
  if(active==='results'){
    if(mainPanel) mainPanel.classList.add('hidden');
    if(resultsPanel) resultsPanel.classList.remove('hidden');
    // Hide next/back footer in results view
    if(panelNextFooter) panelNextFooter.classList.add('hidden');
    // Set title/lipsum
    if(titleEl) titleEl.textContent = 'Results';
    if(lipsumEl) lipsumEl.textContent = 'Server response from your retirement odds calculation.';
    return;
  }else{
    if(resultsPanel) resultsPanel.classList.add('hidden');
    if(mainPanel) mainPanel.classList.remove('hidden');
  }

  const section = sections.find(s=>s.key===active);

  titleEl.textContent = section.label;
  lipsumEl.textContent = section.lipsum;

  // Configure Back button
  if (panelNextFooter && backSectionBtn) {
    backSectionBtn.innerHTML = '';
    backSectionBtn.className = 'navbtn';
    const idx = sections.findIndex(s => s.key === active);
    if (idx > 0) {
      const prev = sections[idx - 1];
      backSectionBtn.appendChild(icon(prev.icon));
      const spb = document.createElement('span');
      spb.textContent = '< Go Back';
      backSectionBtn.appendChild(spb);
      backSectionBtn.onclick = () => gotoSection(prev.key);
      backSectionBtn.classList.remove('hidden');
    } else {
      backSectionBtn.classList.add('hidden');
      backSectionBtn.onclick = null;
    }
  }

  // Configure Next button
  if (panelNextFooter && nextSectionBtn) {
    nextSectionBtn.innerHTML = '';
    nextSectionBtn.className = 'navbtn';
    const idx = sections.findIndex(s => s.key === active);
    if (idx >= 0 && idx < sections.length - 1) {
      const next = sections[idx + 1];
      nextSectionBtn.appendChild(icon(next.icon));
      const sp = document.createElement('span');
      sp.textContent = `Next: ${next.label}`;
      nextSectionBtn.appendChild(sp);
      nextSectionBtn.onclick = () => gotoSection(next.key);
      panelNextFooter.classList.remove('hidden');
    } else {
      const sp = document.createElement('span');
      sp.textContent = 'Calculate My RetirementOdds';
      nextSectionBtn.className = 'btn ok';
      nextSectionBtn.appendChild(sp);
      nextSectionBtn.onclick = () => submitBtn.click();
      panelNextFooter.classList.remove('hidden');
    }
  }

  if(jsonMode){
    singleBasics.classList.add('hidden');
    singleGrowth.classList.add('hidden');
    dockWrap.classList.add('hidden');
    itemsEl.classList.add('hidden');
    panelFooter.classList.add('hidden'); panelNextFooter?.classList.add('hidden');
    document.getElementById('collapseAllBtn')?.classList.add('hidden');
    jsonBox.classList.remove('hidden');
    titleEl.textContent = 'JSON Preview';
    lipsumEl.textContent = 'This is the serialized payload of your current inputs.';
    return;
  }

  jsonBox.classList.add('hidden');
  panelFooter.classList.remove('hidden'); panelNextFooter?.classList.remove('hidden');

  if(section.mode === 'single'){
    dockWrap.classList.add('hidden');
    itemsEl.classList.add('hidden');
    addBtn.classList.add('hidden');
    collapseAllBtn.classList.add('hidden');

    const isBasics = (active === 'alpha');
    singleBasics.classList.toggle('hidden', !isBasics);
    singleGrowth.classList.toggle('hidden', isBasics);

    if(isBasics){
      const data = state[active].single;
      const ageInput = document.getElementById('ageInput');
      const retireInput = document.getElementById('retireInput');
      const lifeInput = document.getElementById('lifeInput');
      const stateSelect = document.getElementById('stateSelect');
      const heirsInput = document.getElementById('heirsInput');
      const ageInputSpouse = document.getElementById('ageInputSpouse');
      const lifeInputSpouse = document.getElementById('lifeInputSpouse');

      ageInput.value = data.age ?? '';
      retireInput.value = data.retire ?? '';
      lifeInput.value = data.life ?? '';
      stateSelect.value = data.stateCode ?? '';
            ageInputSpouse.value = data.spouseAge ?? '';
      lifeInputSpouse.value = data.spouseLife ?? '';
if(data.heirsTarget){
        heirsInput.dataset.raw = String(data.heirsTarget);
        heirsInput.value = `$${fmtDollars(data.heirsTarget)}`;
      }else{
        heirsInput.value = '';
        heirsInput.dataset.raw = '';
      }

      const clampInt = (x,min,max)=>{
        const n = parseInt(numOnly(x),10);
        if(!Number.isFinite(n)) return '';
        return String(Math.min(max, Math.max(min, n)));
      };

      ageInput.oninput    = ()=>{ state[active].single.age    = clampInt(ageInput.value,    0, 120); };
      updateSpouseRetireCard();
      retireInput.oninput = ()=>{ state[active].single.retire = clampInt(retireInput.value, 0, 120); };
      updateSpouseRetireCard();
      lifeInput.oninput   = ()=>{ state[active].single.life   = clampInt(lifeInput.value,   0, 130); };
      ageInputSpouse.oninput = ()=>{ state[active].single.spouseAge = clampInt(ageInputSpouse.value, 0, 120); updateSpouseRetireCard(); };
      lifeInputSpouse.oninput = ()=>{ state[active].single.spouseLife = clampInt(lifeInputSpouse.value, 0, 130); };

      stateSelect.onchange = ()=>{ state[active].single.stateCode = stateSelect.value; };

      heirsInput.onfocus = ()=> onFocusNumeric(heirsInput);
      heirsInput.onblur  = ()=> { onBlurDollar(heirsInput); state[active].single.heirsTarget = heirsInput.dataset.raw || ''; };
      updateSpouseRetireCard();

      return;
    }

    /* ===== Render Growth Rates ===== */
    const g = state.beta.single;

    
  
  // === Inflation Time Period selector handler ===
  (function(){
    try{
      const sel = document.getElementById('inflationTimePeriod');
      const roiEl = document.getElementById('inflationRoi');
      const sdEl  = document.getElementById('inflationSd');
      if (!sel || !roiEl || !sdEl || typeof inflationdata === 'undefined') return;

      const applyFromSelection = ()=>{
        const n = parseInt(sel.value, 10);
        if (!Number.isFinite(n)) return;
        // Use the latest complete year available in the dataset
        const maxY = (inflationdata.getMaxYear && inflationdata.getMaxYear()) || (new Date().getFullYear()-1);
        const first = maxY - n + 1;
        const last  = maxY;
        const mean = (inflationdata.computeMeanRange && inflationdata.computeMeanRange(first, last)) || '';
        const stdev = (inflationdata.computeStdDevRange && inflationdata.computeStdDevRange(first, last)) || '';

        if (mean !== null && mean !== '') {
          roiEl.dataset.raw = String(mean);
          roiEl.value = `${mean}%`;
          if (g && g.inflation) g.inflation.roi = String(mean);
        }
        if (stdev !== null && stdev !== '') {
          sdEl.dataset.raw = String(stdev);
          sdEl.value = `${stdev}%`;
          if (g && g.inflation) g.inflation.stdev = String(stdev);
        }

      };

      // Wire change and apply immediately (default is 100 years)
      sel.addEventListener('change', applyFromSelection);
      // Ensure default shows up on first render
      if (!sel.value) sel.value = '100';
      applyFromSelection();
    }catch(e){ /* no-op */ }
  })();
// Auto-fill default Inflation values if empty (moved from Help Me Choose)
  try {
    g.inflation = g.inflation || {};
    if (!g.inflation.roi || g.inflation.roi === '') {
      const avg = (typeof inflationdata !== 'undefined' && inflationdata.computeAverage) ? inflationdata.computeAverage() : '3.00';
      g.inflation.roi = String(avg);
    }
    if (!g.inflation.stdev || g.inflation.stdev === '') {
      const sd = (typeof inflationdata !== 'undefined' && inflationdata.computeStdDev) ? inflationdata.computeStdDev() : '1.00';
      g.inflation.stdev = String(sd);
    }
  } catch(e) { /* no-op */ }
const fieldPairs = [
      {roiId:'inflationRoi', sdId:'inflationSd', obj:g.inflation},
      {roiId:'reRoi',        sdId:'reSd',        obj:g.realEstate},
    ];

    fieldPairs.forEach(({roiId, sdId, obj})=>{
      const roiEl = document.getElementById(roiId);
      const sdEl  = document.getElementById(sdId);

      if(obj.roi){
        roiEl.dataset.raw = String(obj.roi);
        roiEl.value = `${obj.roi}%`;
      } else { roiEl.value=''; roiEl.dataset.raw=''; }

      if(obj.stdev){
        sdEl.dataset.raw = String(obj.stdev);
        sdEl.value = `${obj.stdev}%`;
      } else { sdEl.value=''; sdEl.dataset.raw=''; }

      roiEl.onfocus = ()=> onFocusNumeric(roiEl);
      roiEl.onblur  = ()=> { onBlurPercent(roiEl); obj.roi = roiEl.dataset.raw || ''; };

      sdEl.onfocus = ()=> onFocusNumeric(sdEl);
      sdEl.onblur  = ()=> { onBlurPercent(sdEl); obj.stdev = sdEl.dataset.raw || ''; };
    });
    // --- Liquid: 2x3 grid wiring ---
    (function(){
      const ids = {
        usStocks: { roi:'liquidUsStocksRoi', sd:'liquidUsStocksSd' },
        usBonds:  { roi:'liquidUsBondsRoi',  sd:'liquidUsBondsSd'  },
        internationalStocks:{ roi:'liquidIntlStocksRoi', sd:'liquidIntlStocksSd' }
      };
      const obj = g.liquid;
      if (!obj.usStocks) obj.usStocks = {roi:'', stdev:''};
      if (!obj.usBonds) obj.usBonds = {roi:'', stdev:''};
      if (!obj.internationalStocks) obj.internationalStocks = {roi:'', stdev:''};

      Object.entries(ids).forEach(([k, pair])=>{
        const roiEl = document.getElementById(pair.roi);
        const sdEl  = document.getElementById(pair.sd);
        if (!roiEl || !sdEl) return;

        // populate
        if (nonEmpty(obj[k].roi)) { roiEl.dataset.raw = String(obj[k].roi); roiEl.value = `${obj[k].roi}%`; }
        else { roiEl.value=''; roiEl.dataset.raw=''; }
        if (nonEmpty(obj[k].stdev)) { sdEl.dataset.raw = String(obj[k].stdev); sdEl.value = `${obj[k].stdev}%`; }
        else { sdEl.value=''; sdEl.dataset.raw=''; }

        // handlers
        roiEl.onfocus = ()=> onFocusNumeric(roiEl);
        roiEl.onblur  = ()=> { onBlurPercent(roiEl); obj[k].roi   = roiEl.dataset.raw || ''; };

        sdEl.onfocus  = ()=> onFocusNumeric(sdEl);
        sdEl.onblur   = ()=> { onBlurPercent(sdEl);  obj[k].stdev = sdEl.dataset.raw || ''; };
      });
    // === Real Estate inline state selector (replaces Help Me Choose modal) ===
    (function(){
      try{
        const sel = document.getElementById('reStateSelect');
        const roiEl = document.getElementById('reRoi');
        const sdEl  = document.getElementById('reSd');
        if (!sel || !roiEl || !sdEl || typeof realEstateROI === 'undefined') return;
        // Populate options once
        if (!sel.dataset.populated) {
          const byName = Object.entries(realEstateROI)
            .map(([abbr, v])=>({abbr, name: v.stateName}))
            .sort((a,b)=> a.name.localeCompare(b.name));
          const defaultAbbr = (typeof geoplugin_regionCode === 'function' && geoplugin_regionCode()) || (state.alpha?.single?.stateCode) || 'CA';
          const placeholder = document.createElement('option');
          placeholder.textContent = '• Outside the USA';
          placeholder.value = '';
          sel.appendChild(placeholder);
          byName.forEach(({abbr, name})=>{
            const o = document.createElement('option');
            o.value = abbr;
            o.textContent = name;
            if (abbr === defaultAbbr) o.selected = true;
            sel.appendChild(o);
          });
          sel.dataset.populated = '1';
        }
        const apply = ()=>{
          const abbr = sel.value;
          const data = realEstateROI[abbr];
          if (!data) return;
          const roi = (100*Number(data.average)).toFixed(2);
          const sd  = (100*Number(data.stdev)).toFixed(2);
          roiEl.dataset.raw = String(roi); roiEl.value = `${roi}%`;
          sdEl.dataset.raw  = String(sd);  sdEl.value  = `${sd}%`;
          // Persist
          const g = state.beta.single;
          if (g && g.realEstate) {
            g.realEstate.roi = String(roi);
            g.realEstate.stdev = String(sd);
          }
        };
        sel.addEventListener('change', apply);
        // Apply immediately if a default was selected
        if (sel.value) apply();
      }catch(e){ /* no-op */ }
    })();

    })();


    
    
    /* --- Liquid: Time Period preset handler (markethistory.js) --- */
    (function(){
      try {
        const sel = document.getElementById('liquidTimePeriod');
        if (!sel || typeof markethistory === 'undefined' || !Array.isArray(markethistory.data)) return;

        // Map UI -> dataset keys & input ids
        const classes = [
          { key: "US_Stocks_SP500_TR", roiId: "liquidUsStocksRoi", sdId: "liquidUsStocksSd", stateKey: "usStocks" },
          { key: "US_Bonds_Agg_TR", roiId: "liquidUsBondsRoi", sdId: "liquidUsBondsSd", stateKey: "usBonds" },
          { key: "Intl_Stocks_MSCI_EAFE_NR_USD", roiId: "liquidIntlStocksRoi", sdId: "liquidIntlStocksSd", stateKey: "internationalStocks" },
        ];

        // Helpers
        const years = markethistory.data.map(r => Number(r.Year)).filter(Number.isFinite);
        const minY = Math.min.apply(null, years), maxY = Math.max.apply(null, years);

        function parseRange(v){
          // v examples: "1976-present", "2000-2010"
          const m = String(v || '').trim().toLowerCase().match(/^(\d{4})\s*-\s*(present|\d{4})$/);
          if (!m) return {first:minY, last:maxY};
          const first = Number(m[1]);
          const last  = (m[2] === 'present') ? maxY : Number(m[2]);
          return { first: Math.max(minY, Math.min(first, maxY)), last: Math.max(minY, Math.min(last, maxY)) };
        }

        function pct(x){ return (Number.isFinite(x) ? (x*100).toFixed(2) : ""); }

        function applyFromSelection(){
          const {first, last} = parseRange(sel.value);
          // For each asset, compute mean & stdev from markethistory
          classes.forEach(({key, roiId, sdId, stateKey})=>{
            const mean  = (markethistory.getAverage && markethistory.getAverage(first, last, key)) ?? null;
            const stdev = (markethistory.getStandardDeviation && markethistory.getStandardDeviation(first, last, key)) ?? null;

            const roiEl = document.getElementById(roiId);
            const sdEl  = document.getElementById(sdId);
            if (!roiEl || !sdEl) return;

            const meanPct  = mean  === null ? "" : pct(mean);
            const stdevPct = stdev === null ? "" : pct(stdev);

            // Write inputs (show with % but store raw number in dataset.raw)
            if (meanPct !== "") { roiEl.dataset.raw = meanPct;  roiEl.value = meanPct + "%";  }
            if (stdevPct !== ""){ sdEl.dataset.raw = stdevPct;  sdEl.value = stdevPct + "%"; }

            // Persist to state
            if (g && g.liquid && g.liquid[stateKey]){
              if (meanPct !== "")  g.liquid[stateKey].roi   = meanPct;
              if (stdevPct !== "") g.liquid[stateKey].stdev = stdevPct;
            }
          });
        }

        sel.addEventListener('change', applyFromSelection);
        // Initialize on first render using currently selected option
        applyFromSelection();
      } catch(e) { /* no-op */ }
    })();
    
/* --- Liquid: Customize ROI for Specific Years --- */
    (function(){
  const btn  = document.getElementById('liquidCustomizeBtn') /* may be null now */;
  const wrap = document.getElementById('liquidCustomizeWrap');
  const rowsHost = document.getElementById('liquidRows');
  const addBtn = document.getElementById('addLiquidRowBtn');

  if (!wrap || !rowsHost || !addBtn) return;

  // Ensure the array exists, seed with one empty row if none
  g.liquid.customYears = (g.liquid.customYears && g.liquid.customYears.length)
    ? g.liquid.customYears
    : [{year:String(new Date().getFullYear()), roi:'', prob:''}];

  function renderRows(){
    rowsHost.innerHTML = '';
    const arr = g.liquid.customYears || (g.liquid.customYears = []);
    const now = new Date().getFullYear();
    const years = Array.from({length:51}, (_,i)=> String(now + i));

    arr.forEach((row, idx)=>{
      const showLabels = (idx === 0);
      const div = document.createElement('div');
      div.className = 'triple-row' + (showLabels ? ' header-row' : '');

      // Plan Year
      const fY = document.createElement('div');
      fY.className = 'field';
      if (showLabels) {
        const lY = document.createElement('label');
        lY.className = 'label';
        lY.textContent = 'Plan Year';
        fY.append(lY);
      }
      const sY = document.createElement('select');
      sY.className = 'year-compact';
      years.forEach(y=>{ const o=document.createElement('option'); o.value=y; o.textContent=y; sY.appendChild(o); });
      if (!row.year) { row.year = years[0]; }
    sY.value = String(row.year);
    if (row.year) sY.value = String(row.year);
      sY.addEventListener('change', ()=>{ row.year = sY.value; });
      fY.append(sY);

      // ROI (%)
      const fR = document.createElement('div');
      fR.className = 'field';
      if (showLabels) {
        const lR = document.createElement('label');
        lR.className = 'label';
        lR.textContent = 'ROI (%)';
        fR.append(lR);
      }
      const iR = document.createElement('input');
      iR.type='text';
      iR.inputMode='decimal';
      iR.className='pct small';
      if (row.roi){ iR.dataset.raw = String(row.roi); iR.value = `${row.roi}%`; }
      iR.addEventListener('focus', ()=> onFocusNumeric(iR));
      iR.addEventListener('blur', ()=>{ onBlurPercent(iR); row.roi = iR.dataset.raw || ''; });
      fR.append(iR);

      // Probability (%)
      const fP = document.createElement('div');
      fP.className = 'field';
      if (showLabels) {
        const lP = document.createElement('label');
        lP.className = 'label';
        lP.textContent = 'Probability (%)';
        fP.append(lP);
      }
      const iP = document.createElement('input');
      iP.type='text';
      iP.inputMode='decimal';
      iP.className='pct small';
      if (row.prob){ iP.dataset.raw = String(row.prob); iP.value = `${row.prob}%`; }
      iP.addEventListener('focus', ()=> onFocusNumeric(iP));
      iP.addEventListener('blur', ()=>{ onBlurPercent(iP); row.prob = iP.dataset.raw || ''; });
      fP.append(iP);

      // Remove button
      const rem = document.createElement('button');
      rem.className='rem-row';
      rem.type='button';
      rem.title='Remove';
      rem.textContent = '✕';
      rem.addEventListener('click', ()=>{ arr.splice(idx,1); renderRows(); });

      div.append(fY, fR, fP, rem);
      rowsHost.appendChild(div);
    });
  }

  // Initial render if visible
  if (!wrap.classList.contains('hidden')) renderRows();

  if (btn) btn.onclick = ()=>{
    const isHidden = wrap.classList.contains('hidden'); // currently hidden?
    wrap.classList.toggle('hidden');
    btn.textContent = isHidden ? 'Hide Customized ROI Years' : 'Customize ROI For Specific Years';
    if (isHidden) renderRows();
  };

  addBtn.onclick = ()=>{
    g.liquid.customYears = g.liquid.customYears || [];
    g.liquid.customYears.push({year:String(new Date().getFullYear()), roi:'', prob:''});
    renderRows();
  };
})();
wireHelpButtons();
    return;
  }

  /* Multi sections */
  singleBasics.classList.add('hidden');
  singleGrowth.classList.add('hidden');
  dockWrap.classList.remove('hidden');
  itemsEl.classList.remove('hidden');
  addBtn.classList.remove('hidden');
  addBtn.textContent = `+ ${addLabelFor(active)}`;
  addBtn.setAttribute('aria-label', addLabelFor(active));

  const items = state[active].items;

  const hasExpanded = items.some(it => !it.collapsed);
  collapseAllBtn.classList.toggle('hidden', !hasExpanded);
  collapseAllBtn.textContent = 'Collapse All';

  dockEl.innerHTML = '';
  const collapsed = items.filter(it=>it.collapsed);
  dockEl.classList.toggle('empty', collapsed.length===0);
  dockEl.textContent = collapsed.length ? '' : 'Collapsed items will appear here.';
  collapsed.forEach(it => dockEl.appendChild(renderMiniCard(it, active)));

  itemsEl.innerHTML = '';
  items.filter(it=>!it.collapsed).forEach(it => itemsEl.appendChild(renderItem(it, active)));

  enableDockDrag();

  // keep the left-nav highlighting in sync
  try{ updateActiveNav(); }catch(e){}
}

/* Mini-card (collapsed) */
function renderMiniCard(it, sectionKey){
  const card = document.createElement('div');
  card.className = 'mini'; card.setAttribute('role','button'); card.setAttribute('tabindex','0');
  card.dataset.id = it.id; card.title = 'Drag to reorder • Click to expand';

  const title = document.createElement('h4'); title.textContent = it.title; card.appendChild(title);

  
  const kv = document.createElement('div'); kv.className='kv';
  // Compact summary: only show amount/value on second line
  let amtText = '—';
  const getAmt = ()=>{
    // Special case: Liquid Assets -> Taxable Investment shows Cost Basis + Unrealized Gains
    try{
      if (sectionKey === 'gamma' && it.atype === 'Taxable Investment') {
        const cb = toInt ? (nonEmpty(it.costBasis) ? toInt(it.costBasis) : 0) : (parseInt(it.costBasis||0,10)||0);
        const ug = toInt ? (nonEmpty(it.unrealized) ? toInt(it.unrealized) : 0) : (parseInt(it.unrealized||0,10)||0);
        const total = (cb||0) + (ug||0);
        return `$${fmtDollars(total)}`;
      }
    }catch(e){ /* fall through */ }
    if (it.amount) return `$${fmtDollars(it.amount)}`;
    if (it.currentValue) return `$${fmtDollars(it.currentValue)}`;
    if (it.dollars) return `$${fmtDollars(it.dollars)}`;
    if (it.value) return `$${fmtDollars(it.value)}`;
    return null;
  };
  const a = getAmt(); if (a) amtText = a;
  kv.innerHTML = `<div>${amtText}</div>`;
  card.appendChild(kv);


  const expand = ()=>{ it.collapsed=false; render(); };
  card.addEventListener('click', expand);
  card.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); expand(); } });

  return card;
}
function makeBadge(text){ const b=document.createElement('span'); b.className='badge'; b.textContent=text; return b; }

/* Expanded item card (multi) */
function renderItem(it, sectionKey){
  const wrap = document.createElement('div'); wrap.className = 'item'; wrap.dataset.id = it.id;

  const header = document.createElement('div'); header.className = 'item-header';
  const title = document.createElement('div'); title.className = 'item-title';

  const titleInput = document.createElement('input');
  titleInput.className = 'title-input'; titleInput.type = 'text';
  titleInput.value = it.title || defaultTitle(sectionKey, it.id);
  titleInput.placeholder = defaultTitle(sectionKey, it.id);
  titleInput.addEventListener('input', ()=>{
    it.title = titleInput.value.trim() || defaultTitle(sectionKey, it.id);
    const mini = dockEl.querySelector(`.mini[data-id="${it.id}"] h4`); if(mini) mini.textContent = it.title;
    // If a Liquid Asset title changes, proceeds-dropdowns will refresh on next render
  });
  titleInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') titleInput.blur(); });
  title.append(titleInput);

  const actions = document.createElement('div'); actions.className = 'item-actions';
  const collapseBtn = document.createElement('button'); collapseBtn.className = 'btn small ghost'; collapseBtn.textContent = 'Collapse';
  collapseBtn.addEventListener('click', ()=>{ it.collapsed = true; render(); });
  const deleteBtn = document.createElement('button'); deleteBtn.className = 'btn small danger'; deleteBtn.textContent = 'Remove';
  if(it.locked){
    deleteBtn.classList.add('disabled');
    deleteBtn.setAttribute('aria-disabled','true');
    deleteBtn.title = 'This default asset cannot be removed';
  }else{
    deleteBtn.addEventListener('click', ()=>{
      const list = state[sectionKey].items; const idx = list.findIndex(x=>x.id===it.id); if(idx>=0){ list.splice(idx,1); render(); }
    });
  }
  actions.append(collapseBtn, deleteBtn);
  header.append(title, actions);

  const body = document.createElement('div'); body.className = 'item-body';

  if(sectionKey === 'gamma'){
    const typeField = document.createElement('div'); typeField.className = 'field';

    const fieldset = document.createElement('fieldset');
    fieldset.className = 'segmented';
    fieldset.setAttribute('role','radiogroup');
    fieldset.setAttribute('aria-label','Liquid Asset Type');
    const legend = document.createElement('legend');
    legend.className = 'sr-only';
    legend.textContent = 'Account Type';
    fieldset.appendChild(legend);
    const inlineCaption = document.createElement('span');
    inlineCaption.className = 'legend-inline label';
    inlineCaption.textContent = 'Account Type';
    fieldset.appendChild(inlineCaption);
 
    const opts = ['Cash','Taxable Investment','Tax Deferred','Roth'];
    const name = `la-type-${it.id}`;

    opts.forEach((opt, idx) => {
      const id = `${name}-${idx}`;
      const input = document.createElement('input'); input.type = 'radio'; input.name = name; input.id = id; input.value = opt;
      if (it.locked) input.disabled = true;
      if (it.locked) { input.disabled = true; input.setAttribute('aria-disabled','true'); input.title = 'Account type is fixed for default accounts'; }
input.addEventListener('change', () => {
        if(input.checked){
          it.atype = opt;
          // update visual selection without waiting for full render
          Array.from(fieldset.querySelectorAll('label')).forEach(l=>l.classList.remove('selected'));
          label.classList.add('selected');
          render();
        }
      });

      const label = document.createElement('label'); label.setAttribute('for', id); label.textContent = opt;
      if ((it.atype || 'Cash') === opt) { label.classList.add('selected'); label.setAttribute('aria-checked','true'); }
      fieldset.append(input, label);
    });

    typeField.append(fieldset); body.append(typeField);

    const grid = document.createElement('div'); grid.className = (it.atype==='Taxable Investment') ? 'grid-2' : 'grid';

    if(it.atype==='Taxable Investment'){
      const {field:fCB} = makeTextField('Cost Basis ($)', 'e.g. 200000', it.costBasis, (v)=>{ it.costBasis=v; });
      const {field:fUG} = makeTextField('Unrealized Gains ($)', 'e.g. 50000', it.unrealized, (v)=>{ it.unrealized=v; });
      grid.append(fCB, fUG);
    } else {
      const {field:fAmt} = makeTextField('Amount ($)', 'e.g. 250000', it.amount, (v)=>{ it.amount=v; });
      grid.append(fAmt);
      if(it.atype==='Cash'){
        const {field:fInt} = makeTextField('Interest Rate (%)', 'e.g. 4.5', it.interest, (v)=>{ it.interest=v; });
        grid.append(fInt);
      }
    }
    body.append(grid);
    // === Pre-Retirement Contribution (visible only if your age < retirement age) ===
    (function(){
      try{
        if (it.atype === 'Taxable Investment') return;
const basics = (state.alpha && state.alpha.single) ? state.alpha.single : {};
        const age = parseInt(numOnly(String(basics.age ?? document.getElementById('ageInput')?.value ?? '')),10);
        const retireAge = parseInt(numOnly(String(basics.retire ?? document.getElementById('retireInput')?.value ?? '')),10);
        const showPreRet = Number.isFinite(age) && Number.isFinite(retireAge) && age < retireAge;
        if (showPreRet) {
          const prRow = document.createElement('div'); prRow.className='row';
          const prBtn = document.createElement('button'); prBtn.className='btn secondary';
          prBtn.textContent = it.preRetContribEnabled ? 'Hide Pre-Retirement Contribution' : 'Add Pre-Retirement Contribution';
          prBtn.addEventListener('click', ()=>{ it.preRetContribEnabled = !it.preRetContribEnabled; render(); });
          prRow.append(prBtn); body.append(prRow);
          if (it.preRetContribEnabled) {
            const gPR = document.createElement('div'); gPR.className='grid';
            const {field:prField} = makeTextField('Pre-Retirement Annual Contribution ($)', 'e.g. 6000', it.preRetireAnnualContribution, (v)=>{ it.preRetireAnnualContribution = v; });
            gPR.append(prField); body.append(gPR);
          }
        }
      }catch(e){ /* no-op */ }
    })();


        if (it.atype==='Taxable Investment') {
      const opts = [
        {value:'ordinary', label:'Ordinary Income'},
        {value:'capital_gains', label:'Long Term Capital Gains'},
        {value:'fifty_fifty', label:'About 50/50'}
      ];
      if (!it.taxTreatment) { it.taxTreatment = 'ordinary'; }
      const {field:fTT} = makeSelectField('Tax Treatment', opts, it.taxTreatment, (v)=>{ it.taxTreatment = v; });
      const row = document.createElement('div'); row.className = 'row'; row.append(fTT);
      body.append(row);
    // === Pre-Retirement Contribution button placed below Tax Treatment (Taxable Investment only) ===
    (function(){
      try{
        const basics = (state.alpha && state.alpha.single) ? state.alpha.single : {};
        const age = parseInt(numOnly(String(basics.age ?? document.getElementById('ageInput')?.value ?? '')),10);
        const retireAge = parseInt(numOnly(String(basics.retire ?? document.getElementById('retireInput')?.value ?? '')),10);
        const showPreRet = Number.isFinite(age) && Number.isFinite(retireAge) && age < retireAge;
        if (showPreRet) {
          const prRow = document.createElement('div'); prRow.className='row';
          const prBtn = document.createElement('button'); prBtn.className='btn secondary';
          prBtn.textContent = it.preRetContribEnabled ? 'Hide Pre-Retirement Contribution' : 'Add Pre-Retirement Contribution';
          prBtn.addEventListener('click', ()=>{ it.preRetContribEnabled = !it.preRetContribEnabled; render(); });
          prRow.append(prBtn); body.append(prRow);
          if (it.preRetContribEnabled) {
            const gPR = document.createElement('div'); gPR.className='grid';
            const {field:prField} = makeTextField('Pre-Retirement Annual Contribution ($)', 'e.g. 6000', it.preRetireAnnualContribution, (v)=>{ it.preRetireAnnualContribution = v; });
            gPR.append(prField); body.append(gPR);
          }
        }
      }catch(e){}
    })();

    }
if(it.atype==='Tax Deferred'){
      const r = document.createElement('div'); r.className='row';
      const sw = document.createElement('label'); sw.className='switch';
      const chk = document.createElement('input'); chk.type='checkbox'; chk.checked = !!it.rmd; chk.id = `rmd-${it.id}`;
      chk.addEventListener('change', ()=>{ it.rmd = chk.checked; render(); });
      const lb = document.createElement('label'); lb.className='label'; lb.setAttribute('for', chk.id); lb.textContent='Take Required Minimum Distributions (RMDs)';
      sw.append(chk, lb); r.append(sw); body.append(r);

      if(it.rmd){
        // "Proceeds to account" under RMD when enabled
        const proceedsOptions = getProceedsAccountOptions();
        const withPlaceholder = proceedsOptions.map(t => ({value:t, label:t}));
        const gRmd = document.createElement('div'); gRmd.className='grid-2';
        const {field:paField} = makeSelectField('Proceeds to account', withPlaceholder, it.rmdProceedsAccount || '', (v)=>{ it.rmdProceedsAccount = v; });
        
        // If spouse age and life expectancy are defined, add Account Owner radio group
        try {
          const basics = state.alpha?.single || {};
          const hasSpouse = nonEmpty(basics.spouseAge) && nonEmpty(basics.spouseLife);
          if (hasSpouse) {
            const fieldset = document.createElement('fieldset');
            fieldset.className = 'segmented';
            fieldset.setAttribute('role','radiogroup');
            fieldset.setAttribute('aria-label','Account Owner');
            const legend = document.createElement('legend'); legend.className = 'sr-only'; legend.textContent = 'Account Owner'; fieldset.appendChild(legend);
            const inlineCaption = document.createElement('span'); inlineCaption.className = 'legend-inline label'; inlineCaption.textContent = 'Account Owner'; fieldset.appendChild(inlineCaption);

            const name = `rmd-owner-${it.id}`;
            const opts = [{val:'you', label:'You'}, {val:'spouse', label:'Spouse'}];
            const current = (it.rmdOwner === 'spouse') ? 'spouse' : 'you';
            opts.forEach((o, idx) => {
              const id = `${name}-${idx}`;
              const input = document.createElement('input'); input.type='radio'; input.name=name; input.id=id; input.value=o.val;
              input.checked = (current === o.val);
              input.addEventListener('change', ()=>{ if(input.checked){ it.rmdOwner = o.val; } });
              const label = document.createElement('label'); label.setAttribute('for', id); label.textContent = o.label;
              fieldset.append(input, label);
            });

            const ownerFieldWrap = document.createElement('div'); ownerFieldWrap.className = 'field';
            ownerFieldWrap.append(fieldset);
            body.append(ownerFieldWrap);
          } else {
            it.rmdOwner = 'you'; // default to 'you' if no spouse info
          }
        } catch(e) { /* no-op */ }
gRmd.append(paField); body.append(gRmd);
        const tip = document.createElement('div'); tip.className='subtle'; tip.textContent = 'RMD withdrawals will be deposited to this account.';
        body.append(tip);
      }
    }

    if(it.atype !== 'Cash'){
      const roiRow = document.createElement('div'); roiRow.className='row';
      const btn = document.createElement('button'); btn.className='btn small'; btn.textContent = it.showROI? 'Hide ROI' : 'Customize ROI';
      btn.addEventListener('click', ()=>{ it.showROI = !it.showROI; render(); });
      roiRow.append(btn); body.append(roiRow);

      if(it.showROI){
        const roiGrid = document.createElement('div'); roiGrid.className='grid-2';
        const {field:fRoi} = makeTextField('ROI (%)', 'e.g. 6.0', it.roi, (v)=>{ it.roi=v; });
        const {field:fSd}  = makeTextField('Standard Deviation (%)', 'e.g. 12', it.stdev, (v)=>{ it.stdev=v; });
        roiGrid.append(fRoi, fSd); body.append(roiGrid);
        const tip = document.createElement('div'); tip.className='subtle'; tip.textContent = 'These override any global growth assumptions for this asset.'; body.append(tip);
      }
    }

  
    
    // Inheritance toggle button and year picker (appears at the very end of the Asset form)
    if(!it.locked){
      const inhRow = document.createElement('div'); inhRow.className = 'row';
      const inhBtn = document.createElement('button'); inhBtn.className='btn secondary';
      inhBtn.textContent = it.inheritance ? 'Hide inheritance options' : 'This will be an inheritance';
      inhBtn.addEventListener('click', ()=>{ it.inheritance = !it.inheritance; render(); });
      inhRow.append(inhBtn); body.append(inhRow);

      if (it.inheritance){
        const inhGrid = document.createElement('div'); inhGrid.className='grid-2';
        const now = new Date().getFullYear();
        const years = Array.from({length:51},(_,i)=> now + i); // include current year + 50
        const {field:inhField, select:inhSel} = makeSelectField('Inheritance Year', years, it.inheritanceYear || '', (v)=>{ it.inheritanceYear = v; });
        inhSel.dataset.yearsOnly = '0';
        inhSel.dataset.isPurchaseYearSelect = '1';
        inhSel.dataset.defaultToken='__ALREADY_OWNED__';
        inhSel.classList.add('year-select');
        try { rebuildSelect(inhSel, 'Inheritance Year'); } catch(e){}
        inhGrid.append(inhField);
        body.append(inhGrid);
      }
    }

  }
else if (sectionKey === 'delta'){
    /* Current Value */
    const cvGrid = document.createElement('div'); cvGrid.className = 'grid-2';
    const {field:cvField} = makeTextField('Today\'s Value ($)', 'e.g. 750000', it.currentValue, (v)=>{ it.currentValue=v; });
    cvGrid.append(cvField); body.append(cvGrid);

    /* Purchase Year */
    const purchaseWrap = document.createElement('div'); purchaseWrap.className = 'grid-2';
    const now = new Date().getFullYear();
    const next50 = Array.from({length:50}, (_,i)=> now + i);
    const purchaseOptions = [...next50];
    const defaultPurchase = it.purchaseYear;
    const {field:pyField, select: pySel} = makeSelectField('Purchase Year', purchaseOptions, defaultPurchase, (v)=>{ it.purchaseYear=v; });
    pySel.dataset.defaultToken='__ALREADY_OWNED__'; pySel.dataset.isPurchaseYearSelect='1'; // This is a special token to indicate the purchaseYear selector
    purchaseWrap.append(pyField); body.append(purchaseWrap);


    /* Mortgage */
    const mortRow = document.createElement('div'); mortRow.className='row';
    const mortBtn = document.createElement('button'); mortBtn.className='btn small'; mortBtn.type='button';
    mortBtn.textContent = it.showMortgage? 'Hide Mortgage Information' : 'Enter Mortgage Information';
    mortBtn.addEventListener('click', ()=>{ it.showMortgage = !it.showMortgage; render(); });
    mortRow.append(mortBtn); body.append(mortRow);

    if(it.showMortgage){
      const g = document.createElement('div'); g.className='grid';
      const isAlreadyOwned = (it.purchaseYear === '__ALREADY_OWNED__' || !it.purchaseYear || it.purchaseYear === '' || it.purchaseYear === pySel?.dataset?.defaultToken);
      if(isAlreadyOwned){
        const {field:yF} = makeTextField('Loan Origination Year', 'e.g. 2015', it.loanOrigYear, (v)=>{ it.loanOrigYear=v; }, 'text', 'numeric');
        const {field:tF} = makeTextField('Loan Term (years)', 'e.g. 30', it.loanTerm, (v)=>{ it.loanTerm=v; }, 'text', 'numeric');
        const {field:rF} = makeTextField('Interest Rate (%)', 'e.g. 3.75', it.loanRate, (v)=>{ it.loanRate=v; });
        const {field:mpF} = makeTextField('Monthly Payment ($)', 'e.g. 1500', it.monthlyPayment, (v)=>{ it.monthlyPayment=v; });
        g.append(yF, tF, rF, mpF);
      } else {
        const {field:dpF} = makeTextField('Percent Down Payment (%)', 'e.g. 20', it.downPaymentPct, (v)=>{ it.downPaymentPct=v; }, 'text', 'numeric');
        const {field:tF} = makeTextField('Loan Term (years)', 'e.g. 30', it.loanTerm, (v)=>{ it.loanTerm=v; }, 'text', 'numeric');
        const {field:rF} = makeTextField('Interest Rate (%)', 'e.g. 5.25', it.loanRate, (v)=>{ it.loanRate=v; });
        // Note styled like form labels
        const noteWrap = document.createElement('div'); noteWrap.className='field'; noteWrap.style.gridColumn='1 / -1';
        const note = document.createElement('div'); note.className='label';
        note.textContent = 'Note: Future purchase price is projected based on today\'s value and appreciation rate.   Future down payment is treated as a drawdown expense only if purchase occurs during retirement years';
        noteWrap.appendChild(note);
        g.append(dpF, tF, rF, noteWrap);
      }
      body.append(g);
    }

    /* Rental */
    const rentRow = document.createElement('div'); rentRow.className='row';
    const rentBtn = document.createElement('button'); rentBtn.className='btn small'; rentBtn.textContent = it.showRental? 'Hide Rental Income' : 'Enter Rental Income (Optional)';
    rentBtn.addEventListener('click', ()=>{ it.showRental = !it.showRental; render(); });
    rentRow.append(rentBtn); body.append(rentRow);

    if(it.showRental){
      const g = document.createElement('div'); g.className='grid';
      const {field:incF}  = makeTextField('Annual Rental Income ($)', 'e.g. 30000', it.annualIncome, (v)=>{ it.annualIncome=v; });
      const {field:expF}  = makeTextField('Annual Expenses ($) (w/o mortgage)', 'e.g. 6000', it.annualExpenses, (v)=>{ it.annualExpenses=v; });
      const {field:grF}   = makeTextField('Growth Rate (%)', 'e.g. 2.5', it.rentGrowth, (v)=>{ it.rentGrowth=v; });
      g.append(incF, expF, grF); body.append(g);
    }

    /* Sale */
    const saleRow = document.createElement('div'); saleRow.className='row';
    const saleBtn = document.createElement('button'); saleBtn.className='btn small'; saleBtn.textContent = it.showSale? 'Hide Sale Information' : 'Enter Future Sale and Tax Information';
    saleBtn.addEventListener('click', ()=>{ it.showSale = !it.showSale; render(); });
    saleRow.append(saleBtn); body.append(saleRow);

    if(it.showSale){
      const nowY = new Date().getFullYear();
      const years = Array.from({length:51}, (_,i)=> nowY + i);
      const g1 = document.createElement('div'); g1.className='grid-2';
      const {field:saleYearField, select: saleSel} = makeSelectField('Sale Year', years, it.saleYear || years[0], (v)=>{ it.saleYear=v; });
      saleSel.dataset.defaultToken='__NEVER_SELL__'; saleSel.dataset.isSaleYearSelect='1';
      g1.append(saleYearField); body.append(g1);

      const g2 = document.createElement('div'); g2.className='grid';
      const {field:ppF} = makeTextField('Purchase Price ($)', 'e.g. 500000', it.purchasePrice, (v)=>{ it.purchasePrice=v; });
      const {field:impF}= makeTextField('Improvements Value ($)', 'e.g. 75000', it.improvements, (v)=>{ it.improvements=v; });
      const {field:csF} = makeTextField('Cost of Selling (%)', 'e.g. 6', it.sellCost, (v)=>{ it.sellCost=v; });
      g2.append(ppF, impF, csF); body.append(g2);

      // Proceeds to account (already added for Real Estate)
      const proceedsOptions = getProceedsAccountOptions();
      const withPlaceholder = proceedsOptions.map(t => ({value:t, label:t}));
      const g3 = document.createElement('div'); g3.className='grid-2';
      const {field:paField} = makeSelectField('Proceeds to account', withPlaceholder, it.saleProceedsAccount || '', (v)=>{ it.saleProceedsAccount = v; });
      g3.append(paField); body.append(g3);
    }

    /* ROI toggle */
    const roiRow = document.createElement('div'); roiRow.className='row';
    const roiBtn = document.createElement('button'); roiBtn.className='btn small'; roiBtn.textContent = it.showROI? 'Hide Appreciation' : 'Customize Appreciation';
    roiBtn.addEventListener('click', ()=>{ it.showROI = !it.showROI; render(); });
    roiRow.append(roiBtn); body.append(roiRow);

    if(it.showROI){
      const g = document.createElement('div'); g.className='grid-2';
      const {field:roiF} = makeTextField('ROI (%)', 'e.g. 4.0', it.roi, (v)=>{ it.roi=v; });
      const {field:sdF}  = makeTextField('Standard Deviation (%)', 'e.g. 8', it.stdev, (v)=>{ it.stdev=v; });
      g.append(roiF, sdF); body.append(g);
    }






  } else if (sectionKey === 'epsilon' || sectionKey === 'zeta'){
    const now = new Date().getFullYear();
    const years = Array.from({length:51}, (_,i)=> now + i);

    const gYears = document.createElement('div'); gYears.className='grid-2';
    const {field:syF, select: sySel} = makeSelectField('Start Year', years, it.startYear || years[0], (v)=>{ it.startYear=v; });
    sySel.dataset.defaultToken='__RETIREMENT__';
    const {field:eyF, select: eySel} = makeSelectField('End Year',   years, it.endYear   || years[Math.min(5, years.length-1)], (v)=>{ it.endYear=v; });
    eySel.dataset.defaultToken='__END_OF_PLAN__';
    gYears.append(syF, eyF); body.append(gYears);

    const gAmt = document.createElement('div'); gAmt.className='grid-2';
    const {field:amtF} = makeTextField('Annual Amount ($)', 'e.g. 45000', it.amount, (v)=>{ it.amount=v; });
    gAmt.append(amtF); body.append(gAmt);
    // Tax Treatment (Income only)
    if (sectionKey === 'epsilon') {
      const taxGrid = document.createElement('div'); taxGrid.className='grid-2';
      const taxOptions = ['Ordinary Income','Social Security (85% taxable)','Non-taxable Income'];
      const currentTax = it.taxTreatment || 'Ordinary Income';
      const {field:taxField} = makeSelectField('Tax Treatment', taxOptions, currentTax, (v)=>{ it.taxTreatment = v; });
      taxGrid.append(taxField); body.append(taxGrid);
    }


    const inflRow = document.createElement('div'); inflRow.className='row';
    const inflBtn = document.createElement('button'); inflBtn.className='btn small'; inflBtn.textContent = it.showInflation? 'Hide Inflation' : 'Customize Inflation';
    inflBtn.addEventListener('click', ()=>{ it.showInflation = !it.showInflation; render(); });
    inflRow.append(inflBtn); body.append(inflRow);

    if(it.showInflation){
      const gInfl = document.createElement('div'); gInfl.className='grid-2';
      const {field:roiF} = makeTextField('ROI (%)', 'e.g. 2.5', it.roi, (v)=>{ it.roi=v; });
      gInfl.append(roiF); body.append(gInfl);
      const tip = document.createElement('div'); tip.className='subtle'; text = 'This overrides default inflation for this line item.'; tip.textContent = text; body.append(tip);
    }
  }

  const wrapup = document.createElement('div');
  wrap.append(header, body, wrapup);
  return wrap;
}

/* Field factories (used by multi sections) */
function makeTextField(labelText, placeholder, initValRaw, onSave, type='text', inputMode='decimal'){
  const f = document.createElement('div'); f.className = 'field';
  const l = document.createElement('label'); l.className = 'label'; l.textContent = labelText; f.appendChild(l);
  const i = document.createElement('input'); i.type=type; i.inputMode=inputMode; i.placeholder=placeholder; f.appendChild(i);

  if(initValRaw){
    const isPct = /%$/.test(labelText) || /Rate|Deviation|ROI|Growth/i.test(labelText);
    const isDol = /\(\$\)|\$/i.test(labelText) || /Amount|Basis|Gains|Value|Price|Expenses|Income|Cost/i.test(labelText);
    if(isPct){ i.value = `${initValRaw}%`; }
    else if(isDol){ i.value = `$${fmtDollars(initValRaw)}`; }
    else { i.value = initValRaw; }
    i.dataset.raw = String(initValRaw);
  }

  let blurFn = null;
  if(/%|Rate|ROI|Deviation|Growth/i.test(labelText)) blurFn = onBlurPercent;
  else if(/\$|Amount|Basis|Gains|Value|Price|Expenses|Income|Cost/i.test(labelText)) blurFn = onBlurDollar;
  else if(/Year/i.test(labelText)) blurFn = onBlurYear;

  if(blurFn){
    i.addEventListener('focus', ()=> onFocusNumeric(i));
    i.addEventListener('blur', ()=> { blurFn(i); onSave(i.dataset.raw || ''); });
  } else {
    i.addEventListener('input', ()=> onSave(i.value));
  }
  return {field:f, input:i};
}

function makeSelectField(labelText, options, initVal, onSave){
  // options can be array of strings OR array of {value,label}
  const normalize = (o)=> (typeof o === 'object' && o !== null && 'value' in o)
    ? {value: String(o.value), label: String(o.label ?? o.value)}
    : {value: String(o), label: String(o)};
  const opts = options.map(normalize);

  const f = document.createElement('div'); f.className = 'field';
  const l = document.createElement('label'); l.className = 'label'; l.textContent = labelText; f.appendChild(l);
  const s = document.createElement('select');

  opts.forEach(({value,label})=>{
    const opt = document.createElement('option'); opt.value = value; opt.textContent = label;
    if(String(value)===String(initVal)) opt.selected = true; s.appendChild(opt);
  });

  s.addEventListener('change', ()=> onSave(s.value));
  f.appendChild(s);
  return {field:f, select:s};
}

/* Add item */
addBtn.addEventListener('click', ()=>{
  const section = sections.find(s=>s.key===active);
  if(section.mode !== 'multi') return;
  const it = createItem(active);
  render();
  requestAnimationFrame(()=>{
    const node = itemsEl.querySelector(`.item[data-id="${it.id}"] .title-input`);
    node?.focus(); node?.select();
  });
});

/* NEW: Collapse All behavior */
collapseAllBtn.addEventListener('click', ()=>{
  const section = sections.find(s=>s.key===active);
  if(section.mode !== 'multi') return;
  const arr = state[active].items;
  let changed = false;
  arr.forEach(it=>{ if(!it.collapsed){ it.collapsed = true; changed = true; } });
  if(changed) render();
});

/* Drag & drop in dock */
function enableDockDrag(){
  const section = sections.find(s=>s.key===active);
  if(section.mode !== 'multi') return;

  const cards = Array.from(dockEl.querySelectorAll('.mini'));
  if(!cards.length) return;

  let draggingEl = null, startX = 0, startY = 0, dragStarted = false, placeholder = null, pointerId = null;
  const threshold = 6;

  const cleanup = ()=>{
    if(!draggingEl) return;
    draggingEl.classList.remove('dragging'); draggingEl.style.transform = '';
    placeholder?.remove(); placeholder = null;
    if(pointerId != null){ try{ draggingEl.releasePointerCapture?.(pointerId); }catch{} }
    window.removeEventListener('pointermove', onMove, {capture:true});
    window.removeEventListener('pointerup', onUp, {capture:true});
    window.removeEventListener('pointercancel', onCancel, {capture:true});
    draggingEl = null; dragStarted = false; pointerId = null;
  };

  const commitReorder = ()=>{
    const newOrderIds = Array.from(dockEl.children).filter(n => n.classList.contains('mini')).map(n => Number(n.dataset.id));
    applyCollapsedOrder(active, newOrderIds);
  };

  const startDrag = (e)=>{
    dragStarted = true;
    placeholder = document.createElement('div'); placeholder.className = 'placeholder';
    dockEl.insertBefore(placeholder, draggingEl.nextSibling);
    draggingEl.classList.add('dragging');
    try{ draggingEl.setPointerCapture?.(e.pointerId); }catch{}
  };

  const onMove = (e)=>{
    if(!draggingEl) return;
    const dx = e.clientX - startX;
    if(!dragStarted){
      if(Math.hypot(dx, e.clientY - startY) < threshold) return;
      startDrag(e); e.preventDefault();
    }
    draggingEl.style.transform = `translateX(${dx}px) rotate(1deg) scale(1.02)`;

    const {left, right} = dockEl.getBoundingClientRect();
    const speed = 14;
    if(e.clientX > right - 36) dockEl.scrollLeft += speed;
    else if(e.clientX < left + 36) dockEl.scrollLeft -= speed;

    const siblings = Array.from(dockEl.children).filter(n=>n!==draggingEl && n!==placeholder);
    let beforeNode = null;
    for(const sib of siblings){
      const rect = sib.getBoundingClientRect();
      const mid = rect.left + rect.width/2;
      if(e.clientX < mid){ beforeNode = sib; break; }
    }
    if(beforeNode){ dockEl.insertBefore(placeholder, beforeNode); } else { dockEl.appendChild(placeholder); }
  };

  const finishAsClick = (el)=>{
    if(!el) return;
    const id = Number(el.dataset.id);
    const it = state[active].items.find(x=>x.id===id);
    if(it){ it.collapsed = false; render(); }
  };

  const onUp = ()=>{
    if(!draggingEl) return;
    if(dragStarted){
      if(placeholder) dockEl.insertBefore(draggingEl, placeholder);
      commitReorder(); cleanup(); render();
    }{
      const el = draggingEl; cleanup(); finishAsClick(el);
    }
  };

  const onCancel = ()=>{ cleanup(); };

  cards.forEach(card=>{
    card.addEventListener('pointerdown', (e)=>{
      if(e.target.closest('.icon-btn')) return;
      draggingEl = card; pointerId = e.pointerId; startX = e.clientX; startY = e.clientY; dragStarted = false;
      window.addEventListener('pointermove', onMove, {capture:true, passive:false});
      window.addEventListener('pointerup', onUp, {capture:true});
      window.addEventListener('pointercancel', onCancel, {capture:true});
      e.preventDefault();
    }, {passive:false});
  });
}

function applyCollapsedOrder(sectionKey, newCollapsedIds){
  const arr = state[sectionKey].items.slice();
  const collapsedSet = new Set(newCollapsedIds);
  const byId = Object.fromEntries(arr.map(x=>[x.id, x]));
  const reorderedCollapsed = newCollapsedIds.map(id => byId[id]).filter(Boolean);

  const final = [];
  let cIdx = 0;
  for(const it of arr){
    if(collapsedSet.has(it.id)){
      final.push(reorderedCollapsed[cIdx++]);
    } else {
      final.push(it);
    }
  }
  state[sectionKey].items = final;
}

/* JSON build & submit */
const toInt   = v => { const n = parseInt(v,10); return Number.isFinite(n) ? n : null; };
const toFloat = v => { const n = parseFloat(v);  return Number.isFinite(n) ? n : null; };
const nonEmpty = v => !(v === '' || v === undefined || v === null);

function prune(x){
  if(Array.isArray(x)){
    const arr = x.map(prune).filter(v => !(v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length===0) && v !== null);
    return arr;
  } else if(x && typeof x === 'object'){
    const out = {};
    for(const [k,v] of Object.entries(x)){
      const pv = prune(v);
      if(pv === '' || pv === undefined || pv === null) continue;
      if(typeof pv === 'object' && !Array.isArray(pv) && Object.keys(pv).length===0) continue;
      if(Array.isArray(pv) && pv.length===0) continue;
      out[k] = pv;
    }
    return out;
  }
  return x;
}

function validateState(){
  const errors = [];

  const basics = state.alpha.single || {};
  if(!nonEmpty(basics.age)) errors.push('Basics: Age is required');
  if(!nonEmpty(basics.life)) errors.push('Basics: Life expectancy is required');
  if(!nonEmpty(basics.retire)) errors.push('Basics: Retirement age is required');
  if(!nonEmpty(basics.stateCode)) errors.push('Basics: State of residence is required');
  if (nonEmpty(basics.spouseAge) && !nonEmpty(basics.spouseLife)) {
    errors.push('Basics: Spouse\'s life expectancy is required if age is provided');
  } else if (nonEmpty(basics.spouseLife) && !nonEmpty(basics.spouseAge)) {
    errors.push('Basics: Spouse\'s age is required if life expectancy is provided');
  }

  const g = state.beta.single || {};
  if(!nonEmpty(g.inflation?.roi)) errors.push('Growth Rates: Inflation value is required');
  if(!nonEmpty(g.liquid?.usStocks?.roi) || !nonEmpty(g.liquid?.usBonds?.roi) || !nonEmpty(g.liquid?.internationalStocks?.roi)) errors.push('Growth Rates: Each Liquid Investment ROI (US Stocks, US Bonds, International Stocks) is required');

  //validate liquid assets
  let totalAssets = 0;
  (state.gamma.items || []).forEach(a => {
    //sum up the values of all liquid assets
    let amount = nonEmpty(a.amount) ? toInt(a.amount) : null;
    totalAssets += (amount || 0);
    //check cash interest rate
    //if (a.atype === 'Cash') {
    //  const cashRate = nonEmpty(a.cashRate) ? toFloat(a.cashRate) : null;
    //  if (cashRate === null) {
    //    errors.push(`Liquid Assets: Cash interest rate is required for asset "${a.title || 'Unnamed Asset'}"`);
    //  } else if (cashRate < 0 || cashRate > 100) {
    //    errors.push(`Liquid Assets: Cash interest rate must be between 0% and 100% for asset "${a.title || 'Unnamed Asset'}"`);
    //  }
    //}
    //check custom ROI values
    if (nonEmpty(a.roi) && !nonEmpty(a.stdev)) {
      errors.push(`Liquid Assets: Standard Deviation is required if ROI is provided for asset "${a.title || 'Unnamed Asset'}"`);
    } else if (!nonEmpty(a.roi) && nonEmpty(a.stdev)) {
      errors.push(`Liquid Assets: ROI is required if Standard Deviation is provided for asset "${a.title || 'Unnamed Asset'}"`);
    }
  });
  if (totalAssets <= 0) {
      errors.push('Liquid Assets: At least one liquid asset is required');
  }

  //validate real estate
  let totalRealEstate = 0;
  (state.delta.items || []).forEach(p => {
    //check for current value of real estate
    const currentValue = nonEmpty(p.currentValue) ? toInt(p.currentValue) : null;
    if (currentValue === null || currentValue <= 0) {
      errors.push(`Real Estate: Current value is required for property "${p.title || 'Unnamed Property'}"`);
    } 
    const purchaseYear = p.purchaseYear || null;
    if (purchaseYear === '__ALREADY_OWNED__') {
      //check if mortgage information is complete
      const loanOrigYear = nonEmpty(p.loanOrigYear) ? toInt(p.loanOrigYear) : null;
      const loanTerm = nonEmpty(p.loanTerm) ? toInt(p.loanTerm) : null;
      const loanRate = nonEmpty(p.loanRate) ? toFloat(p.loanRate) : null;
      const monthlyPayment = nonEmpty(p.monthlyPayment) ? toInt(p.monthlyPayment) : null;
      const none = (loanOrigYear === null && loanTerm === null && loanRate === null && monthlyPayment === null);
      const allFour = (loanOrigYear !== null && loanTerm !== null && loanRate !== null && monthlyPayment !== null);
      if (!none && !allFour) {
        errors.push(`Real Estate: Mortgage information is incomplete for property "${p.title || 'Unnamed Property'}"`);
      }
    }
    else {
      //check if future mortgage information is complete
      const downPaymentPct = nonEmpty(p.downPaymentPct) ? toFloat(p.downPaymentPct) : null;
      const loanTerm = nonEmpty(p.loanTerm) ? toInt(p.loanTerm) : null;
      const loanRate = nonEmpty(p.loanRate) ? toFloat(p.loanRate) : null;
      const none = (downPaymentPct === null && loanTerm === null && loanRate === null);
      const allThree = (downPaymentPct !== null && loanTerm !== null && loanRate !== null);
      if (!none && !allThree) {
        errors.push(`Real Estate: Mortgage information is incomplete for property "${p.title || 'Unnamed Property'}"`);
      }
    }
    //check custom ROI values
    if (nonEmpty(p.roi) && !nonEmpty(p.stdev)) {
      errors.push(`Real Estate: Standard Deviation is required if ROI is provided for property "${p.title || 'Unnamed Property'}"`);
    } else if (!nonEmpty(p.roi) && nonEmpty(p.stdev)) {
      errors.push(`Real Estate: ROI is required if Standard Deviation is provided for property "${p.title || 'Unnamed Property'}"`);
    }

    //validate sale information
    const saleYear = p.saleYear || null;
    if (saleYear && saleYear !== '__NEVER_SELL__') {
      //check purchase price
      const purchasePrice = nonEmpty(p.purchasePrice) ? toInt(p.purchasePrice) : null;
      const improvements = nonEmpty(p.improvements) ? toInt(p.improvements) : null;
      const sellCost = nonEmpty(p.sellCost) ? toInt(p.sellCost) : null;
      if (purchasePrice === null) {
        errors.push(`Real Estate: Purchase price is required for sale of property "${p.title || 'Unnamed Property'}"`);
      }
      //check proceeds account
      const saleProceedsAccount = p.saleProceedsAccount || null;
      if (!saleProceedsAccount) {
        errors.push(`Real Estate: Proceeds account is required for sale of property "${p.title || 'Unnamed Property'}"`);
      }
    }
  });

  //validate income
  (state.epsilon.items || []).forEach(i => {
  });

  //validate expenses
  let totalExpenses = 0;
  (state.zeta.items || []).forEach(e => {
    const annualAmount = nonEmpty(e.amount) ? toInt(e.amount) : null;
    totalExpenses += (annualAmount || 0);
  });
  if (totalExpenses <= 0) {
    errors.push('Expenses: At least one expense is required');
  }


  return errors;
}

function getIdPrefixMap() {
  //For each asset, map its title to an idPrefix used in the back end
  const map = {};
  (state.gamma.items || []).forEach((a, index) => {
    const assetNum = index + 1;
    const idPrefix = 'asset' + assetNum;
    map[a.title] = idPrefix;
  });
  return map;
}

/**
 * Compute the original loan principal from a fixed monthly mortgage payment.
 *
 * Formula (level-payment annuity):
 *   M = P * i / (1 - (1 + i)^(-N))
 *   => P = M * (1 - (1 + i)^(-N)) / i
 *
 * @param {number} monthlyPayment - Fixed monthly payment (M), > 0
 * @param {number} termYears      - Loan term in years, > 0
 * @param {number} annualRate     - Annual interest rate as a decimal (e.g., 0.06 for 6%), amortized monthly
 * @returns {number} Starting principal (P)
 */
function getMortgageStartPrincipal(monthlyPayment, termYears, annualRate) {
  if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) {
    throw new Error("monthlyPayment must be a positive number");
  }
  if (!Number.isFinite(termYears) || termYears <= 0) {
    throw new Error("termYears must be a positive number");
  }
  if (!Number.isFinite(annualRate) || annualRate < 0) {
    throw new Error("annualRate must be a non-negative number (e.g., 0.06 for 6%)");
  }

  const N = Math.round(termYears * 12); // total number of monthly payments
  const i = annualRate / 12;            // monthly interest rate

  // Handle zero (or effectively zero) interest as a special case
  if (Math.abs(i) < 1e-12) {
    return monthlyPayment * N;
  }

  const discountFactor = 1 - Math.pow(1 + i, -N);
  return monthlyPayment * (discountFactor / i);
}

function codeForYearSelection(yearSelection) {
  if (yearSelection === '__RETIREMENT__') return -1;
  if (yearSelection === '__FIRST_DEATH__') return -2;
  if (yearSelection === '__FIRST_DEATH_P1__') return -3;
  if (yearSelection === '__END_OF_PLAN__') return -4;
  return toInt(yearSelection);
}

function buildPlanJSON(){
  const submittal = {};
  submittal.version = "5.0";
  //submittal.clickstream = "";
  submittal.mode = "advanced";
  //submittal.name = "";
  const calendar = {};
  calendar.planStartYear = new Date().getFullYear();
  calendar.birthYear = Number(calendar.planStartYear) - Number(state.alpha.single.age);
  calendar.deathAge = Number(state.alpha.single.life);
  if (state.alpha.single.spouseAge && state.alpha.single.spouseLife) {
    calendar.birthYearSpouse = Number(calendar.planStartYear) - Number(state.alpha.single.spouseAge);
    calendar.deathAgeSpouse = Number(state.alpha.single.spouseLife);
  }
  calendar.retireYear = Number(calendar.birthYear) + Number(state.alpha.single.retire);
  submittal.calendar = calendar;

  if (nonEmpty(state.alpha.single.heirsTarget)) {
    submittal.definitionOfSuccess = toInt(state.alpha.single.heirsTarget);
  }
  submittal.state = state.alpha.single.stateCode; 
  //submittal.city = ;
  const growthRates = {};
  growthRates.inflation = toFloat(state.beta.single.inflation.roi);
  growthRates.inflation_stdev = toFloat(state.beta.single.inflation.stdev); //TODO: retrofit back end to handle
  growthRates.defaultAnnualGainRate = {};
  growthRates.defaultAnnualGainRate.average = toFloat(state.beta.single.liquid.roi) || 0;
  growthRates.defaultAnnualGainRate.standardDeviation = toFloat(state.beta.single.liquid.stdev) || 0; 
  //growthRates.ownRealEstate = 'true'; //TODO needed?
  growthRates.defaultREAnnualGainRate = {}
  growthRates.defaultREAnnualGainRate.average = toFloat(state.beta.single.realEstate.roi) || 0;
  growthRates.defaultREAnnualGainRate.standardDeviation = toFloat(state.beta.single.realEstate.stdev) || 0; 
  growthRates.growthRatesCustomize = "true"; //TODO
  growthRates.customGrowthRates = {};
  //map custom growth rates to array indexed by year offset from current year
  let triples = state.beta.single.liquid.customYears || [];
  const currentYear = new Date().getFullYear();
  const maxYear = Math.max(...triples.map(t => t.year));
  const length = maxYear - currentYear + 1;
  const newTriples = Array(length).fill(null);
  triples.forEach(({ year, roi, prob }) => {
    const index = year - currentYear;
    if (index >= 0 && index < length && nonEmpty(year) && nonEmpty(roi) && nonEmpty(prob)) {
      newTriples[index] = { year : toInt(year), roi: toFloat(roi) || 0, trialPercentage: toFloat(prob) || 0 };
    }
  });
  if (newTriples.length > 0) {
    growthRates.customGrowthRates.customGrowthRates = newTriples;
  } else {
    delete growthRates.customGrowthRates;
  }
  submittal.growthRates = growthRates;

  //liquid assets
  idPrefixMap = getIdPrefixMap(); //map of asset title to idPrefix
  submittal.savingsAccountList = {};
  submittal.savingsAccountList.savingsAccounts = [];
  submittal.savingsAccountList.taxableInvestmentAccounts = [];
  let assetNum = 1;
  (state.gamma.items || []).forEach(a => {
    const future = a.inheritanceYear && a.inheritanceYear !== '' && a.inheritanceYear !== '__ALREADY_OWNED__' ? true : false;
    const firstYear = future ? toInt(a.inheritanceYear) : calendar.planStartYear;
    if (a.atype === 'Taxable Investment') {
      let savingsSubType = 'stock';
      let taxTreatment = a.taxTreatment === 'ordinary' ? 'ordinary' : (a.taxTreatment === 'capital_gains' ? 'ltcg' : 'split');
      let annualGainRateOverride = false;
      if (nonEmpty(a.roi) && nonEmpty(a.stdev)) annualGainRateOverride = true;
      submittal.savingsAccountList.taxableInvestmentAccounts.push({
        idPrefix: idPrefixMap[a.title] || ('asset' + assetNum),
        savingsSubType: savingsSubType,
        isDefault: a.title.startsWith('DEFAULT'),
        name: a.title,
        sortOrder: assetNum,
        future: future,
        firstYear: firstYear,
        startingValueGains: toInt(a.unrealized) || 0,
        startingValueCost: toInt(a.costBasis) || 0,
        taxTreatment: taxTreatment,
        preRetireContribution: toInt(a.preRetireAnnualContribution) || 0,
        annualGainRateOverride: annualGainRateOverride,
        annualGainRate: annualGainRateOverride ? {
          average: toFloat(a.roi) || 0,
          standardDeviation: toFloat(a.stdev) || 0
        } : null
      });
    }
    else {
      let savingsSubType = 'regular';
      let rmdEnabled = !!a.rmd;
      if (a.atype === 'Tax Deferred') {
        savingsSubType = 'ira';
        rmdEnabled = !!a.rmd;
      }
      if (a.atype === 'Roth') savingsSubType = 'roth';
      let annualGainRateOverride = false;
      if (a.atype !== 'Cash' && nonEmpty(a.roi) && nonEmpty(a.stdev)) annualGainRateOverride = true;
      if (a.atype === 'Cash') annualGainRateOverride = true; //always override for cash
      let annualGainRate = annualGainRateOverride ? {
          average: toFloat(a.roi) || 0,
          standardDeviation: toFloat(a.stdev) || 0
        } : null ;
      if (a.atype === 'Cash') {
        annualGainRate = {
          average: toFloat(a.interest) || 0,
          standardDeviation: 0
        };
      }
      submittal.savingsAccountList.savingsAccounts.push({
        idPrefix: idPrefixMap[a.title] || ('asset' + assetNum),
        savingsSubType: savingsSubType,
        isDefault: a.title.startsWith('DEFAULT'),
        name: a.title,
        sortOrder: assetNum,
        future: future,
        firstYear: firstYear,
        startingValue: toInt(a.amount) || 0,
        preRetireContribution: toInt(a.preRetireAnnualContribution) || 0,
        annualGainRateOverride: annualGainRateOverride,
        annualGainRate: annualGainRate,
        rmdEnabled: rmdEnabled,
        assetOwner: rmdEnabled ? a.rmdOwner : 'you',
        proceedsToAccountId: rmdEnabled && a.atype === "Tax Deferred" ? (idPrefixMap[a.rmdProceedsAccount] || null) : null
      });
    }
    assetNum += 1;
  });

  if (submittal.savingsAccountList.savingsAccounts.length === 0) {
    submittal.savingsAccountList.savingsAccounts = null; // Remove empty savings account list
  } 
  if (submittal.savingsAccountList.taxableInvestmentAccounts.length === 0) {
    submittal.savingsAccountList.taxableInvestmentAccounts = null; // Remove empty savings account list
  } 

  //Real estate
  submittal.propertyList = {};
  submittal.propertyList.properties = [];
  submittal.propertyList.rentalProperties = [];
  let propNum = 1;
  (state.delta.items || []).forEach(p => {
    const future = p.purchaseYear && p.purchaseYear !== '' && p.purchaseYear !== '__ALREADY_OWNED__' ? true : false;
    const firstYear = future ? toInt(p.purchaseYear) : calendar.planStartYear;
    let annualGainRateOverride = false;
    if (nonEmpty(p.roi) && nonEmpty(p.stdev)) annualGainRateOverride = true;
    const rental = (p.annualExpenses || p.annualIncome || p.rentGrowth) ? true : false;
    const re = {
      name: p.title,
      propertySubType: rental ? 'rental' : 'home',
      future: future,
      firstYear: firstYear,
      startingValue: toInt(p.currentValue) || 0,
      annualGainRateOverride: annualGainRateOverride,
      annualGainRate: annualGainRateOverride ? {
        average: toFloat(p.roi) || 0,
        standardDeviation: toFloat(p.stdev) || 0
      } : null,
      //hasMortgage: below
      //mortgageStartYear: below
      //mortgageStartPrincipal: below
      //mortgageTermYears: below
      //mortgageInterestRate: below
      //planToSell: below
      //sellTrigger: below
      //annualExpenses: below
      //annualRentalIncome: below
      //cashFlowGrowthRate: below
      idPrefix: 'property' + propNum
    };
    //mortgage?
    const loanOrigYear = nonEmpty(p.loanOrigYear) ? toInt(p.loanOrigYear) : null;
    const loanTerm = nonEmpty(p.loanTerm) ? toInt(p.loanTerm) : null;
    const loanRate = nonEmpty(p.loanRate) ? toFloat(p.loanRate) : null;
    const monthlyPayment = nonEmpty(p.monthlyPayment) ? toInt(p.monthlyPayment) : null;
    const downPaymentPct = nonEmpty(p.downPaymentPct) ? toFloat(p.downPaymentPct) : null;
    const hasMortgage = (loanOrigYear !== null && loanTerm !== null && loanRate !== null && monthlyPayment !== null) ||
                        (downPaymentPct !== null && loanTerm !== null && loanRate !== null);
    re.hasMortgage = hasMortgage;
    if (hasMortgage) {
      if (future) {
        re.downPaymentPercent = downPaymentPct || 0;
        re.mortgageStartYear = -1;
        re.mortgageStartPrincipal = -1;
        re.mortgageTermYears = loanTerm || 0;
        re.mortgageInterestRate = loanRate || 0;
      }
      else {
        re.mortgageStartYear = loanOrigYear;
        re.mortgageStartPrincipal = getMortgageStartPrincipal(monthlyPayment, loanTerm, (loanRate || 0)/100);
        re.mortgageTermYears = loanTerm;
        re.mortgageInterestRate = loanRate;
      }
    }
    //rental?
    const annualExpenses = nonEmpty(p.annualExpenses) ? toInt(p.annualExpenses) : 0;
    const annualIncome = nonEmpty(p.annualIncome) ? toInt(p.annualIncome) : 0;
    const rentGrowth = nonEmpty(p.rentGrowth) ? toFloat(p.rentGrowth) : 0;
    const hasRental = (annualExpenses !== 0 || annualIncome !== 0 || rentGrowth !== 0);
    if (hasRental) {
      re.annualRentalIncome = annualIncome;
      re.annualExpenses = annualExpenses;
      re.cashFlowGrowthRate = rentGrowth;
    }
    //sale?
    const planToSell = p.saleYear && p.saleYear !== '' && p.saleYear !== '__AS_NEEDED__' && p.saleYear !== '__NEVER_SELL__' ? true : false;
    const sellTrigger = p.saleYear === '__AS_NEEDED__';
    re.planToSell = planToSell;
    re.sellTrigger = sellTrigger;
    if (planToSell) {
      re.lastYear = toInt(p.saleYear) || null;
    }
    if (planToSell || sellTrigger) {
      re.purchasePrice = nonEmpty(p.purchasePrice) ? toInt(p.purchasePrice) : 0;
      re.improvementsValue = nonEmpty(p.improvements) ? toInt(p.improvements) : 0;
      re.costOfSelling = nonEmpty(p.sellCost) ? toInt(p.sellCost) : 0; //TODO: make percent, not flat
      const saleProceedsAccount = p.saleProceedsAccount || null;
      re.proceedsToAccountId = saleProceedsAccount ? (idPrefixMap[saleProceedsAccount] || null) : null
    }    


    if (rental) {
      submittal.propertyList.rentalProperties.push(re);
    }
    else {
      submittal.propertyList.properties.push(re);
    }
    propNum += 1;
  });
  if (submittal.propertyList.properties.length === 0) {
    delete submittal.propertyList.properties; // Remove empty real estate list
  }
  if (submittal.propertyList.rentalProperties.length === 0) {
    delete submittal.propertyList.rentalProperties; // Remove empty rental property list
  }
  if (submittal.propertyList.properties === null && submittal.propertyList.rentalProperties === null) {
    delete submittal.propertyList; // Remove empty property list
  }

  //income
  submittal.incomeAccountList = {};
  submittal.incomeAccountList.incomesAccounts = [];
  let incomeNum = 1;
  (state.epsilon.items || []).forEach(i => {
    const inc = {
      idPrefix: 'income' + incomeNum,
      name: i.title,
      taxable: i.taxTreatment === 'Ordinary Income',
      socialSecurity: i.taxTreatment === 'Social Security (85% taxable)', //TODO NEW SERVER SIDE
      firstYear: codeForYearSelection(i.startYear),
      lastYear: codeForYearSelection(i.endYear),
      startingValue: toInt(i.amount) || 0,
      annualGainRateOverride: nonEmpty(i.roi),
      annualGainRate: nonEmpty(i.roi) ? {
        average: toFloat(i.roi) || 0,
        standardDeviation: 0
      } : null,
    };
    submittal.incomeAccountList.incomesAccounts.push(inc);
    incomeNum += 1;
  });
  if (submittal.incomeAccountList.incomesAccounts.length === 0) {
    delete submittal.incomeAccountList.incomesAccounts; // Remove empty income list
  }
  if (submittal.incomeAccountList.incomesAccounts === null) {
    delete submittal.incomeAccountList; // Remove empty income account list
  }




  //expenses
  submittal.expenseAccountList = {};
  submittal.expenseAccountList.expenseAccounts = [];
  let expenseNum = 1;
  (state.zeta.items || []).forEach(e => {
    const exp = {
      idPrefix: 'expense' + expenseNum,
      name: e.title,
      firstYear: codeForYearSelection(e.startYear),
      lastYear: codeForYearSelection(e.endYear),
      startingValue: toInt(e.amount) || 0,
      annualGainRateOverride: nonEmpty(e.roi),
      annualGainRate: nonEmpty(e.roi) ? {
        average: toFloat(e.roi) || 0,
        standardDeviation: 0
      } : null,
    };
    submittal.expenseAccountList.expenseAccounts.push(exp);
    expenseNum += 1;
  });
  if (submittal.expenseAccountList.expenseAccounts.length === 0) {
    delete submittal.expenseAccountList.expenseAccounts; // Remove empty expense list
  }
  if (submittal.expenseAccountList.expenseAccounts === null) {
    delete submittal.expenseAccountList; // Remove empty expense account list
  }


  return submittal;
}

/* JSON preview toggle */
previewBtn.addEventListener('click', ()=>{
  const errors = validateState();
  if(errors.length > 0){
    console.warn('Validation errors:', errors);
    showErrorPanel(errors);
    return;
  }
  hideErrorPanel();
  const data = buildPlanJSON();
  const enteringPreview = !jsonMode;
  if(enteringPreview){
    jsonBox.textContent = JSON.stringify(data, null, 2);
    jsonMode = true;
    previewBtn.textContent = 'Hide JSON';
  }else{
    jsonMode = false;
    previewBtn.textContent = 'Preview JSON';
  }
  render();
});

/* Submit */
submitBtn.addEventListener('click', async ()=>{
  const errors = validateState();
  if(errors.length > 0){
    console.warn('Validation errors:', errors);
    showErrorPanel(errors);
    return;
  }
  hideErrorPanel();
  const data = buildPlanJSON();
  const body = btoa(JSON.stringify(data))
  showProcessingModal();
  const response = await fetch('https://api.retirementodds.info/calculate/staging/calculate', {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'text/plain',
      'Referer': document.referrer || window.location.href
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: '', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: body // body data type must match "Content-Type" header
  });
  //return response.json(); // parses JSON response into native JavaScript objects
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  //showToast('Submitted successfully.', true);
  const respData = await response.json(); 
  hideProcessingModal()
  ensureResultsSection(); 
  results.showResults(respData.result, data); 
  //showResults(respData);
});
document.getElementById('submitBtnDup')?.addEventListener('click', () => submitBtn.click());

function showProcessingModal() {
  document.getElementById('processingModal').style.display = 'flex';
}

function hideProcessingModal() {
  document.getElementById('processingModal').style.display = 'none';
}

function showToast(msg, ok){
  toastEl.textContent = msg;
  toastEl.className = 'toast show ' + (ok?'ok':'err');
  setTimeout(()=>{ toastEl.classList.remove('show'); }, 2600);
}

/* Create the two default liquid assets (collapsed + locked) */
function createDefaultLiquidAssets(){
  // Create two default accounts collapsed and locked
  createItem('gamma', {
    title: 'DEFAULT Cash Account',
    atype: 'Cash',
    collapsed: true,
    locked: true
  });
  createItem('gamma', {
    title: 'DEFAULT Taxable Investment Account',
    atype: 'Taxable Investment',
    collapsed: true,
    locked: true
  });
}
/* ======== HELP ME CHOOSE MODAL LOGIC ======== */
const modalBackdrop = document.getElementById('modalBackdrop');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalTitle = document.getElementById('modalTitle');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalXBtn = document.getElementById('modalXBtn');

const modalXCloseBtn = document.getElementById('modalXClose');
if(modalXCloseBtn){
  modalXCloseBtn.addEventListener('click', ()=>{
    closeModal();
  });
}


function openModal(){ modalBackdrop.classList.add('show'); modal.classList.add('show'); }
function closeModal(){ modalBackdrop.classList.remove('show'); modal.classList.remove('show'); }

modalBackdrop.addEventListener('click', closeModal);
if(modalXBtn){ modalXBtn.addEventListener('click', closeModal); }
modalCloseBtn.addEventListener('click', ()=>{
  // Default close (if a handler assigned by helpMeChoose, it will be replaced there)
  closeModal();
});

function setPctFieldBehavior(el){
  el.classList.add('pct');
  el.addEventListener('focus', ()=> onFocusNumeric(el));
  el.addEventListener('blur', ()=> onBlurPercent(el));
}

function randomInRange(min, max, step=0.1){
  const n = Math.round((min + Math.random()*(max-min)) / step) * step;
  return Number(n.toFixed(2));
}

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","District of Columbia","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada",
  "New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
  "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"
];

window.helpMeChoose = function(topic){
  // map topic -> state path + UI definition
  const growth = state.beta.single;
  let title = 'Help me choose';
  let applyTo = null;

  const makeRoiSdFields = (initRoi, initSd) => {
    const wrap = document.createElement('div');
    wrap.className = 'grid-2';
    const f1 = document.createElement('div'); f1.className='field';
    const l1 = document.createElement('label'); l1.className='label'; l1.textContent='ROI (%)';
    const roi = document.createElement('input'); roi.type='text'; roi.inputMode='decimal'; roi.id='modalRoi';
    if(initRoi){ roi.dataset.raw = String(initRoi); roi.value = `${initRoi}%`; }
    setPctFieldBehavior(roi);
    f1.append(l1, roi);

    const f2 = document.createElement('div'); f2.className='field';
    const l2 = document.createElement('label'); l2.className='label'; l2.textContent='Standard Deviation (%)';
    const sd = document.createElement('input'); sd.type='text'; sd.inputMode='decimal'; sd.id='modalSd';
    if(initSd){ sd.dataset.raw = String(initSd); sd.value = `${initSd}%`; }
    setPctFieldBehavior(sd);
    f2.append(l2, sd);

    wrap.append(f1, f2);
    return wrap;
  };

  modalBody.innerHTML = '';

  if(topic === 'inflation'){
    title = 'Inflation • Help me choose';
    applyTo = growth.inflation;
    const p = document.createElement('p');
    p.id = 'modalDesc';
    p.className='lipsum';
    p.innerHTML = 'The historical average inflation from the <a href="https://www.usinflationcalculator.com/inflation/historical-inflation-rates/" target="_blank">US Inflation Calculator</a> web site is shown below.   Feel free to make adjustments as you see fit to predict the future.';
    modalBody.appendChild(p);
    const inflationRoi = inflationdata.computeMean();
    const inflationSd  = inflationdata.computeStdDev();
    modalBody.appendChild(makeRoiSdFields(inflationRoi, inflationSd));
  }
  else if(topic === 'liquid'){
    title = 'Liquid Investments • Help me choose';
    applyTo = growth.liquid;

    // Portfolio selector
    const fP = document.createElement('div'); fP.className='field';
    const lP = document.createElement('label'); lP.className='label'; lP.textContent='Portfolio';
    const sP = document.createElement('select'); sP.id='modalPortfolio';
    [
      '--Choose a common portfolio--',
      'S&P 500', 'Dow Jones (DIA)', 'Total US Stock Market', 'Total US Bond Market',
      '80% US Stock,20% Bonds', '60% US Stock,40% Bonds', '40% US Stock,60% Bonds',
      '65% US Stock,15% Intl Stock,20% Bonds', '50% US Stock,10% Intl Stock,40% Bonds'      
    ].forEach(v=>{
      const o=document.createElement('option'); o.value=v; o.textContent=v; sP.appendChild(o);
    });
    fP.append(lP, sP);

    // History selector
    const fH = document.createElement('div'); fH.className='field';
    const lH = document.createElement('label'); lH.className='label'; lH.textContent='Historical Time Period';
    const sH = document.createElement('select'); sH.id='modalPeriod';
    [
      '--Choose a historical time period--',
      '1987-2023', '2000-2010', '2010-2023', '2000-2023'
    ].forEach(v=>{
      const o=document.createElement('option'); o.value=v; o.textContent=v; sH.appendChild(o);
    });
    fH.append(lH, sH);

    const selWrap = document.createElement('div'); selWrap.className='grid-2';
    selWrap.append(fP, fH);
    modalBody.append("Choose a portfolio that best matches your investments, and historical period that you feel can best predict the future.   Click \"Close & Apply\" to use the resulting values.");
    modalBody.appendChild(selWrap);

    const roiSdWrap = makeRoiSdFields(applyTo.roi, applyTo.stdev);
    modalBody.appendChild(roiSdWrap);

    const lookupValues = ()=>{
      const portfolio = sP.value;
      const period = sH.value;
      if (portfolio !== '--Choose a common portfolio--' && period !== '--Choose a historical time period--') {
        const roi = marketreturns[portfolio][period]["ROI"].replace(/%$/, '');;
        const sd  = marketreturns[portfolio][period]["STD"].replace(/%$/, '');;
        const roiEl = document.getElementById('modalRoi');
        const sdEl  = document.getElementById('modalSd');
        roiEl.dataset.raw = String(roi); roiEl.value = `${roi}%`;
        sdEl.dataset.raw  = String(sd);  sdEl.value  = `${sd}%`;
      }
    };
    sP.addEventListener('change', lookupValues);
    sH.addEventListener('change', lookupValues);
  }
  else if(topic === 'real_estate'){
    title = 'Real Estate Investments • Help me choose';
    applyTo = growth.realEstate;
    const p = document.createElement('p');
    p.id = 'modalDesc';
    p.className='lipsum';
    p.innerHTML = 'Choose a state to see the historical appreciation for real estate in that state.  This data is for the period from Q1 1991 to Q3 2022 from the <a href=\"https://www.fhfa.gov/data/hpi\" target=\"_blank\">Federal Housing Finance Agency</a>.  Feel free to make adjustments as you see fit to predict the future.';
    modalBody.appendChild(p);

    const fS = document.createElement('div'); fS.className='field';
    const lS = document.createElement('label'); lS.className='label'; lS.textContent='State';
    const sS = document.createElement('select'); sS.id='modalState';

    const o = document.createElement('option');
    o.value = ''; o.textContent = '-- Choose a state --';
    sS.appendChild(o);

    Object.entries(realEstateROI).forEach(([abbr, data]) => {
        const option = document.createElement('option');
        option.value = abbr;
        option.textContent = data.stateName;
        sS.appendChild(option);
    });

    fS.append(lS, sS);
    modalBody.appendChild(fS);

    const roiSdWrap = makeRoiSdFields(applyTo.roi, applyTo.stdev);
    modalBody.appendChild(roiSdWrap);

    const lookupRE = ()=>{
      const selectedAbbr = sS.value;
      const data = realEstateROI[selectedAbbr];
      if (data) {
        let roi = `${data.average}`;
        roi = (100*Number(roi)).toFixed(2); // Average ROI for the state
        let sd  = `${data.stdev}`;
        sd = (100*Number(sd)).toFixed(2); // Standard Deviation for the state
        const roiEl = document.getElementById('modalRoi');
        const sdEl  = document.getElementById('modalSd');
        roiEl.dataset.raw = String(roi); roiEl.value = `${roi}%`;
        sdEl.dataset.raw  = String(sd);  sdEl.value  = `${sd}%`;
      }

    };
    sS.addEventListener('change', lookupRE);
  }

  modalTitle.textContent = title;

  // Close button behavior: push ROI/SD into the main form & state, then close.
  modalCloseBtn.onclick = ()=>{
    const roiInput = document.getElementById('modalRoi');
    const sdInput  = document.getElementById('modalSd');

    const roiRaw = roiInput?.dataset.raw ?? numOnly(roiInput?.value || '');
    const sdRaw  = sdInput?.dataset.raw  ?? numOnly(sdInput?.value  || '');

    if(applyTo){
      applyTo.roi   = roiRaw || '';
      applyTo.stdev = sdRaw  || '';
    }

    // Reflect into visible inputs on Growth panel
    const idsMap = {
      inflation: { roi:'inflationRoi', sd:'inflationSd' },
      liquid:    { roi:'liquidRoi',    sd:'liquidSd'    },
      real_estate:{ roi:'reRoi',       sd:'reSd'        }
    };

    const map = idsMap[topic];
    if(map){
      const roiEl = document.getElementById(map.roi);
      const sdEl  = document.getElementById(map.sd);
      if(roiEl){ roiEl.dataset.raw = applyTo.roi || ''; roiEl.value = applyTo.roi ? `${applyTo.roi}` : ''; }
      if(sdEl){  sdEl.dataset.raw  = applyTo.stdev || ''; sdEl.value  = applyTo.stdev ? `${applyTo.stdev}` : ''; }
    }

    // Re-render to keep all bindings tidy (stays on Growth)
    render();
    closeModal();
  };

  openModal();
};
/* ======== /HELP ME CHOOSE MODAL LOGIC ======== */

/* Boot */
function init(){
  // Add two locked, collapsed defaults to Liquid Assets
  createDefaultLiquidAssets();

  // (Removed) No starter items for Real Estate, Income, Expenses per user request.

  render();
}
init();






/* ===== Plan Save/Restore via localStorage — Namespaced Modals ===== */
(function(){
  const PLAN_PREFIX = 'plan:';
  const INDEX_KEY = 'plan:index';
  const $ = s => document.querySelector(s);
  const keyFor = n => PLAN_PREFIX + n;

  function readIndex(){
    try{ const raw = localStorage.getItem(INDEX_KEY); const arr = raw?JSON.parse(raw):[]; return Array.isArray(arr)?arr.filter(x=>typeof x==='string' && x.trim()):[]; }catch(e){ return []; }
  }
  function writeIndex(arr){ localStorage.setItem(INDEX_KEY, JSON.stringify(Array.from(new Set(arr.filter(Boolean))))); }

  function openModal(id){
    const m = document.getElementById(id); if(!m) return;
    m.setAttribute('aria-hidden','false'); document.body.classList.add('ro-modal-open');
    setTimeout(()=>{ m.querySelector('input,button,select,textarea,[tabindex]:not([tabindex="-1"])')?.focus(); },0);
  }
  function closeModal(id){
    const m = document.getElementById(id); if(!m) return;
    m.setAttribute('aria-hidden','true');
    // If no other ro-modals are open, unlock scroll
    if(!document.querySelector('.ro-modal[aria-hidden="false"]')) document.body.classList.remove('ro-modal-open');
  }
  window.closeRoModal = closeModal; // for internal calls

  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.ro-modal__close,[data-close-modal]');
    if(btn){ closeModal(btn.getAttribute('data-close-modal') || btn.closest('.ro-modal')?.id); }
    const dialog = e.target.closest('.ro-modal__dialog');
    const root = e.target.closest('.ro-modal');
    if(root && !dialog){ root.setAttribute('aria-hidden','true'); if(!document.querySelector('.ro-modal[aria-hidden="false"]')) document.body.classList.remove('ro-modal-open'); }
  });

  // Deep assign
  function deepAssign(target, source){
    if(source && typeof source==='object'){
      Object.keys(source).forEach(k=>{
        if(source[k] && typeof source[k]==='object' && !Array.isArray(source[k])){
          if(!target[k] || typeof target[k] !== 'object') target[k] = {};
          deepAssign(target[k], source[k]);
        }else{ target[k] = source[k]; }
      });
    }
  }

  function doSavePlan(name){
    if(!name || !name.trim()){ showToast?.('Please enter a plan name.'); return; }
    const key = keyFor(name);
    const existing = localStorage.getItem(key);
    if(existing && !confirm(`A plan named “${name}” already exists. Replace it?`)) return;
    try{
      const payload = { updatedAt: Date.now(), data: state };
      localStorage.setItem(key, JSON.stringify(payload));
      const idx = readIndex(); if(!idx.includes(name)){ idx.push(name); writeIndex(idx); }
      showToast?.(`Saved plan “${name}”.`);
      closeModal('saveModal');
    }catch(e){ alert('Failed to save plan: ' + (e?.message||e)); }
  }

  function doRestorePlan(name){
    try{
      const raw = localStorage.getItem(keyFor(name)); if(!raw){ alert('Saved plan not found.'); return; }
      const parsed = JSON.parse(raw); const data = parsed.data || parsed;
      deepAssign(state, data);
      if(typeof render === 'function') render();
      showToast?.(`Restored plan “${name}”.`);
      document.dispatchEvent(new CustomEvent('plan:restored', { detail:{ name } }));
      closeModal('restoreModal');
    }catch(e){ alert('Failed to restore plan: ' + (e?.message||e)); }
  }
  function doDeletePlan(name){
    try{
      localStorage.removeItem(keyFor(name));
      const idx = readIndex().filter(n=>n!==name); writeIndex(idx);
      buildRestoreList();
      showToast?.(`Deleted “${name}”.`);
    }catch(e){ alert('Failed to delete plan: ' + (e?.message||e)); }
  }

  function buildRestoreList(){
    const wrap = document.getElementById('savedPlansList'); const empty = document.getElementById('noPlansHint'); if(!wrap) return;
    const names = readIndex();
    names.sort((a,b)=>{
      const ra = JSON.parse(localStorage.getItem(keyFor(a))||'{}').updatedAt||0;
      const rb = JSON.parse(localStorage.getItem(keyFor(b))||'{}').updatedAt||0;
      return rb-ra;
    });
    wrap.innerHTML='';
    if(names.length===0){ empty?.removeAttribute('hidden'); return; }
    empty?.setAttribute('hidden','');
    names.forEach(name=>{
      const payload = JSON.parse(localStorage.getItem(keyFor(name))||'{}');
      const updatedAt = payload.updatedAt || Date.now();
      const row = document.createElement('div'); row.className='saved-plan-row';
      const info = document.createElement('div');
      const nm = document.createElement('div'); nm.className='saved-plan-name'; nm.textContent=name;
      const tm = document.createElement('div'); tm.className='saved-plan-time'; tm.textContent='Last modified: ' + new Date(updatedAt).toLocaleString();
      info.appendChild(nm); info.appendChild(tm);
      const actions = document.createElement('div'); actions.className='saved-plan-actions';
      const r = document.createElement('button'); r.className='btn'; r.textContent='Restore'; r.addEventListener('click', ()=>doRestorePlan(name));
      const d = document.createElement('button'); d.className='btn ghost'; d.textContent='Delete'; d.addEventListener('click', ()=>{ if(confirm(`Delete saved plan “${name}”?`)) doDeletePlan(name); });
      actions.appendChild(r); actions.appendChild(d);
      row.appendChild(info); row.appendChild(actions);
      wrap.appendChild(row);
    });
  }

  function setup(){
    const saveBtn = document.getElementById('savePlanBtn');
    const restoreBtn = document.getElementById('restorePlanBtn');
    const modalSaveBtn = document.getElementById('modalSaveBtn');
    const input = document.getElementById('planNameInput');
    saveBtn?.addEventListener('click', ()=>{ if(input) input.value=''; openModal('saveModal'); });
    restoreBtn?.addEventListener('click', ()=>{ buildRestoreList(); openModal('restoreModal'); });
    modalSaveBtn?.addEventListener('click', ()=>{ const name=(input?.value||'').trim(); doSavePlan(name); });
    input?.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); modalSaveBtn?.click(); } });
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', setup); } else { setup(); }
})();

/* ===== Floating Year Picker Enhancer (ro18) ===== */
(function(){
  const TOKENS = {
    RETIREMENT_YEAR: '__RETIREMENT__',
    ALREADY_OWNED: '__ALREADY_OWNED__',
    AS_NEEDED: '__AS_NEEDED__',
    NEVER_SELL: '__NEVER_SELL__',
    FIRST_SPOUSE_DEATH: '__FIRST_DEATH__',
    FIRST_SPOUSE_DEATH_PLUS_1: '__FIRST_DEATH_P1__',
    END_OF_PLAN: '__END_OF_PLAN__'
};
  function numOnly(x){ return (String(x||'').match(/\d+/g)||[]).join(''); }
  function getInt(val){ const n=parseInt(numOnly(val),10); return Number.isFinite(n)?n:null; }
  function computeModel(){
    const now = new Date().getFullYear();
    const ya = getInt(document.getElementById('ageInput')?.value);
    const ra = getInt(document.getElementById('retireInput')?.value);
    const yl = getInt(document.getElementById('lifeInput')?.value);
    const sa = getInt(document.getElementById('ageInputSpouse')?.value);
    const sl = getInt(document.getElementById('lifeInputSpouse')?.value);
    const hasYou = ya!=null && yl!=null && yl>=ya;
    const hasSp = sa!=null && sl!=null && sl>=sa;
    const endYou = hasYou ? now + (yl-ya) : null;
    const endSp  = hasSp ? now + (sl-sa) : null;
    const endOfPlan = (hasYou||hasSp) ? Math.max(endYou??-Infinity,endSp??-Infinity) : (now+50);
    const retirementYear = (ya!=null && ra!=null && ra>=ya) ? now + (ra-ya) : null;
    let firstDeath = null;
    if(hasYou && hasSp) firstDeath = Math.min(endYou, endSp);
    else if(hasYou) firstDeath = endYou;
    else if(hasSp) firstDeath = endSp;
    return { now, endOfPlan, retirementYear, firstDeath, firstDeathP1: firstDeath!=null? firstDeath+1 : null };
  }
  function resolve(token, model){
    switch(token){
      case TOKENS.RETIREMENT_YEAR: return model.retirementYear;
      case TOKENS.FIRST_SPOUSE_DEATH: return model.firstDeath;
      case TOKENS.FIRST_SPOUSE_DEATH_PLUS_1: return model.firstDeathP1;
      case TOKENS.END_OF_PLAN: return model.endOfPlan;
      default: return null;
    }
  }
  function isYear(v){ return /^\d{4}$/.test(String(v)); }
  function labelForToken(token){
    switch(token){
      case TOKENS.ALREADY_OWNED: return '• Already Owned';
      case TOKENS.AS_NEEDED: return '• Sell When Needed For Cash Flow';
      case TOKENS.NEVER_SELL: return '• Never Sell';
      case TOKENS.RETIREMENT_YEAR: return '• Retirement Year';
      case TOKENS.FIRST_SPOUSE_DEATH: return '• First Spouse Death';
      case TOKENS.FIRST_SPOUSE_DEATH_PLUS_1: return '• First Spouse Death + 1';
      case TOKENS.END_OF_PLAN: return '• End of Plan';
    }
    return token;
  }
  function labelForYear(Y){
    // Build "Age XX in YYYY" or "Spouse age XX in YYYY" depending on who's alive.
    const now = new Date().getFullYear();
    const ya = getInt(document.getElementById('ageInput')?.value);
    const yl = getInt(document.getElementById('lifeInput')?.value);
    const sa = getInt(document.getElementById('ageInputSpouse')?.value);
    const sl = getInt(document.getElementById('lifeInputSpouse')?.value);

    const year = parseInt(Y,10);
    if (!Number.isFinite(year)) return String(Y);

    if (ya == null && sa == null) return String(year);

    const youAge = (ya != null) ? ya + (year - now) : null;
    const spAge  = (sa != null) ? sa + (year - now) : null;

    const youAlive = (youAge != null) && (yl == null || youAge <= yl);
    const spAlive  = (spAge != null) && (sl == null || spAge <= sl);

    if (youAlive && spAlive) return `Age ${youAge} in ${year}`;
    if (spAlive) return `Spouse age ${spAge} in ${year}`;
    if (youAlive) return `Age ${youAge} in ${year}`;
    return String(year);
  }

  function roleFromLabel(text){
    const t=(text||'').toLowerCase();
    if(t.includes('start')) return 'startYear';
    if(t.includes('end')) return 'endYear';
    if(t.includes('purchase')) return 'purchaseYear';
    if(t.includes('sale')) return 'saleYear';
    if(t.includes('inherit')) return 'inheritanceYear';
    return null;
  }
  function defaultTokenFor(labelText){
    const t = (labelText||'').toLowerCase();
    if (t.includes('already') || t.includes('owned')) return TOKENS.ALREADY_OWNED;
    if (t.includes('needed') || t.includes('cash flow')) return TOKENS.AS_NEEDED;
    if (t.includes('never')) return TOKENS.NEVER_SELL;
    if(t.includes('start') || t.includes('purchase')) return TOKENS.RETIREMENT_YEAR;
    if(t.includes('end') || t.includes('sale')) return TOKENS.END_OF_PLAN;
    return TOKENS.END_OF_PLAN;
  }
  function rebuildSelect(select, labelText, forceDefault){
    const model = computeModel();
    
    // Prefer the saved item value from state over the DOM value to avoid snapping to first year during re-render
    let storedVal = null;
    try {
      const itemEl = select.closest('.item');
      if(itemEl && typeof state !== 'undefined' && typeof active !== 'undefined'){
        const id = parseInt(itemEl.dataset.id,10);
        const arr = (state[active]||{}).items || [];
        const it = arr.find(x=>x.id===id);
        const role = roleFromLabel(labelText);
        if(it && role){ storedVal = it[role] ?? null; }
      }
    } catch(e){}
    const prev = forceDefault ? '' : (storedVal ?? (select.value || select.dataset.prev || ''));
    const defTok = select.dataset.defaultToken || defaultTokenFor(labelText);
    const start = model.now;
    const end = model.endOfPlan;
    // Build options
    const opts = [];
    const yearsOnly = select.dataset.yearsOnly === '1';
    if (!yearsOnly && select.dataset.isPurchaseYearSelect === '1') {
      opts.push({value:TOKENS.ALREADY_OWNED, label:labelForToken(TOKENS.ALREADY_OWNED)});
    }
    else if (!yearsOnly && select.dataset.isSaleYearSelect === '1') {
      opts.push({value:TOKENS.NEVER_SELL, label:labelForToken(TOKENS.NEVER_SELL)});
      opts.push({value:TOKENS.AS_NEEDED, label:labelForToken(TOKENS.AS_NEEDED)});
    }
    else if (!yearsOnly) {
      opts.push(
        {value:TOKENS.RETIREMENT_YEAR, label:labelForToken(TOKENS.RETIREMENT_YEAR)},
        {value:TOKENS.FIRST_SPOUSE_DEATH, label:labelForToken(TOKENS.FIRST_SPOUSE_DEATH)},
        {value:TOKENS.FIRST_SPOUSE_DEATH_PLUS_1, label:labelForToken(TOKENS.FIRST_SPOUSE_DEATH_PLUS_1)},
        {value:TOKENS.END_OF_PLAN, label:labelForToken(TOKENS.END_OF_PLAN)}
      );
    }
    opts.push({value:'', label:'────────────', disabled:true});
    for(let y=start; y<=end; y++){ opts.push({value:String(y), label:labelForYear(y)}); }
    // preserve selection when possible
    let toSelect = null;
    if(prev){
      if([TOKENS.RETIREMENT_YEAR,TOKENS.FIRST_SPOUSE_DEATH,TOKENS.FIRST_SPOUSE_DEATH_PLUS_1,TOKENS.END_OF_PLAN].includes(prev)){
        toSelect = prev;
      }else if(isYear(prev)){
        const py = parseInt(prev,10);
        if(py>=start && py<=end) toSelect = prev;
      }
    }
    if(!toSelect) toSelect = defTok;
    // Paint DOM
    select.innerHTML='';
    opts.forEach(o=>{
      const op=document.createElement('option');
      op.value=o.value; op.textContent=o.label;
      if(o.disabled) op.disabled=true;
      select.appendChild(op);
    });
    select.value = toSelect;
    select.dataset.prev = toSelect;
  }
  function enhanceAll(){
    const model = computeModel();
    document.querySelectorAll('.field').forEach(f=>{
      const label = f.querySelector('.label');
      const sel = f.querySelector('select');
      if(!label || !sel) return;
      const text = label.textContent || '';
      const t = text.toLowerCase();
      if(!(t.includes('start year')||t.includes('end year')||t.includes('purchase year')||t.includes('sale year')||t.includes('inheritance year'))) return;
      // Determine if item model has value; if empty, force default token on first enhancement
      let forceDefault = false;
      const itemEl = sel.closest('.item');
      if(itemEl && typeof state !== 'undefined' && typeof active !== 'undefined'){
        const id = parseInt(itemEl.dataset.id,10);
        const arr = (state[active]||{}).items || [];
        const it = arr.find(x=>x.id===id);
        const role = roleFromLabel(text);
        if(it && role && !it[role]) forceDefault = true;
      }
      sel.classList.add('year-select');
      rebuildSelect(sel, text, forceDefault);
    });
  }
  // Hook into render cycle
  const __origRender = window.render;
  window.render = function(){ __origRender.apply(this, arguments); enhanceAll(); };

  const __origRender2 = window.render;
  window.render = function(){
    __origRender2.apply(this, arguments);
    // Ensure mortgage UI updates when purchase year changes
    document.querySelectorAll('select').forEach(sel=>{
      if(sel && sel.dataset && sel.dataset.isPurchaseYearSelect === '1'){
        if(!sel.__hadMortgageToggle){
          sel.addEventListener('change', ()=>{ try { window.render(); } catch(e){} });
          sel.__hadMortgageToggle = true;
        }
      }
    });
  };

  // Also rebuild when basics inputs change (without needing a render)
  ['ageInput','retireInput','lifeInput','ageInputSpouse','lifeInputSpouse'].forEach(id=>{
    const el = document.getElementById(id);
    if(el){ ['input','change'].forEach(evt=> el.addEventListener(evt, enhanceAll)); }
  });
  // initial
  document.addEventListener('DOMContentLoaded', enhanceAll);
})()
function renderRows(){
  rowsHost.innerHTML = '';
  const arr = g.liquid.customYears || (g.liquid.customYears = []);
  const now = new Date().getFullYear();
  const years = Array.from({length:51}, (_,i)=> String(now + i));

  arr.forEach((row, idx)=>{
    const showLabels = (idx === 0);
    const div = document.createElement('div');
    div.className = 'triple-row' + (showLabels ? ' header-row' : '');

    // Plan Year
    const fY = document.createElement('div');
    fY.className = 'field';
    if (showLabels) {
      const lY = document.createElement('label');
      lY.className = 'label';
      lY.textContent = 'Plan Year';
      fY.append(lY);
    }
    const sY = document.createElement('select');
    sY.className = 'year-compact';
    years.forEach(y=>{ const o=document.createElement('option'); o.value=y; o.textContent=y; sY.appendChild(o); });
    if (!row.year) { row.year = years[0]; }
    sY.value = String(row.year);
    if (row.year) sY.value = String(row.year);
    sY.addEventListener('change', ()=>{ row.year = sY.value; });
    fY.append(sY);

    // ROI (%)
    const fR = document.createElement('div');
    fR.className = 'field';
    if (showLabels) {
      const lR = document.createElement('label');
      lR.className = 'label';
      lR.textContent = 'ROI (%)';
      fR.append(lR);
    }
    const iR = document.createElement('input');
    iR.type='text';
    iR.inputMode='decimal';
    iR.className='pct small';
    if (row.roi){ iR.dataset.raw = String(row.roi); iR.value = `${row.roi}%`; }
    iR.addEventListener('focus', ()=> onFocusNumeric(iR));
    iR.addEventListener('blur', ()=>{ onBlurPercent(iR); row.roi = iR.dataset.raw || ''; });
    fR.append(iR);

    // Probability (%)
    const fP = document.createElement('div');
    fP.className = 'field';
    if (showLabels) {
      const lP = document.createElement('label');
      lP.className = 'label';
      lP.textContent = 'Probability (%)';
      fP.append(lP);
    }
    const iP = document.createElement('input');
    iP.type='text';
    iP.inputMode='decimal';
    iP.className='pct small';
    if (row.prob){ iP.dataset.raw = String(row.prob); iP.value = `${row.prob}%`; }
    iP.addEventListener('focus', ()=> onFocusNumeric(iP));
    iP.addEventListener('blur', ()=>{ onBlurPercent(iP); row.prob = iP.dataset.raw || ''; });
    fP.append(iP);

    // Remove button
    const rem = document.createElement('button');
    rem.className='rem-row';
    rem.type='button';
    rem.title='Remove';
    rem.textContent = '✕';
    rem.addEventListener('click', ()=>{ arr.splice(idx,1); renderRows(); });

    div.append(fY, fR, fP, rem);
    rowsHost.appendChild(div);
  });
}
;

// Dynamically populate states for stateSelect

const states = [
  { code: "", name: "• Outside the USA" },
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DC", name: "District of Columbia" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" }
];

(function populateStates() {
  try {
    const stateSelect = document.getElementById('stateSelect');
    if (stateSelect) {
      states.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.code;
        opt.textContent = s.name;
        stateSelect.appendChild(opt);
      });
      try {
        const defaultCode = geoplugin_regionCode();
        if (defaultCode) stateSelect.value = defaultCode;
      } catch (e) {
        console.log("Could not obtain state code");
      }
    }
  } catch (e) {
    console.error("Error populating states", e);
  }
})();
