import React, { useState, useEffect } from 'react';
import API from '../Api';

const EsploraPrestazioni = () => {
    const [loading, setLoading] = useState(true);
    const [errore, setErrore] = useState('');
    const [lista, setLista] = useState([]);
    useEffect(() => {
        const caricaPrestazioni = async () => {
        setLoading(true);
        setErrore('');
        try {
            const data = await API.esplora.get();
            if(Array.isArray(data.Prestazioni)) {
                setLista(data.Prestazioni);
            }
            else {
                setErrore("Errore interno");
                console.log("Risposta API:", data);
            }
            
        } catch (err) {
            setErrore("Impossibile caricare le Prestazioni.");
            console.error(err);
        } finally {
            setLoading(false);
        }
        };
        caricaPrestazioni();
    },[]);

  return (
    <div className="container mt-3 pb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold m-0">Prestazioni disponibili</h2>
        </div>
        {loading && <div className="text-center p-4"><div className="spinner-border text-primary" role="status"></div></div>}
        {errore && <div className="alert alert-danger">{errore}</div>}
        {!loading && !lista.length>0 && (<div className="alert alert-danger">Nessuna prenotazione trovata.</div>)}

        <div className="d-flex flex-column gap-3">
            {!errore && !loading && lista.length > 0 && (
                lista.map((item, index) => (
                <div key={index} className="card shadow-sm bg-body-secondary border-0">
                    <div className="card-body">
                    <h5 className="card-title fw-bold text-primary mb-3">
                        {item.Prestazione}
                    </h5>
                    <p className="card-text mb-2">
                        <strong>Medico:</strong> Dott. {item.NomeMedico} {item.CognomeMedico} <br />
                        <span className="text-muted small">{item.SpecializzazioneMedico}</span>
                    </p>
                    <p className="card-text mb-0">
                        <strong>Sede:</strong> {item.Sede} - {item.CittaSede}
                    </p>
                    </div>
                </div>
                ))
            )}
        </div>
    </div>
    );
};

export default EsploraPrestazioni;