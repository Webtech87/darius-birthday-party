import os
import secrets
import string
import threading
from datetime import datetime, timezone

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_mail import Mail, Message
from flask_sqlalchemy import SQLAlchemy

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///birthday_party.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Email configuration
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

# Initialize extensions
db = SQLAlchemy(app)
mail = Mail(app)
CORS(app, origins=[
    'http://localhost:5173',  # Development
    'https://darius-birthday-party-frontend.onrender.com',  # Render domain
    'https://dariussantiago.eu',  # Your custom domain
    'https://www.dariussantiago.eu'  # WWW version
])

# Models
class Party(db.Model):
    __tablename__ = 'parties'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), default="Festa de Aniversário do Darius")
    description = db.Column(db.Text, default="Junte-se a nós para uma celebração incrível de aniversário!")
    date = db.Column(db.DateTime, default=lambda: datetime(2024, 7, 27, 17, 0))  # Updated to 17:00 (5 PM)
    time = db.Column(db.String(20), default="17:00")  # Updated to 17:00
    address = db.Column(db.String(500), default="Urbanização Quinta do Eucalipto nº4, 8005-227 Faro")  # Updated address
    max_guests = db.Column(db.Integer, default=50)
    is_active = db.Column(db.Boolean, default=True)
    rsvp_deadline = db.Column(db.DateTime, default=lambda: datetime(2024, 7, 25, 23, 59))
    contact_email = db.Column(db.String(120), default="festa@exemplo.com")
    contact_phone = db.Column(db.String(20), default="+351 123 456 789")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def is_rsvp_open(self):
        return self.rsvp_deadline > datetime.now(timezone.utc) and self.is_active

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'date': self.date.isoformat() if self.date else None,
            'time': self.time,
            'address': self.address,
            'max_guests': self.max_guests,
            'is_rsvp_open': self.is_rsvp_open,
            'rsvp_deadline': self.rsvp_deadline.isoformat() if self.rsvp_deadline else None,
            'contact_email': self.contact_email,
            'contact_phone': self.contact_phone
        }

class RSVP(db.Model):
    __tablename__ = 'rsvps'
    
    id = db.Column(db.Integer, primary_key=True)
    party_id = db.Column(db.Integer, db.ForeignKey('parties.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20))
    attending = db.Column(db.String(10), nullable=False)  # 'yes', 'no', 'maybe'
    number_of_guests = db.Column(db.Integer, default=1)
    dietary_restrictions = db.Column(db.Text)
    message = db.Column(db.Text)
    confirmation_code = db.Column(db.String(20), unique=True)
    submitted_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    party = db.relationship('Party', backref='rsvps')
    
    def __init__(self, **kwargs):
        super(RSVP, self).__init__(**kwargs)
        if not self.confirmation_code:
            self.confirmation_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'attending': self.attending,
            'number_of_guests': self.number_of_guests,
            'dietary_restrictions': self.dietary_restrictions,
            'message': self.message,
            'confirmation_code': self.confirmation_code,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None
        }

# Email functions
def send_async_email(app, msg):
    """Send email asynchronously"""
    with app.app_context():
        try:
            mail.send(msg)
            print(f"✅ Email enviado com sucesso!")
        except Exception as e:
            print(f"❌ Falha ao enviar email: {e}")

def send_notification_email(new_guest_name, all_guests):
    """Send notification email with updated guest list"""
    notification_email = os.getenv('NOTIFICATION_EMAIL')
    
    if not notification_email:
        print("⚠️ Email de notificação não configurado")
        return
    
    try:
        subject = f"🎉 Novo Convidado: {new_guest_name} - Festa do Darius"
        
        # Create HTML email content
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; color: white; text-align: center;">
                <h1>🎉 Festa de Aniversário do Darius!</h1>
                <h2>{new_guest_name} confirmou presença!</h2>
            </div>
            
            <div style="padding: 20px;">
                <h3 style="color: #667eea;">📝 Lista Atualizada de Convidados ({len(all_guests)} pessoas):</h3>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                    <ul style="list-style: none; padding: 0;">
        """
        
        for i, guest in enumerate(all_guests, 1):
            guest_name = guest.get('name', 'Desconhecido')
            submitted_time = guest.get('submitted_at', '')
            html_body += f"""
                        <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
                            <span style="font-weight: bold; color: #667eea;">#{i}</span> 
                            🎈 {guest_name}
                            <span style="color: #6c757d; font-size: 0.9em; margin-left: 10px;">
                                ({submitted_time[:10] if submitted_time else 'Data desconhecida'})
                            </span>
                        </li>
            """
        
        html_body += """
                    </ul>
                </div>
                
                <div style="margin-top: 30px; padding: 15px; background-color: #e8f4f8; border-radius: 8px;">
                    <p style="margin: 0; color: #0c63e4;">
                        <strong>🎊 Detalhes da Festa:</strong><br>
                        📅 27 de Julho, 2024 às 17:00<br>
                        📍 Urbanização Quinta do Eucalipto nº4, 8005-227 Faro<br>
                        👥 Total de Convidados: """ + str(len(all_guests)) + """
                    </p>
                </div>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 0.9em;">
                <p>Esta notificação foi enviada automaticamente quando alguém confirmou presença na Festa de Aniversário do Darius.</p>
            </div>
        </body>
        </html>
        """
        
        # Create plain text version
        text_body = f"""
        🎉 Nova Confirmação de Presença!
        
        {new_guest_name} confirmou presença na festa!
        
        📝 Lista Atualizada de Convidados ({len(all_guests)} pessoas):
        """
        
        for i, guest in enumerate(all_guests, 1):
            guest_name = guest.get('name', 'Desconhecido')
            text_body += f"\n#{i} 🎈 {guest_name}"
        
        text_body += f"""
        
        🎊 Detalhes da Festa:
        📅 27 de Julho, 2024 às 17:00
        📍 Urbanização Quinta do Eucalipto nº4, 8005-227 Faro
        👥 Total de Convidados: {len(all_guests)}
        
        Esta notificação foi enviada automaticamente quando alguém confirmou presença na Festa de Aniversário do Darius.
        """
        
        msg = Message(
            subject=subject,
            recipients=[notification_email],
            body=text_body,
            html=html_body
        )
        
        # Send email in background thread
        thread = threading.Thread(target=send_async_email, args=(app, msg))
        thread.start()
        
    except Exception as e:
        print(f"❌ Erro ao criar email de notificação: {e}")

# Routes
@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'OK',
        'message': 'API da Festa de Aniversário está funcionando',
        'version': '1.0.0',
        'email_configured': bool(os.getenv('MAIL_USERNAME'))
    })

@app.route('/api/party', methods=['GET'])
def get_party():
    party = Party.query.filter_by(is_active=True).first()
    if not party:
        party = Party()
        db.session.add(party)
        db.session.commit()
    return jsonify(party.to_dict())

@app.route('/api/party/stats', methods=['GET'])
def get_party_stats():
    party = Party.query.filter_by(is_active=True).first()
    if not party:
        return jsonify({'error': 'Festa não encontrada'}), 404
    
    total_rsvps = RSVP.query.filter_by(party_id=party.id).count()
    attending = RSVP.query.filter_by(party_id=party.id, attending='yes').all()
    total_attending = sum(r.number_of_guests for r in attending)
    
    return jsonify({
        'total_rsvps': total_rsvps,
        'total_attending': total_attending,
        'max_guests': party.max_guests,
        'available_spots': max(0, party.max_guests - total_attending),
        'is_rsvp_open': party.is_rsvp_open
    })

@app.route('/api/rsvp', methods=['POST'])
def submit_rsvp():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(k in data for k in ['name', 'email', 'attending', 'number_of_guests']):
            return jsonify({'error': 'Campos obrigatórios em falta'}), 400
        
        party = Party.query.filter_by(is_active=True).first()
        if not party:
            return jsonify({'error': 'Festa não encontrada'}), 404
        
        # Check if already exists
        existing = RSVP.query.filter_by(email=data['email'], party_id=party.id).first()
        if existing:
            return jsonify({
                'error': 'Você já confirmou presença para esta festa',
                'confirmation_code': existing.confirmation_code
            }), 400
        
        # Create RSVP
        rsvp = RSVP(
            party_id=party.id,
            name=data['name'],
            email=data['email'],
            phone=data.get('phone', ''),
            attending=data['attending'],
            number_of_guests=data['number_of_guests'],
            dietary_restrictions=data.get('dietary_restrictions', ''),
            message=data.get('message', '')
        )
        
        db.session.add(rsvp)
        db.session.commit()
        
        # Send notification email with updated guest list
        if data['attending'] == 'yes':
            all_guests = RSVP.query.filter_by(party_id=party.id, attending='yes').order_by(RSVP.submitted_at.desc()).all()
            guest_list = [guest.to_dict() for guest in all_guests]
            send_notification_email(data['name'], guest_list)
        
        return jsonify({
            'message': 'Presença confirmada com sucesso',
            'confirmation_code': rsvp.confirmation_code
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Falha ao confirmar presença: {str(e)}'}), 500

@app.route('/api/rsvp/<confirmation_code>', methods=['GET'])
def get_rsvp(confirmation_code):
    rsvp = RSVP.query.filter_by(confirmation_code=confirmation_code).first()
    if not rsvp:
        return jsonify({'error': 'Confirmação não encontrada'}), 404
    return jsonify({
        'rsvp': rsvp.to_dict(),
        'party': rsvp.party.to_dict()
    })

@app.route('/api/guests', methods=['GET'])
def get_guests():
    party = Party.query.filter_by(is_active=True).first()
    if not party:
        return jsonify({'error': 'Festa não encontrada'}), 404
    
    guests = RSVP.query.filter_by(party_id=party.id).order_by(RSVP.submitted_at.desc()).all()
    return jsonify([guest.to_dict() for guest in guests])

@app.route('/api/clear-guests', methods=['DELETE'])
def clear_guests():
    try:
        party = Party.query.filter_by(is_active=True).first()
        if not party:
            return jsonify({'error': 'Festa não encontrada'}), 404
        
        # Delete all RSVP records for this party
        deleted_count = RSVP.query.filter_by(party_id=party.id).delete()
        db.session.commit()
        
        print(f"✅ {deleted_count} convidados removidos da lista")
        return jsonify({
            'message': f'Lista de convidados limpa com sucesso. {deleted_count} registros removidos.',
            'deleted_count': deleted_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro ao limpar lista: {e}")
        return jsonify({'error': f'Falha ao limpar lista de convidados: {str(e)}'}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Rota não encontrada'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Erro interno do servidor'}), 500

# Initialize database
with app.app_context():
    db.create_all()
    if not Party.query.first():
        default_party = Party()
        db.session.add(default_party)
        db.session.commit()
        print("✅ Festa padrão criada!")

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"🚀 Iniciando servidor Flask na porta {port}")
    print(f"📧 Email configurado: {bool(os.getenv('MAIL_USERNAME'))}")
    app.run(host='0.0.0.0', port=port, debug=True)