import './Dashboard.css';
import hands from './assets/hands.png';
import { Link } from 'react-router';
import CityAutocomplete from './CityAutocomplete';

{/* 
function maintenant() {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); // passe en heure locale
    return date.toISOString().slice(0, 16);
}

function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}*/}
const API_FIELDS = {
    title: 'title',
    description: 'description',
    date_time: 'dateTime',
    location: 'city',
    address: 'address',
    contact_phone: 'phone',
}

function Dashboard() {
    
    const abc = "user00";
    return (
        <>
            <div >
                {/*L'Antête*/}
                <div className='fp'>
                    <header className='fp-header'>
                        <Link to="/" className='fp-brand'>
                            <img src={hands} alt="" className='fp-brand-logo' />
                            <span className='fp-brand-name'>HumanKind</span>
                        </Link>
                        <button>Mes annonces</button>
                        <button>Messages</button>
                        <button>Annonces {`${abc}`}</button>

                        <Link to="/annonces" className='fp-back'>← Déconnexion</Link>
                    </header>
                </div>
                 
                <div className="fp-principal">
                    <h1 className="title-main">Ce que vos voisins vous proposent</h1>
                    <p>Des activités, des savoirs et des coups de main offres près de chez vous, à la date qui vous convient.</p>
                </div>
                    <h3>Mots-clés</h3>
                    <div className='fp-cles'>
                        <label htmlFor='title'>Titre de votre proposition *</label>
                        <input type="text" placeholder="Ex: courses, jardinage, accompagnement"></input>
                    </div>
                    <h3>Catégorie</h3>
                    <div className='fp-cat'>
                        <label htmlFor='title'>Categorie *</label>
                        <input type="text" placeholder="Toutes"/>
                    </div>
                       
                    <h3>Date</h3>
                    {/*
                    <div className='fp-cat'>
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
                    </div>
                    */}
                    
            </div>
        </>
    )
}

export default Dashboard;