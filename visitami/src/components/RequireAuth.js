import React, { useState, useEffect } from 'react';
import API from '../Api';

const CheckLogin =(eseguiLogout, setUtente,utente) => {  
    useEffect(() => {
    API.setUnauthorizedListener(() => {});
    const controllaSessione = async () => {
      try {
        const utenteLoggato = await API.auth.me(); 
        setUtente(utenteLoggato);
      } catch (error) {
        console.log("Nessuna sessione attiva");
      } finally {
      }
    };
    controllaSessione();
  }, [setUtente]);
  useEffect(() => {
    if (utente) {
      API.setUnauthorizedListener(eseguiLogout);
    }
    
    return () => {
       API.setUnauthorizedListener(() => {});
    };
  }, [utente, eseguiLogout]); 

};

const Login = ({ onLoginSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [messaggio, setMessaggio] = useState('');
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessaggio("Caricamento...");
    try {
      const data = await API.auth.login(email, password);
      onLoginSuccess(data);
    } catch (error) {
      setMessaggio(error.message || "Credenziali errate");
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          <div className="modal-header bg-primary text-white border-0">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-person-lock me-2"></i>Accedi a Visitami
            </h5>
            {onClose && (
                <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            )}
          </div>
          <div className="modal-body p-4">
            <p className="text-muted small mb-4 text-center">
              Inserisci le tue credenziali per accedere a questa sezione.
            </p>
            <form onSubmit={handleLogin}>
              <div className="form-floating mb-3">
                <input 
                  type="email" 
                  className="form-control" 
                  id="floatingInput" 
                  placeholder="name@example.com"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
                <label htmlFor="floatingInput">Indirizzo Email</label>
              </div>
              
              <div className="form-floating mb-3">
                <input 
                  type="password" 
                  className="form-control" 
                  id="floatingPassword" 
                  placeholder="Password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
                <label htmlFor="floatingPassword">Password</label>
              </div>

              {messaggio && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <div>{messaggio}</div>
                </div>
              )}

              <button type="submit" className="btn btn-primary w-100 btn-lg rounded-pill fw-bold mt-2">
                Entra
              </button>
            </form>
          </div>

          <div className="modal-footer justify-content-center bg-light border-0">
            <small className="text-muted">Non hai un account? <a href="#" className="text-decoration-none fw-bold">Registrati</a></small>
          </div>

        </div>
      </div>
    </div>
  );
};

const RequireAuth = ({onLoginSuccess, onClose, utente, children, setUtente, eseguiLogout }) => {
  CheckLogin(eseguiLogout,setUtente,utente);
  if (!utente) {
    return <Login API={API} onLoginSuccess={onLoginSuccess} onClose={onClose} />;
  }
  else 
  return React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { API: API }); 
    }
    return child;
  });
};

export { Login };
export default RequireAuth;