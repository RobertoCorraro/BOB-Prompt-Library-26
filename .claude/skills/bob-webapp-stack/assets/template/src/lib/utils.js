/**
 * Triggers haptic feedback if available on the device.
 * @param {'success'|'warning'|'error'|'light'|'medium'|'heavy'} type
 */
export const triggerHaptic = (type = 'medium') => {
    if (!navigator.vibrate) return;

    switch (type) {
        case 'success':
            navigator.vibrate([10, 30, 10]);
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

/**
 * Converte una data PocketBase ("2026-08-01 14:53:28.228Z") in un oggetto Date.
 * PocketBase usa lo spazio al posto della "T": Safari/iOS non lo accetta,
 * quindi normalizziamo prima di passarlo al costruttore.
 * @param {string|Date|undefined} value
 * @returns {Date|null} null se il valore manca o non è una data valida
 */
export const parseDate = (value) => {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(String(value).replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Formatta una data PocketBase secondo le opzioni Intl indicate.
 * Restituisce una stringa vuota se la data manca o non è valida,
 * così la UI non mostra mai "Invalid Date".
 * @param {string|Date|undefined} value
 * @param {Intl.DateTimeFormatOptions} options
 * @param {string} locale
 */
export const formatDate = (value, options = { day: 'numeric', month: 'short', year: 'numeric' }, locale = 'it-IT') => {
    const d = parseDate(value);
    return d ? d.toLocaleString(locale, options) : '';
};
