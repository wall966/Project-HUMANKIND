import './Welcome.css';
import hands from './assets/hands.png';


function Welcome() {
    return (
        <main className='welcome'>
            <img src={hands} alt="Mains tendues" className="welcome-hands" />
            <h1 className='welcome-human'>HumanKind</h1>
            <p className='welcome-text'>
                Connecting people isn't just about technology.
                It's about listening, presence, and humanity.
                We are the bridge between being and feeling.
            </p>

            <form className='welcome-form'>
                <input type="email" name='email' placeholder='Email' />
                <input type="password" name='password' placeholder='Password' />
                <button type="submit" className="btn-create">Login</button>
            </form>

            <p className='welcome-footer'>
                Already have an account? <a href='./login'>Log in</a>
            </p>
        </main>
    );
}

export default Welcome;
