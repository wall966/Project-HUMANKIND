import './Dashboard.css';
import hands from './assets/hands.png';
import { Link } from 'react-router';


function Dashboard() {
    const abc = "user00";
    return (
        <>
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
        



        </>
    )
}

export default Dashboard;