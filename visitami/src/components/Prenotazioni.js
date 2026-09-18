import React, { useState, useEffect } from 'react';

const Prenotazioni = ({API}) => {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState('');
  const [filtro, setFiltro] = useState('inprogramma'); 
  const [prenotazioneSelezionata, selezionaPrenotazione] = useState(false); 

  useEffect(() => {
    const caricaPrenotazioni = async () => {
      setLoading(true);
      setErrore('');
      try {
        const data = await API.prenotazioni.lista(filtro);
        setLista(data);
      } catch (err) {
        setErrore("Impossibile caricare le prenotazioni.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    caricaPrenotazioni();
  }, [API,filtro]);

  const getBadgeColor = (stato) => {
    switch(stato) {
      case 'PRENOTATA': return 'bg-primary';
      case 'ANNULLATA': return 'bg-danger';
      case 'ESEGUITA': return 'bg-success';
      default: return 'bg-primary';
    };
    
  };
  
  const Filtri = [
  { id: 1, nome: 'Tutte', valore: 'tutte' },
  { id: 2, nome: 'In Programma', valore: 'inprogramma' },
  ];

  return (
    <div className="container mt-3 pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0">Le mie Visite</h2>
      </div>
      

      <div className="btn-group w-100 mb-4 shadow-sm" role="group">
        {Filtri.map((Filtro) => (
          <button 
          key={Filtro.id}
          type="button" 
          className={`btn ${filtro === Filtro.valore ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setFiltro(Filtro.valore)}
          >
            {Filtro.nome}
          </button>
        ))}
      </div>

      {loading && <div className="text-center p-4"><div className="spinner-border text-primary" role="status"></div></div>}
      
      {errore && <div className="alert alert-danger">{errore}</div>}

      {!loading && lista.length === 0 && (
        <div className="text-center p-5 text-muted">
          <i className="bi bi-calendar-x display-1"></i>
          <p className="mt-3">Nessuna prenotazione trovata.</p>
        </div>
      )}

      <div className="d-flex flex-column gap-3">
        {lista.map((item) => (
          <div  key={item.id} className="card shadow-sm border-0">
            <div style={{ cursor: 'pointer' }} onClick={() => selezionaPrenotazione(item.id)} className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h5 className="card-title fw-bold text-dark mb-1">
                    {item.specializzazione}
                  </h5>
                  <div className="text-muted small">
                    <i className="bi bi-person-fill me-1"></i>
                    Dr. {item.cognome_medico} {item.nome_medico}
                  </div>
                </div>
                <span className={`badge rounded-pill ${getBadgeColor(item.stato)}`}>
                  {item.stato}
                </span>
              </div>

              <div className="bg-light p-2 rounded d-flex justify-content-between align-items-center mt-3">
                <div className="d-flex align-items-center">
                  <i className="bi bi-calendar-event text-primary fs-4 me-3"></i>
                  <div>
                    <div className="fw-bold">{item.data}</div>
                    <div className="small text-muted">{item.ora}</div>
                  </div>
                </div>
                <div className="text-end">
                   <div className="small text-muted">{item.nome_sede}</div>
                </div>
              </div>
              
              {item.note && (
                <div className="mt-3 small text-muted fst-italic border-top pt-2">
                  <i className="bi bi-sticky me-1"></i> Note: {item.note}
                </div>
              )}

            </div>
          </div>
        ))}
      </div>
      {prenotazioneSelezionata? <CardPrenotazione item={lista.find(prenotazione => prenotazione.id===prenotazioneSelezionata)} selezionaPrenotazione={selezionaPrenotazione} />:""}
    </div>
  );
};

const deleteItem = (item) => {
  console.log(item)
}
const CardPrenotazione = ({item,selezionaPrenotazione}) => {
  console.log(item);
  return(
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
      
          {/* Header */}
          <div className="modal-header bg-primary text-white border-0">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-calendar-check me-2"></i> 
              Dettaglio Visita
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => selezionaPrenotazione(false)}></button>
          </div>

          {/* Body */}
          <div className="modal-body p-2">
            
            {/* Sezione Medico (Stile Card Profile) */}
            <div className="d-flex align-items-center mb-3 p-3 bg-light rounded-3">
              <div className="bg-white rounded-circle p-3 shadow-sm me-3 text-primary d-flex align-items-center justify-content-center" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-person-fill fs-4"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-dark">Dr. {item.nome_medico} {item.cognome_medico}</h6>
                <div className="small text-muted">{item.specializzazione}</div>
              </div>
            </div>

            {/* Griglia Dettagli (Ora, Sede, Stato) */}
            <div className="row g-3 mb-3">
              {/* Orario */}
              <div className="col-4">
                <div className="border rounded-3 p-2 text-center h-100">
                  <i className="bi bi-clock text-primary mb-1 d-block fs-5"></i>
                  <div className="fw-bold">{item.ora}</div>
                  <div className="small text-muted" style={{fontSize: '0.75rem'}}>ORARIO</div>
                </div>
              </div>
              
              {/* Data */}
              <div className="col-4">
                <div className="border rounded-3 p-2 text-center h-100">
                  <i className="bi bi-calendar-event text-primary mb-1 d-block fs-5"></i>
                  <div className="fw-bold">{item.data}</div>
                  <div className="small text-muted" style={{fontSize: '0.75rem'}}>DATA</div>
                </div>
              </div>

              {/* Sede */}
              <div className="col-4">
                <div className="border rounded-3 p-2 text-center h-100">
                  <i className="bi bi-geo-alt text-danger mb-1 d-block fs-5"></i>
                  <div className="fw-bold">{item.nome_sede}</div>
                  <div className="small text-muted" style={{fontSize: '0.75rem'}}>SEDE</div>
                </div>
              </div>
            </div>

            {/* Prestazione e Stato */}
            <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
              <div>
                <span className="text-muted small d-block">Prestazione</span>
                <span className="fw-semibold">{item.nome_prestazione}</span>
              </div>
              <span className={`badge rounded-pill ${item.stato === 'PRENOTATA' ? 'bg-success' : 'bg-secondary'}`}>
                {item.stato}
              </span>
            </div>

            {/* Note (visibili solo se ci sono) */}
            {item.note && (
              <div className="alert alert-warning border-0 d-flex align-items-start mb-0" role="alert">
                <i className="bi bi-info-circle-fill me-2 mt-1"></i>
                <div>
                  <strong className="d-block small text-dark">Note:</strong>
                  <small className="text-dark opacity-75">{item.note}</small>
                </div>
              </div>
            )}
            <button className='badge btn btn-sm m-2 btn-danger' onClick={()=>deleteItem(item.id)}>Annulla Prenotazione</button>
      </div>
    </div>
  </div>
</div>
  );
}

export default Prenotazioni;