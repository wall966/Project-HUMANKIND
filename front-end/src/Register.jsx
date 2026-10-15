import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import './Welcome.css';
import hands from './assets/hands.png';

// Adresse de l'API Laravel, lue dans le fichier .env du front ("VITE_API_URL")
const API_URL = import.meta.env.VITE_API_URL;

// Laravel répond en anglais : on traduit les messages les plus courants
function traduire(field, message) {
    if (field === 'email' && message.includes('taken')) return 'Cet email est déjà utilisé.';
    if (field === 'password' && message.includes('confirmation')) return 'Les mots de passe ne correspondent pas.';
    return message;
}

function Register() {
    const navigate = useNavigate();

    // 1. L'ÉTAT
    const [values, setValues] = useState({ name: '', email: '', password: '', password_confirmation: '' });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    // 2. Mettre à jour un champ (et effacer son ancienne erreur)
    function handleChange(e) {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
        setMessage('');
    }

    // 3. Mêmes règles que le RegisterRequest de Laravel
    function validate() {
        const newErrors = {};
        if (!values.name.trim()) newErrors.name = 'Indiquez votre nom.';
        else if (values.name.length > 30) newErrors.name = 'Le nom ne doit pas dépasser 30 caractères.';
        if (!values.email.trim()) newErrors.email = 'Indiquez votre email.';
        else if (!/^\S+@\S+\.\S+$/.test(values.email)) newErrors.email = 'Cet email ne semble pas valide.';
        if (!values.password) newErrors.password = 'Indiquez votre mot de passe.';
        else if (values.password.length < 8) newErrors.password = 'Au moins 8 caractères.';
        else if (values.password.length > 30) newErrors.password = '30 caractères maximum.';
        if (values.password_confirmation !== values.password) {
            newErrors.password_confirmation = 'Les mots de passe ne correspondent pas.';
        }
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
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    name: values.name.trim(),
                    email: values.email.trim(),
                    password: values.password,
                    password_confirmation: values.password_confirmation,
                }),
            });
            const data = await response.json();

            // 201 : compte créé → la personne est directement connectée
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/formulaire');
                return;
            }

            // 422 : erreurs de validation de Laravel (ex. : email déjà utilisé) → sous chaque champ
            if (response.status === 422) {
                const fieldErrors = {};
                Object.entries(data.errors ?? {}).forEach(([field, messages]) => {
                    fieldErrors[field] = traduire(field, messages[0]);
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

    // Un champ du formulaire avec son message d'erreur
    function field(name, type, placeholder, autoComplete) {
        return (
            <div className='welcome-field'>
                <input
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    value={values[name]}
                    onChange={handleChange}
                    className={errors[name] ? 'is-invalid' : ''}
                    aria-invalid={Boolean(errors[name])}
                />
                {errors[name] && <p className='welcome-error'>{errors[name]}</p>}
            </div>
        );
    }

    // 5. L'AFFICHAGE
    return (
        <main className='welcome'>
            <img src={hands} alt="Mains tendues" className="welcome-hands" />
            <h1 className='welcome-human'>HumanKind</h1>
            <p className='welcome-text'>
                Connecter les gens, ce n’est pas qu’une question de technologie.
                C’est une affaire d’écoute, de présence et d’humanité.
                Nous sommes le pont entre l’être et le ressenti.
            </p>

            <form className='welcome-form' onSubmit={handleSubmit} noValidate>
                {field('name', 'text', 'Nom', 'name')}
                {field('email', 'email', 'Email', 'email')}
                {field('password', 'password', 'Mot de passe', 'new-password')}
                {field('password_confirmation', 'password', 'Confirmer le mot de passe', 'new-password')}

                {message && <p className='welcome-alert' role='alert'>{message}</p>}

                <button type="submit" className="btn-create" disabled={sending}>
                    {sending ? 'Création du compte…' : 'Créer un compte'}
                </button>
            </form>

            <p className='welcome-footer'>
                Vous avez déjà un compte ? <Link to='/'>Se connecter</Link>
            </p>
        </main>
    );
}

export default Register;
