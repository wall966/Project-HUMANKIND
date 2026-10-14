import './Formulaire.css';
import hands from './assets/hands.png';
import { Link } from 'react-router';

function Formulaire() {
    return (
        <>
            <div className='form-head'>
                <header className='logo-title'>
                    <img src={hands} alt="Mains tendues" className="welcome-hands" />
                    <h1 className='title'>HumanKind</h1>
                </header>
                <Link to="/annonces" className='form-back'>← Retour aux annonces</Link>
            </div>
            <div className='form-page'>
                <main className='form-main'>

                    <h1 className='form-title'>Proposer mon aide</h1>

                    <form className='welcome-form'>
                        <p className='form-hint'>
                            Offrez un peu de votre temp: un savoir à partager, un coup de main, un moment ensemble.
                        </p>
                        <h1>Titre de votre proposition*</h1>
                        <input type="text" name='title' placeholder='Aide' />
                        <button type="submit" className="btn-create">Publier</button>
                    </form>
                </main>

                <aside className='form-aside'>

                </aside>

            </div>
        </>
    );
}

export default Formulaire;
