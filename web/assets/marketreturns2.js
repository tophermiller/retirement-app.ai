if (typeof(marketreturns2) === "undefined") {
    marketreturns2 = {
	
		/*
			usstocks
			source: 
			Primary source fetched at runtime:
 			Aswath Damodaran's "Stocks, Bonds, Bills & Inflation" dataset
			(https://www.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xls).
			We extract the S&P 500 total return (including dividends) by calendar year.
		*/
		usstocks : {
		  1928: 0.438112,
		  1929: -0.082979,
		  1930: -0.251236,
		  1931: -0.438375,
		  1932: -0.086424,
		  1933: 0.499822,
		  1934: -0.011886,
		  1935: 0.467404,
		  1936: 0.319434,
		  1937: -0.353367,
		  1938: 0.292827,
		  1939: -0.010976,
		  1940: -0.106729,
		  1941: -0.127715,
		  1942: 0.191738,
		  1943: 0.250613,
		  1944: 0.190307,
		  1945: 0.358211,
		  1946: -0.084291,
		  1947: 0.052,
		  1948: 0.057046,
		  1949: 0.183032,
		  1950: 0.308055,
		  1951: 0.236785,
		  1952: 0.18151,
		  1953: -0.012082,
		  1954: 0.525633,
		  1955: 0.325973,
		  1956: 0.074395,
		  1957: -0.104574,
		  1958: 0.4372,
		  1959: 0.120565,
		  1960: 0.003365,
		  1961: 0.266377,
		  1962: -0.088115,
		  1963: 0.226119,
		  1964: 0.164155,
		  1965: 0.123992,
		  1966: -0.09971,
		  1967: 0.23803,
		  1968: 0.108149,
		  1969: -0.082414,
		  1970: 0.035611,
		  1971: 0.142212,
		  1972: 0.187554,
		  1973: -0.14308,
		  1974: -0.259018,
		  1975: 0.369951,
		  1976: 0.23831,
		  1977: -0.069797,
		  1978: 0.065093,
		  1979: 0.185195,
		  1980: 0.317352,
		  1981: -0.047024,
		  1982: 0.204191,
		  1983: 0.223372,
		  1984: 0.061461,
		  1985: 0.312351,
		  1986: 0.184946,
		  1987: 0.058127,
		  1988: 0.165372,
		  1989: 0.314752,
		  1990: -0.030645,
		  1991: 0.302348,
		  1992: 0.074937,
		  1993: 0.099671,
		  1994: 0.013259,
		  1995: 0.371952,
		  1996: 0.22681,
		  1997: 0.331037,
		  1998: 0.28338,
		  1999: 0.208854,
		  2000: -0.090318,
		  2001: -0.118498,
		  2002: -0.21966,
		  2003: 0.283558,
		  2004: 0.107428,
		  2005: 0.048345,
		  2006: 0.156126,
		  2007: 0.054847,
		  2008: -0.365523,
		  2009: 0.259352,
		  2010: 0.148211,
		  2011: 0.020984,
		  2012: 0.158906,
		  2013: 0.321451,
		  2014: 0.135244,
		  2015: 0.013789,
		  2016: 0.117731,
		  2017: 0.216055,
		  2018: -0.042269,
		  2019: 0.312117,
		  2020: 0.180232,
		  2021: 0.284689,
		  2022: -0.180375,
		  2023: 0.260607,
		  2024: 0.248786
		},
		
		/*
			usbonds
			source: AGG from 1976 onwards, US Treasury for earlier years, compilation courtesy of ChatGPT
		*/		
		usbonds : {
		  1928: 0.008355,
		  1929: 0.042038,
		  1930: 0.045409,
		  1931: -0.025589,
		  1932: 0.087903,
		  1933: 0.018553,
		  1934: 0.079634,
		  1935: 0.04472,
		  1936: 0.050179,
		  1937: 0.013791,
		  1938: 0.042132,
		  1939: 0.044123,
		  1940: 0.054025,
		  1941: -0.020222,
		  1942: 0.022949,
		  1943: 0.0249,
		  1944: 0.025776,
		  1945: 0.038044,
		  1946: 0.031284,
		  1947: 0.009197,
		  1948: 0.01951,
		  1949: 0.046635,
		  1950: 0.004296,
		  1951: -0.002953,
		  1952: 0.02268,
		  1953: 0.041438,
		  1954: 0.032898,
		  1955: -0.013364,
		  1956: -0.022558,
		  1957: 0.06797,
		  1958: -0.02099,
		  1959: -0.026466,
		  1960: 0.116395,
		  1961: 0.020609,
		  1962: 0.056935,
		  1963: 0.016842,
		  1964: 0.037281,
		  1965: 0.007189,
		  1966: 0.029079,
		  1967: -0.015806,
		  1968: 0.032746,
		  1969: -0.05014,
		  1970: 0.167547,
		  1971: 0.097869,
		  1972: 0.028184,
		  1973: 0.036587,
		  1974: 0.019886,
		  1975: 0.036053,
		  1976: 0.156,
		  1977: 0.03,
		  1978: 0.014,
		  1979: 0.019,
		  1980: 0.027,
		  1981: 0.062,
		  1982: 0.326,
		  1983: 0.084,
		  1984: 0.151,
		  1985: 0.221,
		  1986: 0.153,
		  1987: 0.027,
		  1988: 0.079,
		  1989: 0.145,
		  1990: 0.089,
		  1991: 0.16,
		  1992: 0.074,
		  1993: 0.098,
		  1994: -0.029,
		  1995: 0.185,
		  1996: 0.036,
		  1997: 0.097,
		  1998: 0.087,
		  1999: -0.008,
		  2000: 0.116,
		  2001: 0.084,
		  2002: 0.103,
		  2003: 0.041,
		  2004: 0.043,
		  2005: 0.024,
		  2006: 0.043,
		  2007: 0.07,
		  2008: 0.052,
		  2009: 0.059,
		  2010: 0.065,
		  2011: 0.078,
		  2012: 0.042,
		  2013: -0.02,
		  2014: 0.06,
		  2015: 0.005,
		  2016: 0.026,
		  2017: 0.035,
		  2018: 0.0,
		  2019: 0.087,
		  2020: 0.075,
		  2021: -0.015,
		  2022: -0.13,
		  2023: 0.055,
		  2024: 0.017		
		},
		
		/*
			international
			source: https://www.macrohistory.net/database/
			Returns per year per country, then weighted by GDP (GDP per capital * population)
		*/
		
		international : {
			1928: 0.206562707473903,
			1929: -0.108077314082287,
			1930: -0.179961479238485,
			1931: -0.221394093256407,
			1932: 0.135186944441807,
			1933: 0.186833267828106,
			1934: 0.0878577860289433,
			1935: 0.141796629371446,
			1936: 0.224463098847822,
			1937: 0.0261166306103141,
			1938: -0.021584887583915,
			1939: 0.0941901789928112,
			1940: 0.233798745749039,
			1941: 0.160062565199123,
			1942: 0.206595443916624,
			1943: 0.133923813272639,
			1944: 0.14434688248815,
			1945: -0.0276469668196052,
			1946: 0.266897145543154,
			1947: -0.0217578218065523,
			1948: -0.0540620484633097,
			1949: 0.270225780271021,
			1950: 0.0226728736160009,
			1951: 0.346805903283424,
			1952: 0.190704947262296,
			1953: 0.237605014855542,
			1954: 0.520245515153512,
			1955: 0.118835421708988,
			1956: 0.0785265524410837,
			1957: 0.0595439370600422,
			1958: 0.265699435233989,
			1959: 0.485317328609128,
			1960: 0.156619851674695,
			1961: 0.0744186973445635,
			1962: -0.0662015102792587,
			1963: 0.0656543591552814,
			1964: -0.0250413301315824,
			1965: 0.020809440730442,
			1966: -0.0126375135293739,
			1967: 0.171828913848111,
			1968: 0.220793456223115,
			1969: 0.183423202852656,
			1970: -0.0480055943360289,
			1971: 0.0928854788629142,
			1972: 0.307988708993749,
			1973: 0.0593558490289002,
			1974: -0.197458221032059,
			1975: 0.338461899229971,
			1976: 0.00961859596275891,
			1977: 0.0355876372402261,
			1978: 0.193078023648539,
			1979: 0.0826671016381561,
			1980: 0.216776609848152,
			1981: 0.102284796935611,
			1982: 0.0837916465487367,
			1983: 0.367530574212822,
			1984: 0.212097792009335,
			1985: 0.430242873900079,
			1986: 0.39479737705409,
			1987: 0.244,
			1988: 0.287,
			1989: 0.101,
			1990: -0.233,
			1991: 0.128,
			1992: -0.113,
			1993: 0.322,
			1994: 0.086,
			1995: 0.115,
			1996: 0.061,
			1997: 0.027,
			1998: 0.202,
			1999: 0.276,
			2000: -0.143,
			2001: -0.219,
			2002: -0.158,
			2003: 0.396,
			2004: 0.2,
			2005: 0.148,
			2006: 0.263,
			2007: 0.116,
			2008: -0.43,
			2009: 0.317,
			2010: 0.079,
			2011: -0.12,
			2012: 0.175,
			2013: 0.225,
			2014: -0.044,
			2015: -0.003,
			2016: 0.013,
			2017: 0.253,
			2018: -0.1336,
			2019: 0.2266,
			2020: 0.0828,
			2021: 0.1178,
			2022: -0.1401,
			2023: 0.1885,
			2024: 0.0435		
		}
		
	
	
}}


/* === Added utility & stats functions (2025-09-30) === */
(function(){
  // Guard if marketreturns2 isn't present
  if (typeof marketreturns2 !== "object" || marketreturns2 === null) {
    console.error("marketreturns2 not found; cannot attach getAverage/getStandardDeviation.");
    return;
  }

  // Internal helper to collect numeric values between inclusive years.
  function _collectValues(dataset, startYear, endYear) {
    if (!dataset || typeof dataset !== "object") return [];
    const a = Number(startYear), b = Number(endYear);
    const lo = Math.min(a, b), hi = Math.max(a, b);
    const vals = [];
    for (const [k, v] of Object.entries(dataset)) {
      const y = Number(k);
      if (Number.isFinite(y) && y >= lo && y <= hi && Number.isFinite(Number(v))) {
        vals.push(Number(v));
      }
    }
    return vals.sort((x, y) => x - y); // order not required, but deterministic
  }

  /**
   * Compute the arithmetic average of values in the given dataset
   * between startYear and endYear (inclusive).
   * @param {Object} dataset - e.g., marketreturns2.usstocks
   * @param {number} startYear
   * @param {number} endYear
   * @returns {number} mean, or NaN if no values present
   */
  marketreturns2.getAverage = function(dataset, startYear, endYear) {
    const vals = _collectValues(dataset, startYear, endYear);
    if (vals.length === 0) return NaN;
    let sum = 0;
    for (let i = 0; i < vals.length; i++) sum += vals[i];
    return sum / vals.length;
  };

  /**
   * Compute the (sample) standard deviation (Bessel-corrected, n-1)
   * of values in the given dataset between startYear and endYear (inclusive).
   * Returns NaN if fewer than 2 observations are available.
   * @param {Object} dataset - e.g., marketreturns2.usbonds
   * @param {number} startYear
   * @param {number} endYear
   * @returns {number} standard deviation (sample)
   */
  marketreturns2.getStandardDeviation = function(dataset, startYear, endYear, population=false) {
    const vals = _collectValues(dataset, startYear, endYear);
    const n = vals.length;
    if (n < 2) return NaN;
    // mean
    let sum = 0;
    for (let i = 0; i < n; i++) sum += vals[i];
    const mean = sum / n;
    // sample variance with Bessel's correction
    let sq = 0;
    for (let i = 0; i < n; i++) {
      const d = vals[i] - mean;
      sq += d * d;
    }
    const divisor = population ? n : (n - 1);
    const variance = sq / divisor;
    return Math.sqrt(variance);
  };

  /**
   * Simple unit tests for getAverage and getStandardDeviation.
   * Logs results to console and returns a summary object.
   */
  marketreturns2.testStats = function() {
    const eps = 1e-12;
    function almostEqual(a, b, tol = eps) {
      if (Number.isNaN(a) && Number.isNaN(b)) return true;
      return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
    }

    const results = [];

    // Test 1: US stocks 1928-1930
    (function(){
      const expectedAvg = (0.438112 + (-0.082979) + (-0.251236)) / 3; // 0.0346323333333...
      const expectedSd  = (function(vals){
        const m = expectedAvg;
        const n = vals.length;
        const v = ( (vals[0]-m)**2 + (vals[1]-m)**2 + (vals[2]-m)**2 ) / (n-1);
        return Math.sqrt(v);
      })([0.438112, -0.082979, -0.251236]); // ~0.3594085218415575

      const avg = marketreturns2.getAverage(marketreturns2.usstocks, 1928, 1930);
      const sd  = marketreturns2.getStandardDeviation(marketreturns2.usstocks, 1928, 1930);
      results.push({
        name: "US Stocks 1928-1930",
        avg: avg, sd: sd,
        passAvg: almostEqual(avg, expectedAvg),
        passSd: almostEqual(sd, expectedSd)
      });
    })();

    // Test 2: US bonds 1928-1930
    (function(){
      const vals = [0.008355, 0.042038, 0.045409];
      const expectedAvg = (vals[0] + vals[1] + vals[2]) / 3; // 0.031934
      const m = expectedAvg;
      const v = ((vals[0]-m)**2 + (vals[1]-m)**2 + (vals[2]-m)**2) / (vals.length - 1);
      const expectedSd = Math.sqrt(v); // ~0.02048945682540169

      const avg = marketreturns2.getAverage(marketreturns2.usbonds, 1928, 1930);
      const sd  = marketreturns2.getStandardDeviation(marketreturns2.usbonds, 1928, 1930);
      results.push({
        name: "US Bonds 1928-1930",
        avg: avg, sd: sd,
        passAvg: almostEqual(avg, expectedAvg),
        passSd: almostEqual(sd, expectedSd)
      });
    })();

    // Test 3: Swap start/end order
    (function(){
      const a = marketreturns2.getAverage(marketreturns2.usstocks, 1930, 1928);
      const b = marketreturns2.getAverage(marketreturns2.usstocks, 1928, 1930);
      results.push({
        name: "Swapped year order yields same average",
        passAvg: almostEqual(a, b),
        a: a, b: b
      });
    })();

    // Test 4: Single-year stdev is NaN
    (function(){
      const sd = marketreturns2.getStandardDeviation(marketreturns2.usstocks, 1928, 1928);
      results.push({
        name: "Single-year standard deviation returns NaN",
        sd: sd,
        passSdIsNaN: Number.isNaN(sd)
      });
    })();

    // Aggregate
    const allPass = results.every(r =>
      (r.passAvg !== false) &&
      (r.passSd !== false) &&
      (r.passSdIsNaN !== false)
    );

    try {
      console.group("marketreturns2.testStats()");
      for (const r of results) console.log(r.name, r);
      console.log("ALL PASS:", allPass);
      console.groupEnd();
    } catch(_) {}

    return { allPass, results };
  };
})();



/* === Enhanced unit tests to verify sample vs population stdev (2025-09-30) === */
(function(){
  if (typeof marketreturns2 !== "object" || marketreturns2 === null) return;

  marketreturns2.testStats = function() {
    const eps = 1e-12;
    function almostEqual(a, b, tol = eps) {
      if (Number.isNaN(a) && Number.isNaN(b)) return true;
      return Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
    }

    function expectedStats(vals, population=false) {
      const n = vals.length;
      const mean = vals.reduce((s,v)=>s+v,0)/n;
      const sq = vals.reduce((s,v)=>{const d=v-mean; return s+d*d;},0);
      const varr = sq / (population ? n : (n-1));
      return { mean, sd: Math.sqrt(varr) };
    }

    const results = [];

    // Case A: US stocks 1928-1930
    (function(){
      const vals = [0.438112, -0.082979, -0.251236];
      const expS = expectedStats(vals, false); // sample
      const expP = expectedStats(vals, true);  // population

      const avg = marketreturns2.getAverage(marketreturns2.usstocks, 1928, 1930);
      const sdS = marketreturns2.getStandardDeviation(marketreturns2.usstocks, 1928, 1930, false);
      const sdP = marketreturns2.getStandardDeviation(marketreturns2.usstocks, 1928, 1930, true);

      results.push({
        name: "US Stocks 1928-1930 (avg/sample/population)",
        avg, sdS, sdP,
        passAvg: almostEqual(avg, expS.mean),
        passSdSample: almostEqual(sdS, expS.sd),
        passSdPopulation: almostEqual(sdP, expP.sd)
      });
    })();

    // Case B: US bonds 1928-1930
    (function(){
      const vals = [0.008355, 0.042038, 0.045409];
      const expS = expectedStats(vals, false);
      const expP = expectedStats(vals, true);

      const avg = marketreturns2.getAverage(marketreturns2.usbonds, 1928, 1930);
      const sdS = marketreturns2.getStandardDeviation(marketreturns2.usbonds, 1928, 1930, false);
      const sdP = marketreturns2.getStandardDeviation(marketreturns2.usbonds, 1928, 1930, true);

      results.push({
        name: "US Bonds 1928-1930 (avg/sample/population)",
        avg, sdS, sdP,
        passAvg: almostEqual(avg, expS.mean),
        passSdSample: almostEqual(sdS, expS.sd),
        passSdPopulation: almostEqual(sdP, expP.sd)
      });
    })();

    // Case C: Swapped year order average must match
    (function(){
      const a = marketreturns2.getAverage(marketreturns2.usstocks, 1930, 1928);
      const b = marketreturns2.getAverage(marketreturns2.usstocks, 1928, 1930);
      results.push({
        name: "Swapped year order yields same average",
        passAvg: almostEqual(a, b),
        a, b
      });
    })();

    // Case D: Single-year stdev returns NaN (both sample and population have edge rules)
    (function(){
      const sdS = marketreturns2.getStandardDeviation(marketreturns2.usstocks, 1928, 1928, false);
      const sdP = marketreturns2.getStandardDeviation(marketreturns2.usstocks, 1928, 1928, true);
      // By implementation: both return NaN when n<2
      results.push({
        name: "Single-year standard deviation returns NaN (sample & population)",
        sdS, sdP,
        passSdSampleIsNaN: Number.isNaN(sdS),
        passSdPopulationIsNaN: Number.isNaN(sdP)
      });
    })();

    const allPass = results.every(r =>
      Object.keys(r).filter(k=>k.startsWith("pass")).every(k => r[k] !== false)
    );

    try {
      console.group("marketreturns2.testStats()");
      for (const r of results) console.log(r.name, r);
      console.log("ALL PASS:", allPass);
      console.groupEnd();

      let avg = marketreturns2.getAverage(marketreturns2.usstocks, 2000, 2024);
      console.log("US Stocks 2000-2024 avg: " + avg);
      let sdS = marketreturns2.getStandardDeviation(marketreturns2.usstocks, 2000, 2024);
      console.log("US Stocks 2000-2024 std: " + sdS);
    
      avg = marketreturns2.getAverage(marketreturns2.usbonds, 2000, 2024);
      console.log("US Bonds 2000-2024 avg: " + avg);
      sdS = marketreturns2.getStandardDeviation(marketreturns2.usbonds, 2000, 2024);
      console.log("US Bonds 2000-2024 std: " + sdS);

      avg = marketreturns2.getAverage(marketreturns2.international, 2000, 2024);
      console.log("International 2000-2024 avg: " + avg);
      sdS = marketreturns2.getStandardDeviation(marketreturns2.international, 2000, 2024);
      console.log("International 2000-2024 std: " + sdS);	  
    } catch(_) {}

    return { allPass, results };
  };
})();
