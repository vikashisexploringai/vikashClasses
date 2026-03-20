// Chemistry-specific formatter (for future use)
const ChemistryFormatter = {
    formatQuestion: (text, format) => {
        // For now, just return text
        // Later you can add chemical formula formatting
        // e.g., H2O -> H<span class="subscript">2</span>O
        return text;
    },
    
    formatOptions: (options, format) => {
        return options.map(opt => ({
            display: opt,
            value: opt
        }));
    },
    
    formatAnswer: (text, format) => {
        return text;
    }
};

export default ChemistryFormatter;
