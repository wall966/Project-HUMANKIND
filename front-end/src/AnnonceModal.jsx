import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import './AnnonceModal.css';

const API_URL = import.meta.env.VITE_API_URL;

// "2026-10-25T13:30:00Z" → "Dimanche 25 octobre 2026 à 14 h 30" (heure locale)
function dateLongue(valeur) {
    const date = new Date(valeur);
    const jour = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const minutes = date.getMinutes() ? ` ${String(date.getMinutes()).padStart(2, '0')}` : '';
    return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} à ${date.getHours()} h${minutes}`;
}

const STATUTS = {
    pending: { classe: 'pending', texte: '🟡 Demande envoyée : en attente de validation par l’organisateur.' },
    approved: { classe: 'approved', texte: '🟢 Participation validée ! L’adresse et le contact sont dans « Mes activités ».' },
    rejected: { classe: 'rejected', texte: '🔴 Votre demande n’a pas été retenue pour cette activité.' },
};

// Partie "Participer" de la fenêtre : propre annonce, statut déjà connu, ou formulaire de demande
function Participation({ annonce, moiId, statut, onParticipation }) {
    const [commentaire, setCommentaire] = useState('');
    const [envoi, setEnvoi] = useState(false);
    const [erreur, setErreur] = useState('');

    if (annonce.user_id === moiId) {
        return (
            <p className='am-info'>
                C’est votre annonce. Les demandes reçues sont dans{' '}
                <Link to='/mes-activites?onglet=annonces'>Mes activités</Link>.
            </p>
        );
    }

    if (statut) {
        const s = STATUTS[statut] ?? STATUTS.pending;
        return <p className={`am-status am-status-${s.classe}`} role='status'>{s.texte}</p>;
    }

    async function participer(e) {
        e.preventDefault();
        setEnvoi(true);
        setErreur('');
        try {
            const response = await fetch(`${API_URL}/listings/${annonce.id}/participate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ comment: commentaire.trim() || null }),
            });
            const data = await response.json();

            if (response.status === 201) {
                onParticipation(annonce.id, data.status ?? 'pending');
                return;
            }
            // 409 = déjà demandé, 403 = propre annonce, 422 = commentaire trop long
            setErreur(data.errors?.comment?.[0] ?? data.message ?? 'La demande a échoué. Réessayez.');
        } catch {
            setErreur('Impossible de joindre le serveur. Vérifiez votre connexion.');
        } finally {
            setEnvoi(false);
        }
    }

    return (
        <form className='am-participer' onSubmit={participer}>
            <label htmlFor='am-commentaire'>Un petit mot pour l’organisateur (facultatif)</label>
            <textarea
                id='am-commentaire'
                rows={3}
                maxLength={255}
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder='Ex. : Bonjour, je serais ravi de venir !'
            />
            <div className='am-participer-bas'>
                <span className='am-compteur'>{commentaire.length} / 255</span>
                <button type='submit' className='am-btn' disabled={envoi}>
                    {envoi ? 'Envoi…' : 'Participer'}
                </button>
            </div>
            {erreur && <p className='am-erreur' role='alert'>{erreur}</p>}
        </form>
    );
}

// Détail d'une annonce, affiché par-dessus la liste (sans changer de page).
// annonce = null → fenêtre fermée.
function AnnonceModal({ annonce, onClose, moiId, statut, onParticipation }) {
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

                    {/* key : le formulaire repart à zéro quand on ouvre une autre annonce */}
                    <Participation
                        key={annonce.id}
                        annonce={annonce}
                        moiId={moiId}
                        statut={statut}
                        onParticipation={onParticipation}
                    />
                </article>
            )}
        </dialog>
    );
}

export default AnnonceModal;
