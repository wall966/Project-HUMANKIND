import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import './Admin.css';
import Navbar from './Navbar';
import ConfirmModal from './ConfirmModal';

const API_URL = import.meta.env.VITE_API_URL;

// "Élève" → "eleve" : recherche sans accents ni majuscules
function normaliser(texte) {
    return (texte ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function dateCourte(valeur) {
    return valeur ? new Date(valeur).toLocaleDateString('fr-FR') : '—';
}

// Espace administrateur : voir et supprimer les utilisateurs et les annonces.
// La vraie protection est côté Laravel (middleware "admin") : sans droit, l'API répond 403.
function Admin() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const [onglet, setOnglet] = useState('users'); // 'users' | 'listings'
    const [users, setUsers] = useState([]);
    const [listings, setListings] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState(''); // '' | 'interdit' | message
    const [recherche, setRecherche] = useState('');

    // élément à supprimer : { type: 'user' | 'listing', item }
    const [aSupprimer, setASupprimer] = useState(null);
    const [envoi, setEnvoi] = useState(false);
    const [erreurSuppression, setErreurSuppression] = useState('');

    // Chargement des utilisateurs et des annonces
    useEffect(() => {
        if (!token) return;

        let annule = false;
        const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };

        async function charger() {
            try {
                const [repUsers, repListings] = await Promise.all([
                    fetch(`${API_URL}/admin/users`, { headers }),
                    fetch(`${API_URL}/admin/listings`, { headers }),
                ]);

                if (repUsers.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/');
                    return;
                }
                if (repUsers.status === 403) {
                    if (!annule) setErreur('interdit');
                    return;
                }
                if (!repUsers.ok || !repListings.ok) throw new Error();

                const [u, l] = await Promise.all([repUsers.json(), repListings.json()]);
                if (annule) return;
                setUsers(u);
                setListings(l);
            } catch {
                if (!annule) setErreur('Impossible de charger les données. Vérifiez que le serveur est lancé.');
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

    async function confirmerSuppression() {
        const { type, item } = aSupprimer;
        const url = type === 'user' ? `${API_URL}/admin/users/${item.id}` : `${API_URL}/admin/listings/${item.id}`;

        setEnvoi(true);
        setErreurSuppression('');
        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            });
            const data = await response.json();

            if (!response.ok) {
                setErreurSuppression(data.message ?? 'La suppression a échoué.');
                return;
            }

            if (type === 'user') {
                setUsers((prev) => prev.filter((u) => u.id !== item.id));
                // ses annonces ont été supprimées en cascade côté base
                setListings((prev) => prev.filter((l) => l.user_id !== item.id));
            } else {
                setListings((prev) => prev.filter((l) => l.id !== item.id));
                setUsers((prev) =>
                    prev.map((u) => (u.id === item.user_id ? { ...u, listings_count: u.listings_count - 1 } : u)),
                );
            }
            setASupprimer(null);
        } catch {
            setErreurSuppression('Impossible de joindre le serveur.');
        } finally {
            setEnvoi(false);
        }
    }

    const q = normaliser(recherche);
    const usersFiltres = users.filter((u) => normaliser(`${u.name} ${u.email}`).includes(q));
    const listingsFiltres = listings.filter((l) =>
        normaliser(`${l.title} ${l.user?.name} ${l.location} ${l.category?.name}`).includes(q),
    );

    const moi = (() => {
        try {
            return JSON.parse(localStorage.getItem('user'))?.id;
        } catch {
            return null;
        }
    })();

    return (
        <div className='ad'>
            <Navbar />

            <main className='ad-main'>
                <h1 className='ad-title'>Administration</h1>

                {chargement && <p className='ad-state'>Chargement…</p>}

                {!chargement && erreur === 'interdit' && (
                    <p className='ad-state ad-state-error'>Accès réservé aux administrateurs.</p>
                )}

                {!chargement && erreur && erreur !== 'interdit' && <p className='ad-state ad-state-error'>{erreur}</p>}

                {!chargement && !erreur && (
                    <>
                        <div className='ad-toolbar'>
                            <div className='ad-tabs' role='tablist' aria-label='Données'>
                                <button
                                    type='button'
                                    role='tab'
                                    aria-selected={onglet === 'users'}
                                    className={onglet === 'users' ? 'is-active' : ''}
                                    onClick={() => setOnglet('users')}
                                >
                                    Utilisateurs <span className='ad-count'>{users.length}</span>
                                </button>
                                <button
                                    type='button'
                                    role='tab'
                                    aria-selected={onglet === 'listings'}
                                    className={onglet === 'listings' ? 'is-active' : ''}
                                    onClick={() => setOnglet('listings')}
                                >
                                    Annonces <span className='ad-count'>{listings.length}</span>
                                </button>
                            </div>

                            <input
                                type='search'
                                className='ad-search'
                                placeholder={onglet === 'users' ? 'Rechercher un nom, un email…' : 'Rechercher un titre, un auteur, une ville…'}
                                aria-label='Rechercher'
                                value={recherche}
                                onChange={(e) => setRecherche(e.target.value)}
                            />
                        </div>

                        <div className='ad-table-wrap'>
                            {onglet === 'users' ? (
                                <table className='ad-table'>
                                    <thead>
                                        <tr>
                                            <th>Nom</th>
                                            <th>Email</th>
                                            <th>Annonces</th>
                                            <th>Inscrit le</th>
                                            <th><span className='ad-sr'>Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usersFiltres.map((u) => (
                                            <tr key={u.id}>
                                                <td>
                                                    {u.name}
                                                    {u.is_admin && <span className='ad-badge'>Admin</span>}
                                                </td>
                                                <td>{u.email}</td>
                                                <td>{u.listings_count}</td>
                                                <td>{dateCourte(u.created_at)}</td>
                                                <td className='ad-actions'>
                                                    {u.id !== moi && (
                                                        <button
                                                            type='button'
                                                            className='ad-delete'
                                                            onClick={() => setASupprimer({ type: 'user', item: u })}
                                                        >
                                                            Supprimer
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className='ad-table'>
                                    <thead>
                                        <tr>
                                            <th>Titre</th>
                                            <th>Auteur</th>
                                            <th>Catégorie</th>
                                            <th>Ville</th>
                                            <th>Demandes</th>
                                            <th>Publiée le</th>
                                            <th><span className='ad-sr'>Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {listingsFiltres.map((l) => (
                                            <tr key={l.id}>
                                                <td className='ad-strong'>{l.title}</td>
                                                <td>{l.user?.name ?? '—'}</td>
                                                <td>{l.category?.name ?? '—'}</td>
                                                <td>{l.location ?? '—'}</td>
                                                <td>{l.participations_count}</td>
                                                <td>{dateCourte(l.created_at)}</td>
                                                <td className='ad-actions'>
                                                    <button
                                                        type='button'
                                                        className='ad-delete'
                                                        onClick={() => setASupprimer({ type: 'listing', item: l })}
                                                    >
                                                        Supprimer
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {(onglet === 'users' ? usersFiltres : listingsFiltres).length === 0 && (
                                <p className='ad-empty'>Aucun résultat.</p>
                            )}
                        </div>
                    </>
                )}
            </main>

            <ConfirmModal
                open={Boolean(aSupprimer)}
                titre={aSupprimer?.type === 'user' ? 'Supprimer cet utilisateur ?' : 'Supprimer cette annonce ?'}
                texte={
                    aSupprimer?.type === 'user'
                        ? `${aSupprimer.item.name} (${aSupprimer.item.email}) sera supprimé, avec ses ${aSupprimer.item.listings_count} annonce(s) et ses participations. Action irréversible.`
                        : `« ${aSupprimer?.item.title ?? ''} » sera supprimée, avec ses demandes de participation. Action irréversible.`
                }
                confirmer='Supprimer'
                envoi={envoi}
                erreur={erreurSuppression}
                onConfirm={confirmerSuppression}
                onCancel={() => {
                    setASupprimer(null);
                    setErreurSuppression('');
                }}
            />
        </div>
    );
}

export default Admin;
