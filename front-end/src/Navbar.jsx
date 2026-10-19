import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import './Navbar.css';
import hands from './assets/hands.png';
import LogoutModal from './LogoutModal';

const API_URL = import.meta.env.VITE_API_URL;

// Utilisateur connecté, enregistré dans le localStorage au moment de la connexion
function utilisateurConnecte() {
    try {
        return JSON.parse(localStorage.getItem('user')) ?? null;
    } catch {
        return null;
    }
}

// Barre de navigation commune à toutes les pages de l'espace connecté
function Navbar() {
    const navigate = useNavigate();
    const user = utilisateurConnecte();
    const prenom = user?.name ?? '';

    const [confirmation, setConfirmation] = useState(false); // fenêtre "À bientôt ?" ouverte
    const [envoi, setEnvoi] = useState(false);               // déconnexion en cours

    async function deconnexion() {
        setEnvoi(true);
        const token = localStorage.getItem('token');
        try {
            // révoque le token côté Laravel (AuthController@logout)
            await fetch(`${API_URL}/logout`, {
                method: 'POST',
                headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
            });
        } catch {
            // même si le serveur ne répond pas, on déconnecte la personne côté navigateur
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/');
        }
    }

    return (
        <header className='nav'>
            <Link to='/annonces' className='nav-brand'>
                <img src={hands} alt='' className='nav-brand-logo' />
                <span className='nav-brand-name'>HumanKind</span>
            </Link>

            <nav className='nav-links' aria-label='Navigation principale'>
                <NavLink to='/annonces' className='nav-link'>Annonces</NavLink>
                <NavLink to='/mes-activites' className='nav-link'>Mes activités</NavLink>
                {/* visible seulement pour un admin ; la vraie protection est le middleware "admin" de l'API */}
                {user?.is_admin && <NavLink to='/admin' className='nav-link'>Admin</NavLink>}
            </nav>

            <div className='nav-actions'>
                <Link to='/formulaire' className='nav-cta'>
                    <span aria-hidden='true'>+</span> Proposer mon aide
                </Link>

                {prenom && (
                    <Link to='/compte' className='nav-user' title='Mon compte' aria-label={`Mon compte (${prenom})`}>
                        <span className='nav-user-text'>Bonjour, <strong>{prenom}</strong></span>
                        <span className='nav-avatar' aria-hidden='true'>{prenom.charAt(0).toUpperCase()}</span>
                    </Link>
                )}

                <button type='button' className='nav-logout' onClick={() => setConfirmation(true)}>
                    <span aria-hidden='true'>⇥</span> Déconnexion
                </button>
            </div>

            <LogoutModal
                open={confirmation}
                prenom={prenom}
                envoi={envoi}
                onConfirm={deconnexion}
                onCancel={() => setConfirmation(false)}
            />
        </header>
    );
}

export default Navbar;
