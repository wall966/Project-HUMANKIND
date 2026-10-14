import './Formulaire.css';
import hands from './assets/hands.png';
import { Link } from 'react-router';

function Formulaire() {
    return (
        <div className='form-page'>
            <header className='form-head'>
                <img src={hands} alt="Mains tendues" className="welcome-hands" />
                <Link to="/annonces" className='form-back'>← Retour aux annonces</Link>
            </header>

            <main className='form-main'>
                <h1 className='form-title'>Publier une annonce</h1>

                <form className='welcome-form'>
                    {/*  */}
                    {/* */}
                    <p className='form-hint'>
                        La catégorie sera choisie automatiquement à partir de votre description.
                    </p>
                    <button type="submit" className="btn-create">Publier</button>
                </form>
            </main>
        </div>
    );
}

export default Formulaire;
