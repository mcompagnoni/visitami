import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import time

#Password segreta legata a JWT
PASSWORD = "password segreta"

class BaseModel:
    """Classe base per gestire la connessione al DB SQLite"""
    @staticmethod
    def get_db_connection():
        conn = sqlite3.connect('database.db')
        conn.row_factory = sqlite3.Row 
        return conn

class Utenti(BaseModel):
    @classmethod
    def registra(cls, email, password, nome, cognome, codice_fiscale):
        hash_pwd = generate_password_hash(password)
        conn = cls.get_db_connection()
        conn.execute("INSERT INTO utenti (email, password, nome, cognome, codice_fiscale) VALUES (?, ?, ?, ?, ?)",
                     (email, hash_pwd, nome, cognome, codice_fiscale))
        conn.commit()
        conn.close()

    @classmethod
    def verifica_login(cls, email, password):
        conn = cls.get_db_connection()
        user = conn.execute("SELECT * FROM Utenti WHERE email = ?", (email,)).fetchone()
        conn.close()
        time.sleep(1)
        if user and check_password_hash(user['password'], password):
            token = jwt.encode({
                'id_utente': user["id_utente"]
                ,'nome': user["nome"]
                ,'cognome': user["cognome"]
                ,"email": user["email"]
                ,'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
                }, PASSWORD, algorithm="HS256")
            return {
                "nome": user["nome"],
                "cognome": user["cognome"],
                "email": user["email"],
                "token": token
            }
            
    @classmethod
    def get_profilo(cls, id_utente):
        conn = cls.get_db_connection()
        # Selezioniamo solo i dati che ci servono (NON la password)
        user = conn.execute("SELECT id_utente, nome, cognome, email FROM Utenti WHERE id_utente = ?", (id_utente,)).fetchone()
        conn.close()
        
        if user:
            # Convertiamo la riga del DB in un dizionario
            return {
                "id_utente": user["id_utente"],
                "nome": user["nome"],
                "cognome": user["cognome"],
                "email": user["email"]
            }
        return None
    
    @classmethod
    def jwt_decode(cls, token):
        decode = jwt.decode(token, PASSWORD, algorithms=["HS256"])
        return decode
    
    @classmethod
    def resetPsw(cls):
        return generate_password_hash("Pass")

class Sede(BaseModel):
    def __init__(self, id_sede, nome, indirizzo, citta):
        self.id = id_sede
        self.nome = nome
        self.indirizzo = indirizzo
        self.citta = citta

    @classmethod
    def get_all(cls):
        """Metodo di classe per recuperare tutte le sedi Cerba"""
        conn = cls.get_db_connection()
        query = "SELECT * FROM sedi"
        rows = conn.execute(query).fetchall()
        conn.close()
        return [cls(row['id'], row['nome'], row['indirizzo'], row['citta']).to_dict() for row in rows]

    def to_dict(self):
        """Metodo per convertire l'oggetto in un dizionario pronto per JSON"""
        return {
            "id": self.id,
            "nome": self.nome,
            "indirizzo": self.indirizzo,
            "citta": self.citta
        }
    
class Prenotazioni(BaseModel):
    def __init__(self, **kwargs):
        for chiave, valore in kwargs.items():
            setattr(self, chiave, valore)
    @classmethod
    def crea(cls,id_paziente, id_disponibilita, data_app, ora_app, note):
        conn = cls.get_db_connection()
        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.cursor()
        try:
            query = """
                INSERT INTO Prenotazioni 
                (id_paziente, id_disponibilita, data_appuntamento, ora_appuntamento, note_mediche)
                VALUES (?, ?, ?, ?, ?)
            """
            parametri = (id_paziente, id_disponibilita, data_app, ora_app, note)
            cursor.execute(query, parametri)
            conn.commit()
            nuovo_id = cursor.lastrowid
            return nuovo_id
        
        except sqlite3.IntegrityError as e:
            conn.rollback()
            raise ValueError(f"Impossibile prenotare: vincolo violato ({e})")
            
        except Exception as e:
            print(f"Errore Generico DB: {e}")
            conn.rollback()
            raise e
            
        finally:
            conn.close()

    @classmethod
    def per_pazienti(cls,id_paziente, filtro):
        conn = cls.get_db_connection()
        query = """
           select Prenotazioni.id_accettazione 
            , Prenotazioni.data_appuntamento as [Data Appuntamento]
            , Prenotazioni.ora_appuntamento as [Ora Appuntamento]
            , Prenotazioni.stato as [Stato]
            , Prenotazioni.note_mediche as [Note Mediche]
            , Medici.specializzazione as [Specializzazione Medico]
            , Anagrafiche_Medici.Nome as [Nome Medico]
            , Anagrafiche_Medici.Cognome as [Cognome Medico]
            , sd.id_sede as [ID Sede]
            , Sedi.nome  as [Nome Sede]
            , p.descrizione as [Nome Prestazione]
            from Prenotazioni
            inner join Slot_Disponibilita sd on sd.id_disponibilita = Prenotazioni.id_disponibilita 
            inner join Medici on Medici.id_utente = sd.id_medico
            inner join Utenti as Anagrafiche_Medici ON  Anagrafiche_Medici.id_utente = Medici.id_utente
            inner join Sedi on Sedi.id  = sd.id_sede
            inner join Prestazioni p on p.id_prestazione = sd.id_prestazione  
            where id_paziente = ?
            """
        match filtro:
            case 'inprogramma':
                query += " AND Prenotazioni.stato = 'PRENOTATA'"
            case 'tutte':
                pass
            case _:
                raise ValueError(f"Parametro vista non valido: {filtro}")
        query += " ORDER BY Prenotazioni.data_appuntamento ASC, Prenotazioni.ora_appuntamento ASC;"
        rows = conn.execute(query, (id_paziente,)).fetchall()
        conn.close()
        return [dict(row) for row in rows]
    

class EsploraPrestazioni(BaseModel):
    def __init__(self, Prestazione, SpecializzazioneMedico, NomeMedico, CognomeMedico, Sede,CittaSede):
        self.Prestazione = Prestazione
        self.SpecializzazioneMedico = SpecializzazioneMedico
        self.NomeMedico = NomeMedico
        self.CognomeMedico = CognomeMedico
        self.Sede = Sede
        self.CittaSede=CittaSede

    @classmethod
    def get_all(cls):
        """Metodo di classe per recuperare tutte prestazioni, e capire le disponibilità dei medici. In questo momento nelle disponibilità non tiene conto delle prenotazioni già effettuate"""
        conn = cls.get_db_connection()
        query = """Select p.descrizione as [Prestazione], m.specializzazione as [SpecializzazioneMedico],m.matricola_ordine , u.nome as [NomeMedico], u.cognome as [CognomeMedico],s.nome [Sede], s.citta as [CittaSede]
                    from Prestazioni p
                    left join Slot_Disponibilita sd on sd.id_prestazione =p.id_prestazione
                    left join Medici m on m.id_utente = sd.id_medico 
                    left join Utenti u on u.id_utente = m.id_utente 
                    left join Sedi s on s.id = sd.id_sede;"""
        rows = conn.execute(query).fetchall()
        conn.close()
        return [cls(row['Prestazione'],row['SpecializzazioneMedico'], row['NomeMedico'], row['CognomeMedico'], row['Sede'], row['CittaSede']).to_dict() for row in rows]

    def to_dict(self):
        """Metodo per convertire l'oggetto in un dizionario pronto per JSON"""
        return {
            "Prestazione": self.Prestazione,
            "SpecializzazioneMedico": self.SpecializzazioneMedico,
            "NomeMedico": self.NomeMedico,
            "CognomeMedico": self.CognomeMedico,
            "Sede": self.Sede,
            "CittaSede": self.CittaSede
        }