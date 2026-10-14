
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
                <input type="text" name='name' placeholder='Name' />
                <input type="email" name='email' placeholder='Email' />
                <input type="password" name='password' placeholder='Password' />
                <input type="password" name='password_confirmation' placeholder='Confirm password' />
                <button type="submit" className="btn-create">Create account</button>
            </form>

            <p className='welcome-footer'>
                Already have an account? <a href='/login'>Log in</a>
            </p>
        </main>
    );
}

export default Welcome;
