// Main formatter router - imports and exports all formatters
import MathFormatter from './math-formatter.js';
import ChemistryFormatter from './chemistry-formatter.js';
import DefaultFormatter from './default-formatter.js';

// Map format types to their formatters
const formatterMap = {
    'fraction': MathFormatter,
    'surds': MathFormatter,
    'mixed': MathFormatter,
    'percentage': MathFormatter,
    'chemistry': ChemistryFormatter,
    'text': DefaultFormatter
};

// Main function to get the right formatter for a question
export function getFormatterForQuestion(question) {
    const format = question.format || 'text';
    return formatterMap[format] || DefaultFormatter;
}

// Export individual formatters for direct use if needed
export { MathFormatter, ChemistryFormatter, DefaultFormatter };
