// Math-specific formatter for fractions, surds, etc.
const MathFormatter = {
    formatQuestion: (text, format) => {
        switch(format) {
            case 'fraction':
                return formatFraction(text);
            case 'surds':
                return formatSurds(text);
            case 'mixed':
                return formatMixed(text);
            case 'percentage':
                return formatPercentage(text);
            default:
                return text;
        }
    },
    
    formatOptions: (options, format) => {
        return options.map(opt => ({
            display: formatOption(opt, format),
            value: opt
        }));
    },
    
    formatAnswer: (text, format) => {
        return formatOption(text, format);
    }
};

// Fraction formatting
function formatFraction(text) {
    return text.replace(/(\d+)\/(\d+)/g, 
        '<span class="fraction"><span class="numerator">$1</span><span class="denominator">$2</span></span>');
}

// Surds formatting
function formatSurds(text) {
    return text.replace(/√(\d+)/g, 
        '<span class="surd">√<span class="surd-number">$1</span></span>');
}

// Mixed formatting (handles both)
function formatMixed(text) {
    return text
        .replace(/(\d+)\/(\d+)/g, 
            '<span class="fraction"><span class="numerator">$1</span><span class="denominator">$2</span></span>')
        .replace(/√(\d+)/g, 
            '<span class="surd">√<span class="surd-number">$1</span></span>');
}

// Percentage formatting
function formatPercentage(text) {
    return text.replace(/(\d+)%/g, 
        '<span class="percentage">$1<span class="percent-symbol">%</span></span>');
}

// Generic option formatter
function formatOption(text, format) {
    if (format === 'fraction' || format === 'mixed') {
        return text.replace(/(\d+)\/(\d+)/g, 
            '<span class="fraction"><span class="numerator">$1</span><span class="denominator">$2</span></span>');
    }
    if (format === 'surds' || format === 'mixed') {
        return text.replace(/√(\d+)/g, 
            '<span class="surd">√<span class="surd-number">$1</span></span>');
    }
    return text;
}

export default MathFormatter;
