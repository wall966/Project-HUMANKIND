import { useEffect, useRef } from 'react';
import './AnnonceModal.css';

// "2026-10-25T13:30:00Z" → "Dimanche 25 octobre 2026 à 14 h 30" (heure locale)
function dateLongue(valeur) {
    const date = new Date(valeur);
    const jour = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const minutes = date.getMinutes() ? ` ${String(date.getMinutes()).padStart(2, '0')}` : '';
    return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} à ${date.getHours()} h${minutes}`;
}

// Détail d'une annonce, affiché par-dessus la liste (sans changer de page).
// annonce = null → fenêtre fermée.
function AnnonceModal({ annonce, onClose }) {
    const ref = useRef(null);

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (annonce && !dialog.open) dialog.showModal();
        if (!annonce && dialog.open) dialog.close();
    }, [annonce]);

    const auteur = annonce?.user?.name ?? 'Anonyme';

    return (
        <dialog
            ref={ref}
            className='am'
            aria-labelledby='am-title'
            // Échap
            onCancel={(e) => {
                e.preventDefault();
                onClose();
            }}
            // clic sur le fond assombri
            onClick={(e) => {
                if (e.target === ref.current) onClose();
            }}
        >
            {annonce && (
                <article className='am-card'>
                    <button type='button' className='am-close' onClick={onClose} aria-label='Fermer'>
                        ×
                    </button>

                    {annonce.category?.name && <span className='am-badge'>{annonce.category.name}</span>}
                    <h2 id='am-title' className='am-title'>{annonce.title}</h2>

                    <ul className='am-meta'>
                        <li>📅 {annonce.date_time ? dateLongue(annonce.date_time) : 'Date à définir'}</li>
                        <li>📍 {annonce.location ?? 'Lieu à préciser'}</li>
                    </ul>

                    <p className='am-text'>{annonce.description}</p>

                    <footer className='am-footer'>
                        <span className='am-author'>
                            <span className='am-avatar' aria-hidden='true'>{auteur.charAt(0).toUpperCase()}</span>
                            Proposé par <strong>{auteur}</strong>
                        </span>
                    </footer>
                </article>
            )}
        </dialog>
    );
}

export default AnnonceModal;
