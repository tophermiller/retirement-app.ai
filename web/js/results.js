
if (typeof(results) === "undefined") {
  results = {

    buildPgh1: (resultData) => {
      let tnwStatement = "";
      let isRetiredAtStart = state.alpha.age >= state.alpha.retireAge;
      let retireYear = new Date().getFullYear() + state.alpha.retireAge;
    
      if (isRetiredAtStart) {
        tnwStatement += "Congratulations, you indicated you are already retired as of the plan starting year.  ";
        tnwStatement += "Your total net worth at the start of this plan is " ;
        tnwStatement += util.formatCurrencyVal(resultData.tnw);
        tnwStatement += " (if you include income property equity it is " + util.formatCurrencyVal(resultData.tnwWithIncomeProperty);
        tnwStatement += " and if you also include your home equity it is " + util.formatCurrencyVal(resultData.tnwWithAllProperty) + ")";
        tnwStatement += ". Your total withdrawal needs at the start are " + util.formatCurrencyVal(resultData.retireYearWithdrawals) + ", ";
        tnwStatement += "so your starting retirement withdrawal rate is " + util.formatPercentageVal(resultData.retireYearWithdrawalRate * 100) + ". ";
        tnwStatement += " It is important to note that the withdrawal rate may vary over your retirement lifetime as cash flows and assets come and go.";
      }
      else {
        tnwStatement += "Upon your retirement year of " + retireYear + ", ";
        tnwStatement += "your total net worth is projected to be approximately " ;
        tnwStatement += util.formatCurrencyVal(resultData.tnw);
        tnwStatement += " (if you include income property equity it is " + util.formatCurrencyVal(resultData.tnwWithIncomeProperty);
        tnwStatement += " and if you also include your home equity it is " + util.formatCurrencyVal(resultData.tnwWithAllProperty) + ")";
        tnwStatement += ".  Your total withdrawal needs at the start are projected to be " + util.formatCurrencyVal(resultData.retireYearWithdrawals) + ", ";
        tnwStatement += "so your starting retirement withdrawal rate will be approximately " + util.formatPercentageVal(resultData.retireYearWithdrawalRate * 100) + ". ";
        tnwStatement += " It is important to note that the withdrawal rate may vary over your retirement lifetime as cash flows and assets come and go.";
      }
      return tnwStatement;
    },

    buildPgh2: (resultData) => {
      let ret = "";
      ret += "<p>The values you provided (or left at their defaults) for standard deviation and average ROI were used to generate a random set of market returns, so that your results will not always be 0% or 100%.</p>  ";
      return ret;
    },

    buildPgh3: (resultData) => {
      ret = "We executed your retirement plan 1000 times with returns randomized each time.  ";
      ret += "The above indicates your overall odds of having enough money to ";
      ret += "last through your life expectancy.   ";
      ret += "Now you may ";
      ret += '<a href="#">scroll back to the top</a> ';
      ret += "to try changing some of your values and see how it ";
      ret += "affects your results.  ";
      ret + "Or, try running multiple scenarios at once by ";
      ret += "<a class=\"switch-to-whatif-link\" href=\"#\">switching to \"What-If\" mode.</a>";
      return ret;
    },

    showPreSubmitErrors: function (errors) {
      document.getElementById("results-error").innerHTML = errors;
      if (document.getElementById("results-error-details")) document.getElementById("results-error-details").open = true;
      document.getElementById("results-error").style.display = "block";
      document.getElementById("results-success").style.display = "none";
      document.getElementById("results-container").style.display = "block";
      document.getElementById("results-error").open = true;
    },

    showResults: function (resultData, submittal) {
      if (resultData.error) {
        document.getElementById("results-error").innerHTML = resultData.error;
        document.getElementById("results-error").style.display = "block";
        document.getElementById("results-success").style.display = "none";
      }  
      else {//success from server
        document.getElementById("results-error").style.display = "none";
        document.getElementById("results-success").style.display = "block";

        //if you're finding this tool useful...
        document.getElementById("results-support-top").style.display = "block";

        document.getElementById("results-pgh1").innerHTML = results.buildPgh1(resultData);
        document.getElementById("results-pgh2").innerHTML = results.buildPgh2(resultData);
        document.getElementById("results-result").innerHTML = util.formatPercentageVal(Number(resultData.overallResult)*100);
        document.getElementById("results-pgh3").innerHTML = results.buildPgh3(resultData);
        document.getElementById("results-download-csv").style.display = "block";
        const downloadSampleLink = document.getElementById("downloadSampleLink");
        const blob = new Blob([resultData.sample], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        downloadSampleLink.setAttribute('href', url);
        const timestamp = new Date().toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(' ', '_').replace(':', '-');
        const filename = "RetirementOdds_" + timestamp + "_variableROI.csv";
        downloadSampleLink.setAttribute('download', filename);
        const downloadFixedSampleLink = document.getElementById("downloadFixedSampleLink");
        const blobFixed = new Blob([resultData.fixedRateSample], { type: 'text/csv' });
        const urlFixed = window.URL.createObjectURL(blobFixed);
        const filenameFixed = "RetirementOdds_" + timestamp + "_fixedROI.csv";
        downloadFixedSampleLink.setAttribute('href', urlFixed);
        downloadFixedSampleLink.setAttribute('download', filenameFixed);

        //charts
        results.showCharts(resultData.chartData, submittal);
      }
 
      const rp = document.getElementById('resultsPanel');
      //const rj = document.getElementById('resultsJson');
      //if(rj) rj.textContent = JSON.stringify(resultsData ?? {}, null, 2);
      if(rp){ rp.classList.remove('hidden'); }
      active = 'results';
      buildNav();
      render();

    },

    showNoResults: function (message) {
      results.clearCharts();
      document.getElementById("results-error").innerHTML = data.message + "  Please try again.";
      document.getElementById("results-error").style.display = "block";
      document.getElementById("results-success").style.display = "none";
      document.getElementById("results-container").style.display = "block";
      document.getElementById("results-container").scrollIntoView();
      results.enableClosePopup();
    },

    showCharts: function (chartDataArrays, submittal) {
      // List of element IDs
      const chartsData = [
        //Liquid Net Worth
        {
          buttonId : "plot-assets-choice-liquid",
          plotId : "plot-assets",
          data : [
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.nwFixedIncome,
              name : "Fixed Rate Savings",
              type : "bar"
            },
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.nwTaxableSavings,
              name : "Taxable Investments",
              type : "bar"
            },
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.nwIRASavings,
              name : "401K/IRA",
              type : "bar"
            },
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.nwRothSavings,
              name : "Roth",
              type : "bar"
            }
          ],
          layout : {
            title: "Liquid Net Worth vs Age using average ROI",
            barmode: "stack",
            xaxis: {title: "Age"},
            yaxis: {title: "Liquid Net Worth"},
            legend: {orientation: "h", xanchor: "center", x: 0.5, y: -0.2,}
          }
        },
        //Total Net Worth
        {
          buttonId : "plot-assets-choice-tnw",
          plotId : "plot-assets",
          data : [
            {
              x : chartDataArrays.ageArray,
              y : util.pairwiseAdd(
                    chartDataArrays.nwFixedIncome,
                    chartDataArrays.nwTaxableSavings,
                    chartDataArrays.nwIRASavings,
                    chartDataArrays.nwRothSavings),
              name : "Total Savings",
              type : "bar"
            },
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.nwRentalEquity,
              name : "Invesment Property Equity",
              type : "bar"
            },
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.nwHomeEquity,
              name : "Home equity",
              type : "bar"
            }
          ],
          layout : {
            title: "Total Net Worth vs Age using average ROI",
            barmode: "stack",
            xaxis: {title: "Age"},
            yaxis: {title: "Total Net Worth"},
            legend: {orientation: "h", xanchor: "center", x: 0.5, y: -0.2,}
          }
        },
        //Cash Source
        {
          buttonId : "plot-spending-choice-source",
          plotId : "plot-spending",
          data : [
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.spendingCash,
              name : "Start of Year Cash",
              type : "bar"
            },
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.spendingIncome,
              name : "Income",
              type : "bar"
            },
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.spendingWithdrawalsFixedRateSavings,
              name : "Fixed Rate Savings Withdrawals",
              type : "bar"
            },
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.spendingWithdrawalsTaxableInvestments,
              name : "Taxable Investments Withdrawals",
              type : "bar"
            },
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.spendingWithdrawalsIRA,
              name : "IRA/401K Withdrawals",
              type : "bar"
            },
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.spendingWithdrawalsRoth,
              name : "Roth Withdrawals",
              type : "bar"
            }
          ],
          layout : {
            title: "Spending by Cash Source and Age",
            barmode: "stack",
            xaxis: {title: "Age"},
            yaxis: {title: "Spending"},
            legend: {orientation: "h", xanchor: "center", x: 0.5, y: -0.2,}
          }
        },
        //Tax View
        {
          buttonId : "plot-spending-choice-taxview",
          plotId : "plot-spending",
          data : [
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.spendingExpenses,
              name : "Spending Before Taxes",
              type : "bar"
            },
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.spendingTaxExpenses,
              name : "Tax Expenses",
              type : "bar"
            }
          ],
          layout : {
            title: "Spending Before Tax and Taxes by Age",
            barmode: "stack",
            xaxis: {title: "Age"},
            yaxis: {title: "Spending"},
            legend: {orientation: "h", xanchor: "center", x: 0.5, y: -0.2,}
          }
        },
        //Withdrawal Rate
        {
          buttonId : "plot-spending-choice-withdrawalrate",
          plotId : "plot-spending",
          data : [
            {
              x : chartDataArrays.ageArray,
              y : util.pairwisePercentage(
                        chartDataArrays.spendingWithdrawals,
                        util.pairwiseAdd(
                          chartDataArrays.nwFixedIncome,
                          chartDataArrays.nwTaxableSavings,
                          chartDataArrays.nwIRASavings,
                          chartDataArrays.nwRothSavings
                        )
                  ),
              name : "Withdrawal Rate",
              type : "bar"
            }
          ],
          layout : {
            title: "Withdrawal Rate (Based on Liquid Net Worth) by Age",
            barmode: "stack",
            xaxis: {title: "Age"},
            yaxis: {title: "Withdrawal Rate (% of Liquid Net Worth)",tickformat: ',.1%' },
            legend: {orientation: "h", xanchor: "center", x: 0.5, y: -0.2,}
          }
        },
        //Taxes Paid
        {
          buttonId : "plot-taxview-choice-taxes",
          plotId : "plot-taxes",
          data : [
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.taxesOrdinary,
              name : "Ordinary Income Tax",
              type : "bar"
            },
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.taxesLtcg,
              name : "Long Term Capital Gains Tax",
              type : "bar"
            },
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.taxesNiit,
              name : "Niit Tax",
              type : "bar"
            },
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.taxesState,
              name : "State Tax",
              type : "bar"
            }
          ],
          layout : {
            title: "Taxes Paid by Age",
            barmode: "stack",
            xaxis: {title: "Age"},
            yaxis: {title: "Taxes Paid"},
            legend: {orientation: "h", xanchor: "center", x: 0.5, y: -0.2,}
          }
        },
        //Taxable Income
        {
          buttonId : "plot-taxview-choice-taxableincome",
          plotId : "plot-taxes",
          data : [
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.taxableIncomeOrindary,
              name : "Ordinary Income",
              type : "bar"
            },
            {
              x : chartDataArrays.ageArray,
              y : chartDataArrays.taxableIncomeLtcg,
              name : "Long Term Capital Gains Income",
              type : "bar"
            }
          ],
          layout : {
            title: "Taxable Income by Age",
            barmode: "stack",
            xaxis: {title: "Age"},
            yaxis: {title: "Taxable Income"},
            legend: {orientation: "h", xanchor: "center", x: 0.5, y: -0.2,}
          }
        }
      ];

      // Add click event listeners to each element
      chartsData.forEach(({buttonId, plotId, data, layout}) => {
        document.getElementById(buttonId).addEventListener("click", () => Plotly.newPlot(plotId, data, layout));
      });

      document.getElementById("plot-assets-choice-liquid").click();
      document.getElementById("plot-spending-choice-source").click();
      document.getElementById("plot-taxview-choice-taxes").click();

      document.getElementById("plot-randomroi-average").value = util.formatPercentageVal(submittal.growthRates.defaultAnnualGainRate.average);
      document.getElementById("plot-randomroi-stdev").value = util.formatPercentageVal(submittal.growthRates.defaultAnnualGainRate.standardDeviation);
      document.getElementById("plot-randomroi-regenerate").addEventListener("click", () => {
        const average = getNumber(document.getElementById("plot-randomroi-average"));
        const stdev = getNumber(document.getElementById("plot-randomroi-stdev"));
        const rateArray = chartDataArrays.ageArray.map(() => util.getRandomRate(average, stdev));
        randomROIData = [
          {
            x : chartDataArrays.ageArray,
            y : rateArray,
            name : "ROI",
            type : "bar"
          }
        ];
        randomROILayout = {
          title: "Sample Randomized ROI",
          barmode: "stack",
          xaxis: {title: "Age"},
          yaxis: {title: "ROI", tickformat: ',.1%'},
          legend: {orientation: "h", xanchor: "center", x: 0.5, y: -0.2,}
        };
        Plotly.newPlot("plot-randomroi", randomROIData, randomROILayout);
        document.getElementById("plot-randomroi-actual-number").innerHTML = rateArray.length;
        document.getElementById("plot-randomroi-actual-average").innerHTML = util.formatPercentageVal(100 * util.arrayAverage(rateArray));
        document.getElementById("plot-randomroi-actual-display").style.display = "block";
      });
      document.getElementById("plot-randomroi-regenerate").click();
    },

    clearCharts: function () {
      document.getElementById("plot-assets").innerHTML = "";
      document.getElementById("plot-spending").innerHTML = "";
      document.getElementById("plot-taxes").innerHTML = "";
      document.getElementById("plot-randomroi").innerHTML = "";
    }

  }
}
