// Default formatter - just returns text as-is
const DefaultFormatter = {
    formatQuestion: (text, format) => {
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

export default DefaultFormatter;
