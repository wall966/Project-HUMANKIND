import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import './MesActivites.css';
import Navbar from './Navbar';

const API_URL = import.meta.env.VITE_API_URL;

const STATUTS = {
    pending: { texte: 'En attente', icone: '🟡' },
    approved: { texte: 'Validée', icone: '🟢' },
    rejected: { texte: 'Refusée', icone: '🔴' },
};

// "2026-10-25T13:30:00Z" → "Dim. 25 oct. · 14 h 30"
function formatDate(valeur) {
    if (!valeur) return 'Date à définir';
    const date = new Date(valeur);
    const jour = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    const minutes = date.getMinutes() ? ` ${String(date.getMinutes()).padStart(2, '0')}` : '';
    return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} · ${date.getHours()} h${minutes}`;
}

function Badge({ statut }) {
    const s = STATUTS[statut] ?? STATUTS.pending;
    return (
        <span className={`ma-badge ma-badge-${statut}`}>
            <span aria-hidden='true'>{s.icone}</span> {s.texte}
        </span>
    );
}

// "Mes activités" : mes demandes de participation, et les demandes reçues sur mes annonces
function MesActivites() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [params, setParams] = useSearchParams();
    const onglet = params.get('onglet') === 'annonces' ? 'annonces' : 'demandes';

    const [demandes, setDemandes] = useState([]); // mes participations
    const [annonces, setAnnonces] = useState([]); // mes annonces + demandes reçues
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState('');
    const [enCours, setEnCours] = useState(null); // id de la demande en train d'être validée/refusée
    const [erreurAction, setErreurAction] = useState('');

    useEffect(() => {
        if (!token) return;

        let annule = false;
        const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };

        async function charger() {
            try {
                const [repDemandes, repAnnonces] = await Promise.all([
                    fetch(`${API_URL}/my-activities`, { headers }),
                    fetch(`${API_URL}/my-listings`, { headers }),
                ]);
                if (repDemandes.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/');
                    return;
                }
                if (!repDemandes.ok || !repAnnonces.ok) throw new Error();

                const [d, a] = await Promise.all([repDemandes.json(), repAnnonces.json()]);
                if (annule) return;
                setDemandes(d.filter((p) => p.listing)); // une annonce supprimée n'a plus de détail
                setAnnonces(a);
            } catch {
                if (!annule) setErreur('Impossible de charger vos activités. Vérifiez que le serveur est lancé.');
            } finally {
                if (!annule) setChargement(false);
            }
        }

        charger();
        return () => {
            annule = true;
        };
    }, [token, navigate]);

    if (!token) return <Navigate to='/' replace />;

    // Valider ou refuser une demande reçue
    async function repondre(participation, statut) {
        setEnCours(participation.id);
        setErreurAction('');
        try {
            const response = await fetch(`${API_URL}/participations/${participation.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: statut }),
            });
            const data = await response.json();
            if (!response.ok) {
                setErreurAction(data.message ?? 'L’action a échoué.');
                return;
            }
            // mise à jour locale, sans recharger la page
            setAnnonces((prev) =>
                prev.map((annonce) => ({
                    ...annonce,
                    participations: annonce.participations.map((p) =>
                        p.id === participation.id ? { ...p, status: data.status } : p,
                    ),
                })),
            );
        } catch {
            setErreurAction('Impossible de joindre le serveur.');
        } finally {
            setEnCours(null);
        }
    }

    const enAttente = annonces.reduce(
        (total, a) => total + a.participations.filter((p) => p.status === 'pending').length,
        0,
    );

    return (
        <div className='ma'>
            <Navbar />

            <main className='ma-main'>
                <h1 className='ma-title'>Mes activités</h1>

                <div className='ma-tabs' role='tablist' aria-label='Mes activités'>
                    <button
                        type='button'
                        role='tab'
                        aria-selected={onglet === 'demandes'}
                        className={onglet === 'demandes' ? 'is-active' : ''}
                        onClick={() => setParams({})}
                    >
                        Mes demandes <span className='ma-count'>{demandes.length}</span>
                    </button>
                    <button
                        type='button'
                        role='tab'
                        aria-selected={onglet === 'annonces'}
                        className={onglet === 'annonces' ? 'is-active' : ''}
                        onClick={() => setParams({ onglet: 'annonces' })}
                    >
                        Demandes reçues
                        {enAttente > 0 && <span className='ma-count ma-count-alert'>{enAttente}</span>}
                    </button>
                </div>

                {chargement && <p className='ma-state'>Chargement…</p>}
                {!chargement && erreur && <p className='ma-state ma-state-error'>{erreur}</p>}

                {/* ---------- Mes demandes ---------- */}
                {!chargement && !erreur && onglet === 'demandes' && (
                    demandes.length === 0 ? (
                        <div className='ma-state'>
                            <p>Vous n’avez encore demandé à participer à aucune activité.</p>
                            <Link to='/annonces' className='ma-link'>Voir les annonces</Link>
                        </div>
                    ) : (
                        <ul className='ma-list'>
                            {demandes.map((p) => {
                                const l = p.listing;
                                return (
                                    <li key={p.id} className='ma-card'>
                                        <div className='ma-card-head'>
                                            <div>
                                                {l.category?.name && <span className='ma-cat'>{l.category.name}</span>}
                                                <h2 className='ma-card-title'>{l.title}</h2>
                                            </div>
                                            <Badge statut={p.status} />
                                        </div>

                                        <p className='ma-meta'>
                                            📅 {formatDate(l.date_time)} · 📍 {l.location ?? 'Lieu à préciser'} · par {l.user?.name ?? 'Anonyme'}
                                        </p>
                                        {p.comment && <p className='ma-comment'>Votre message : « {p.comment} »</p>}

                                        {p.status === 'approved' && (
                                            <div className='ma-private'>
                                                <p className='ma-private-title'>🔒 Informations pour vous retrouver</p>
                                                <ul>
                                                    <li>📍 {l.address ?? 'Adresse non renseignée'}</li>
                                                    {l.contact_phone && (
                                                        <li>📞 <a href={`tel:${l.contact_phone.replace(/\s/g, '')}`}>{l.contact_phone}</a></li>
                                                    )}
                                                    {l.user?.email && (
                                                        <li>✉️ <a href={`mailto:${l.user.email}`}>{l.user.email}</a></li>
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                        {p.status === 'pending' && (
                                            <p className='ma-hint'>
                                                L’adresse et le contact apparaîtront ici dès que l’organisateur aura validé votre demande.
                                            </p>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )
                )}

                {/* ---------- Demandes reçues sur mes annonces ---------- */}
                {!chargement && !erreur && onglet === 'annonces' && (
                    annonces.length === 0 ? (
                        <div className='ma-state'>
                            <p>Vous n’avez pas encore publié d’annonce.</p>
                            <Link to='/formulaire' className='ma-link'>Proposer mon aide</Link>
                        </div>
                    ) : (
                        <>
                            {erreurAction && <p className='ma-state ma-state-error' role='alert'>{erreurAction}</p>}
                            <ul className='ma-list'>
                                {annonces.map((a) => (
                                    <li key={a.id} className='ma-card'>
                                        <div className='ma-card-head'>
                                            <div>
                                                {a.category?.name && <span className='ma-cat'>{a.category.name}</span>}
                                                <h2 className='ma-card-title'>{a.title}</h2>
                                            </div>
                                            <span className='ma-total'>
                                                {a.participations.length} demande{a.participations.length > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <p className='ma-meta'>
                                            📅 {formatDate(a.date_time)} · 📍 {a.location ?? 'Lieu à préciser'}
                                            {a.address && ` · 🔒 ${a.address}`}
                                        </p>

                                        {a.participations.length === 0 ? (
                                            <p className='ma-hint'>Aucune demande pour le moment.</p>
                                        ) : (
                                            <ul className='ma-requests'>
                                                {a.participations.map((p) => {
                                                    const nom = p.user?.name ?? 'Utilisateur supprimé';
                                                    return (
                                                        <li key={p.id} className='ma-request'>
                                                            <span className='ma-avatar' aria-hidden='true'>{nom.charAt(0).toUpperCase()}</span>
                                                            <div className='ma-request-body'>
                                                                <strong>{nom}</strong>
                                                                <p>{p.comment ? `« ${p.comment} »` : 'Pas de message.'}</p>
                                                            </div>
                                                            {p.status === 'pending' ? (
                                                                <div className='ma-actions'>
                                                                    <button
                                                                        type='button'
                                                                        className='ma-btn ma-btn-ok'
                                                                        onClick={() => repondre(p, 'approved')}
                                                                        disabled={enCours === p.id}
                                                                    >
                                                                        Valider
                                                                    </button>
                                                                    <button
                                                                        type='button'
                                                                        className='ma-btn ma-btn-no'
                                                                        onClick={() => repondre(p, 'rejected')}
                                                                        disabled={enCours === p.id}
                                                                    >
                                                                        Refuser
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <Badge statut={p.status} />
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )
                )}
            </main>
        </div>
    );
}

export default MesActivites;
