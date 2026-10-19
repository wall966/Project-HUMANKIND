import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import './Compte.css';
import Navbar from './Navbar';
import ConfirmModal from './ConfirmModal';

const API_URL = import.meta.env.VITE_API_URL;

function utilisateurConnecte() {
    try {
        return JSON.parse(localStorage.getItem('user')) ?? null;
    } catch {
        return null;
    }
}

// Page "Mon compte" : informations du compte et suppression définitive (droit à l'effacement, RGPD)
function Compte() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = utilisateurConnecte();

    const [confirmation, setConfirmation] = useState(false);
    const [motDePasse, setMotDePasse] = useState('');
    const [erreur, setErreur] = useState('');
    const [envoi, setEnvoi] = useState(false);

    if (!token) return <Navigate to='/' replace />;

    function fermer() {
        setConfirmation(false);
        setMotDePasse('');
        setErreur('');
    }

    async function supprimerCompte() {
        if (!motDePasse) {
            setErreur('Indiquez votre mot de passe pour confirmer.');
            return;
        }

        setEnvoi(true);
        setErreur('');
        try {
            const response = await fetch(`${API_URL}/user`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ password: motDePasse }),
            });

            if (response.ok) {
                // le compte n'existe plus : on vide le navigateur et on revient à l'accueil
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/', { replace: true, state: { compteSupprime: true } });
                return;
            }

            const data = await response.json();
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/', { replace: true });
                return;
            }
            setErreur(data.errors?.password?.[0] ?? data.message ?? 'La suppression a échoué.');
        } catch {
            setErreur('Impossible de joindre le serveur. Vérifiez votre connexion.');
        } finally {
            setEnvoi(false);
        }
    }

    return (
        <div className='ct'>
            <Navbar />

            <main className='ct-main'>
                <h1 className='ct-title'>Mon compte</h1>

                <section className='ct-card' aria-labelledby='ct-infos'>
                    <h2 id='ct-infos' className='ct-card-title'>Mes informations</h2>
                    <dl className='ct-infos'>
                        <dt>Nom</dt>
                        <dd>{user?.name ?? '—'}</dd>
                        <dt>Email</dt>
                        <dd>{user?.email ?? '—'}</dd>
                    </dl>
                </section>

                <section className='ct-card ct-danger' aria-labelledby='ct-suppr'>
                    <h2 id='ct-suppr' className='ct-card-title'>Supprimer mon compte</h2>
                    <p>
                        Votre compte, vos annonces et vos participations seront supprimés <strong>définitivement</strong>.
                        Cette action est irréversible.
                    </p>
                    <button type='button' className='ct-btn-danger' onClick={() => setConfirmation(true)}>
                        Supprimer mon compte
                    </button>
                </section>
            </main>

            <ConfirmModal
                open={confirmation}
                titre='Supprimer votre compte ?'
                texte='Toutes vos propositions et participations seront supprimées. Pour confirmer, saisissez votre mot de passe.'
                confirmer='Supprimer définitivement'
                envoi={envoi}
                erreur={erreur}
                onConfirm={supprimerCompte}
                onCancel={fermer}
            >
                <input
                    type='password'
                    className='lo-field'
                    placeholder='Mot de passe'
                    autoComplete='current-password'
                    aria-label='Mot de passe'
                    value={motDePasse}
                    onChange={(e) => {
                        setMotDePasse(e.target.value);
                        setErreur('');
                    }}
                    autoFocus
                />
            </ConfirmModal>
        </div>
    );
}

export default Compte;
