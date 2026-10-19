import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import './Dashboard.css';
import Navbar from './Navbar';
import AnnonceModal from './AnnonceModal';

const API_URL = import.meta.env.VITE_API_URL;
const PAR_PAGE = 6;
const FILTRES_VIDES = { q: '', categorie: '', date: '', lieu: '', rayon: '' };
const RAYONS = [5, 10, 25, 50]; // en km
const LIBELLES_STATUT = { pending: 'En attente', approved: 'Validée', rejected: 'Refusée' };

// id de l'utilisateur connecté (enregistré au moment de la connexion)
function idConnecte() {
    try {
        return JSON.parse(localStorage.getItem('user'))?.id ?? null;
    } catch {
        return null;
    }
}

// Distance "à vol d'oiseau" entre deux points GPS (formule de haversine), en km
function distanceKm(a, b) {
    const R = 6371; // rayon de la Terre en km
    const rad = (deg) => (deg * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLon = rad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}

// 1.234 → "1,2 km" ; 0.4 → "400 m"
function formatDistance(km) {
    if (km < 1) return `${Math.round(km * 10) * 100} m`;
    return `${km.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
}

// "Montpellier" → { lat, lon } avec Photon (première ville trouvée), ou null
async function geocoder(texte) {
    const params = new URLSearchParams({ q: texte, limit: '1', lang: 'fr' });
    ['city', 'district', 'locality'].forEach((layer) => params.append('layer', layer));
    const data = await (await fetch(`https://photon.komoot.io/api/?${params}`)).json();
    const coords = data.features?.[0]?.geometry?.coordinates; // [longitude, latitude]
    return coords ? { lat: coords[1], lon: coords[0] } : null;
}

// "Élève" → "eleve" : pour chercher sans tenir compte des accents ni des majuscules
function normaliser(texte) {
    return (texte ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Date ISO de l'API → "2026-10-18" en heure locale (pour comparer avec le champ date)
function jourLocal(valeur) {
    const date = new Date(valeur);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
}

// "2026-10-18T10:00" → "Sam. 18 oct · 10 h"
function formatDate(valeur) {
    const date = new Date(valeur);
    const jour = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    const minutes = date.getMinutes() ? ` ${String(date.getMinutes()).padStart(2, '0')}` : '';
    return `${jour.charAt(0).toUpperCase()}${jour.slice(1).replace(/\.$/, '')} · ${date.getHours()} h${minutes}`;
}

function Dashboard() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const moiId = idConnecte();
    // titre de l'annonce qui vient d'être publiée (envoyé par le formulaire)
    const publiee = useLocation().state?.publiee;

    // Données de l'API
    const [annonces, setAnnonces] = useState([]);
    const [categories, setCategories] = useState([]);
    // statut de MES demandes, par annonce : { 16: 'pending', 18: 'approved' }
    const [statuts, setStatuts] = useState({});
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState('');
    const [essai, setEssai] = useState(0); // incrémenté par le bouton "Réessayer"

    // Filtres : "brouillon" = ce qui est tapé, "filtres" = ce qui est appliqué après "Rechercher"
    const [brouillon, setBrouillon] = useState(FILTRES_VIDES);
    const [filtres, setFiltres] = useState(FILTRES_VIDES);
    const [tri, setTri] = useState('recentes');
    const [page, setPage] = useState(1);
    const [localisation, setLocalisation] = useState(''); // message du bouton "ma position"
    const [annonceOuverte, setAnnonceOuverte] = useState(null); // annonce affichée par-dessus la liste
    // Point de départ du rayon : "positionGps" = bouton ⌖ (pas encore appliqué), "origine" = appliqué
    const [positionGps, setPositionGps] = useState(null); // { lat, lon, nom }
    const [origine, setOrigine] = useState(null); // { lat, lon }
    const [recherche, setRecherche] = useState(false); // géocodage en cours

    // 1. Chargement des annonces et des catégories
    useEffect(() => {
        if (!token) return;

        let annule = false;
        const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };

        async function charger() {
            try {
                const [repAnnonces, repCategories, repActivites] = await Promise.all([
                    fetch(`${API_URL}/listings`, { headers }),
                    fetch(`${API_URL}/categories`, { headers }),
                    fetch(`${API_URL}/my-activities`, { headers }),
                ]);

                // token expiré ou révoqué → retour à la connexion
                if (repAnnonces.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/');
                    return;
                }
                if (!repAnnonces.ok) throw new Error();

                const donnees = await repAnnonces.json();
                const cats = repCategories.ok ? await repCategories.json() : [];
                const activites = repActivites.ok ? await repActivites.json() : [];
                if (annule) return;
                setAnnonces(donnees);
                setCategories(cats);
                setStatuts(Object.fromEntries(activites.map((p) => [p.listing_id, p.status])));
                setErreur('');
            } catch {
                if (!annule) setErreur('Impossible de charger les annonces. Vérifiez que le serveur est lancé.');
            } finally {
                if (!annule) setChargement(false);
            }
        }

        charger();
        return () => {
            annule = true; // la page a été quittée : on ignore la réponse
        };
    }, [token, navigate, essai]);

    // 2. Filtrage et tri (recalculés seulement quand les données ou les filtres changent)
    const resultats = useMemo(() => {
        const q = normaliser(filtres.q);
        const lieu = normaliser(filtres.lieu);

        // distance de chaque annonce au point de départ (null si l'un des deux n'a pas de coordonnées)
        const avecDistance = annonces.map((a) => ({
            ...a,
            distance: origine && a.latitude != null ? distanceKm(origine, { lat: a.latitude, lon: a.longitude }) : null,
        }));

        const liste = avecDistance.filter((a) => {
            if (q && !normaliser(`${a.title} ${a.description}`).includes(q)) return false;
            if (filtres.categorie && String(a.category_id) !== filtres.categorie) return false;
            if (filtres.date && (!a.date_time || jourLocal(a.date_time) !== filtres.date)) return false;

            if (filtres.rayon && origine) {
                // rayon actif : on garde les annonces à moins de X km (les villes voisines comprises)
                if (a.distance === null || a.distance > Number(filtres.rayon)) return false;
            } else if (lieu && !normaliser(a.location).includes(lieu)) {
                // sans rayon : le nom de la ville doit correspondre
                return false;
            }
            return true;
        });

        if (tri === 'proches') {
            // les plus proches d'abord, celles sans distance à la fin
            return [...liste].sort((a, b) => {
                if (a.distance === null) return 1;
                if (b.distance === null) return -1;
                return a.distance - b.distance;
            });
        }

        if (tri === 'date') {
            // les activités les plus proches dans le temps d'abord, celles sans date à la fin
            return [...liste].sort((a, b) => {
                if (!a.date_time) return 1;
                if (!b.date_time) return -1;
                return new Date(a.date_time) - new Date(b.date_time);
            });
        }
        return liste; // l'API renvoie déjà les plus récentes d'abord
    }, [annonces, filtres, tri, origine]);

    // 3. Pagination
    const totalPages = Math.max(1, Math.ceil(resultats.length / PAR_PAGE));
    const pageCourante = Math.min(page, totalPages);
    const annoncesPage = resultats.slice((pageCourante - 1) * PAR_PAGE, pageCourante * PAR_PAGE);

    // Pas connecté → page de connexion
    if (!token) return <Navigate to='/' replace />;

    function changer(e) {
        const { name, value } = e.target;
        setBrouillon((prev) => ({ ...prev, [name]: value }));
    }

    async function rechercher(e) {
        e.preventDefault();
        setLocalisation('');

        // Point de départ : la position GPS si la ville n'a pas été modifiée depuis le bouton ⌖,
        // sinon les coordonnées de la ville tapée (Photon)
        let point = null;
        const lieu = brouillon.lieu.trim();
        if (lieu) {
            if (positionGps && positionGps.nom === lieu) {
                point = { lat: positionGps.lat, lon: positionGps.lon };
            } else {
                setRecherche(true);
                try {
                    point = await geocoder(lieu);
                } catch {
                    point = null;
                } finally {
                    setRecherche(false);
                }
            }
            if (!point && brouillon.rayon) setLocalisation(`Ville « ${lieu} » introuvable : le rayon est ignoré.`);
        } else if (brouillon.rayon) {
            setLocalisation('Indiquez une ville ou utilisez ⌖ pour chercher dans un rayon.');
        }

        setOrigine(point);
        setFiltres(brouillon);
        setPage(1);
        if (point && tri === 'recentes') setTri('proches'); // avec un lieu, les plus proches d'abord
    }

    function retirerFiltre(nom) {
        // le lieu et le rayon vont ensemble
        const champs = nom === 'lieu' ? ['lieu', 'rayon'] : [nom];
        const vide = Object.fromEntries(champs.map((c) => [c, '']));
        setFiltres((prev) => ({ ...prev, ...vide }));
        setBrouillon((prev) => ({ ...prev, ...vide }));
        if (nom === 'lieu') {
            setOrigine(null);
            if (tri === 'proches') setTri('recentes');
        }
        setPage(1);
    }

    function toutEffacer() {
        setFiltres(FILTRES_VIDES);
        setBrouillon(FILTRES_VIDES);
        setOrigine(null);
        if (tri === 'proches') setTri('recentes');
        setPage(1);
    }

    // Bouton ⌖ : position du navigateur → nom de la ville (Photon, géocodage inversé)
    function maPosition() {
        if (!navigator.geolocation) {
            setLocalisation("Votre navigateur ne permet pas la géolocalisation.");
            return;
        }
        setLocalisation('Recherche de votre position…');
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                try {
                    const url = `https://photon.komoot.io/reverse?lat=${coords.latitude}&lon=${coords.longitude}&lang=fr`;
                    const data = await (await fetch(url)).json();
                    const p = data.features?.[0]?.properties ?? {};
                    const nom = p.city ?? p.name ?? 'Ma position';
                    setBrouillon((prev) => ({ ...prev, lieu: nom, rayon: prev.rayon || '10' }));
                    // on garde la position exacte : plus précise que le centre de la ville
                    setPositionGps({ lat: coords.latitude, lon: coords.longitude, nom });
                    setLocalisation('');
                } catch {
                    setLocalisation('Impossible de trouver votre ville.');
                }
            },
            () => setLocalisation('Position refusée ou indisponible.'),
        );
    }

    const nomCategorie = (id) => categories.find((c) => c.id === id)?.name;

    // Étiquettes des filtres actifs
    const filtresActifs = [
        filtres.q && { nom: 'q', texte: `« ${filtres.q} »` },
        filtres.categorie && { nom: 'categorie', texte: nomCategorie(Number(filtres.categorie)) ?? 'Catégorie' },
        filtres.date && { nom: 'date', texte: new Date(filtres.date).toLocaleDateString('fr-FR') },
        filtres.lieu && {
            nom: 'lieu',
            texte: filtres.rayon && origine ? `${filtres.lieu} · ${filtres.rayon} km` : filtres.lieu,
        },
    ].filter(Boolean);

    return (
        <div className='db'>
            <Navbar />

            <main className='db-main'>
                <h1 className='db-title'>Ce que vos voisins vous proposent</h1>
                <p className='db-subtitle'>
                    Des activités, des savoirs et des coups de main offerts près de chez vous, à la date qui vous convient.
                </p>

                {publiee && (
                    <p className='db-success' role='status'>
                        🙌 Votre proposition « {publiee} » a été publiée. Merci !
                    </p>
                )}

                {/* Filtres */}
                <form className='db-filters' onSubmit={rechercher}>
                    <div className='db-field db-field-q'>
                        <label htmlFor='q'>Mots-clés</label>
                        <input
                            id='q'
                            name='q'
                            type='search'
                            value={brouillon.q}
                            onChange={changer}
                            placeholder='Ex. : courses, jardinage, accompagnement…'
                        />
                    </div>

                    <div className='db-field'>
                        <label htmlFor='categorie'>Catégorie</label>
                        <select id='categorie' name='categorie' value={brouillon.categorie} onChange={changer}>
                            <option value=''>Toutes</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className='db-field'>
                        <label htmlFor='date'>Date</label>
                        <input id='date' name='date' type='date' value={brouillon.date} onChange={changer} />
                    </div>

                    <div className='db-field'>
                        <label htmlFor='lieu'>Lieu</label>
                        <div className='db-place'>
                            <input
                                id='lieu'
                                name='lieu'
                                type='text'
                                value={brouillon.lieu}
                                onChange={changer}
                                placeholder='Ville'
                                autoComplete='off'
                            />
                            <button
                                type='button'
                                className='db-locate'
                                onClick={maPosition}
                                title='Utiliser ma position'
                                aria-label='Utiliser ma position'
                            >
                                ⌖
                            </button>
                        </div>
                        {localisation && <p className='db-hint'>{localisation}</p>}
                    </div>

                    <div className='db-field'>
                        <label htmlFor='rayon'>Rayon</label>
                        <select id='rayon' name='rayon' value={brouillon.rayon} onChange={changer}>
                            <option value=''>Ville exacte</option>
                            {RAYONS.map((km) => (
                                <option key={km} value={km}>{km} km</option>
                            ))}
                        </select>
                    </div>

                    <button type='submit' className='db-search' disabled={recherche}>
                        <span aria-hidden='true'>⌕</span> {recherche ? 'Recherche…' : 'Rechercher'}
                    </button>
                </form>

                {/* Barre des résultats */}
                <div className='db-toolbar'>
                    <div className='db-count'>
                        <strong>{resultats.length} annonce{resultats.length > 1 ? 's' : ''}</strong>
                        {filtresActifs.length > 0 && (
                            <>
                                <span className='db-muted'> · filtres actifs :</span>
                                {filtresActifs.map((f) => (
                                    <button
                                        key={f.nom}
                                        type='button'
                                        className='db-chip'
                                        onClick={() => retirerFiltre(f.nom)}
                                        aria-label={`Retirer le filtre ${f.texte}`}
                                    >
                                        {f.texte} <span aria-hidden='true'>×</span>
                                    </button>
                                ))}
                                <button type='button' className='db-clear' onClick={toutEffacer}>Tout effacer</button>
                            </>
                        )}
                    </div>

                    <div className='db-sort'>
                        <label htmlFor='tri'>Trier par</label>
                        <select
                            id='tri'
                            value={tri}
                            onChange={(e) => {
                                setTri(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value='recentes'>Plus récentes</option>
                            <option value='date'>Date de l’activité</option>
                            {/* trier par distance n'a de sens qu'avec un point de départ */}
                            <option value='proches' disabled={!origine}>Plus proches</option>
                        </select>

                        <div className='db-view' role='group' aria-label='Affichage'>
                            <button type='button' className='is-active' aria-pressed='true'>Liste</button>
                            <button type='button' disabled title='Bientôt disponible'>Carte</button>
                        </div>
                    </div>
                </div>

                {/* Liste des annonces */}
                {chargement && <p className='db-state'>Chargement des annonces…</p>}

                {!chargement && erreur && (
                    <div className='db-state db-state-error'>
                        <p>{erreur}</p>
                        <button
                            type='button'
                            className='db-outline'
                            onClick={() => {
                                setChargement(true);
                                setEssai((n) => n + 1);
                            }}
                        >
                            Réessayer
                        </button>
                    </div>
                )}

                {!chargement && !erreur && resultats.length === 0 && (
                    <div className='db-state'>
                        <p>Aucune annonce ne correspond à votre recherche.</p>
                        {filtresActifs.length > 0 && (
                            <button type='button' className='db-outline' onClick={toutEffacer}>Effacer les filtres</button>
                        )}
                    </div>
                )}

                {!chargement && !erreur && resultats.length > 0 && (
                    <>
                        <ul className='db-grid'>
                            {annoncesPage.map((a) => {
                                const auteur = a.user?.name ?? 'Anonyme';
                                const categorie = a.category?.name ?? nomCategorie(a.category_id);
                                return (
                                    <li key={a.id} className='db-card'>
                                        <div className='db-card-top'>
                                            {categorie && <span className='db-badge'>{categorie}</span>}
                                            {statuts[a.id] && (
                                                <span className={`db-status db-status-${statuts[a.id]}`}>
                                                    {LIBELLES_STATUT[statuts[a.id]]}
                                                </span>
                                            )}
                                        </div>
                                        <h2 className='db-card-title'>{a.title}</h2>
                                        <p className='db-card-text'>{a.description}</p>

                                        <p className='db-card-meta'>
                                            <span>📅 {a.date_time ? formatDate(a.date_time) : 'Date à définir'}</span>
                                            <span>
                                                📍 {a.location ?? 'Lieu à préciser'}
                                                {a.distance !== null && ` · ${formatDistance(a.distance)}`}
                                            </span>
                                        </p>

                                        <div className='db-card-footer'>
                                            <span className='db-author'>
                                                <span className='db-author-avatar' aria-hidden='true'>
                                                    {auteur.charAt(0).toUpperCase()}
                                                </span>
                                                {auteur}
                                            </span>
                                            <button type='button' className='db-outline' onClick={() => setAnnonceOuverte(a)}>
                                                Voir l’annonce
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        {totalPages > 1 && (
                            <nav className='db-pagination' aria-label='Pagination'>
                                <button
                                    type='button'
                                    onClick={() => setPage(pageCourante - 1)}
                                    disabled={pageCourante === 1}
                                    aria-label='Page précédente'
                                >
                                    ‹
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                                    <button
                                        key={n}
                                        type='button'
                                        onClick={() => setPage(n)}
                                        className={n === pageCourante ? 'is-active' : ''}
                                        aria-current={n === pageCourante ? 'page' : undefined}
                                    >
                                        {n}
                                    </button>
                                ))}
                                <button
                                    type='button'
                                    onClick={() => setPage(pageCourante + 1)}
                                    disabled={pageCourante === totalPages}
                                    aria-label='Page suivante'
                                >
                                    ›
                                </button>
                            </nav>
                        )}
                    </>
                )}
            </main>

            {/* Détail de l'annonce, par-dessus la liste */}
            <AnnonceModal
                annonce={annonceOuverte}
                onClose={() => setAnnonceOuverte(null)}
                moiId={moiId}
                statut={annonceOuverte ? statuts[annonceOuverte.id] : undefined}
                onParticipation={(listingId, statut) => setStatuts((prev) => ({ ...prev, [listingId]: statut }))}
            />
        </div>
    );
}

export default Dashboard;
