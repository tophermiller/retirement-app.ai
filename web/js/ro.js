
var staging = false;



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
  { key:'epsilon', label:'Income',        mode:'multi',  lipsum:'Enter any retirement income, including pensions, Social Security, etc., with date ranges.  DO NOT include any rental income that you specified in the Real Estate section.', icon:'income' },
  { key:'zeta',    label:'Expenses',      mode:'multi',  lipsum:'Your taxes and any mortgage payments you entered are automatically included.  Enter all your other retirement spending here with date ranges. ', icon:'expenses' },
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


// --- Ensure Growth Rates defaults are initialized on first load (idempotent) ---
function ensureGrowthDefaultsInitialized(){
  try{
    const g = (state && state.beta && state.beta.single) ? state.beta.single : null;
    if(!g) return;

    // Helper: safe set percent strings
    function pctStr(v){ 
      if(v===null || v===undefined || v==='' || !Number.isFinite(v)) return null;
      return String((v*100).toFixed(2));
    }

    // ---- Inflation defaults (last 100 years) ----
    try{
      g.inflation = g.inflation || {};
      if(!g.inflation.roi || !g.inflation.stdev){
        const maxY = (typeof inflationdata!=='undefined' && inflationdata.getMaxYear && inflationdata.getMaxYear()) || (new Date().getFullYear()-1);
        const first = maxY - 100 + 1;
        const mean  = (typeof inflationdata!=='undefined' && inflationdata.computeMeanRange) ? Number(inflationdata.computeMeanRange(first, maxY)) : null;
        const sd    = (typeof inflationdata!=='undefined' && inflationdata.computeStdDevRange) ? Number(inflationdata.computeStdDevRange(first, maxY)) : null;
        if(!g.inflation.roi && mean!==null)   g.inflation.roi   = String(mean?.toFixed(2));
        if(!g.inflation.stdev && sd!==null)   g.inflation.stdev = String(sd?.toFixed(2));
      }
    }catch(e){ /* noop */ }

    // ---- Liquid asset defaults based on selector default (2000-present) ----
    try{
      function getMaxIndex(obj) {
        let maxKey = null;
        for (const [key, value] of Object.entries(obj)) {
          if(key > maxKey) {
            maxKey = key;
          }
        }
        return Number(maxKey); // returns the year (as a string)
      }

      g.liquid = g.liquid || { usStocks:{}, usBonds:{}, internationalStocks:{}, customYears:[] };
      const minY = 1928;
      const maxY = getMaxIndex(markethistory2.usstocks);
      const first = 2000;
      const last  = maxY;

      function setIfEmpty(obj, key, val){ if(!obj[key] || obj[key]==='') obj[key] = val; }

      const meanUS   = (markethistory2.getAverage && markethistory2.getAverage(markethistory2.usstocks, first, last)) ?? null;
      const stdevUS  = (markethistory2.getStandardDeviation && markethistory2.getStandardDeviation(markethistory2.usstocks, first, last)) ?? null;
      const meanBnd  = (markethistory2.getAverage && markethistory2.getAverage(markethistory2.usbonds, first, last)) ?? null;
      const stdevBnd = (markethistory2.getStandardDeviation && markethistory2.getStandardDeviation(markethistory2.usbonds, first, last)) ?? null;
      const meanINT  = (markethistory2.getAverage && markethistory2.getAverage(markethistory2.international, first, last)) ?? null;
      const stdevINT = (markethistory2.getStandardDeviation && markethistory2.getStandardDeviation(markethistory2.international, first, last)) ?? null;

      g.liquid.usStocks = g.liquid.usStocks || {};
      g.liquid.usBonds  = g.liquid.usBonds  || {};
      g.liquid.internationalStocks = g.liquid.internationalStocks || {};

      setIfEmpty(g.liquid.usStocks, 'roi',   pctStr(meanUS));
      setIfEmpty(g.liquid.usStocks, 'stdev', pctStr(stdevUS));
      setIfEmpty(g.liquid.usBonds,  'roi',   pctStr(meanBnd));
      setIfEmpty(g.liquid.usBonds,  'stdev', pctStr(stdevBnd));
      setIfEmpty(g.liquid.internationalStocks, 'roi',   pctStr(meanINT));
      setIfEmpty(g.liquid.internationalStocks, 'stdev', pctStr(stdevINT));

      if(!Array.isArray(g.liquid.customYears)) g.liquid.customYears = [];
    }catch(e){ console.log(e);/* noop */ }

    // ---- Real Estate defaults based on user's state (geoplugin), fallback CA ----
    try{
      g.realEstate = g.realEstate || {};
      const code = (typeof geoplugin_regionCode==='function' && (function(){ try{return geoplugin_regionCode();}catch(_){return null;} })()) || 'CA';
      if(typeof realEstateROI!=='undefined' && realEstateROI[code]){
        const avg = Number(realEstateROI[code].average);
        const sd  = Number(realEstateROI[code].stdev);
        if(!g.realEstate.roi)   g.realEstate.roi   = pctStr(avg);
        if(!g.realEstate.stdev) g.realEstate.stdev = pctStr(sd);
      }
    }catch(e){ /* noop */ }

  }catch(e){ /* noop */ }
}


// Initialize growth defaults immediately
try{ ensureGrowthDefaultsInitialized(); }catch(e){}


let active = sections[0].key;
let jsonMode = false;
let footerLinkMode = false;

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


window.ensureTaxesExpense = function(){
  try{
    const z = state && state.zeta;
    if(!z || !Array.isArray(z.items)) return;
    const hasTaxes = z.items.some(it => it && it.isTaxes === true);
    if(!hasTaxes){
      const newId = (typeof z.nextId === 'number' ? z.nextId : 1);
      z.items.unshift({
        id: newId,
        title: 'TAXES',
        collapsed: true,
        locked: true,
        isTaxes: true,
        infoOnly: true,
        collapsed: true
      });
      z.nextId = newId + 1;
    } else {
      // Make sure the taxes item stays locked and titled properly
      z.items.forEach(it => {
        if(it && it.isTaxes){ it.locked = true; it.title = 'TAXES';  it.infoOnly = true; }
      });
    }
  }catch(e){}
}



// Auto-create/remove infoOnly Mortgage Expense cards for properties with mortgage info

window.ensureMortgageExpenseCards = function(){
  try{
    const z = state && state.zeta;
    const reSec = state && state.delta;
    if(!z || !Array.isArray(z.items) || !reSec || !Array.isArray(reSec.items)) return;

    const nonEmpty = (v) => v !== undefined && v !== null && String(v).trim() !== '';
    const toNum = (v) => {
      if(v === null || v === undefined) return null;
      const s = String(v);
      if(!nonEmpty(s)) return null;
      // strip $ , % and any non numeric except . and -
      const cleaned = s.replace(/[^0-9\.\-]/g, '');
      if(!cleaned) return null;
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : null;
    };

    // Build a map of properties that currently have mortgage info
    const propsWithMortgage = new Map(); // key: property id -> {title}
    reSec.items.forEach(p=>{
      if(!p) return;
      const title = (p.title || (typeof defaultTitle==='function' ? defaultTitle('delta', p.id) : `Property #${p.id}`)).trim();

      const loanOrigYear   = nonEmpty(p.loanOrigYear)   ? toNum(p.loanOrigYear)   : null;
      const loanTerm       = nonEmpty(p.loanTerm)       ? toNum(p.loanTerm)       : null;
      const loanRate       = nonEmpty(p.loanRate)       ? toNum(p.loanRate)       : null;
      const monthlyPayment = nonEmpty(p.monthlyPayment) ? toNum(p.monthlyPayment) : null;
      const downPaymentPct = nonEmpty(p.downPaymentPct) ? toNum(p.downPaymentPct) : null;

      const ownedPath  = (loanOrigYear !== null && loanTerm !== null && loanRate !== null && monthlyPayment !== null);
      const futurePath = (downPaymentPct !== null && loanTerm !== null && loanRate !== null);

      const hasMortgage = Boolean(ownedPath || futurePath);
      if(hasMortgage){
        propsWithMortgage.set(p.id, { title });
      }
    });

    // Ensure a mortgage infoOnly card exists for each property with mortgage
    propsWithMortgage.forEach((val, pid)=>{
      const existing = z.items.find(it => it && it.isMortgageInfo === true && it.propertyId === pid);
      const desiredTitle = `Mortgage Expense for ${val.title}`;
      if(!existing){
        const newId = (typeof z.nextId === 'number' ? z.nextId : 1);
        z.items.unshift({
          id: newId,
          title: desiredTitle,
          collapsed: true,
          locked: true,
          infoOnly: true,
          isMortgageInfo: true,
          propertyId: pid,
          propertyTitle: val.title
        });
        z.nextId = newId + 1;
      } else {
        // keep title in sync if property title changed
        existing.title = desiredTitle;
        existing.propertyTitle = val.title;
      }
    });

    // Remove stale mortgage infoOnly cards
    for(let i = z.items.length - 1; i >= 0; i--){
      const it = z.items[i];
      if(it && it.isMortgageInfo === true){
        if(!propsWithMortgage.has(it.propertyId)){
          z.items.splice(i,1);
        }
      }
    }
  }catch(e){ console.error('ensureMortgageExpenseCards failed', e); }
};

/* Helpers for section-specific labels/titles */
function addLabelFor(sectionKey){
  const map = { gamma:'Add Account', delta:'Add Property', epsilon:'Add Income', zeta:'Add Spending' };
  return map[sectionKey] || 'Add Item';
}



// Auto-create/remove infoOnly Rental Income cards for properties with rental income
window.ensureRentalIncomeCards = function(){
  try{
    const inc = state && state.epsilon;
    const reSec = state && state.delta;
    if(!inc || !Array.isArray(inc.items) || !reSec || !Array.isArray(reSec.items)) return;

    const nonEmpty = (v) => v !== undefined && v !== null && String(v).trim() !== '';
    const toNum = (v) => {
      if(v === null || v === undefined) return null;
      const s = String(v);
      if(!nonEmpty(s)) return null;
      const cleaned = s.replace(/[^0-9\.\-]/g, '');
      if(!cleaned) return null;
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : null;
    };

    // Map of properties that have rental income -> { title, income }
    const propsWithIncome = new Map();
    reSec.items.forEach(p => {
      if(!p || p.removed) return;
      const title = (p.title && String(p.title).trim()) || `Property ${p.id}`;
      const showRental = !!p.showRental;
      const annualIncome = showRental ? toNum(p.annualIncome) : null;
      if(showRental && annualIncome !== null && annualIncome > 0){
        propsWithIncome.set(p.id, { title, income: annualIncome });
      }
    });

    // Ensure infoOnly rental income card exists/updated
    propsWithIncome.forEach((val, pid) => {
      const existing = inc.items.find(it => it && it.isRentalInfo === true && it.propertyId === pid);
      const desiredTitle = `Rental Income for ${val.title}`;
      if(!existing){
        const newId = (typeof inc.nextId === 'number' ? inc.nextId : 1);
        inc.items.unshift({
          id: newId,
          title: desiredTitle,
          collapsed: true,
          locked: true,
          infoOnly: true,
          isRentalInfo: true,
          propertyId: pid,
          propertyTitle: val.title
        });
        inc.nextId = newId + 1;
      } else {
        existing.title = desiredTitle;
        existing.propertyTitle = val.title;
      }
    });

    // Remove stale rental income cards
    for(let i = inc.items.length - 1; i >= 0; i--){
      const it = inc.items[i];
      if(it && it.isRentalInfo === true){
        const stillHas = propsWithIncome.has(it.propertyId);
        if(!stillHas){
          inc.items.splice(i,1);
        }
      }
    }
  }catch(e){ /* no-op */ }
};
function baseNounFor(sectionKey){
  const map = { gamma:'Account', delta:'Property', epsilon:'Income', zeta:'Spending' };
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
    previewJsonLink.textContent = 'Preview JSON';
  }
  if (footerLinkMode) {
    footerLinkMode = false;
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

    
    // If this is the Results entry, add a nested link for What-If
    if(s.key === 'results'){
      const sub = document.createElement('a');
      sub.href = '#';
      sub.className = 'nav-sub whatif-link';
      sub.textContent = 'Try a "What-If" scenario';
      sub.setAttribute('role','button');
      sub.onclick = (e)=>{
        e.preventDefault();
        active = 'whatif';
        buildNav();
        render();
        // close sidebar if open (mobile)
        try{ sidebar.classList.remove('open'); overlay.classList.remove('show'); }catch(_){}
      };
      window.__whatIfSub = sub;
    }
b.className = (s.key===active?'active':'' );
    b.setAttribute('role','tab');
    b.setAttribute('aria-selected', String(s.key===active));
    if (s.key===active) b.setAttribute('aria-current','page');
    b.addEventListener('click', ()=>{
      active = s.key;
      if(jsonMode){
        jsonMode = false;
        jsonBox.classList.add('hidden');
        const previewJsonLink= document.getElementById('previewJsonLink');
        previewJsonLink.textContent = 'Preview JSON';
      }
      if (footerLinkMode) {
        footerLinkMode = false;
      }
      render();
          try{ updateActiveNav(); }catch(e){}
sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });

    navEl.appendChild(b);
    if(s.key === 'results' && window.__whatIfSub){ navEl.appendChild(window.__whatIfSub); window.__whatIfSub = null; }
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

if (typeof whatIfData === 'undefined') {
  whatIfData = {
    "variables": [
      { stateVariable: "alpha.single.retire", label: "Retirement Age", type: "number"},
      { stateVariable: "alpha.single.life", label: "Life Expectancy", type: "number"},
      { stateVariable: "alpha.single.spouseLife", label: "Spouse Life Expectancy", type: "number"},
      { stateVariable: "alpha.single.heirsTarget", label: "Heirs Target Amount ($)", type: "currency"},
      { stateVariable: "beta.single.inflation.roi", label: "Inflation Rate (%)", type: "percent"},
      { stateVariable: "beta.single.liquid.usStocks.roi", label: "US Stocks Return (%)", type: "percent"},
      { stateVariable: "beta.single.liquid.usStocks.stdev", label: "US Stocks Volatility (%)", type: "percent"},
      { stateVariable: "beta.single.liquid.usBonds.roi", label: "US Bonds Return (%)", type: "percent"},
      { stateVariable: "beta.single.liquid.usBonds.stdev", label: "US Bonds Volatility (%)", type: "percent"},
      { stateVariable: "beta.single.liquid.internationalStocks.roi", label: "International Stocks Return (%)", type: "percent"},
      { stateVariable: "beta.single.liquid.internationalStocks.stdev", label: "International Stocks Volatility (%)", type: "percent"},
      { stateVariable: "beta.single.realEstate.roi", label: "Real Estate Return (%)", type: "percent"},
      { stateVariable: "beta.single.realEstate.stdev", label: "Real Estate Volatility (%)", type: "percent"},
      { stateVariable: "gamma.items[].amount", label: "Account Value ($)", type: "currency"},
      { stateVariable: "delta.items[].currentValue", label: "Property Value ($)", type: "currency"},
      { stateVariable: "delta.items[].annualExpenses", label: "Annual Expenses ($)", type: "currency"},
      { stateVariable: "delta.items[].saleYear", label: "Property Sale Year", type: "number"},
      { stateVariable: "epsilon.items[].amount", label: "Income Amount ($)", type: "currency"},
      { stateVariable: "epsilon.items[].startYear", label: "Income Start Year", type: "number"},
      { stateVariable: "epsilon.items[].endYear", label: "Income End Year", type: "number"},
      { stateVariable: "zeta.items[].startYear", label: "Expense Start Year", type: "number"},
      { stateVariable: "zeta.items[].endYear", label: "Expense End Year", type: "number"},
      { stateVariable: "zeta.items[].amount", label: "Expense Amount ($)", type: "currency"}
    ]
  }
}

/* ===== What-If Panel ===== */
function ensureWhatIfPanel(){

function _getValueByPath(obj, path){
  try{
    const tokens = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let cur = obj;
    for(const t of tokens){
      if(t==='') continue;
      if(typeof cur!=='object' || cur===null) return undefined;
      cur = cur[t];
    }
    return cur;
  }catch(_){ return undefined; }
}

  let w = document.getElementById('whatIfPanel');
  if(!w){
    const main = document.querySelector('main') || document.body;
    w = document.createElement('div');
    w.id = 'whatIfPanel';
    w.className = 'panel hidden';
    w.innerHTML = `
      <section class="section whatif">
        <h2 class="h2">What If</h2>
        <p style="margin:0 0 1rem 0;">
          Here you can compute your odds multiple times while varying one of your inputs, and see all the results at once.
        </p>
        <div class="form-row" style="display:flex;flex-direction:column;gap:.75rem;max-width:520px;">
          <label for="whatIfSection"><strong>Choose Section</strong></label>
          <select id="whatIfSection" name="whatIfSection">
            <option value="">— Select —</option>
          </select>

          <label for="whatIfVariable"><strong>Choose Variable</strong></label>
          <select id="whatIfVariable" name="whatIfVariable">
            <option value="">— Select —</option>
          </select>
          
        
          
          <div id="whatIfCurrentRow" class="info-line"><strong>Current Value:</strong> <span id="whatIfCurrentValue">—</span></div>
          
          <label for="whatIfFrom"><strong>Vary From</strong></label>
          <input id="whatIfFrom" name="whatIfFrom" class="input" inputmode="decimal" autocomplete="off" />

          <label for="whatIfTo"><strong>Vary To</strong></label>
          <input id="whatIfTo" name="whatIfTo" class="input" inputmode="decimal" autocomplete="off" />
          
    </div>
      
        <div style="margin-top:1rem;">
          <button id="whatIfSubmitBtn" class="btn ok">Calculate What-Ifs</button>
        </div>
      </section>
    `;
    main.appendChild(w);
    // Populate section selector
    const secSel = w.querySelector('#whatIfSection');
    if(secSel){
      sections.forEach(s=>{
        if (s.mode === 'single') { 
          const opt = document.createElement('option');
          opt.value = s.key;
          opt.textContent = s.label;
          secSel.appendChild(opt);
        }
        else if (s.mode === 'multi') {
          const sec = state[s.key];
          if(sec && Array.isArray(sec.items) && sec.items.length > 0){
            sec.items.forEach((it, idx)=>{
              if (!it || it.removed) return;
              // Use id in value to identify item, idx just for stable ordering
              // Title fallback to defaultTitle if none set
              // Format: sectionKey::itemId
              // Example: delta::3
              //skip items that are infoOnly
              if(it.infoOnly) return;
              const opt = document.createElement('option');
              opt.value = `${s.key}::${it.id}`;
              opt.textContent = `${s.label} - ${it.title || defaultTitle(s.key, it.id)}`;
              secSel.appendChild(opt);
            });
          }
        }
      });
      secSel.addEventListener('change', ()=>{
        const selectedSec = secSel.value;
        let sec;
        let itemId;
        if (selectedSec === 'alpha' || selectedSec === 'beta') {
          //single
          sec = sections.find(s=>s.key===selectedSec);;
          itemId = 0; //not used
        }  
        else if (selectedSec.includes('::')) {
          //multi
          const parts = selectedSec.split('::');
          if(parts.length===2) {
            const skey = parts[0];
            sec = sections.find(s=>s.key===skey);
            itemId = Number(parts[1]);
          }
        }    

        const varSel = w.querySelector('#whatIfVariable');
        if(varSel){
          varSel.innerHTML = '<option value="">— Select —</option>';
          if(sec){
            whatIfData.variables.forEach(v=>{
              if(v.stateVariable.startsWith(`${sec.key}.`)){
                let indexedStateVariable = v.stateVariable
                if (sec.mode === 'multi') {
                  indexedStateVariable = v.stateVariable.replace("[]", `[${itemId}]`);
                } 
                // single mode: match section.key + '.' + field name
                const opt = document.createElement('option');
                opt.value = indexedStateVariable;
                opt.textContent = v.label;
                opt.dataset.type = v.type;
                varSel.appendChild(opt);
              }
            
      // --- What-If dynamic fields: Current Value + Vary From/To formatting ---
      const currentSpan = w.querySelector('#whatIfCurrentValue');
      const fromInput = w.querySelector('#whatIfFrom');
      const toInput = w.querySelector('#whatIfTo');

      function formatDisplay(val, type){
        if(val==='' || val===undefined || val===null) return '—';
        if(type==='currency'){
          return '$' + fmtDollars(Number(String(val).toString().replace(/[$,%]/g,'')));
        }else if(type==='percent'){
          // Expect raw like 5.43 meaning %, display with %
          return fmtPercent(Number(String(val).toString().replace(/[$,%]/g,'')));
        }else{
          const n = parseFloat(String(val).toString().replace(/[$,%]/g,''));
          return Number.isFinite(n) ? String(n) : '—';
        }
      }

      function setInputMasks(type){
        if(type==='currency'){
          fromInput.placeholder = '$0';
          toInput.placeholder = '$0';
          fromInput.oninput = (e)=>{ e.target.value = util.formatCurrencyVal(e.target.value); };
          toInput.oninput   = (e)=>{ e.target.value = util.formatCurrencyVal(e.target.value); };
        }else if(type==='percent'){
          fromInput.placeholder = '0%';
          toInput.placeholder = '0%';
          fromInput.oninput = (e)=>{ e.target.value = util.formatPercentageVal(e.target.value, false, true); };
          toInput.oninput   = (e)=>{ e.target.value = util.formatPercentageVal(e.target.value, false, true); };
        }else{
          fromInput.placeholder = '0';
          toInput.placeholder = '0';
          const onlyNum = (e)=>{ e.target.value = util.formatNumber(e.target.value, true); };
          fromInput.oninput = onlyNum;
          toInput.oninput   = onlyNum;
        }
      }

      function updateCurrent(){
        const opt = varSel.options[varSel.selectedIndex];
        if(!opt || !opt.value){ currentSpan.textContent = '—'; return; }
        const type = opt.dataset.type || 'number';
        setInputMasks(type);
        const val = _getValueByPath(state, opt.value);
        currentSpan.textContent = formatDisplay(val, type);
      }

      secSel.addEventListener('change', ()=>{
        // reset dependent selects/fields
        currentSpan.textContent = '—';
        fromInput.value = '';
        toInput.value = '';
      });
      varSel.addEventListener('change', updateCurrent);

      // Initialize defaults on first open
      updateCurrent();
});  
          }
        }
      });
    }
  }
  return w;
}



// Hook up What-If button to reuse main calculation for now
document.addEventListener('click', (e)=>{
  const t = e.target;
  if(t && t.id === 'whatIfSubmitBtn'){
    e.preventDefault();
    try{ submitBtn.click(); }catch(_){}
  }
});
function render(){
  hideProcessingModal();
  const resultsPanel = document.getElementById('resultsPanel');
  const mainPanel = document.querySelector('main .panel:not(#resultsPanel)');
  
  const whatIfPanel = document.getElementById('whatIfPanel');
  if(active==='whatif'){
    const w = ensureWhatIfPanel();
    if(mainPanel) mainPanel.classList.add('hidden');
    if(resultsPanel) resultsPanel.classList.add('hidden');
    if(w) w.classList.remove('hidden');
    if(panelNextFooter) panelNextFooter.classList.add('hidden');
    if(titleEl) titleEl.textContent = 'What If';
    if(lipsumEl) lipsumEl.textContent = 'Explore alternative scenarios by choosing a section and variable.';
    return;
  }else{
    if(whatIfPanel) whatIfPanel.classList.add('hidden');
  }
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

  if (!footerLinkMode && !jsonMode) {
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
      // Always show Calculate on Expenses, even if a Results section exists
      if (active === 'zeta') {
        const sp = document.createElement('span');
        sp.textContent = 'Calculate My RetirementOdds';
        nextSectionBtn.className = 'btn ok';
        const calcIcon = document.createElement('span'); calcIcon.className='icon'; calcIcon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="7" y1="7" x2="17" y2="7"/><line x1="7" y1="11" x2="11" y2="11"/><line x1="13" y1="11" x2="17" y2="11"/><line x1="7" y1="15" x2="17" y2="15"/></svg>`;
        nextSectionBtn.appendChild(calcIcon);
        nextSectionBtn.appendChild(sp);
        nextSectionBtn.onclick = () => submitBtn.click();
        panelNextFooter.classList.remove('hidden');
      } else if (idx >= 0 && idx < sections.length - 1) {
    
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
        const calcIcon = document.createElement('span'); calcIcon.className='icon'; calcIcon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="7" y1="7" x2="17" y2="7"/><line x1="7" y1="11" x2="11" y2="11"/><line x1="13" y1="11" x2="17" y2="11"/><line x1="7" y1="15" x2="17" y2="15"/></svg>`; nextSectionBtn.appendChild(calcIcon); nextSectionBtn.appendChild(sp);
        nextSectionBtn.onclick = () => submitBtn.click();
        panelNextFooter.classList.remove('hidden');
      }
    }
  }

  if(jsonMode){
    singleBasics.classList.add('hidden');
    singleGrowth.classList.add('hidden');
    dockWrap.classList.add('hidden');
    itemsEl.classList.add('hidden');
    panelFooter.classList.add('hidden'); panelNextFooter?.classList.add('hidden');
    document.getElementById('collapseAllBtn')?.classList.add('hidden');
    document.getElementById("resultsPanel")?.classList.add("hidden");
    document.getElementById("footerLinkContent").classList.add("hidden");

    jsonBox.classList.remove('hidden');
    titleEl.textContent = 'JSON Preview';
    lipsumEl.textContent = 'This is the serialized payload of your current inputs.';
    return;
  }

  if (footerLinkMode) {
    singleBasics.classList.add('hidden');
    singleGrowth.classList.add('hidden');
    dockWrap.classList.add('hidden');
    itemsEl.classList.add('hidden');
    panelFooter.classList.add('hidden'); panelNextFooter?.classList.add('hidden');
    document.getElementById('collapseAllBtn')?.classList.add('hidden');
    jsonBox.classList.add('hidden');
    document.getElementById("resultsPanel")?.classList.add("hidden");

    document.getElementById("footerLinkContent").classList.remove("hidden");
    titleEl.textContent = '';
    lipsumEl.textContent = '';
    return;
  }
  

  document.getElementById("footerLinkContent").classList.add("hidden");
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

    
  
  
// === Inflation Time Period selector handler (with Custom + persistence) ===
  (function(){
    try{
      const sel = document.getElementById('inflationTimePeriod');
      const inputsList = ['inflationRoi','inflationSd'];
      function setEditable(editable){
        inputsList.forEach(id=>{
          const el = document.getElementById(id);
          if (el){
            el.readOnly = !editable;
            el.classList.toggle('read-only', !editable);
          }
        });
      }

      const roiEl = document.getElementById('inflationRoi');
      const sdEl  = document.getElementById('inflationSd');
      if (!sel || !roiEl || !sdEl || typeof inflationdata === 'undefined') return;

      // Initialize selection from state (persisted)
      try{
        const savedSel = (state && state.beta && state.beta.single && state.beta.single.inflation && state.beta.single.inflation.presetSelection) || null;
        if (savedSel && sel.querySelector(`option[value="${savedSel}"]`)) sel.value = savedSel;
      }catch(e){}

      const applyFromSelection = ()=>{
        // Persist chosen selection
        try{
          if (state && state.beta && state.beta.single && state.beta.single.inflation){
            state.beta.single.inflation.presetSelection = sel.value;
          }
        }catch(e){}

        // Custom mode: make fields editable, do not overwrite values
        if ((sel.value||'').toLowerCase() === 'custom'){
          setEditable(true);
          return;
        } else {
          setEditable(false);
        }

        // Non-custom: compute from last N years option
        const n = parseInt(sel.value, 10);
        if (!Number.isFinite(n)) return;
        const maxY = (inflationdata.getMaxYear && inflationdata.getMaxYear()) || (new Date().getFullYear()-1);
        const first = maxY - n + 1;
        const last  = maxY;
        const mean  = (inflationdata.computeMeanRange && inflationdata.computeMeanRange(first, last));
        const stdev = (inflationdata.computeStdDevRange && inflationdata.computeStdDevRange(first, last));

        if (mean !== null && mean !== undefined && mean !== ''){
          const m = String(Number(mean).toFixed(2));
          roiEl.dataset.raw = m;
          roiEl.value = m + '%';
          if (g && g.inflation) g.inflation.roi = m;
        }
        if (stdev !== null && stdev !== undefined && stdev !== ''){
          const s = String(Number(stdev).toFixed(2));
          sdEl.dataset.raw = s;
          sdEl.value = s + '%';
          if (g && g.inflation) g.inflation.stdev = s;
        }
      };

      sel.addEventListener('change', applyFromSelection);
      if (!sel.value) sel.value = '100';
      applyFromSelection();
    }catch(e){ /* no-op */ }
  })();
;
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

        function setEditable(editable){
          [roiEl, sdEl].forEach(el=>{
            if (!el) return;
            el.readOnly = !editable;
            el.classList.toggle('read-only', !editable);
          });
        }

        // Populate options once
        if (!sel.dataset.populated) {
          const byName = Object.entries(realEstateROI)
            .map(([abbr, v])=>({abbr, name: v.stateName}))
            .sort((a,b)=> a.name.localeCompare(b.name));

          // States
          byName.forEach(({abbr, name})=>{
            const o = document.createElement('option');
            o.value = abbr;
            o.textContent = name;
            sel.appendChild(o);
          });

          sel.dataset.populated = '1';
        }

        // Initialize selection from state (persisted) or geolocation default
        try{
          const savedSel = (state && state.beta && state.beta.single && state.beta.single.realEstate && state.beta.single.realEstate.presetSelection) || null;
          if (savedSel && sel.querySelector(`option[value="${savedSel}"]`)) {
            sel.value = savedSel;
          } else {
            // geolocation default only if nothing saved and not already set
            if (!sel.value) {
              const defaultAbbr = (typeof geoplugin_regionCode === 'function' ? (function(){try{return geoplugin_regionCode();}catch(_){return null;}})() : null) || (state.alpha?.single?.stateCode) || 'CA';
              if (sel.querySelector(`option[value="${defaultAbbr}"]`)) sel.value = defaultAbbr;
            }
          }
        }catch(e){/* no-op */}

        const apply = ()=>{
          // Persist chosen selection
          try{
            if (state && state.beta && state.beta.single && state.beta.single.realEstate){
              state.beta.single.realEstate.presetSelection = sel.value;
            }
          }catch(e){/* no-op */}

          // Custom mode: make editable and do not auto-fill
          if ((sel.value||'').toLowerCase() === 'custom'){
            setEditable(true);
            return;
          } else {
            setEditable(false);
          }

          // Non-custom: when a US state is chosen, auto-fill ROI/StdDev
          const abbr = sel.value;
          const data = realEstateROI[abbr];
          if (!data) return;
          const roi = (100*Number(data.average)).toFixed(2);
          const sd  = (100*Number(data.stdev)).toFixed(2);
          roiEl.dataset.raw = String(roi); roiEl.value = `${roi}%`;
          sdEl.dataset.raw  = String(sd);  sdEl.value  = `${sd}%`;
          // Persist to state
          const g = state.beta.single;
          if (g && g.realEstate) {
            g.realEstate.roi = String(roi);
            g.realEstate.stdev = String(sd);
          }
        };

        sel.addEventListener('change', apply);

        // Apply immediately (respect saved selection)
        if ((sel.value||'').toLowerCase() === 'custom'){
          setEditable(true);
        } else if (sel.value) {
          apply();
        }
      }catch(e){ /* no-op */ }
    })();
})();


    
    
    /* --- Liquid: Time Period preset handler (markethistory2.js) --- */
    (function(){
      try {
        const sel = document.getElementById('liquidTimePeriod');
        const inputsList = [
          'liquidUsStocksRoi','liquidUsStocksSd',
          'liquidUsBondsRoi','liquidUsBondsSd',
          'liquidIntlStocksRoi','liquidIntlStocksSd'
        ];
        function setEditable(editable){
          inputsList.forEach(id=>{
            const el = document.getElementById(id);
            if (el){
              el.readOnly = !editable;
              el.classList.toggle('read-only', !editable);
            }
          });
        }
        // Initialize selection from state (persisted)
        try {
          const gsel = (state && state.beta && state.beta.single && state.beta.single.liquid && state.beta.single.liquid.presetSelection) || null;
          if (gsel && sel.querySelector(`option[value="${gsel}"]`)) sel.value = gsel;
        } catch(e){}
        if (!sel) return;

        // Map UI -> dataset keys & input ids
        const classes = [
          { dataset: markethistory2.usstocks, roiId: "liquidUsStocksRoi", sdId: "liquidUsStocksSd", stateKey: "usStocks" },
          { dataset: markethistory2.usbonds, roiId: "liquidUsBondsRoi", sdId: "liquidUsBondsSd", stateKey: "usBonds" },
          { dataset: markethistory2.international, roiId: "liquidIntlStocksRoi", sdId: "liquidIntlStocksSd", stateKey: "internationalStocks" },
        ];

        function getMaxIndex(obj) {
          let maxKey = null;
          for (const [key, value] of Object.entries(obj)) {
            if(key > maxKey) {
              maxKey = key;
            }
          }
          return Number(maxKey); // returns the year (as a string)
        }

        // Helpers
        const minY = 1928, maxY = getMaxIndex(markethistory2.usstocks);

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
          // Persist chosen selection
          try{
            if (state && state.beta && state.beta.single && state.beta.single.liquid){
              state.beta.single.liquid.presetSelection = sel.value;
            }
          }catch(e){}
          // Custom mode: make fields editable, do not overwrite values
          if ((sel.value||'').toLowerCase() === 'custom'){
            setEditable(true);
            return;
          } else {
            setEditable(false);
          }
          const {first, last} = parseRange(sel.value);
          // For each asset, compute mean & stdev from markethistory
          classes.forEach(({dataset, roiId, sdId, stateKey})=>{
            const mean  = (markethistory2.getAverage && markethistory2.getAverage(dataset, first, last)) ?? null;
            const stdev = (markethistory2.getStandardDeviation && markethistory2.getStandardDeviation(dataset, first, last)) ?? null;

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

  if(active==='zeta' || active==='delta' || active==='epsilon'){
    if (active==='zeta' && typeof window.ensureTaxesExpense === 'function') { window.ensureTaxesExpense(); }
    if (typeof window.ensureMortgageExpenseCards === 'function') { window.ensureMortgageExpenseCards(); }
    if (typeof window.ensureRentalIncomeCards === 'function') { window.ensureRentalIncomeCards(); }
  }
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

  const title = document.createElement('h4');
  if(sectionKey==='zeta' && it && it.isTaxes){ 
    title.textContent='TAXES'; 
    //const info=document.createElement('span'); 
    // info.textContent='ℹ️'; 
    // info.title='Informational only'; 
    // title.appendChild(info);
  } else { title.textContent=it.title; }
  card.appendChild(title);
  // Append ℹ️ icon for Mortgage Expense infoOnly mini-card titles
  try {
    if((sectionKey==='zeta' && it && (it.isMortgageInfo === true || it.isTaxes === true)) || (sectionKey==='epsilon' && it && it.isRentalInfo === true)){
      const info = document.createElement('span');
      info.setAttribute('title','Informational only');
      info.textContent = 'ℹ️';
      info.style.marginLeft = '6px';
      title.appendChild(info);
    }
  } catch(e){}


  
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



/* ===== Tri-Allocation Slider Control ===== */
function createTriAllocationControl(it){
  if(!Number.isFinite(+it.allocUS) && !Number.isFinite(+it.allocBonds) && !Number.isFinite(+it.allocIntl)){
    it.allocUS = 60; it.allocBonds = 30; it.allocIntl = 10;
  }
  const total = (n)=> Math.max(0, Math.min(100, Math.round(+n || 0)));
  const toCuts = ()=> {
    const us = total(it.allocUS), bonds = total(it.allocBonds);
    let intl = total(100 - us - bonds);
    if(us + bonds + intl !== 100){ intl = Math.max(0, 100 - us - bonds); }
    return [us, us + bonds];
  };
  const fromCuts = (a,b)=>{
    a = total(a); b = total(b);
    if(b < a) b = a;
    it.allocUS = a;
    it.allocBonds = Math.max(0, b - a);
    it.allocIntl = Math.max(0, 100 - b);
  };

  const wrap = document.createElement('div'); wrap.className = 'tri-alloc';
  const lab = document.createElement('div'); lab.className = 'label'; lab.textContent = 'Asset Allocation (must add to 100%)';
  wrap.append(lab);

  const sliderWrap = document.createElement('div'); sliderWrap.className = 'tri-alloc-slider';
  const [initA, initB] = toCuts();

  const r1 = document.createElement('input'); r1.type = 'range'; r1.min = '0'; r1.max = '100'; r1.value = String(initA);
  const r2 = document.createElement('input'); r2.type = 'range'; r2.min = '0'; r2.max = '100'; r2.value = String(initB);
  r1.className = 'tri-alloc-range a'; r2.className = 'tri-alloc-range b';

  let lastActive = 'r2';
  // Blended ROI display support
  let blendRow;
  function updateBlended(){
    try{
      const g = (state && state.beta && state.beta.single && state.beta.single.liquid) ? state.beta.single.liquid : null;
      const roiUS  = parseFloat(numOnly(String(g?.usStocks?.roi ?? '0'))) || 0;
      const roiBnd = parseFloat(numOnly(String(g?.usBonds?.roi ?? '0'))) || 0;
      const roiInt = parseFloat(numOnly(String(g?.internationalStocks?.roi ?? '0'))) || 0;
      const us = Math.max(0, +it.allocUS || 0);
      const b  = Math.max(0, +it.allocBonds || 0);
      const i  = Math.max(0, +it.allocIntl || 0);
      const blended = (us*roiUS + b*roiBnd + i*roiInt) / 100;
      if(blendRow){
        const val = Number.isFinite(blended) ? blended.toFixed(2) : '0.00';
        blendRow.textContent = `Blended ROI: ${val}%`;
      }
    }catch(e){ /* noop */ }
  }

  function setZ(){
    const a = parseInt(r1.value,10), b = parseInt(r2.value,10);
    if(a === b){
      if(lastActive === 'r1'){ r1.style.zIndex='4'; r2.style.zIndex='3'; }
      else { r2.style.zIndex='4'; r1.style.zIndex='3'; }
    }else{
      r2.style.zIndex='4'; r1.style.zIndex='3';
    }
  }
  setZ();

  // Handle pointer interactions on the whole slider so either thumb can be chosen by proximity
  let dragging = null;
  function clamp01(x){ return Math.max(0, Math.min(1, x)); }
  function pctFromEvent(e){
    const rect = sliderWrap.getBoundingClientRect();
    const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    const ratio = clamp01((clientX - rect.left) / Math.max(1, rect.width));
    return Math.round(ratio * 100);
  }
  function chooseHandleByProximity(pct){
    const a = Math.abs(pct - parseInt(r1.value,10));
    const b = Math.abs(pct - parseInt(r2.value,10));
    if(a === b){ return lastActive; }
    return (a < b) ? 'r1' : 'r2';
  }
  function onDown(e){
    e.preventDefault();
    const pct = pctFromEvent(e);
    dragging = chooseHandleByProximity(pct);
    lastActive = dragging;
    if(dragging === 'r1'){
      r1.value = String(Math.min(pct, parseInt(r2.value,10)));
      syncFromRanges('r1');
    }else{
      r2.value = String(Math.max(pct, parseInt(r1.value,10)));
      syncFromRanges('r2');
    }
    setZ();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('touchmove', onMove, {passive:false});
    window.addEventListener('pointerup', onUp, {once:true});
    window.addEventListener('touchend', onUp, {once:true});
  }
  function onMove(e){
    if(!dragging) return;
    e.preventDefault();
    const pct = pctFromEvent(e);
    if(dragging === 'r1'){
      r1.value = String(Math.min(pct, parseInt(r2.value,10)));
      syncFromRanges('r1');
    }else{
      r2.value = String(Math.max(pct, parseInt(r1.value,10)));
      syncFromRanges('r2');
    }
  }
  function onUp(){ dragging = null; }
  sliderWrap.addEventListener('pointerdown', onDown);
  sliderWrap.addEventListener('touchstart', onDown, {passive:false});


  function syncFromRanges(active){
    let a = parseInt(r1.value,10);
    let b = parseInt(r2.value,10);
    if(active === 'r1' && a > b){ a = b; r1.value = String(a); }
    if(active === 'r2' && b < a){ b = a; r2.value = String(b); }
    fromCuts(parseInt(r1.value,10), parseInt(r2.value,10));
    updateBars();
    syncInputs();
    updateBlended();
    setZ();
  }

  ['pointerdown','mousedown','touchstart'].forEach(evt=>{
    r1.addEventListener(evt, ()=>{ lastActive='r1'; setZ(); }, {passive:true});
    r2.addEventListener(evt, ()=>{ lastActive='r2'; setZ(); }, {passive:true});
  });

  r1.addEventListener('input', ()=>{ lastActive='r1'; syncFromRanges('r1'); });
  r2.addEventListener('input', ()=>{ lastActive='r2'; syncFromRanges('r2'); });

  const bar = document.createElement('div'); bar.className = 'tri-alloc-bar';
  const segUS = document.createElement('div'); segUS.className = 'seg us';
  const segB = document.createElement('div'); segB.className = 'seg bonds';
  const segI = document.createElement('div'); segI.className = 'seg intl';
  bar.append(segUS, segB, segI);

  function updateBars(){
    const a = parseInt(r1.value,10), b = parseInt(r2.value,10);
    segUS.style.width = a + '%';
    segB.style.width = (b - a) + '%';
    segI.style.width = (100 - b) + '%';
  }

  sliderWrap.append(bar, r1, r2);
  wrap.append(sliderWrap);

  const inputs = document.createElement('div'); inputs.className = 'tri-alloc-inputs';
  function makePctField(label, getVal, setVal){
    const f = document.createElement('div'); f.className = 'tri-field label';
    const l = document.createElement('label'); l.textContent = label;
    const inp = document.createElement('input'); inp.type = 'number'; inp.min='0'; inp.max='100'; inp.step='1';
    inp.value = String(total(getVal()));
    inp.addEventListener('input', ()=>{
      const v = total(inp.value);
      setVal(v);
      const [a,b] = toCuts();
      r1.value = String(a); r2.value = String(b);
      updateBars();
      syncInputs(true);
      updateBlended();
      setZ();
    });
    f.append(l, inp);
    return {field:f, input:inp};
  }
  function syncInputs(skipRound){
    usBox.input.value = String(total(it.allocUS));
    bBox.input.value = String(total(it.allocBonds));
    iBox.input.value = String(total(it.allocIntl));
    if(!skipRound){
      const [a,b] = toCuts();
      fromCuts(a,b);
    }
  }
  const usBox = makePctField('US Stocks (%)', ()=>it.allocUS, (v)=>{ it.allocUS = v; });
  const bBox  = makePctField('US Bonds (%)', ()=>it.allocBonds, (v)=>{ it.allocBonds = v; });
  const iBox  = makePctField('International (%)', ()=>it.allocIntl, (v)=>{ it.allocIntl = v; });
  inputs.append(usBox.field, bBox.field, iBox.field);
  wrap.append(inputs);

  // Blended ROI line
  blendRow = document.createElement('div');
  blendRow.className = 'blended-roi label';
  blendRow.setAttribute('role','status');
  blendRow.setAttribute('aria-live','polite');
  wrap.append(blendRow);

  updateBars();
  updateBlended();
  return wrap;
}
/* Expanded item card (multi) */
function renderItem(it, sectionKey){
  const wrap = document.createElement('div'); wrap.className = 'item'; wrap.dataset.id = it.id;

  const header = document.createElement('div'); header.className = 'item-header';
  const title = document.createElement('div'); title.className = 'item-title';

  const isTaxes = (sectionKey==='zeta' && it && it.isTaxes === true);
  const isMortgageInfo = (sectionKey==='zeta' && it && it.isMortgageInfo === true);
  const isRentalInfo = (sectionKey==='epsilon' && it && it.isRentalInfo === true);
  const titleInput = (isTaxes || isMortgageInfo || isRentalInfo) ? document.createElement('div') : document.createElement('input');
  if(isTaxes||isMortgageInfo||isRentalInfo){ titleInput.className = 'title-static'; } else { titleInput.className = 'title-input'; titleInput.type = 'text'; }
  if(isTaxes){ 
    titleInput.textContent = 'TAXES'; 
    //const info=document.createElement('span'); 
    // info.textContent='ℹ️'; 
    // info.title='Informational only'; 
    // titleInput.appendChild(info); 
    it.title='TAXES'; 
  } else { titleInput.value = it.title || defaultTitle(sectionKey, it.id); }
  if(!(isTaxes||isMortgageInfo||isRentalInfo)){ titleInput.placeholder = defaultTitle(sectionKey, it.id); }
  if(!(isTaxes||isMortgageInfo||isRentalInfo)) titleInput.addEventListener('input', ()=>{
    it.title = titleInput.value.trim() || defaultTitle(sectionKey, it.id);
    const mini = dockEl.querySelector(`.mini[data-id="${it.id}"] h4`); if(mini) mini.textContent = it.title;
    // If a Liquid Asset title changes, proceeds-dropdowns will refresh on next render
  });
  titleInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') titleInput.blur(); });
  title.append(titleInput);
  if(isMortgageInfo || isRentalInfo){ try{ titleInput.textContent = it.title || ''; }catch(e){} }

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
  //if(isTaxes){ if(!title.querySelector('.info-icon')){ const info=document.createElement('span'); info.className='info-icon'; info.textContent=''; title.appendChild(info); } }


  const body = document.createElement('div'); body.className = 'item-body';

  if(sectionKey === 'zeta' && it && it.isTaxes === true){
    const note = document.createElement('div');
    note.className = 'subtle';
    note.textContent = 'Your taxes including federal income tax, capital gains, and state income tax are automatically included by the calculator.   You should not include any tax allowances in your other expense entries';
    body.append(note);
    } else if(sectionKey === 'zeta' && it && it.isMortgageInfo === true){
    const note = document.createElement('div');
    note.className = 'subtle';
    const propTitle = (it.propertyTitle || (it.title||'').replace(/^Mortgage Expense for\s+/, ''));
    try{
      // Look up the property to read mortgage fields and purchase year
      const reSec = state && state.delta;
      const prop = (reSec && Array.isArray(reSec.items)) ? reSec.items.find(p => p && p.id === it.propertyId) : null;

      const nonEmpty = (v) => v !== undefined && v !== null && String(v).trim() !== '';
      const toNum = (v) => {
        if(v === null || v === undefined) return null;
        const s = String(v);
        if(!nonEmpty(s)) return null;
        const cleaned = s.replace(/[^0-9\.\-]/g, '');
        if(!cleaned) return null;
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : null;
      };

      const TOKENS = { ALREADY_OWNED: '__ALREADY_OWNED__' };
      const nowYear = new Date().getFullYear();

      // Determine purchase year status
      const purchaseRaw = prop ? (prop.purchaseYear ?? '') : '';
      const isAlreadyOwned = (purchaseRaw === TOKENS.ALREADY_OWNED);
      const purchaseYearNum = /^\d{4}$/.test(String(purchaseRaw)) ? Number(purchaseRaw) : null;
      const isPastOrPresentPurchase = isAlreadyOwned || (purchaseYearNum !== null && purchaseYearNum <= nowYear);
      const isFuturePurchase = (purchaseYearNum !== null && purchaseYearNum > nowYear);

      const monthly = prop ? toNum(prop.monthlyPayment) : null;
      const annual = monthly !== null ? monthly * 12 : null;

      const startYear = prop ? toNum(prop.loanOrigYear) : null;
      const termYears = prop ? toNum(prop.loanTerm) : null;
      const endYear = (startYear !== null && termYears !== null) ? (startYear + termYears - 1) : null;

      const fmtUSD = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

      if(isPastOrPresentPurchase && annual !== null && startYear !== null && endYear !== null){
        note.innerHTML = `The annual mortgage expenses of ${fmtUSD(annual)} for "${propTitle}" are already included as an expense from ${startYear} to ${endYear}.`;
      } else if (isFuturePurchase || annual === null) {
        // Future purchases, or missing monthly payment -> generic note without amount
        note.innerHTML = `The annual mortgage expenses for "${propTitle}" are already included as an expense.`;
      } else if(annual !== null){
        // Fallback: amount known but years unknown
        note.innerHTML = `The annual mortgage expenses of ${fmtUSD(annual)} for "${propTitle}" are already included as an expense.`;
      } else {
        note.innerHTML = `The annual mortgage expenses for "${propTitle}" are already included as an expense.`;
      }
    }catch(e){
      note.innerHTML = `The annual mortgage expenses for "${propTitle}" are already included as an expense.`;
    }
    body.append(note);
  } else if(sectionKey === 'epsilon' && it && it.isRentalInfo === true){
    const note = document.createElement('div');
    note.className = 'subtle';
    const propTitle = (it.propertyTitle || (it.title||'').replace(/^Rental Income for\s+/, ''));
    try{
      const reSec = state && state.delta;
      const prop = (reSec && Array.isArray(reSec.items)) ? reSec.items.find(p => p && p.id === it.propertyId) : null;

      const nonEmpty = (v) => v !== undefined && v !== null && String(v).trim() !== '';
      const toNum = (v) => {
        if(v === null || v === undefined) return null;
        const s = String(v);
        if(!nonEmpty(s)) return null;
        const cleaned = s.replace(/[^0-9\.\-]/g, '');
        if(!cleaned) return null;
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : null;
      };
      const income = prop ? toNum(prop.annualIncome) - toNum(prop.annualExpenses): null;
      const fmtUSD = (v) => new Intl.NumberFormat('en-US', { style:'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
      if(income !== null){
        note.innerHTML = `Net Annual Rental Income of ${fmtUSD(income)} from property ${propTitle} is already included as income.`;
      } else {
        note.innerHTML = `Net Annual Rental Income from property ${propTitle} is already included as income.`;
      }
    }catch(e){
      note.textContent = `Net Annual Rental Income from property ${propTitle} is already included as income.`;
    }
    body.append(note);
;
  } else if(sectionKey === 'gamma'){
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
      // Top note explaining split
      const noteTop = document.createElement('div'); noteTop.className='subtle';
      noteTop.textContent = 'For tax purposes, please separate the account value into cost basis and unrealized gains.';
      body.append(noteTop);

      // Fields
      const {field:fCB, input:iCB} = makeTextField('Cost Basis ($)', 'e.g. 200000', it.costBasis, (v)=>{ it.costBasis=v; });
      const {field:fUG, input:iUG} = makeTextField('Unrealized Gains ($)', 'e.g. 50000', it.unrealized, (v)=>{ it.unrealized=v; });
      grid.append(fCB, fUG);
      body.append(grid);

      // Bottom note for total value
      const noteBottom = document.createElement('div'); noteBottom.className='subtle';
      const updateTotalNote = ()=>{
        const toNum = (el)=>{
          const raw = el && el.dataset && el.dataset.raw ? el.dataset.raw : (el ? el.value : '');
          const n = parseFloat(String(raw).replace(/[^0-9.\-]/g,'')) || 0;
          return n;
        };
        const total = toNum(iCB) + toNum(iUG);
        noteBottom.textContent = `Total account value: $${fmtDollars(total)}`;
      };
      iCB && iCB.addEventListener('input', updateTotalNote);
      iUG && iUG.addEventListener('input', updateTotalNote);
      iCB && iCB.addEventListener('blur', updateTotalNote);
      iUG && iUG.addEventListener('blur', updateTotalNote);
      updateTotalNote();
      body.append(noteBottom);

    } else {
      const {field:fAmt} = makeTextField('Amount ($)', 'e.g. 250000', it.amount, (v)=>{ it.amount=v; });
      grid.append(fAmt);
      if(it.atype==='Cash'){
        const {field:fInt} = makeTextField('Interest Rate (%)', 'e.g. 4.5', it.interest, (v)=>{ it.interest=v; });
        grid.append(fInt);
      }
      body.append(grid);
    }

    // === Asset Allocation Slider (only for Taxable Investment, Tax Deferred, Roth) ===
    (function(){
      const t = it.atype || 'Cash';
      if(t==='Taxable Investment' || t==='Tax Deferred' || t==='Roth'){
        const allocWrap = createTriAllocationControl(it);
        const row = document.createElement('div'); row.className='row'; row.append(allocWrap);
        body.append(row);
      }
    })();


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
      const btn = document.createElement('button'); btn.className='btn'; btn.textContent = it.showROI? 'Hide ROI' : 'Customize ROI';
      btn.addEventListener('click', ()=>{ it.showROI = !it.showROI; render(); });
      roiRow.append(btn); body.append(roiRow);

      if(it.showROI){
        const roiGrid = document.createElement('div'); roiGrid.className='grid-2';
        const {field:fRoi} = makeTextField('ROI (%)', 'e.g. 6.0', it.roi, (v)=>{ it.roi=v; });
        const {field:fSd}  = makeTextField('Standard Deviation (%)', 'e.g. 12', it.stdev, (v)=>{ it.stdev=v; });
        roiGrid.append(fRoi, fSd); body.append(roiGrid);
        const tip = document.createElement('div'); tip.className='subtle'; tip.textContent = 'These override any asset allocation based returns for this account.'; body.append(tip);
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
        const hint = document.createElement('div');
        hint.className = 'subtle';
        hint.textContent = "Amount should be expressed in today's dollars.";
        inhField.appendChild(hint);
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
    const mortBtn = document.createElement('button'); mortBtn.className='btn'; mortBtn.type='button';
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
        const noteWrap = document.createElement('div'); noteWrap.className='field span-all'; noteWrap.style.gridColumn='1 / -1';
        const note = document.createElement('div'); note.className='label';
        note.textContent = 'Note: Future purchase price is projected based on today\'s value and appreciation rate.   Future down payment is treated as a drawdown expense only if purchase occurs during retirement years';
        noteWrap.appendChild(note);
        g.append(dpF, tF, rF, noteWrap);
      }
      body.append(g);
    }

    /* Rental */
    const rentRow = document.createElement('div'); rentRow.className='row';
    const rentBtn = document.createElement('button'); rentBtn.className='btn'; rentBtn.textContent = it.showRental? 'Hide Rental Income' : 'Enter Rental Income (Optional)';
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
    const saleBtn = document.createElement('button'); saleBtn.className='btn'; saleBtn.textContent = it.showSale? 'Hide Sale Information' : 'Enter Future Sale and Tax Information';
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
    const roiBtn = document.createElement('button'); roiBtn.className='btn'; roiBtn.textContent = it.showROI? 'Hide Appreciation' : 'Customize Appreciation';
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
    const {field:amtF} = makeTextField('Annual Amount - In Today\'s Dollars($)', 'e.g. 45000', it.amount, (v)=>{ it.amount=v; });
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
    const inflBtn = document.createElement('button'); inflBtn.className='btn'; inflBtn.textContent = it.showInflation? 'Hide Inflation' : 'Customize Inflation';
    inflBtn.addEventListener('click', ()=>{ it.showInflation = !it.showInflation; render(); });
    inflRow.append(inflBtn); body.append(inflRow);

    if(it.showInflation){
      const gInfl = document.createElement('div'); gInfl.className='grid-2';
      const {field:roiF} = makeTextField('Inflation (%)', 'e.g. 2.5', it.roi, (v)=>{ it.roi=v; });
      gInfl.append(roiF); body.append(gInfl);
      const tip = document.createElement('div'); tip.className='subtle'; text = 'This overrides default inflation for this cash flow.'; tip.textContent = text; body.append(tip);
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

  try{ ensureGrowthDefaultsInitialized(); }catch(e){}
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
  let totalAssets = getTotalAssets();
  if (totalAssets <= 0) {
      errors.push('Liquid Assets: At least one liquid asset is required');
  }


  // Validate each non-Cash liquid asset's allocation sums to 100
  (state.gamma.items || []).forEach((a, idx) => {
    if (!a || a.atype === 'Cash') return;
    const us    = nonEmpty(a.allocUS)    ? toFloat(a.allocUS)    : 0;
    const bonds = nonEmpty(a.allocBonds) ? toFloat(a.allocBonds) : 0;
    const intl  = nonEmpty(a.allocIntl)  ? toFloat(a.allocIntl)  : 0;
    const sum = us + bonds + intl;
    // small tolerance for floating point
    if (!Number.isFinite(sum) || Math.abs(sum - 100) > 0.0001) {
      const title = a.title || `Asset ${idx + 1}`;
      const pretty = Number.isFinite(sum) ? sum.toFixed(2) : 'NaN';
      errors.push(`Liquid Assets: Allocation for "${title}" must total 100 (US Stocks + US Bonds + International). Currently ${pretty}.`);
    }
  });


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
  let totalExpenses = getTotalExpenses();
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
  submittal.appStateV5 = state;
  //submittal.clickstream = "";
  submittal.mode = "advanced";
  try {submittal.city = geoplugin_city();} catch (e) {console.log('could not obtain city')}

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
  growthRates.assetClassBased = "true"; 
  growthRates.inflationGainRate = {};
  growthRates.inflationGainRate.average = toFloat(state.beta.single.inflation.roi);
  growthRates.inflationGainRate.standardDeviation = toFloat(state.beta.single.inflation.stdev); 
  growthRates.inflation = toFloat(state.beta.single.inflation.roi); //legacy

  //NEW: Asset class gain rates
  growthRates.usStocksGainRate = {};
  growthRates.usStocksGainRate.average = toFloat(state.beta.single.liquid.usStocks.roi) || 0;
  growthRates.usStocksGainRate.standardDeviation = toFloat(state.beta.single.liquid.usStocks.stdev) || 0; 
  growthRates.usBondsGainRate = {};
  growthRates.usBondsGainRate.average = toFloat(state.beta.single.liquid.usBonds.roi) || 0;
  growthRates.usBondsGainRate.standardDeviation = toFloat(state.beta.single.liquid.usBonds.stdev) || 0; 
  growthRates.internationalStocksGainRate = {};
  growthRates.internationalStocksGainRate.average = toFloat(state.beta.single.liquid.internationalStocks.roi) || 0;
  growthRates.internationalStocksGainRate.standardDeviation = toFloat(state.beta.single.liquid.internationalStocks.stdev) || 0;
  
  //growthRates.defaultAnnualGainRate = {};
  //growthRates.defaultAnnualGainRate.average = toFloat(state.beta.single.liquid.roi) || 0;
  //growthRates.defaultAnnualGainRate.standardDeviation = toFloat(state.beta.single.liquid.stdev) || 0; 
  //growthRates.ownRealEstate = 'true'; //TODO needed?
  
  growthRates.defaultREAnnualGainRate = {}
  growthRates.defaultREAnnualGainRate.average = toFloat(state.beta.single.realEstate.roi) || 0;
  growthRates.defaultREAnnualGainRate.standardDeviation = toFloat(state.beta.single.realEstate.stdev) || 0; 
  
  growthRates.customGrowthRates = {};
  //map custom growth rates to array indexed by year offset from current year
  let triples = state.beta.single.liquid.customYears || [];
  const currentYear = new Date().getFullYear();
  const maxYear = Math.max(...triples.map(t => t.year));
  if (maxYear >= 0) {
    const length = maxYear - currentYear + 1;
    const newTriples = Array(length).fill(null);
    triples.forEach(({ year, roi, prob }) => {
       const index = year - currentYear;
       if (index >= 0 && index < length && nonEmpty(year) && nonEmpty(roi) && nonEmpty(prob)) {
         newTriples[index] = { year : toInt(year), roi: toFloat(roi) || 0, trialPercentage: toFloat(prob) || 0 };
         growthRates.growthRatesCustomize = "true"; //TODO
       }
    });
    if (newTriples.length > 0) {
      growthRates.customGrowthRates.customGrowthRates = newTriples;
    } else {
      delete growthRates.customGrowthRates;
      growthRates.growthRatesCustomize = "false";
    }
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
    const assetAllocations = {};
    if (a.atype !== 'Cash') {
      assetAllocations.allocUS = a.allocUS;
      assetAllocations.allocBonds = a.allocBonds;
      assetAllocations.allocIntl = a.allocIntl;
    }
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
        assetAllocations: assetAllocations,
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
        assetAllocations: assetAllocations,
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
  submittal.incomeAccountList.incomeAccounts = [];
  let incomeNum = 1;
  (state.epsilon.items || []).forEach(i => {
    if (i.infoOnly) return;
    const inc = {
      idPrefix: 'income' + incomeNum,
      name: i.title,
      taxable: i.taxTreatment === 'Ordinary Income' || i.taxTreatment === 'Social Security (85% taxable)',
      isSocialSecurity: i.taxTreatment === 'Social Security (85% taxable)', 
      firstYear: codeForYearSelection(i.startYear),
      lastYear: codeForYearSelection(i.endYear),
      startingValue: toInt(i.amount) || 0,
      annualGainRateOverride: nonEmpty(i.roi),
      annualGainRate: nonEmpty(i.roi) ? {
        average: toFloat(i.roi) || 0,
        standardDeviation: 0
      } : null,
    };
    submittal.incomeAccountList.incomeAccounts.push(inc);
    incomeNum += 1;
  });
  if (submittal.incomeAccountList.incomeAccounts.length === 0) {
    delete submittal.incomeAccountList.incomeAccounts; // Remove empty income list
  }
  if (submittal.incomeAccountList.incomeAccounts === null) {
    delete submittal.incomeAccountList; // Remove empty income account list
  }




  //expenses
  submittal.expenseAccountList = {};
  submittal.expenseAccountList.expenseAccounts = [];
  let expenseNum = 1;
  (state.zeta.items || []).forEach(e => { 
    if(e && (e.isTaxes || e.infoOnly)) return; 
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
  let stagingUrl = 'https://rdgkyklxytiqub5rjfnypk3uye0lvtra.lambda-url.us-east-2.on.aws/staging.retirementodds.com';
  let productionUrl = 'https://gsxhoeqef5pivi2lax4q42nnby0nqwvb.lambda-url.us-east-2.on.aws/www.retirementodds.com';
  let apiUrl;
  if (staging) {
    apiUrl = stagingUrl;
  }
  else {
    apiUrl = productionUrl;
  }
  const response = await fetch(apiUrl, {
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

  
  // --- File Save / Restore helpers ---
  function safeFileName(name){
    const base = (name && name.trim()) ? name.trim() : 'retirement-plan';
    return base.replace(/[^a-z0-9\-\._\s]/gi,'_') + '.ro.json';
  }
  function serializePayload(name){
    return JSON.stringify({ name: name||null, updatedAt: Date.now(), data: state }, null, 2);
  }
  function savePlanToFile(name){
    try{
      const blob = new Blob([serializePayload(name)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeFileName(name);
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
      showToast?.('Downloaded plan file.');
      closeModal('saveModal');
    }catch(e){ alert('Failed to save file: ' + (e?.message||e)); }
  }
  function isPayloadLike(obj){
    return obj && (obj.data || obj.updatedAt || obj.name);
  }
  async function restoreFromFile(file){
    try{
      const text = await file.text();
      const obj = JSON.parse(text);
      const newState = isPayloadLike(obj) ? obj.data : obj;
      if(!newState || typeof newState!=='object'){ throw new Error('Invalid file format'); }
      // Replace state deeply to preserve references other code may hold
      Object.keys(state).forEach(k=>{ delete state[k]; });
      deepAssign(state, newState);
      render();
      closeModal('restoreModal');
      showToast?.('Plan restored from file.');
    }catch(e){ alert('Failed to restore from file: ' + (e?.message||e)); }
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
    // Import state from optional ?data=<base64(JSON)> param before first render
    (function(){
      try {
        // Prefer query string; also check hash query (e.g. #about?data=...)
        let enc = new URLSearchParams(window.location.search || '').get('data');
        if (!enc && window.location.hash && window.location.hash.includes('?')) {
          const qs = window.location.hash.split('?')[1] || '';
          enc = new URLSearchParams(qs).get('data');
        }
        if (!enc) return;

        // Accept URL-safe base64; normalize and pad
        enc = String(enc).replace(/\s+/g,'+').replace(/-/g,'+').replace(/_/g,'/');
        const pad = enc.length % 4; if (pad) enc += '='.repeat(4 - pad);

        // Decode
        let jsonText = atob(enc);

        // Parse JSON (supports either raw state or wrapper {name,updatedAt,data})
        const parsed = JSON.parse(jsonText);
        const newState = (parsed && (parsed.data || parsed.updatedAt || parsed.name)) ? parsed.data : parsed;
        if (!newState || typeof newState !== 'object') throw new Error('Invalid data payload');

        // Deep merge into existing global state while preserving references
        function deepAssign(target, source){
          if (source && typeof source === 'object') {
            Object.keys(source).forEach(k => {
              const sv = source[k];
              if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
                if (!target[k] || typeof target[k] !== 'object') target[k] = {};
                deepAssign(target[k], sv);
              } else {
                target[k] = sv;
              }
            });
          }
        }
        // Use existing deepAssign if available on scope; otherwise use the local one above
        try {
          if (typeof deepAssign === 'function') {
            // noop; use the one we just declared (shadows outer if any)
          }
        } catch (e) {}

        // Replace state content
        if (typeof state === 'object' && state) {
          Object.keys(state).forEach(k => { delete state[k]; });
          deepAssign(state, newState);
        } else {
          // Fallback (unlikely): define state if not present
          window.state = newState;
        }
      } catch (e) {
        console.warn('Failed to import state from ?data:', e);
      }
    })();

    const previewJsonLink = document.getElementById('previewJsonLink');
    const aboutSiteLink = document.getElementById('aboutSiteLink');
    const disclosureLink = document.getElementById('disclosureLink');
    const aboutMeLink = document.getElementById('aboutMeLink');
    const donateLink = document.getElementById('donateLink');
    const contactLink = document.getElementById('contactLink');
    const saveBtn = document.getElementById('savePlanBtn');
    const restoreBtn = document.getElementById('restorePlanBtn');
    const modalSaveBtn = document.getElementById('modalSaveBtn');
    const modalSaveFileBtn = document.getElementById('modalSaveFileBtn');
    const input = document.getElementById('planNameInput');
    const restoreFileBtn = document.getElementById('restoreFromFileBtn');
    const restoreFileInput = document.getElementById('restoreFileInput');

    restoreFileInput.addEventListener('click', () => { restoreFileInput.value = ''; });
    const restoreFileName = document.getElementById('restoreFileName');

    saveBtn?.addEventListener('click', ()=>{ if(input) input.value=''; openModal('saveModal'); });
    restoreBtn?.addEventListener('click', ()=>{ buildRestoreList(); openModal('restoreModal'); });

    modalSaveBtn?.addEventListener('click', ()=>{ const name=(input?.value||'').trim(); doSavePlan(name); });
    modalSaveFileBtn?.addEventListener('click', ()=>{ const name=(input?.value||'').trim(); savePlanToFile(name); });

    input?.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); modalSaveBtn?.click(); } });

    restoreFileBtn?.addEventListener('click', ()=>{ restoreFileInput?.click(); });
    restoreFileInput?.addEventListener('change', ()=>{
      const file = restoreFileInput.files && restoreFileInput.files[0];
      if(!file) return;
      if(restoreFileName) restoreFileName.textContent = file.name;
      restoreFromFile(file);
    });

    // List of element IDs
    /*
    const footerLinkIds = ["aboutSiteLink", "disclosureLink", "aboutMeLink", "donateLink", "contactLink"];

    // Generic click handler
    function handleFooterLinkClick(event) {
      const clickedId = event.currentTarget.id;
      let htmlLink;
      switch (clickedId) {
        case "aboutSiteLink":
          htmlLink = "html/about.html";
          break;
        case "disclosureLink":
          htmlLink = "html/disclosures.html";
          break;
        case "aboutMeLink": 
          htmlLink = "html/aboutMe.html";
          break;
        case "donateLink": 
          htmlLink = "html/donate.html";
          break;
        case "contactLink":
          htmlLink = "html/contact.html";
          break;
      }
      hideErrorPanel();
      fetch(htmlLink)
        .then(response => response.text())
        .then(data => {
          document.getElementById("footerLinkContent").innerHTML = data;
        })
        .catch(error => {
          console.error("Error loading footer link content:", error);
        });
        footerLinkMode = true;
        if(jsonMode){
          jsonMode = false;
          jsonBox.classList.add('hidden');
          previewJsonLink.textContent = 'Preview JSON';
        }
        active = '';
        document.getElementById("footerLinkContent").classList.remove("hidden");
        document.querySelector('.main').scrollIntoView({ behavior: 'smooth' });
        render();
    }

    // Attach handler to each link
    footerLinkIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("click", handleFooterLinkClick);
      }
    });
*/
    /* JSON preview toggle */
    if (previewJsonLink) previewJsonLink.addEventListener('click', ()=>{
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
        previewJsonLink.textContent = 'Hide JSON';
        active = '';
      }else{
        jsonMode = false;
        previewJsonLink.textContent = 'Preview JSON';
      }
      render();
    });
/*
    document.getElementById("donating").addEventListener('click', ()=>{
      document.getElementById("donateLink").click();
    })
    document.getElementById("reachOut").addEventListener('click', ()=>{
      document.getElementById("contactLink").click();
    })
*/
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


function getTotalAssets(){
  try{
    const items = (state.gamma && Array.isArray(state.gamma.items)) ? state.gamma.items : [];
    let total = 0;
    for (const it of items){
      const atype = it.atype || '';
      if (atype === 'Taxable Investment'){
        const cb = parseFloat(numOnly(it.costBasis ?? '')) || 0;
        const ug = parseFloat(numOnly(it.unrealized ?? '')) || 0;
        total += cb + ug;
      } else {
        const amt = parseFloat(numOnly(it.amount ?? '')) || 0;
        total += amt;
      }
    }
    return total;
  }catch(e){ return 0; }
}

function getTotalExpenses(){
  try{
    const items = (state.zeta && Array.isArray(state.zeta.items)) ? state.zeta.items : [];
    let total = 0;
    for (const it of items){ if(it && it.isTaxes) continue; const amt = parseFloat(numOnly(it.amount ?? '')) || 0; total += amt;
    }
    return total;
  }catch(e){ return 0; }
}




async function updateOdometer() {
  try {
    const response = await fetch("https://www.retirementodds.com/js/data/odometer/odometer.json");
    const odometer = await response.json();
    const base = odometer.base;
    const counter = odometer.counter;
    const value = base + counter;
    document.getElementById("odometer").innerHTML = value;
  } catch (e) {
    console.error("Failed to update odometer", e);
  }
}
window.addEventListener("DOMContentLoaded", updateOdometer);



// Load Sample Data button handler
document.addEventListener('DOMContentLoaded', ()=>{
  const btn = document.getElementById('loadSampleBtn');
  if(!btn) return;
  btn.addEventListener('click', async ()=>{
    try{
      const resp = await fetch('js/data/sampleplan.json');
      if(!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      // deep merge into existing const state
      (function deepMerge(target, source){
        if(source && typeof source==='object'){
          Object.keys(source).forEach(k=>{
            if(source[k] && typeof source[k]==='object' && !Array.isArray(source[k])){
              if(!target[k] || typeof target[k] !== 'object') target[k] = {};
              deepMerge(target[k], source[k]);
            }else{
              target[k] = source[k];
            }
          });
        }
      })(state, data);
      if(typeof ensureGrowthDefaultsInitialized === 'function'){ ensureGrowthDefaultsInitialized(); }
      if(typeof render === 'function') render();
      const m = document.getElementById('sampleLoadedModal');
      if(m){ m.setAttribute('aria-hidden','false'); document.body.classList.add('ro-modal-open'); }
    }catch(e){
      alert('Failed to load sample data: ' + (e && e.message ? e.message : e));
    }
  });
});
// Re-apply Liquid preset UI (readOnly vs editable) after restore or navigation
(function(){
  try{
    window.syncLiquidPresetUI = function(){
      const sel = document.getElementById('liquidTimePeriod');
      if (!sel) return;
      // Trigger handler by dispatching change (handlers read state and update inputs)
      const ev = new Event('change');
      sel.dispatchEvent(ev);
    };
  }catch(e){}
})();




// HASH TAG HANDLING
//////////////////////
    // Generic click handler
    function handleFooterHash(clickedHash) {
      let htmlLink;
      switch (clickedHash) {
        case "about":
          htmlLink = "html/about.html";
          break;
        case "disclosures":
          htmlLink = "html/disclosures.html";
          break;
        case "aboutme": 
          htmlLink = "html/aboutMe.html";
          break;
        case "donate": 
          htmlLink = "html/donate.html";
          break;
        case "contact":
          htmlLink = "html/contact.html";
          break;
      }
      hideErrorPanel();
      fetch(htmlLink)
        .then(response => response.text())
        .then(data => {
          document.getElementById("footerLinkContent").innerHTML = data;
        })
        .catch(error => {
          console.error("Error loading footer link content:", error);
        });
        footerLinkMode = true;
        if(jsonMode){
          jsonMode = false;
          jsonBox.classList.add('hidden');
          previewJsonLink.textContent = 'Preview JSON';
        }
        active = '';
        document.getElementById("footerLinkContent").classList.remove("hidden");
        document.querySelector('.main').scrollIntoView({ behavior: 'smooth' });
        render();
    }



// 1) Map hash "routes" to functions you want to run
const hashActions = {
  about: () => handleFooterHash('about'),   // your modal opener
  disclosures:    () => handleFooterHash('disclosures'),        // your SPA navigation
  aboutme: () =>  handleFooterHash('aboutme'),
  donate: () =>   handleFooterHash('donate'),
  contact: () =>  handleFooterHash('contact'),
};


// 2) Parse "#route?param1=val&param2=val"
function parseHash(h) {
  const s = (h || '').replace(/^#/, '');
  if (!s) return { route: '', params: {} };
  const [route, query = ''] = s.split('?');
  const params = Object.fromEntries(new URLSearchParams(query));
  return { route, params };
}

// 3) Run action on initial load and on hash changes
function handleHash() {
  const { route, params } = parseHash(location.hash);
  const fn = hashActions[route];
  if (typeof fn === 'function') {
    fn(params);
    // Optional: keep the URL “clean” (avoids accidental native anchor jumps)
    // Comment this out if you want the hash to remain.
    // history.replaceState(null, '', location.pathname + location.search + '#');
  }
}

// Fire once on load (supports copy/paste or direct navigation)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', handleHash, { once: true });
} else {
  handleHash();
}
// Also respond to in-page clicks that change the hash
window.addEventListener('hashchange', handleHash);


