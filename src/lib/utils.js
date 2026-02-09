
/**
 * Extracts variables from text that are enclosed in double curly braces {{variable}}.
 * Returns an array of unique variable names.
 * @param {string} text 
 * @returns {string[]}
 */
export const extractVariables = (text) => {
    if (!text) return [];
    // Regex to match {{ ... }}
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [...text.matchAll(regex)];

    // Extract the content, trim whitespace, and get unique values
    const variables = matches.map(match => match[1].trim());
    return [...new Set(variables)];
};

/**
 * Triggers haptic feedback if available on the device.
 * @param {'success'|'warning'|'error'|'light'|'medium'|'heavy'} type 
 */
export const triggerHaptic = (type = 'medium') => {
    if (!navigator.vibrate) return;

    switch (type) {
        case 'success':
            navigator.vibrate([10, 30, 10]); // Short-Long-Short
            break;
        case 'warning':
            navigator.vibrate([30, 50, 30]);
            break;
        case 'error':
            navigator.vibrate([50, 100, 50, 100]);
            break;
        case 'light':
            navigator.vibrate(10);
            break;
        case 'medium':
            navigator.vibrate(20);
            break;
        case 'heavy':
            navigator.vibrate(30);
            break;
        default:
            navigator.vibrate(20);
    }
};
