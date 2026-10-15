import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import './Welcome.css';
import hands from './assets/hands.png';

// Adresse de l'API Laravel, lue dans le fichier .env du front ("VITE_API_URL")
const API_URL = import.meta.env.VITE_API_URL;

function Welcome() {
    const navigate = useNavigate();

    // 1. L'ÉTAT : ce que la personne tape, les erreurs et l'envoi en cours
    const [values, setValues] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});      // erreurs par champ : { email: '...', password: '...' }
    const [message, setMessage] = useState('');    // erreur générale (identifiants invalides, serveur...)
    const [sending, setSending] = useState(false); // true pendant l'appel à l'API

    // 2. Mettre à jour un champ (et effacer son ancienne erreur)
    function handleChange(e) {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
        setMessage('');
    }

    // 3. Vérifications avant d'appeler l'API (le back-end vérifie aussi, c'est lui qui fait foi)
    function validate() {
        const newErrors = {};
        if (!values.email.trim()) newErrors.email = 'Indiquez votre email.';
        else if (!/^\S+@\S+\.\S+$/.test(values.email)) newErrors.email = 'Cet email ne semble pas valide.';
        if (!values.password) newErrors.password = 'Indiquez votre mot de passe.';
        return newErrors;
    }

    // 4. Envoi du formulaire
    async function handleSubmit(e) {
        e.preventDefault(); // empêche le rechargement de la page

        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSending(true);
        setMessage('');

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json', // sinon Laravel répond en HTML en cas d'erreur
                },
                body: JSON.stringify({
                    email: values.email.trim(),
                    password: values.password,
                }),
            });
            const data = await response.json();

            // 200 : connecté → on garde le token pour les prochaines requêtes
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/formulaire');
                return;
            }

            // 401 : email ou mot de passe incorrect (AuthController@login)
            if (response.status === 401) {
                setMessage('Email ou mot de passe incorrect.');
                return;
            }

            // 422 : erreurs de validation de Laravel (LoginRequest) → sous chaque champ
            if (response.status === 422) {
                const fieldErrors = {};
                Object.entries(data.errors ?? {}).forEach(([field, messages]) => {
                    fieldErrors[field] = messages[0];
                });
                setErrors(fieldErrors);
                return;
            }

            setMessage('Une erreur est survenue. Réessayez dans un instant.');
        } catch {
            // fetch échoue si le serveur Laravel est éteint ou injoignable
            setMessage('Impossible de joindre le serveur. Vérifiez votre connexion.');
        } finally {
            setSending(false);
        }
    }

    // 5. L'AFFICHAGE
    return (
        <main className='welcome'>
            <img src={hands} alt="Mains tendues" className="welcome-hands" />
            <h1 className='welcome-human'>HumanKind</h1>
            <p className='welcome-text'>
                Connecter les gens, ce n’est pas seulement une question de technologie.
                C’est aussi une question d’écoute, de présence et d’humanité.
                Nous sommes le pont entre l’être et le ressenti.
            </p>


            <form className='welcome-form' onSubmit={handleSubmit} noValidate>
                <div className='welcome-field'>
                    <input
                        type="email"
                        name='email'
                        placeholder='Email'
                        autoComplete='email'
                        value={values.email}
                        onChange={handleChange}
                        className={errors.email ? 'is-invalid' : ''}
                        aria-invalid={Boolean(errors.email)}
                    />
                    {errors.email && <p className='welcome-error'>{errors.email}</p>}
                </div>

                <div className='welcome-field'>
                    <input
                        type="password"
                        name='password'
                        placeholder='Mot de passe'
                        autoComplete='current-password'
                        value={values.password}
                        onChange={handleChange}
                        className={errors.password ? 'is-invalid' : ''}
                        aria-invalid={Boolean(errors.password)}
                    />
                    {errors.password && <p className='welcome-error'>{errors.password}</p>}
                </div>

                {message && <p className='welcome-alert' role='alert'>{message}</p>}

                <button type="submit" className="btn-create" disabled={sending}>
                    {sending ? 'Connexion…' : 'Se connecter'}
                </button>
            </form>

            <p className='welcome-footer'>
                Vous n’avez pas encore de compte ? <Link to='/register'>S’inscrire</Link>
            </p>
        </main>
    );
}

export default Welcome;
