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


function _getValueByPath(obj, path) {
  if (obj == null || typeof path !== 'string') return undefined;
  path = path.trim();
  if (!path) return obj;

  // tokens: plain segments or [digits]
  const re = /[^.[\]]+|\[(\d+)\]/g;
  const tokens = [];
  let m;
  while ((m = re.exec(path))) {
    tokens.push(m[1] !== undefined ? Number(m[1]) : m[0]);
  }

  let cur = obj;
  for (key of tokens) {
    let arrayItemId = (typeof key === 'number') ? key : null;
    if (arrayItemId !== null) {
        //find by id in array
        let i = 0;
        while (cur[i].id !== arrayItemId) {
            i++;
        }
        cur = cur[i];
    }
    else {
        cur = cur[key];
    }    
  }
  return cur;
}


function createWhatIfPanel() {
    let w = document.getElementById('whatIfPanel');
    if (w) return w;
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
                <div class="ro-vary-row"><label for="whatIfFrom"><strong>Vary From:</strong></label>
                    <input id="whatIfFrom" name="whatIfFrom" class="input" inputmode="decimal" type="text"/>
                </div>
                <div class="ro-vary-row"><label for="whatIfTo"><strong>Vary To:</strong></label>
                    <input id="whatIfTo" name="whatIfTo" class="input" inputmode="decimal" type="text" />
                </div>
            </div>
            
            <div style="margin-top:1rem;">
                <button id="whatIfSubmitBtn" class="btn ok">Calculate What-Ifs</button>
            </div>

            <div id="whatIfResults" style="margin-top:2rem;">
                <!-- results go here -->
            </div>

        </section>
    `;
    main.appendChild(w);
    return w;
}


/* ===== What-If Panel ===== */
function ensureWhatIfPanel(){
    let w = createWhatIfPanel();
    const secSel = w.querySelector('#whatIfSection');
    const varSel = w.querySelector('#whatIfVariable');
    // --- What-If dynamic fields: Current Value + Vary From/To formatting ---
    const currentSpan = w.querySelector('#whatIfCurrentValue');
    const fromInput = w.querySelector('#whatIfFrom');
    const toInput = w.querySelector('#whatIfTo');

    // Populate section selector
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

    //section selector change
    secSel.addEventListener('change', ()=>{
        // reset dependent selects/fields
        currentSpan.textContent = '—';
        fromInput.value = '';
        toInput.value = '';

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
                itemId = Number(parts[1]); //index in items array
            }
        }    

        varSel.innerHTML = '<option value="">— Select —</option>';
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
        });
    });

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
            //fromInput.placeholder = '$0';
            //toInput.placeholder = '$0';
            fromInput.oninput = (e)=>{ e.target.value = util.formatCurrencyVal(e.target.value); };
            toInput.oninput   = (e)=>{ e.target.value = util.formatCurrencyVal(e.target.value); };
        }else if(type==='percent'){
            //fromInput.placeholder = '0%';
            //toInput.placeholder = '0%';
            const strip = (s)=> String(s ?? '').toString().replace(/[$,%\s,]/g,'');
            const normalize = (val)=>{
            const isNeg = /^-/.test(val);
            let v = strip(val).replace(/[^0-9.]/g,'');
            const parts = v.split('.');
            let kept = parts.shift() || '';
            if(parts.length){ kept += '.' + parts.join('').replace(/\./g,''); }
            if(isNeg && kept && kept!=='0') kept = '-' + kept;
                return kept;
            };
            const onFocus = (e)=>{ e.target.value = strip(e.target.value); };
            const onInput = (e)=>{ e.target.value = normalize(e.target.value); };
            const onBlur  = (e)=>{ e.target.value = util.formatPercentageVal(e.target.value, "blur", true); };

            fromInput.onfocus = onFocus;
            toInput.onfocus   = onFocus;
            fromInput.oninput = onInput;
            toInput.oninput   = onInput;
            fromInput.onblur  = onBlur;
            toInput.onblur    = onBlur;
        }else{
            //fromInput.placeholder = '0';
            //toInput.placeholder = '0';
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

    varSel.addEventListener('change', updateCurrent);

    function checkForErrorInWhatIfInputs(){
        const secSel = w.querySelector('#whatIfSection');
        const varSel = w.querySelector('#whatIfVariable');
        const fromInput = w.querySelector('#whatIfFrom');
        const toInput = w.querySelector('#whatIfTo');
        const errors = [];
        if(!secSel.value) errors.push('Please select a Section.');
        if(!varSel.value) errors.push('Please select a Variable.');
        const fromRaw = (fromInput.value || '').toString().trim();
        const toRaw   = (toInput.value   || '').toString().trim();
        if(!fromRaw) errors.push('Please enter a "Vary From" value.');
        if(!toRaw)   errors.push('Please enter a "Vary To" value.');
        const type = varSel.options[varSel.selectedIndex]?.dataset?.type || 'number';
        let fromVal, toVal;
        if(type==='currency'){
            fromVal = parseFloat((fromRaw || '').toString().replace(/[$,%\s,]/g,''));
            toVal   = parseFloat((toRaw   || '').toString().replace(/[$,%\s,]/g,''));
        }else if(type==='percent'){
            fromVal = parseFloat((fromRaw || '').toString().replace(/[$,%\s,]/g,''));
            toVal   = parseFloat((toRaw   || '').toString().replace(/[$,%\s,]/g,''));
        }else{
            fromVal = parseFloat((fromRaw || '').toString());
            toVal   = parseFloat((toRaw   || '').toString());
        }
        if(!Number.isFinite(fromVal)) errors.push('"Vary From" is not a valid number.');
        if(!Number.isFinite(toVal))   errors.push('"Vary To" is not a valid number.');
        if(Number.isFinite(fromVal) && Number.isFinite(toVal) && toVal < fromVal){
        errors.push('"Vary To" must be greater than or equal to "Vary From".');
        }
        return errors;
    }

    function findIdPrefixFromTitle(title, submittal) {
        if (!submittal) return null;
        if (!title) return null;
        // Define all relevant list paths and their inner arrays
        const paths = [
            submittal.savingsAccountList?.savingsAccounts,
            submittal.savingsAccountList?.taxableInvestmentAccounts,
            submittal.propertyList?.properties,
            submittal.propertyList?.rentalProperties,
            submittal.incomeAccountList?.incomeAccounts,
            submittal.expenseAccountList?.expenseAccounts
        ];
        // Loop through each list
        for (const list of paths) {
            if (Array.isArray(list)) {
            for (const item of list) {
                if (item.name === title) {
                    return item.idPrefix || null;
                }
            }
            }
        }
        // Nothing found
        return null;
    }

    function getFromToValue(inputId){
        const inputEl = w.querySelector(inputId);
        const inputRaw = (inputEl.value || '').toString().trim();
        const varSel = w.querySelector('#whatIfVariable');
        const type = varSel.options[varSel.selectedIndex]?.dataset?.type || 'number';
        let inputVal;
        if(type==='currency'){
            inputVal = parseFloat((inputRaw || '').toString().replace(/[$,%\s,]/g,''));
        }else if(type==='percent'){
            inputVal = parseFloat((inputRaw || '').toString().replace(/[$,%\s,]/g,''));
        }else{
            inputVal = parseFloat((inputRaw || '').toString());
        }
        return inputVal;
    }

    function prepareWhatIfConfig(){
        const submittal = buildPlanJSON();
        submittal.mode = 'whatif';
        submittal.whatif = {};
        submittal.whatif.dim1 = {};
        const dim1 = submittal.whatif.dim1;
        const secSel = w.querySelector('#whatIfSection');
        const varSel = w.querySelector('#whatIfVariable');
        if (secSel.value === 'alpha') {
            dim1.selector1 = 'basics';
            dim1.selector1Text = 'Basics';
            const fieldName = varSel.value.split('.')[2];
            switch (fieldName) {
                case 'retire':
                    dim1.selector2 = 'calendar.retireAge';   
                    dim1.selector2Text = 'Retirement Age';
                    break;
                case 'life':
                    dim1.selector2 = 'calendar.deathAge';   
                    dim1.selector2Text = 'Life Expectancy';
                    break;
                case 'spouseLife':
                    dim1.selector2 = 'calendar.deathAgeSpouse';   
                    dim1.selector2Text = 'Spouse Life Expectancy';
                    break;
                //TODO
                // case 'state':
                //    dim1.selector2 = 'state';   
                //    dim1.selector2Text = 'State of Residence';
                //    break;
                case 'heirsTarget':
                    dim1.selector2 = 'definitionOfSuccess';   
                    dim1.selector2Text = 'Heirs Target Amount';
                    break;
                //default:
                //    dim1.selector2 = fieldName;
                //    dim1.selector2Text = fieldName;
            }
            dim1.type = 'ageinput';
        }
        else if (secSel.value === 'beta') {
            dim1.selector1 = 'growthRates';
            dim1.selector1Text = 'Growth Rates';
            const fieldName = varSel.value;
            switch (fieldName) {
                case 'beta.single.inflation.roi':
                    dim1.selector2 = 'growthRates.inflationGainRate.average';   
                    dim1.selector2Text = 'Inflation Rate';
                    break;
                case 'beta.single.inflation.stdev':
                    dim1.selector2 = 'growthRates.inflationGainRate.standardDeviation';   
                    dim1.selector2Text = 'Inflation Standard Deviation';
                    break;
                case 'beta.single.liquid.usStocks.roi':
                    dim1.selector2 = 'growthRates.usStocksGainRate.average';   
                    dim1.selector2Text = 'US Stocks Return';
                    break;  
                case 'beta.single.liquid.usStocks.stdev':
                    dim1.selector2 = 'growthRates.usStocksGainRate.standardDeviation';   
                    dim1.selector2Text = 'US Stocks Standard Deviation';
                    break;
                case 'beta.single.liquid.usBonds.roi':
                    dim1.selector2 = 'growthRates.usBondsGainRate.average';   
                    dim1.selector2Text = 'US Bonds Return';
                    break;
                case 'beta.single.liquid.usBonds.stdev':
                    dim1.selector2 = 'growthRates.usBondsGainRate.standardDeviation';   
                    dim1.selector2Text = 'US Bonds Standard Deviation';
                    break;
                case 'beta.single.liquid.internationalStocks.roi':
                    dim1.selector2 = 'growthRates.internationalStocksGainRate.average';   
                    dim1.selector2Text = 'International Stocks Return';
                    break;
                case 'beta.single.liquid.internationalStocks.stdev':
                    dim1.selector2 = 'growthRates.internationalStocksGainRate.standardDeviation';   
                    dim1.selector2Text = 'International Stocks Standard Deviation';
                    break;
                case 'beta.single.realEstate.roi':
                    dim1.selector2 = 'growthRates.defaultREGainRate.average';   
                    dim1.selector2Text = 'Real Estate Return';
                    break;
                case 'beta.single.realEstate.stdev':
                    dim1.selector2 = 'growthRates.defaultREGainRate.standardDeviation';   
                    dim1.selector2Text = 'Real Estate Standard Deviation';
                    break;
                //default:
                //    dim1.selector2 = fieldName;
                //    dim1.selector2Text = fieldName;
            }
            dim1.type = 'percentageinput';
        }
        else if (secSel.value.includes('::')) {//multi
            const textContent = secSel.options[secSel.selectedIndex].textContent;
            const match = textContent.match(/^[^-]*-\s*(.*)$/);
            const accountTitle = match ? match[1] : "";
            const idPrefix = findIdPrefixFromTitle(accountTitle, submittal);
            dim1.selector1 = idPrefix;
            dim1.selector1Text = accountTitle || idPrefix;

            const sKey = varSel.value.split('.')[0];
            const itemId = Number(varSel.value.match(/\[(\d+)\]/)?.[1] || '0');
            const fieldName = varSel.value.split('.')[2];
            if (fieldName === 'amount') {
                dim1.selector2 = 'startingValue';
                dim1.selector2Text = 'Amount';
            }
            else {
                //TODO: other mappings
                dim1.selector2 = fieldName;
                dim1.selector2Text = fieldName;
            }
        }

        const opt = varSel.options[varSel.selectedIndex];
        const type = opt.dataset.type || 'number';
        if (type === 'currency') {
            dim1.type = 'currencyinput';
        }
        else if (type === 'percent') {
            dim1.type = 'percentageinput';
        }
        else {
            dim1.type = 'ageinput'; //yearinput should also work the same
        }
        //TODO
        dim1.vary = {};
        dim1.vary.from = getFromToValue('#whatIfFrom');
        dim1.vary.to = getFromToValue('#whatIfTo');
        return submittal;
    }

    // Hook up What-If button to send data to server
    eid("whatIfSubmitBtn").addEventListener('click', async (e)=>{
        e.preventDefault();
        const errors = checkForErrorInWhatIfInputs();
        if(errors.length){
            alert('Please correct the following:\n\n' + errors.join('\n'));
            return;
        }

        // All good, prepare what-if config
        const submittal = prepareWhatIfConfig();

        //submit to server
        showProcessingModal();
        const body = btoa(JSON.stringify(submittal))
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
        showWhatIfResults(respData.result); //TODO
    });

    
    function showWhatIfResults(data){
        try{
            // Find or create the results container
            let container = document.querySelector('#whatIfResults');
            if(!container){
                // If the target div doesn't exist, create it at the end of body for safety
                container = document.createElement('div');
                container.id = 'whatIfResults';
                document.body.appendChild(container);
            }
            // Extract headers
            const dim1 = data?.resultMatrixHeaders?.dim1 ?? 'Dimension 1';
            const dim2 = data?.resultMatrixHeaders?.dim2 ?? 'Result';
            // Build rows from resultMatrix
            const rows = Array.isArray(data?.resultMatrix) ? data.resultMatrix : [];
            // Create table
            const table = document.createElement('table');
            table.setAttribute('role','table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            // Header
            const thead = document.createElement('thead');
            const htr = document.createElement('tr');
            const th1 = document.createElement('th');
            const th2 = document.createElement('th');
            th1.innerHTML = data.submittal.whatif.dim1.selector1Text + "<br>" + data.submittal.whatif.dim1.selector2Text; 
            //th1.textContent = dim1;
            th2.textContent = dim2;
            [th1, th2].forEach(th=>{
                th.style.textAlign = 'left';
                th.style.borderBottom = '1px solid var(--border, #ccc)';
                th.style.padding = '8px 10px';
            });
            htr.appendChild(th1);
            htr.appendChild(th2);
            thead.appendChild(htr);
            table.appendChild(thead);
            // Body
            const tbody = document.createElement('tbody');
            rows.forEach(row=>{
                // row can be an array of cells; we care about the first item per instructions
                const cell = Array.isArray(row) ? row[0] : row;
                if(!cell) return;
                const tr = document.createElement('tr');
                const td1 = document.createElement('td');
                const td2 = document.createElement('td');
                const label = (cell.rowLabel ?? '').toString();
                // Format runResult as percentage if it's a finite number between 0 and 1
                let val = cell.runResult;
                let display;
                if (typeof val === 'number' && isFinite(val)) {
                    if (val <= 1 && val >= 0) {
                        display = (val*100).toFixed(1) + '%';
                    } else {
                        display = val.toString();
                    }
                } else {
                    display = '';
                }

                let varyValue = label;
                const type = data.submittal.whatif.dim1.type;
                switch (type) {
                    case "currencyinput": 
                        varyValue = util.formatCurrencyVal(varyValue);
                        break;
                    case "percentageinput":
                        varyValue = util.formatPercentageVal(varyValue);
                        break;
                    case "ageinput":
                        let field = data.submittal.whatif.dim1.selector2
                        if (field == 'calendar.retireAge') {
                            //convert year to age
                            let birthYear = data.submittal.calendar.birthYear;
                            varyValue = Number(varyValue) - Number(birthYear);
                        }
                        varyValue = util.formatAgeVal(varyValue);
                        break;
                    case "yearinput":
                        varyValue = util.formatYearVal(varyValue);
                        break;
                }

                td1.textContent = varyValue;
                td2.textContent = display;
                [td1, td2].forEach(td=>{
                    td.style.padding = '8px 10px';
                    td.style.borderBottom = '1px solid rgba(0,0,0,0.06)';
                });
                tr.appendChild(td1);
                tr.appendChild(td2);
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            // Inject into container
            container.innerHTML = '';
            container.appendChild(table);
        } catch (e){
            console.error('Failed to render What-If results:', e);
        }
    }

    return w;
}
