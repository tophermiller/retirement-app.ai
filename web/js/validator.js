if (typeof(validator) === "undefined") {
    validator = {

        validate: function() {
            //Get all input fields with attribute inputmode="numeric" or "decimal"
            const inputTuples = validator.getNumericInputTuples();
            const errors = [];
            inputTuples.forEach(([inputEl, label]) => {
                //get input type from label (currency if it contains '$' or 'percentage' if it contains '%')
                let inputType = 'number';
                if (label.includes('$')) {
                    inputType = 'currency';
                }
                else if (label.includes('%')) {
                    inputType = 'percentage';
                }
                switch (inputType) {
                    case 'currency':
                        if (!validator.validateCurrency(inputEl)) {
                            errors.push(`Invalid value in ${label}: "${inputEl.value}"`);
                        }
                        break;
                    case 'percentage': 
                        if (!validator.validatePercentage(inputEl)) {
                            errors.push(`Invalid value in ${label}: "${inputEl.value}"`);
                        }
                        break;
                    default:
                        if (!validator.validateNumeric(inputEl)) {
                            errors.push(`Invalid value in ${label}: "${inputEl.value}"`);
                        }
                        break;
                }
            });
            return errors; 
        },

        showErrors: function(errors) {
            // Placeholder for error display logic
            console.error("Validation errors:", errors);
        },


        // Returns true if the input is a valid percentage value
        // Allows negatives, decimals, and an optional trailing "%"
        // Rejects values > 100
        validatePercentage: function(inputEl) {
            const val = (inputEl && typeof inputEl.value === 'string') ? inputEl.value.trim() : '';

            // Allow empty; treat "required" separately.
            if (val === '') return true;

            // Match optional "-" sign, digits with optional decimal, optional trailing "%"
            const pattern = /^-?\d*\.?\d*\s*%?$/;
            if (!pattern.test(val)) return false;

            // Strip "%" and parse as float
            const numeric = parseFloat(val.replace('%', '').trim());

            // Reject NaN and > 100
            if (isNaN(numeric) || numeric > 100) return false;

            return true;
        },
        // Validate that an input contains only numeric characters.
        // - inputEl: the input element
        // - allowNegative: boolean (true = negatives allowed, false = not allowed)
        // Returns true if valid, false if invalid
        validateNumeric: function(inputEl, allowNegative = false) {
            const val = (inputEl && typeof inputEl.value === 'string') ? inputEl.value.trim() : '';

            // Empty = valid (treat "required" separately)
            if (val === '') return true;

            // Build regex depending on whether negatives are allowed
            const pattern = allowNegative ? /^-?\d+(\.\d+)?$/ : /^\d+(\.\d+)?$/;

            return pattern.test(val);
        },
        // Validate that an input contains a valid currency value.
        // - inputEl: the input element
        // Returns true if valid, false if invalid
        validateCurrency: function(inputEl) {   
            const val = (inputEl && typeof inputEl.value === 'string') ? inputEl.value.trim() : '';

            // Empty = valid (treat "required" separately)
            if (val === '') return true;

            // Match optional "$", digits with optional decimal, optional commas
            const pattern = /^\$?\d{1,3}(,\d{3})*(\.\d+)?$/;
            if (!pattern.test(val)) return false;

            // Strip "$" and commas, then parse as float
            const numeric = parseFloat(val.replace(/[$,]/g, '').trim());

            // Reject NaN
            if (isNaN(numeric)) return false;

            return true;
        },

        /**
         * Get all input elements with inputmode="numeric" or "decimal"
         * Returns an array of tuples [inputElement, labelText]
         * where labelText is the text of the label preceding the input element
         */
        getNumericInputTuples: function() {
            const numericInputs = document.querySelectorAll('input[inputmode="numeric"], input[inputmode="decimal"]');
            const tuples = Array.from(numericInputs).map(input => {
                // Find the label that immediately precedes the input in the DOM
                const label = input.previousElementSibling && input.previousElementSibling.tagName === 'LABEL'
                    ? input.previousElementSibling.innerText.trim()
                    : '';
               return [input, label];
            });
            return tuples;
        }
        
    }
}        