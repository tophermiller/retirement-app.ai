
/* Icons */
function icon(name){
  const wrap = document.createElement('span'); wrap.className = 'icon';
  const svgs = {
    basics: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7aa2f7"/><stop offset="1" stop-color="#89dceb"/></linearGradient></defs>
        <path fill="url(#g1)" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.239-8 5v1h16v-1c0-2.761-3.58-5-8-5Z"/>
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
  { key:'beta',    label:'Growth Rates',  mode:'single', lipsum:'Enter your inflation and return on investment assumptions here.   These are the most important inputs for best results.   Click the "Help me choose" buttons for help.', icon:'growth' },
  { key:'gamma',   label:'Liquid Assets', mode:'multi',  lipsum:'Enter your cash/liquid assets here by account type.   To set retirement withdrawal order, drag and drop in the collapsed area.', icon:'liquid' },
  { key:'delta',   label:'Real Estate',   mode:'multi',  lipsum:'Add properties you own, including your home and any rental properties you own.', icon:'realestate' },
  { key:'epsilon', label:'Income',        mode:'multi',  lipsum:'Enter any forms of retirement income here, including pensions, Social Security, etc., with date ranges.', icon:'income' },
  { key:'zeta',    label:'Expenses',      mode:'multi',  lipsum:'Enter your retirement spending budget here with date ranges.', icon:'expenses' },
];

const state = Object.fromEntries(sections.map(s => [s.key, s.mode==='single'
  ? (s.key==='alpha'
      ? { single:{ age:'', retire:'', life:'', spouseAge:'', spouseLife:'', stateCode:'CA', heirsTarget:'' } }
      // Growth Rates defaults
      : { single:{
            inflation:{ roi:'', stdev:'' },
            liquid:{ roi:'', stdev:'' },
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
  sections.forEach(s=>{
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
      rmdProceedsAccount: '', // NEW
      showROI: false, roi: '', stdev: ''
    });
  } else if (sectionKey === 'delta') {
    Object.assign(base, {
      currentValue: '',
      purchaseYear: '',
      showROI: false, roi: '', stdev: '',
  showMortgage: false, loanOrigYear: '', loanTerm: '', loanRate: '', monthlyPayment: '', downPaymentPct: '',
      showRental: false, annualExpenses: '', annualIncome: '', rentGrowth: '',
      showSale: false, saleYear: '', purchasePrice: '', improvements: '', sellCost: '',
      saleProceedsAccount: '' // NEW
    });
  } else if (sectionKey === 'epsilon' || sectionKey === 'zeta') {
    Object.assign(base, {
      startYear: '', endYear: '', amount: '',
      showInflation: false, roi: ''
    });
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
      sp.textContent = 'Send to Server';
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

    const fieldPairs = [
      {roiId:'inflationRoi', sdId:'inflationSd', obj:g.inflation},
      {roiId:'liquidRoi',    sdId:'liquidSd',    obj:g.liquid},
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

  const actions = document.createElement('div'); actions.className = 'actions';
  if(!it.locked){
    const del = document.createElement('button'); del.className = 'icon-btn'; del.setAttribute('aria-label','Delete item'); del.title='Delete'; del.textContent = '✕';
    del.addEventListener('click',(e)=>{
      e.stopPropagation();
      const list = state[sectionKey].items;
      const idx = list.findIndex(x=>x.id===it.id);
      if(idx>=0){ list.splice(idx,1); render(); }
    });
    actions.appendChild(del);
  }
  card.appendChild(actions);

  const title = document.createElement('h4'); title.textContent = it.title; card.appendChild(title);

  const kv = document.createElement('div'); kv.className='kv';

  if(sectionKey==='gamma'){
    let summaryHTML = '';
    if(it.atype==='Taxable Investment'){
      const cb = it.costBasis ? `$${fmtDollars(it.costBasis)}` : '—';
      const ug = it.unrealized ? `$${fmtDollars(it.unrealized)}` : '—';
      summaryHTML += `<div><strong>Basis:</strong> ${cb}</div><div><strong>Gains:</strong> ${ug}</div>`;
    } else {
      const amt = it.amount ? `$${fmtDollars(it.amount)}` : '—';
      summaryHTML += `<div><strong>Amount:</strong> ${amt}</div>`;
      if(it.atype==='Cash'){
        const ir = it.interest ? `${it.interest}%` : '—';
        summaryHTML += `<div><strong>Interest:</strong> ${ir}</div>`;
      }
    }
    if(it.atype!=='Cash'){
      if(it.roi) summaryHTML += `<div><strong>ROI:</strong> ${it.roi}%</div>`;
      if(it.stdev) summaryHTML += `<div><strong>SD:</strong> ${it.stdev}%</div>`;
    }
    if(it.atype==='Tax Deferred' && it.rmd && it.rmdProceedsAccount){
      summaryHTML += `<div><strong>RMD→</strong> ${it.rmdProceedsAccount}</div>`;
    }
    kv.innerHTML = summaryHTML;

  } else if(sectionKey==='delta'){
    const cv = it.currentValue ? `$${fmtDollars(it.currentValue)}` : '—';
    let summaryHTML = `<div><strong>Value:</strong> ${cv}</div>`;
    if(it.purchaseYear) summaryHTML += `<div><strong>Purchased:</strong> ${it.purchaseYear}</div>`;
    if(it.roi) summaryHTML += `<div><strong>ROI:</strong> ${it.roi}%</div>`;
    if(it.showMortgage) summaryHTML += `<div><strong>Mortgage:</strong> ${it.loanOrigYear || '—'} • ${it.loanTerm? it.loanTerm+'y':'—'} • ${it.loanRate? it.loanRate+'%':'—'}</div>`;
    if(it.showRental) summaryHTML += `<div><strong>Rent:</strong> ${it.annualIncome? '$'+fmtDollars(it.annualIncome):'—'} /yr</div>`;
    if(it.showSale && it.saleYear) summaryHTML += `<div><strong>Sale:</strong> ${it.saleYear}</div>`;
    if(it.showSale && it.saleProceedsAccount) summaryHTML += `<div><strong>Proceeds:</strong> ${it.saleProceedsAccount}</div>`;
    kv.innerHTML = summaryHTML;

  } else if(sectionKey==='epsilon' || sectionKey==='zeta'){
    const amt = it.amount ? `$${fmtDollars(it.amount)}` : '—';
    const sy  = it.startYear || '—';
    const ey  = it.endYear || '—';
    let summaryHTML = `<div><strong>Years:</strong> ${sy}–${ey}</div><div><strong>Amount:</strong> ${amt}/yr</div>`;
    if(it.showInflation && it.roi) summaryHTML += `<div><strong>Inflation:</strong> ${it.roi}%</div>`;
    kv.innerHTML = summaryHTML;

  } else {
    const yr = it.year ? it.year : '—';
    const dl = it.dollars ? `$${fmtDollars(it.dollars)}` : '—';
    const pc = it.percent ? `${it.percent}%` : '—';
    kv.innerHTML = `<div><strong>Year:</strong> ${yr}</div><div><strong>Amount:</strong> ${dl}</div><div><strong>Rate:</strong> ${pc}</div>`;
  }
  card.appendChild(kv);

  const badges = document.createElement('div'); badges.className='badges';
  if(it.locked){ badges.appendChild(makeBadge('Default')); }
  if(sectionKey==='gamma'){
    if(it.atype) badges.appendChild(makeBadge(it.atype));
    if(it.amount && it.atype!=='Taxable Investment') badges.appendChild(makeBadge('Amt'));
    if((it.costBasis||it.unrealized) && it.atype==='Taxable Investment') badges.appendChild(makeBadge('Taxable'));
    if(it.interest && it.atype==='Cash') badges.appendChild(makeBadge('Int'));
    if(it.roi && it.atype!=='Cash') badges.appendChild(makeBadge('ROI'));
    if(it.atype==='Tax Deferred' && it.rmd) badges.appendChild(makeBadge('RMD'));
    if(it.atype==='Tax Deferred' && it.rmd && it.rmdProceedsAccount) badges.appendChild(makeBadge('Proceeds→Acct'));
  } else if(sectionKey==='delta'){
    if(it.currentValue) badges.appendChild(makeBadge('Value'));
    if(it.purchaseYear) badges.appendChild(makeBadge('Purchased'));
    if(it.showMortgage) badges.appendChild(makeBadge('Mortgage'));
    if(it.showRental) badges.appendChild(makeBadge('Rental'));
    if(it.showSale) badges.appendChild(makeBadge('Sale'));
    if(it.showSale && it.saleProceedsAccount) badges.appendChild(makeBadge('Proceeds→Acct'));
  } else if(sectionKey==='epsilon' || sectionKey==='zeta'){
    if(it.startYear || it.endYear) badges.appendChild(makeBadge('Range'));
    if(it.amount) badges.appendChild(makeBadge('Amt'));
    if(it.showInflation) badges.appendChild(makeBadge('Infl.'));
  }
  if(badges.childElementCount) card.appendChild(badges);

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
      input.checked = (it.atype || 'Cash') === opt;
      input.addEventListener('change', () => { if(input.checked){ it.atype = opt; render(); } });

      const label = document.createElement('label'); label.setAttribute('for', id); label.textContent = opt;
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

    if(it.atype==='Tax Deferred'){
      const r = document.createElement('div'); r.className='row';
      const sw = document.createElement('label'); sw.className='switch';
      const chk = document.createElement('input'); chk.type='checkbox'; chk.checked = !!it.rmd; chk.id = `rmd-${it.id}`;
      chk.addEventListener('change', ()=>{ it.rmd = chk.checked; render(); });
      const lb = document.createElement('label'); lb.className='label'; lb.setAttribute('for', chk.id); lb.textContent='Enable RMDs';
      sw.append(chk, lb); r.append(sw); body.append(r);

      if(it.rmd){
        // "Proceeds to account" under RMD when enabled
        const proceedsOptions = getProceedsAccountOptions();
        const withPlaceholder = [{value:'', label:'— Select account —'}, ...proceedsOptions.map(t => ({value:t, label:t}))];
        const gRmd = document.createElement('div'); gRmd.className='grid-2';
        const {field:paField} = makeSelectField('Proceeds to account', withPlaceholder, it.rmdProceedsAccount || '', (v)=>{ it.rmdProceedsAccount = v; });
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

  } else if (sectionKey === 'delta'){
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
      const {field:expF}  = makeTextField('Annual Expenses ($)', 'e.g. 6000', it.annualExpenses, (v)=>{ it.annualExpenses=v; });
      const {field:incF}  = makeTextField('Annual Rental Income ($)', 'e.g. 30000', it.annualIncome, (v)=>{ it.annualIncome=v; });
      const {field:grF}   = makeTextField('Growth Rate (%)', 'e.g. 2.5', it.rentGrowth, (v)=>{ it.rentGrowth=v; });
      g.append(expF, incF, grF); body.append(g);
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
      saleSel.dataset.defaultToken='__END_OF_PLAN__';
      g1.append(saleYearField); body.append(g1);

      const g2 = document.createElement('div'); g2.className='grid';
      const {field:ppF} = makeTextField('Purchase Price ($)', 'e.g. 500000', it.purchasePrice, (v)=>{ it.purchasePrice=v; });
      const {field:impF}= makeTextField('Improvements Value ($)', 'e.g. 75000', it.improvements, (v)=>{ it.improvements=v; });
      const {field:csF} = makeTextField('Cost of Selling ($)', 'e.g. 30000', it.sellCost, (v)=>{ it.sellCost=v; });
      g2.append(ppF, impF, csF); body.append(g2);

      // Proceeds to account (already added for Real Estate)
      const proceedsOptions = getProceedsAccountOptions();
      const withPlaceholder = [{value:'', label:'— Select account —'}, ...proceedsOptions.map(t => ({value:t, label:t}))];
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

  const finishAsClick = ()=>{
    const id = Number(draggingEl.dataset.id);
    const it = state[active].items.find(x=>x.id===id);
    if(it){ it.collapsed = false; render(); }
  };

  const onUp = ()=>{
    if(!draggingEl) return;
    if(dragStarted){
      if(placeholder) dockEl.insertBefore(draggingEl, placeholder);
      commitReorder(); cleanup(); render();
    }else{
      cleanup(); finishAsClick();
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

function buildPlanJSON(){
  const basics = state.alpha.single || {};
  const g = state.beta.single || {};

  const liquid = (state.gamma.items || []).map(a => ({
    title: a.title || null,
    type: a.atype || null,
    amount: nonEmpty(a.amount) ? toInt(a.amount) : null,
    interest_rate_pct: nonEmpty(a.interest) ? toFloat(a.interest) : null,
    cost_basis: nonEmpty(a.costBasis) ? toInt(a.costBasis) : null,
    unrealized_gains: nonEmpty(a.unrealized) ? toInt(a.unrealized) : null,
    rmd_enabled: !!a.rmd,
    rmd_proceeds_to_account: a.rmd ? (a.rmdProceedsAccount || null) : undefined, // NEW
    roi_pct: nonEmpty(a.roi) ? toFloat(a.roi) : null,
    stdev_pct: nonEmpty(a.stdev) ? toFloat(a.stdev) : null
  }));

  const realEstate = (state.delta.items || []).map(p => ({
    title: p.title || null,
    current_value: nonEmpty(p.currentValue) ? toInt(p.currentValue) : null,
    purchase_year: p.purchaseYear || null,
    roi_pct: nonEmpty(p.roi) ? toFloat(p.roi) : null,
    stdev_pct: nonEmpty(p.stdev) ? toFloat(p.stdev) : null,
    mortgage: (p.showMortgage || (p.loanOrigYear||p.loanTerm||p.loanRate||p.monthlyPayment)) ? {
      origination_year: nonEmpty(p.loanOrigYear) ? toInt(p.loanOrigYear) : null,
      term_years: nonEmpty(p.loanTerm) ? toInt(p.loanTerm) : null,
      interest_rate_pct: nonEmpty(p.loanRate) ? toFloat(p.loanRate) : null,
      monthly_payment: nonEmpty(p.monthlyPayment) ? toInt(p.monthlyPayment) : null,
      percent_down_payment: nonEmpty(p.downPaymentPct) ? toFloat(p.downPaymentPct) : null
    } : undefined,
    rental: (p.showRental || (p.annualExpenses||p.annualIncome||p.rentGrowth)) ? {
      annual_expenses: nonEmpty(p.annualExpenses) ? toInt(p.annualExpenses) : null,
      annual_income: nonEmpty(p.annualIncome) ? toInt(p.annualIncome) : null,
      growth_rate_pct: nonEmpty(p.rentGrowth) ? toFloat(p.rentGrowth) : null
    } : undefined,
    sale: (p.showSale || p.saleYear || p.purchasePrice || p.improvements || p.sellCost || p.saleProceedsAccount) ? {
      year: nonEmpty(p.saleYear) ? toInt(p.saleYear) : null,
      purchase_price: nonEmpty(p.purchasePrice) ? toInt(p.purchasePrice) : null,
      improvements_value: nonEmpty(p.improvements) ? toInt(p.improvements) : null,
      selling_cost: nonEmpty(p.sellCost) ? toInt(p.sellCost) : null,
      proceeds_to_account: p.saleProceedsAccount || null
    } : undefined
  }));

  const income = (state.epsilon.items || []).map(i => ({
    title: i.title || null,
    start_year: nonEmpty(i.startYear) ? toInt(i.startYear) : null,
    end_year: nonEmpty(i.endYear) ? toInt(i.endYear) : null,
    annual_amount: nonEmpty(i.amount) ? toInt(i.amount) : null,
    inflation_override_pct: i.showInflation && nonEmpty(i.roi) ? toFloat(i.roi) : undefined
  }));

  const expenses = (state.zeta.items || []).map(e => ({
    title: e.title || null,
    start_year: nonEmpty(e.startYear) ? toInt(e.startYear) : null,
    end_year: nonEmpty(e.endYear) ? toInt(e.endYear) : null,
    annual_amount: nonEmpty(e.amount) ? toInt(e.amount) : null,
    inflation_override_pct: e.showInflation && nonEmpty(e.roi) ? toFloat(e.roi) : undefined
  }));

  const payload = {
    basics: {
      age: nonEmpty(basics.age) ? toInt(basics.age) : null,
      retirement_age: nonEmpty(basics.retire) ? toInt(basics.retire) : null,
      life_expectancy: nonEmpty(basics.life) ? toInt(basics.life) : null,
      state_of_residence: basics.stateCode || null,
      heirs_target_amount: nonEmpty(basics.heirsTarget) ?
        toInt(basics.heirsTarget) : null
    },
    growth_rates: {
      inflation: {
        roi_pct: nonEmpty(g?.inflation?.roi) ? toFloat(g.inflation.roi) : null,
        stdev_pct: nonEmpty(g?.inflation?.stdev) ? toFloat(g.inflation.stdev) : null
      },
      liquid_investments: {
        roi_pct: nonEmpty(g?.liquid?.roi) ? toFloat(g.liquid.roi) : null,
        stdev_pct: nonEmpty(g?.liquid?.stdev) ? toFloat(g.liquid.stdev) : null
      },
      real_estate_investments: {
        roi_pct: nonEmpty(g?.realEstate?.roi) ? toFloat(g.realEstate.roi) : null,
        stdev_pct: nonEmpty(g?.realEstate?.stdev) ? toFloat(g.realEstate.stdev) : null
      }
    },
    liquid_assets: liquid,
    real_estate: realEstate,
    income,
    expenses
  };

  return prune(payload);
}

/* JSON preview toggle */
previewBtn.addEventListener('click', ()=>{
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
  const data = buildPlanJSON();
  try{
    const res = await fetch('/api/plan', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(data)
    });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    showToast('Submitted successfully.', true);
  }catch(err){
    showToast('Submit failed: ' + (err?.message || 'Unknown error'), false);
  }
});
document.getElementById('submitBtnDup')?.addEventListener('click', () => submitBtn.click());

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

function openModal(){ modalBackdrop.classList.add('show'); modal.classList.add('show'); }
function closeModal(){ modalBackdrop.classList.remove('show'); modal.classList.remove('show'); }

modalBackdrop.addEventListener('click', closeModal);
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
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
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
    p.textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras dictum, arcu ut pretium imperdiet, risus nisl vulputate enim, vitae ullamcorper massa nisl id dui.';
    modalBody.appendChild(p);
    modalBody.appendChild(makeRoiSdFields(applyTo.roi, applyTo.stdev));
  }
  else if(topic === 'liquid'){
    title = 'Liquid Investments • Help me choose';
    applyTo = growth.liquid;

    // Portfolio selector
    const fP = document.createElement('div'); fP.className='field';
    const lP = document.createElement('label'); lP.className='label'; lP.textContent='Portfolio';
    const sP = document.createElement('select'); sP.id='modalPortfolio';
    ['S&P 500','Dow Jones','Three Fund'].forEach(v=>{
      const o=document.createElement('option'); o.value=v; o.textContent=v; sP.appendChild(o);
    });
    fP.append(lP, sP);

    // History selector
    const fH = document.createElement('div'); fH.className='field';
    const lH = document.createElement('label'); lH.className='label'; lH.textContent='Historical Time Period';
    const sH = document.createElement('select'); sH.id='modalPeriod';
    ['1987-2023','2000-2023'].forEach(v=>{
      const o=document.createElement('option'); o.value=v; o.textContent=v; sH.appendChild(o);
    });
    fH.append(lH, sH);

    const selWrap = document.createElement('div'); selWrap.className='grid-2';
    selWrap.append(fP, fH);
    modalBody.appendChild(selWrap);

    const roiSdWrap = makeRoiSdFields(applyTo.roi, applyTo.stdev);
    modalBody.appendChild(roiSdWrap);

    const randomize = ()=>{
      // simple randoms (plausible-ish)
      const roiEl = document.getElementById('modalRoi');
      const sdEl  = document.getElementById('modalSd');
      const roi = randomInRange(4, 12, 0.1);
      const sd  = randomInRange(8, 25, 0.1);
      roiEl.dataset.raw = String(roi); roiEl.value = `${roi}%`;
      sdEl.dataset.raw  = String(sd);  sdEl.value  = `${sd}%`;
    };
    sP.addEventListener('change', randomize);
    sH.addEventListener('change', randomize);
  }
  else if(topic === 'real_estate'){
    title = 'Real Estate Investments • Help me choose';
    applyTo = growth.realEstate;

    const fS = document.createElement('div'); fS.className='field';
    const lS = document.createElement('label'); lS.className='label'; lS.textContent='State';
    const sS = document.createElement('select'); sS.id='modalState';
    US_STATES.forEach(st => {
      const o=document.createElement('option'); o.value=st; o.textContent=st; sS.appendChild(o);
    });
    fS.append(lS, sS);
    modalBody.appendChild(fS);

    const roiSdWrap = makeRoiSdFields(applyTo.roi, applyTo.stdev);
    modalBody.appendChild(roiSdWrap);

    const randomizeRE = ()=>{
      const roiEl = document.getElementById('modalRoi');
      const sdEl  = document.getElementById('modalSd');
      const roi = randomInRange(2, 9, 0.1);
      const sd  = randomInRange(3, 15, 0.1);
      roiEl.dataset.raw = String(roi); roiEl.value = `${roi}%`;
      sdEl.dataset.raw  = String(sd);  sdEl.value  = `${sd}%`;
    };
    sS.addEventListener('change', randomizeRE);
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
      if(roiEl){ roiEl.dataset.raw = applyTo.roi || ''; roiEl.value = applyTo.roi ? `${applyTo.roi}%` : ''; }
      if(sdEl){  sdEl.dataset.raw  = applyTo.stdev || ''; sdEl.value  = applyTo.stdev ? `${applyTo.stdev}%` : ''; }
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





/* ===== Floating Year Picker Enhancer (ro18) ===== */
(function(){
  const TOKENS = {
    RETIREMENT_YEAR: '__RETIREMENT__',
    ALREADY_OWNED: '__ALREADY_OWNED__',
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
    return null;
  }
  function defaultTokenFor(labelText){
    const t = (labelText||'').toLowerCase();
    if (t.includes('already') || t.includes('owned')) return TOKENS.ALREADY_OWNED;
    if(t.includes('start') || t.includes('purchase')) return TOKENS.RETIREMENT_YEAR;
    if(t.includes('end') || t.includes('sale')) return TOKENS.END_OF_PLAN;
    return TOKENS.END_OF_PLAN;
  }
  function rebuildSelect(select, labelText, forceDefault){
    const model = computeModel();
    const prev = forceDefault ? '' : (select.value || select.dataset.prev || '');
    const defTok = select.dataset.defaultToken || defaultTokenFor(labelText);
    const start = model.now;
    const end = model.endOfPlan;
    // Build options
    const opts = [];
    if (select.dataset.isPurchaseYearSelect === '1') {
      opts.push({value:TOKENS.ALREADY_OWNED, label:labelForToken(TOKENS.ALREADY_OWNED)});
    }
    else {
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
      if(!(t.includes('start year')||t.includes('end year')||t.includes('purchase year')||t.includes('sale year'))) return;
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
})();