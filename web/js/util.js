
//make this one global so there is less typing required
function eid(id) {
  return document.getElementById(id);
}  

function evalue(id) {
  return eid(id).value;
}

//make this one global so there is less typing required
function getNumber (element) {
  const regex = /[$,%]/g;
  const text = element.value;
  const result = text.replace(regex, '');
  return Number(result);
}


if (typeof(util) === "undefined") {
  util = {

    isES6Supported : function () {
      "use strict";

      if (typeof Symbol == "undefined") return false;
      try {
          eval("class Foo {}");
          eval("var bar = (x) => x+1");
      } catch (e) { return false; }

      return true;
    },

    //https://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
    executeFunctionByName : function (functionName, context /*, args */) {
        var args = Array.prototype.slice.call(arguments, 2);
        var namespaces = functionName.split(".");
        var func = namespaces.pop();
        for(var i = 0; i < namespaces.length; i++) {
          context = context[namespaces[i]];
        }
        return context[func].apply(context, args);
    },


    formatCurrencyVal: function (input_val) {
      if (typeof input_val === 'number') {
        input_val = "" + (Math.round(input_val * 100) / 100).toFixed(2);
      }
      else if (!isNaN(parseFloat(input_val))) {
        f = parseFloat(input_val);
        input_val = "" + f.toFixed(0);
      }
 
      // appends $ to value, validates decimal side
      // and puts cursor back in right position.
      // don't validate empty input
      if (input_val === "") { return ""; }
        
      // check for decimal
      if (input_val.indexOf(".") >= 0) {
    
        // get position of first decimal
        // this prevents multiple decimals from
        // being entered
        var decimal_pos = input_val.indexOf(".");
    
        // split number by decimal point
        var left_side = input_val.substring(0, decimal_pos);
        var right_side = input_val.substring(decimal_pos);
    
        // add commas to left side of number
        left_side = util.formatNumber(left_side, true);
    
        // validate right side
        right_side = util.formatNumber(right_side, false);
        
        // On blur make sure 2 numbers after decimal
        if (blur === "blur") {
          right_side += "00";
        }
        
        // Limit decimal to only 2 digits
        right_side = right_side.substring(0, 2);
    
        // join number by .
        input_val = "$" + left_side + "." + right_side;
    
      } else {
        // no decimal entered
        // add commas to number
        // remove all non-digits
        input_val = util.formatNumber(input_val, true);
        input_val = "$" + input_val;
        
        // final formatting
        // if (blur === "blur") {
        //   input_val += ".00";
        // }
      }
      return input_val;
    },

    formatCurrencyEl: function(input, blur) {
      const val = input.value;
      if (isNaN(parseFloat(val.replace(/[$,.]/g, '')))) {
        return;
      }
      var original_len = val.length;
      var caret_pos = input.selectionStart;

      const input_val = input.value;
      const formatted = util.formatCurrencyVal(input_val);
      input.value = formatted;
      // put caret back in the right position
      var updated_len = val.length;
      caret_pos = updated_len - original_len + caret_pos;
      //input.setSelectionRange(caret_pos, caret_pos);
    },

    formatAgeVal: function (input_val) {
      return parseFloat(input_val).toFixed(0);
    },

    formatYearVal: function (input_val) {
      return parseFloat(input_val).toFixed(0);
    },

    formatPercentageVal: function (input_val, blur, allowNegative) {
      if (typeof input_val === 'number') {
        input_val = "" + input_val.toFixed(2);
      }
      else if (!isNaN(parseFloat(input_val))) {
        var f = parseFloat(input_val);
        input_val = "" + f.toFixed(2);
      }

      if (input_val === "") { return ""; }

      // Handle negative numbers only if allowNegative is true
      var isNegative = false;
      if (allowNegative && input_val[0] === '-') {
        isNegative = true;
        input_val = input_val.substring(1);
      }

      // check for decimal
      if (input_val.indexOf(".") >= 0) {

        var decimal_pos = input_val.indexOf(".");
        var left_side = input_val.substring(0, decimal_pos);
        var right_side = input_val.substring(decimal_pos);

        // add commas to left side of number
        left_side = util.formatNumber(left_side, true);

        // validate right side
        right_side = util.formatNumber(right_side, false);

        // On blur make sure 2 numbers after decimal
        if (blur === "blur") {
          right_side += "00";
        }

        // Limit decimal to only 2 digits
        right_side = right_side.substring(0, 2);

        // join number by .
        input_val = left_side + "." + right_side + "%";

      } else {
        input_val = util.formatNumber(input_val, true) + "%";
      }

      if (isNegative) {
        input_val = "-" + input_val;
      }
      return input_val;
    },

   formatPercentageEl: function(input, blur, allowNegative) {
      const val = input.value;
      // original_len and caret_pos are left as is from your code
      var original_len = input.length;
      var caret_pos = input.selectionStart;

      // Pass allowNegative along to formatPercentageVal
      const formatted = util.formatPercentageVal(val, blur, allowNegative);
      input.value = formatted;

      var updated_len = val.length;
      caret_pos = updated_len - original_len + caret_pos;
      //input.setSelectionRange(caret_pos, caret_pos);
    },


    formatNumber: function (n, addCommas) {
      if (addCommas) {
        // format number 1000000 to 1,234,567
        return n.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
      else {
        return n.replace(/\D/g, "");
      }
    },

    //credit to chatGpt
    pairwiseAdd: function (array1, array2, array3 = [], array4 = []) {
      const length = Math.min(
          array1.length,
          array2.length,
          array3.length || Infinity,
          array4.length || Infinity
      );
      return Array.from({ length }, (_, i) => 
          array1[i] + array2[i] + (array3[i] || 0) + (array4[i] || 0)
      );
    },

    pairwisePercentage: function (array1, array2) {
      const length = Math.min(array1.length, array2.length);
      return Array.from({ length }, (_, i) => 
          array2[i] !== 0 ? Math.round((array1[i] / array2[i]) * 100 * 100 ) / 10000 : null
      );
    },

    randomGaussian: function () {
      let u = 0, v = 0;
      while (u === 0) u = Math.random(); // Convert [0,1) to (0,1)
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    },

    getRandomRate: function (average, standardDeviation) {
      return util.randomGaussian() * (standardDeviation / 100) + (average / 100);
    },

    arrayAverage: function(numbers) {
      return numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
    }

  }
}


// === Theme Init (First Pass) =========================================
(function setupTheme(){try{
  const root = document.documentElement;
  const stored = localStorage.getItem("theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = stored || (prefersDark ? "dark" : "light");
  root.setAttribute("data-theme", initial);
  window.setTheme = (next)=>{
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    document.dispatchEvent(new CustomEvent("themechange", { detail: { theme: next }}));
  };
}catch(e){ console.warn("Theme setup failed", e); }})();


// === In-page iOS-style Theme Switch wiring ===
(function initThemeToggleSwitch(){
  function sync(){
    const btn = document.getElementById("themeToggleSwitch");
    if(!btn) return;
    const theme = document.documentElement.getAttribute("data-theme") || "dark";
    const isLight = (theme === "light");
    btn.setAttribute("aria-checked", String(isLight));
    const label = btn.querySelector(".label");
    if(label) label.textContent = isLight ? "Light" : "Dark";
  }
  function onClick(e){
    const btn = document.getElementById("themeToggleSwitch");
    if(!btn) return;
    if (btn.contains(e.target)) {
      const theme = document.documentElement.getAttribute("data-theme") || "dark";
      setTheme(theme === "light" ? "dark" : "light");
    }
  }
  document.addEventListener("click", onClick);
  document.addEventListener("themechange", sync);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sync);
  } else { sync(); }
})();
