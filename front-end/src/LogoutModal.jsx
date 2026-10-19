import { useEffect, useRef } from 'react';
import './LogoutModal.css';
import hands from './assets/hands.png';

// Fenêtre de confirmation avant la déconnexion.
// On utilise la balise native <dialog> : le navigateur gère le fond assombri,
// la touche Échap et le fait que le clavier reste dans la fenêtre.
function LogoutModal({ open, prenom, envoi, onConfirm, onCancel }) {
    const ref = useRef(null);

    // Ouvre ou ferme le <dialog> quand "open" change
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
            aria-labelledby='lo-title'
            aria-describedby='lo-text'
            // Échap : on passe par onCancel pour garder l'état React à jour
            onCancel={(e) => {
                e.preventDefault();
                if (!envoi) onCancel();
            }}
            // Clic sur le fond assombri (en dehors de la carte) = "Rester connecté"
            onClick={(e) => {
                if (e.target === ref.current && !envoi) onCancel();
            }}
        >
            <div className='lo-card'>
                <img src={hands} alt='' className='lo-logo' />

                <h2 id='lo-title' className='lo-title'>
                    À bientôt{prenom ? `, ${prenom}` : ''} ?
                </h2>

                <p id='lo-text' className='lo-text'>
                    Vous allez être déconnecté de HumanKind. Vos annonces et vos participations restent enregistrées.
                </p>

                <div className='lo-actions'>
                    <button type='button' className='lo-btn lo-btn-primary' onClick={onConfirm} disabled={envoi}>
                        {envoi ? 'Déconnexion…' : 'Se déconnecter'}
                    </button>
                    {/* autoFocus sur le choix le moins risqué : Entrée par erreur ne déconnecte pas */}
                    <button
                        type='button'
                        className='lo-btn lo-btn-secondary'
                        onClick={onCancel}
                        disabled={envoi}
                        autoFocus
                    >
                        Rester connecté
                    </button>
                </div>
            </div>
        </dialog>
    );
}

export default LogoutModal;
