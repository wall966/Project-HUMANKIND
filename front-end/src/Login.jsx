
import './Welcome.css';
import hands from './assets/hands.png';

function Welcome() {
    return (
        <main className='welcome'>
            <img src={hands} alt="Mains tendues" className="welcome-hands" />
            <h1 className='welcome-human'>HumanKind</h1>
            <p className='welcome-text'>
                Connecter les gens, ce n'est pas qu'une question de technologie.
                C'est une affaire d'écoute, de présence et d'humanité.
                Nous sommes le pont entre l'être et le ressenti.
            </p>

            <form className='welcome-form'>
                <input type="text" name='name' placeholder='Nom' />
                <input type="email" name='email' placeholder='Email' />
                <input type="password" name='password' placeholder='Mot de passe' />
                <input type="password" name='password_confirmation' placeholder='Confirmer le mot de passe' />
                <button type="submit" className="btn-create">Créer un compte</button>
            </form>
        </main>
    );
}

export default Welcome;
