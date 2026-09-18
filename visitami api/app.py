from flask import render_template, request, make_response, jsonify, g
from functools import wraps
from apiflask import APIFlask, Schema
from apiflask.fields import Integer, String, List, Nested
from apiflask.validators import OneOf
from flask_cors import CORS
from models import Sede, Utenti, Prenotazioni, EsploraPrestazioni


app = APIFlask(__name__, title='API Visitami', docs_path='/', version='1.0.0', docs_ui='rapidoc')
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])
app.security_schemes = {
    'BearerAuth': { 
        'type': 'http', 'scheme': 'bearer', 'bearerFormat': 'JWT',
    },
    'CookieAuth': {
        'type': 'apiKey',
        'in': 'cookie',
        'name': 'token'
    }
}
app.config['RAPIDOC_CONFIG'] = {'render-style': 'read', 'allow-authentication': 'true'}

#PERMETTE DI USARE @token_required PER OBBLIGARE L'USO DEL TOKEN AD UNA OPERAZIONE
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(" ")[1]
        if not token:
            token = request.cookies.get('token')
        if not token:
            return jsonify({'errore': 'Token mancante!'}), 401
        try:
            data = Utenti.jwt_decode(token)
            g.id_utente = data['id_utente']
        except Exception:
            return jsonify({'errore': 'Token non valido o scaduto!'}), 401
        return f(*args, **kwargs) # Passiamo l'ID utente alla funzione
    return decorated

#GESTISCE ERRORI DI URL MANCANTI
@app.errorhandler(404)
def page_not_found(errore):
    return {"errore": "Pagina non trovata"}, 404


#GET SEDI
class SedeSchema(Schema):
    id = Integer()
    nome = String()
    indirizzo = String()
    citta = String()
class ElencoSediSchema(Schema):
    elenco_oggetti = List(Nested(SedeSchema))
@app.get('/sedi')
@app.output(ElencoSediSchema)
@app.doc(security='BearerAuth')
@token_required
def get_sedi():
    try:
        dati = Sede.get_all()
        return {'elenco_oggetti': dati}
    except Exception as e:
        return jsonify({"errore": f"{type(e).__name__}: {e}"}), 500

#POST PRENOTAZIONI
class CreaPrenotazioneInputSchema(Schema):
    id_disponibilita = Integer(required=True, metadata={'example': 1})
    # L'utente deve dire QUANDO vuole la visita
    data_appuntamento = String(required=True, metadata={'example': '2026-05-20'}) 
    ora_appuntamento = String(required=True, metadata={'example': '15:30'})
    note = String(load_default='', metadata={'example': 'Controllo annuale'})
@app.post('/prenotazioni')
@token_required
@app.input(CreaPrenotazioneInputSchema, arg_name='dati_input')
@app.doc(security='BearerAuth')
def crea_prenotazione(dati_input):
    try:
        id_paziente = g.id_utente
        id_disponibilita = dati_input['id_disponibilita']
        data_app = dati_input['data_appuntamento']
        ora_app = dati_input['ora_appuntamento']
        note = dati_input['note']
        nuovo_id = Prenotazioni.crea(id_paziente, id_disponibilita, data_app, ora_app, note)
        return {"messaggio": "Prenotazione effettuata con successo", "id": nuovo_id}, 201
    except ValueError as e:
        return {"errore": str(e)}, 400
    except Exception as e:
        return {"errore": f"Errore interno del server: {e}"}, 500
    
#GET PRENOTAZIONI
class GetPrenotazioniInputSchema(Schema):
    vista = String(load_default='tutte', validate=OneOf(['tutte', 'inprogramma']))
class GetPrenotazioniSchema(Schema):
    id = Integer(attribute='id_accettazione')
    data = String(attribute='Data Appuntamento') 
    ora = String(attribute='Ora Appuntamento')
    stato = String(attribute='Stato')
    note = String(attribute='Note Mediche')
    specializzazione = String(attribute='Specializzazione Medico')
    nome_medico = String(attribute='Nome Medico')
    cognome_medico = String(attribute='Cognome Medico')
    id_sede = Integer(attribute='ID Sede')
    nome_sede = String(attribute='Nome Sede')
    nome_prestazione = String(attribute='Nome Prestazione')
@app.get('/prenotazioni')
@token_required
@app.input(GetPrenotazioniInputSchema, location='query', arg_name='args')
@app.output(GetPrenotazioniSchema(many=True))
@app.doc(security='BearerAuth')
def leggi_prenotazioni(args):
    try:
        vista = args['vista']
        app.logger.info(vista)
        return Prenotazioni.per_pazienti(g.id_utente, vista,), 200
    except Exception as e:
        return {"errore": f"{type(e).__name__}: {e}"}, 500

#SEZIONE LOGIN
class LoginInputSchema(Schema):
    email = String(required=True, metadata={'example': 'utente@mail.com'})
    password = String(required=True, metadata={'example': 'Pass'})

class LoginResponseSchema(Schema):
    cognome = String()
    email = String()
    nome = String()
    token = String()

@app.post('/login')
@app.input(LoginInputSchema, arg_name='json_data')
@app.output(LoginResponseSchema)

def login(json_data):
    try:
        utente = Utenti.verifica_login(json_data['email'], json_data['password'])
        if utente:
            risposta = make_response(jsonify(utente), 200)
            risposta.set_cookie('token', utente['token'], httponly=True, secure=False, samesite="Lax",max_age=10000) 
            return risposta
        else:
            return jsonify({"errore": "Credenziali non valide"}), 401
    except Exception as e:
        return jsonify({"errore": f"{type(e).__name__}: {e}"}), 500

# Crea uno schema semplice per la risposta del profilo
class ProfiloResponseSchema(Schema):
    nome = String()
    cognome = String()
    email = String()

@app.get('/me')
@app.output(ProfiloResponseSchema)
@token_required
def me():
    utente = Utenti.get_profilo(g.id_utente)
    if utente:
        return jsonify(utente)
    else:
        return jsonify({"errore": "Utente non trovato"}), 404
    

class LogoutResponseSchema(Schema):
    message = String(metadata={'example': 'Logout effettuato'})
@app.post('/logout')
@app.output(LogoutResponseSchema)
@app.doc(summary='Effettua il logout', description='Invalida il token cancellando il cookie HttpOnly.')
def logout():
    resp = make_response(jsonify({'message': 'Logout effettuato'}))
    resp.set_cookie('token', '', expires=0, httponly=True, samesite="Lax")
    return resp


#GET EsploraPrestazioni
class Prestazioni(Schema):
    Prestazione = String()
    SpecializzazioneMedico = String()
    NomeMedico = String()
    CognomeMedico = String()
    Sede = String()
    CittaSede = String()
class EsploraPrestazioniSchema(Schema):
    Prestazioni = List(Nested(Prestazioni))
@app.get('/esploraPrestazioni')
@app.output(EsploraPrestazioniSchema)
def get_esplora_prestazioni():
    try:
        dati = EsploraPrestazioni.get_all()
        return {'Prestazioni': dati}
    except Exception as e:
        return jsonify({"errore": f"{type(e).__name__}: {e}"}), 500

#AVVIO APP
if __name__ == '__main__':
    app.run(debug=True)