import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Primitiva condivisa per finestre di dialogo.
 *
 * Si occupa di quello che ogni modale deve fare per essere usabile anche
 * senza mouse e con uno screen reader:
 * - si annuncia come finestra di dialogo (role="dialog" + aria-modal)
 * - si chiude con Esc
 * - trattiene il focus al proprio interno (Tab non finisce dietro l'overlay)
 * - restituisce il focus all'elemento che l'ha aperta quando si chiude
 * - blocca lo scorrimento della pagina sottostante
 *
 * Overlay e pannello restano stilizzati da chi la usa, così l'aspetto dei
 * singoli modali non cambia.
 */

const FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function Modal({
    isOpen,
    onClose,
    children,
    overlayClassName = '',
    panelClassName = '',
    labelledBy,
    describedBy,
    label,
    closeOnOverlayClick = true,
    initialFocusRef,
}) {
    const panelRef = useRef(null);
    const restoreFocusRef = useRef(null);

    const focusable = useCallback(
        () => Array.from(panelRef.current?.querySelectorAll(FOCUSABLE) ?? [])
            .filter((el) => el.offsetParent !== null || el === document.activeElement),
        [],
    );

    // Blocca lo scroll di fondo e ricorda chi aveva il focus.
    useEffect(() => {
        if (!isOpen) return undefined;
        restoreFocusRef.current = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
            // Il nodo può essere sparito nel frattempo (es. lista ricaricata).
            const target = restoreFocusRef.current;
            if (target && document.contains(target) && typeof target.focus === 'function') {
                target.focus();
            }
        };
    }, [isOpen]);

    // Porta il focus dentro al dialogo appena si apre.
    useEffect(() => {
        if (!isOpen) return;
        const t = setTimeout(() => {
            if (initialFocusRef?.current) { initialFocusRef.current.focus(); return; }
            const [first] = focusable();
            (first ?? panelRef.current)?.focus();
        }, 0);
        return () => clearTimeout(t);
    }, [isOpen, initialFocusRef, focusable]);

    // Esc per chiudere, Tab confinato dentro al dialogo.
    useEffect(() => {
        if (!isOpen) return undefined;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return; }
            if (e.key !== 'Tab') return;

            const items = focusable();
            if (items.length === 0) { e.preventDefault(); return; }
            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement;

            if (!panelRef.current?.contains(active)) {
                e.preventDefault();
                (e.shiftKey ? last : first).focus();
            } else if (e.shiftKey && active === first) {
                e.preventDefault(); last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault(); first.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown, true);
        return () => document.removeEventListener('keydown', onKeyDown, true);
    }, [isOpen, onClose, focusable]);

    if (!isOpen) return null;

    return (
        <div
            className={overlayClassName}
            onMouseDown={(e) => {
                // Solo un clic iniziato sull'overlay chiude: così trascinare una
                // selezione di testo fuori dal pannello non lo fa sparire.
                if (closeOnOverlayClick && e.target === e.currentTarget) onClose?.();
            }}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                aria-describedby={describedBy}
                aria-label={labelledBy ? undefined : label}
                tabIndex={-1}
                className={panelClassName}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}
