import React, { useState, useEffect } from 'react';
import API from '../Api';

const Account = ({ utente, setUtente, setActiveTab }) => {
const handleLogout = async () => {
try { await API.auth.logout(); } catch (e) { console.error(e); }
setUtente(null);
setActiveTab('Esplora');
};

return (
<div className="container mt-3 text-center">
    <h2>Ciao, {utente?.nome}</h2>
    <button onClick={handleLogout} className="btn btn-danger mt-3">Logout</button>
</div>
);
};

export default Account;