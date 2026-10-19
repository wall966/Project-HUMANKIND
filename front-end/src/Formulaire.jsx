import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import './Formulaire.css';
import hands from './assets/hands.png';
import CityAutocomplete from './CityAutocomplete';

const API_URL = import.meta.env.VITE_API_URL;
const DESCRIPTION_MAX = 1000;

// Date et heure actuelles au format attendu par <input type="datetime-local"> : "AAAA-MM-JJTHH:MM"
function maintenant() {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); // passe en heure locale
    return date.toISOString().slice(0, 16);
}

// "2026-10-20T14:30" → "20 oct. 2026, 14:30"
function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}

// Règles de validation : un message par champ, ou rien si tout va bien
function validate(values) {
    const errors = {};
    const title = values.title.trim();
    const description = values.description.trim();

    if (title.length < 5) errors.title = 'Le titre doit contenir au moins 5 caractères.';
    else if (title.length > 255) errors.title = 'Le titre ne peut pas dépasser 255 caractères.';

    if (description.length === 0) errors.description = 'Décrivez ce que vous proposez.';
    else if (description.length > DESCRIPTION_MAX) errors.description = `${DESCRIPTION_MAX} caractères maximum.`;

    if (!values.dateTime) errors.dateTime = 'Choisissez une date et une heure.';
    else if (values.dateTime < maintenant()) errors.dateTime = 'La date doit être dans le futur.';

    if (!values.city) errors.city = 'Choisissez une ville dans la liste.';

    if (values.address.trim().length < 5) errors.address = "Indiquez l'adresse du rendez-vous.";

    if (values.phone && !/^\+?[0-9 .()-]{8,20}$/.test(values.phone)) {
        errors.phone = 'Numéro de téléphone invalide.';
    }

    if (!values.charter) errors.charter = 'Vous devez accepter la charte de bienveillance.';

    return errors;
}

// Champs de l'API Laravel → champs du formulaire (pour afficher les erreurs 422)
const API_FIELDS = {
    title: 'title',
    description: 'description',
    date_time: 'dateTime',
    location: 'city',
    address: 'address',
    contact_phone: 'phone',
};

function Formulaire() {
    const navigate = useNavigate();

    const [values, setValues] = useState({
        title: '',
        description: '',
        dateTime: '',
        city: null,
        address: '',
        phone: '',
        charter: false,
    });
    const [touched, setTouched] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [sending, setSending] = useState(false);
    const [apiErrors, setApiErrors] = useState({});
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

    const errors = { ...validate(values), ...apiErrors };

    // On n'affiche l'erreur d'un champ qu'après l'avoir quitté ou après avoir cliqué sur "Publier"
    const showError = (field) => (touched[field] || submitted) && errors[field];

    function update(field, value) {
        setValues((prev) => ({ ...prev, [field]: value }));
        setApiErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    function touch(field) {
        setTouched((prev) => ({ ...prev, [field]: true }));
    }

    async function handleSubmit(e) {
        e.preventDefault(); // empêche le rechargement de la page
        setSubmitted(true);
        setMessage(null);

        if (Object.keys(validate(values)).length > 0) return;

        const token = localStorage.getItem('token');
        if (!token) {
            setMessage({ type: 'error', text: 'Vous devez être connecté pour publier une proposition.' });
            return;
        }

        setSending(true);
        try {
            const response = await fetch(`${API_URL}/listings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: values.title.trim(),
                    description: values.description.trim(),
                    // "2026-10-25T14:30" (heure locale, sans fuseau) → "2026-10-25T13:30:00.000Z" (UTC)
                    // Sans ça, Laravel croit que l'heure est déjà en UTC : décalage d'une ou deux heures.
                    date_time: new Date(values.dateTime).toISOString(),
                    location: values.city.label,
                    // coordonnées de la ville (Photon) : servent au filtre "Rayon" de la page des annonces
                    latitude: values.city.lat,
                    longitude: values.city.lon,
                    address: values.address.trim(),
                    contact_phone: values.phone.trim() || null,
                }),
            });
            const data = await response.json();

            if (response.status === 201) {
                // retour à la liste, où la nouvelle annonce apparaît en premier
                navigate('/annonces', { state: { publiee: data.title } });
                return;
            }
            if (response.status === 503) {
                setMessage({ type: 'error', text: data.message });
                return;
            }
            if (response.status === 401) {
                setMessage({ type: 'error', text: 'Votre session a expiré. Reconnectez-vous.' });
                return;
            }
            if (response.status === 422) {
                const fieldErrors = {};
                Object.entries(data.errors ?? {}).forEach(([apiField, messages]) => {
                    const field = API_FIELDS[apiField];
                    if (field) fieldErrors[field] = messages[0];
                });
                setApiErrors(fieldErrors);
                setMessage({ type: 'error', text: 'Certains champs sont à corriger.' });
                return;
            }
            setMessage({ type: 'error', text: data.message ?? 'Une erreur est survenue. Réessayez.' });
        } catch {
            setMessage({ type: 'error', text: "Impossible de joindre le serveur. Vérifiez votre connexion." });
        } finally {
            setSending(false);
        }
    }

    const previewPlace = values.city?.name;
    const previewMeta = [formatDate(values.dateTime), previewPlace].filter(Boolean).join(' · ');

    return (
        <div className='fp'>
            <header className='fp-header'>
                <Link to="/annonces" className='fp-brand'>
                    <img src={hands} alt="" className='fp-brand-logo' />
                    <span className='fp-brand-name'>HumanKind</span>
                </Link>
                <Link to="/annonces" className='fp-back'>← Retour aux annonces</Link>
            </header>

            <div className='fp-layout'>
                <main className='fp-card'>
                    <h1 className='fp-title'>Proposer mon aide</h1>
                    <p className='fp-subtitle'>
                        Offrez un peu de votre temps : un savoir à partager, un coup de main, un moment ensemble.
                    </p>

                    <form onSubmit={handleSubmit} noValidate>
                        {/* Titre */}
                        <div className='fp-field'>
                            <label htmlFor='title'>Titre de votre proposition *</label>
                            <input
                                id='title'
                                type="text"
                                value={values.title}
                                onChange={(e) => update('title', e.target.value)}
                                onBlur={() => touch('title')}
                                placeholder='Ex. : Conversation en anglais autour d’un café'
                                maxLength={255}
                                className={showError('title') ? 'is-invalid' : ''}
                                aria-invalid={Boolean(showError('title'))}
                            />
                            {showError('title') && <p className='fp-error'>{errors.title}</p>}
                        </div>

                        {/* Description */}
                        <div className='fp-field'>
                            <label htmlFor='description'>Description *</label>
                            <textarea
                                id='description'
                                rows={6}
                                value={values.description}
                                onChange={(e) => update('description', e.target.value)}
                                onBlur={() => touch('description')}
                                placeholder='Décrivez ce que vous proposez : quoi, où, quand…'
                                maxLength={DESCRIPTION_MAX}
                                className={showError('description') ? 'is-invalid' : ''}
                                aria-invalid={Boolean(showError('description'))}
                            />
                            <div className='fp-field-footer'>
                                {showError('description') && <p className='fp-error'>{errors.description}</p>}
                                <span className='fp-counter'>{values.description.length} / {DESCRIPTION_MAX}</span>
                            </div>
                        </div>

                        {/* Date + Ville côte à côte */}
                        <div className='fp-row'>
                            <div className='fp-field'>
                                <label htmlFor='date_time'>Date et heure *</label>
                                <input
                                    id='date_time'
                                    type="datetime-local"
                                    value={values.dateTime}
                                    min={maintenant()}
                                    onChange={(e) => update('dateTime', e.target.value)}
                                    onBlur={() => touch('dateTime')}
                                    className={showError('dateTime') ? 'is-invalid' : ''}
                                    aria-invalid={Boolean(showError('dateTime'))}
                                />
                                {showError('dateTime') && <p className='fp-error'>{errors.dateTime}</p>}
                            </div>

                            <div className='fp-field'>
                                <label htmlFor='hk-place'>Ville ou quartier *</label>
                                <CityAutocomplete
                                    id='hk-place'
                                    selected={values.city}
                                    onSelect={(city) => {
                                        update('city', city);
                                        if (city) touch('city');
                                    }}
                                    invalid={Boolean(showError('city'))}
                                />
                                {showError('city') && <p className='fp-error'>{errors.city}</p>}
                            </div>
                        </div>

                        {/* Informations privées */}
                        <fieldset className='fp-private'>
                            <legend>🔒 Partagé uniquement avec les participants validés</legend>

                            <div className='fp-row'>
                                <div className='fp-field'>
                                    <label htmlFor='address'>Adresse du rendez-vous *</label>
                                    <input
                                        id='address'
                                        type="text"
                                        value={values.address}
                                        onChange={(e) => update('address', e.target.value)}
                                        onBlur={() => touch('address')}
                                        placeholder='Ex. : 12 rue des Lilas'
                                        maxLength={255}
                                        className={showError('address') ? 'is-invalid' : ''}
                                        aria-invalid={Boolean(showError('address'))}
                                    />
                                    {showError('address') && <p className='fp-error'>{errors.address}</p>}
                                </div>

                                <div className='fp-field'>
                                    <label htmlFor='phone'>Téléphone (facultatif)</label>
                                    <input
                                        id='phone'
                                        type="tel"
                                        value={values.phone}
                                        onChange={(e) => update('phone', e.target.value)}
                                        onBlur={() => touch('phone')}
                                        placeholder='Ex. : 06 12 34 56 78'
                                        className={showError('phone') ? 'is-invalid' : ''}
                                        aria-invalid={Boolean(showError('phone'))}
                                    />
                                    {showError('phone') && <p className='fp-error'>{errors.phone}</p>}
                                </div>
                            </div>

                            <p className='fp-private-note'>
                                L’email de votre compte sera aussi communiqué aux participants que vous validez.
                            </p>
                        </fieldset>

                        {/* Encadré IA */}
                        <p className='fp-ai'>
                            <span aria-hidden="true">✦</span>
                            Pas besoin de choisir une catégorie : notre IA la trouve automatiquement à partir de votre description.
                        </p>

                        {/* Charte */}
                        <div className='fp-field'>
                            <label className='fp-checkbox'>
                                <input
                                    type="checkbox"
                                    checked={values.charter}
                                    onChange={(e) => {
                                        update('charter', e.target.checked);
                                        touch('charter');
                                    }}
                                />
                                <span>
                                    J’accepte la <a href='/charte' target='_blank' rel='noreferrer'>charte de bienveillance</a> HumanKind.
                                </span>
                            </label>
                            {showError('charter') && <p className='fp-error'>{errors.charter}</p>}
                        </div>

                        {message && (
                            <p className={`fp-message fp-message-${message.type}`} role='status'>{message.text}</p>
                        )}

                        <div className='fp-actions'>
                            <button type="button" className='fp-btn fp-btn-secondary' onClick={() => navigate(-1)}>
                                Annuler
                            </button>
                            <button type="submit" className='fp-btn fp-btn-primary' disabled={sending}>
                                {sending ? 'Publication…' : 'Publier ma proposition'}
                            </button>
                        </div>
                    </form>
                </main>

                <aside className='fp-aside'>
                    <p className='fp-aside-label'>Aperçu</p>

                    <article className='fp-preview'>
                        <span className='fp-badge'>Catégorie détectée par l’IA</span>
                        <h2 className='fp-preview-title'>
                            {values.title.trim() || '[Titre de votre proposition]'}
                        </h2>
                        <p className='fp-preview-text'>
                            {values.description.trim() || '[Votre description apparaîtra ici.]'}
                        </p>
                        <p className='fp-preview-meta'>{previewMeta || '[Date] · [Quartier]'}</p>
                    </article>

                    <section className='fp-tips'>
                        <h2>Conseils pour une bonne proposition</h2>
                        <p>
                            Dites ce que vous offrez, combien de temps et pour combien de personnes.
                            Ne partagez jamais votre adresse exacte ni votre téléphone dans la description :
                            utilisez la partie privée, visible seulement par les participants que vous validez.
                        </p>
                    </section>
                </aside>
            </div>
        </div>
    );
}

export default Formulaire;
