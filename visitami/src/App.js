import './bootstrap.min.css';
import './App.css';
import { useState } from 'react'

import RequireAuth from './components/RequireAuth' 
import Prenotazioni from './components/Prenotazioni'
import Account from './components/Account'
import NavigationMenu from './components/NavigationMenu'
import EsploraPrestazioni from './components/Esplora'


function App() {
  /* Gestisce i tab di navigazione dell'app */
  const [activeTab, setActiveTab] = useState('Esplora');
  /* Gestisce l'utente loggato */
  const [utente, setUtente] = useState(null);

  /* Logout lato client, resetta l'utente e va nella sezione pubblica */
  const eseguiLogout = () => {
    setUtente(null);
    setActiveTab('Esplora');
  };

  const vociMenu = [
  { id: 1, nome: 'Esplora', icona: 'search.svg' },
  { id: 2, nome: 'Prenotazioni', icona: 'calendar-days.svg' },
  { id: 3, nome: 'Dashboard', icona: 'gauge.svg' },
  { id: 4, nome: 'Account', icona: 'circle-user-round.svg' },
  ];
  
  const renderContent = () => {
    const authProps = {
      utente: utente,
      onLoginSuccess: setUtente,
      eseguiLogout: eseguiLogout,
      setUtente: setUtente,
      onClose: () => setActiveTab('Esplora')
    };
    switch (activeTab) {
      case 'Esplora': return (<EsploraPrestazioni />);
      case 'Prenotazioni': return (
          <RequireAuth {...authProps}>
            <Prenotazioni />
          </RequireAuth>
        );
      case 'Dashboard': return (
          <RequireAuth {...authProps}>
            <div className="p-3">Dashboard</div>
          </RequireAuth>
        );
      case 'Account': return (
          <RequireAuth {...authProps}>
            <Account  utente={utente} setUtente={setUtente} setActiveTab={setActiveTab} />
          </RequireAuth>
        );
      default: return <div className="p-3">Sezione Esplora</div>;
    }
  };
  return (
  <div className="App">
    <main className="d-flex pb-4"> {renderContent()}
    </main>
    <NavigationMenu vociMenu={vociMenu} activeTab={activeTab} setActiveTab={setActiveTab} />
  </div>
  );
};

export default App;
