import React, { useState, useEffect } from 'react';
const NavigationMenu = ({activeTab, setActiveTab, vociMenu}) => {

  return(
    <div className="fixed-bottom bg-white border-top py-2 shadow-sm">
      <div className="container d-flex justify-content-around text-center">
        {vociMenu.map((item) => ( 
        <div key={item.id}
          className={`nav-item-custom ${activeTab === item.nome ? 'text-success fw-bold' : 'text-secondary'}`}
          onClick={() => (setActiveTab(item.nome))}
          style={{ cursor: 'pointer', flex: 1 }}
        >
          <img src={`/img/${item.icona}`} alt={item.nome} style={{ width: '24px' }} className="d-block mx-auto" />
          <span className="small d-block">{item.nome}</span>
        </div>
        ))}
      </div>
    </div>
  );
};
export default NavigationMenu;