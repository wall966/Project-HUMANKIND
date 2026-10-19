import { useEffect, useRef } from 'react';
import './LogoutModal.css';

// Fenêtre de confirmation réutilisable (suppression d'un compte, d'une annonce...).
// Même principe que LogoutModal : balise native <dialog> (fond assombri, Échap, focus).
// "children" permet d'ajouter un contenu, par exemple un champ mot de passe.
function ConfirmModal({ open, titre, texte, confirmer, envoi, erreur, onConfirm, onCancel, children }) {
    const ref = useRef(null);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            className='lo'
            aria-labelledby='cm-title'
            aria-describedby='cm-text'
            onCancel={(e) => {
                e.preventDefault();
                if (!envoi) onCancel();
            }}
            onClick={(e) => {
                if (e.target === ref.current && !envoi) onCancel();
            }}
        >
            <form
                className='lo-card'
                onSubmit={(e) => {
                    e.preventDefault();
                    onConfirm();
                }}
            >
                <h2 id='cm-title' className='lo-title'>{titre}</h2>
                <p id='cm-text' className='lo-text'>{texte}</p>

                {children}
                {erreur && <p className='lo-error' role='alert'>{erreur}</p>}

                <div className='lo-actions'>
                    <button type='submit' className='lo-btn lo-btn-danger' disabled={envoi}>
                        {envoi ? 'Suppression…' : confirmer}
                    </button>
                    {/* focus sur "Annuler" : appuyer sur Entrée par réflexe ne supprime rien */}
                    <button type='button' className='lo-btn lo-btn-secondary' onClick={onCancel} disabled={envoi} autoFocus>
                        Annuler
                    </button>
                </div>
            </form>
        </dialog>
    );
}

export default ConfirmModal;
