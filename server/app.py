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

# Enhanced database configuration with PostgreSQL support
database_url = os.getenv('DATABASE_URL')
if database_url and database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url or 'sqlite:///birthday_party.db'
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
CORS(app, 
     origins=[
         'http://localhost:5173',
         'https://darius-birthday-party-frontend.onrender.com',
         'https://dariussantiago.eu',
         'https://www.dariussantiago.eu'
     ],
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

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
        # Make sure both datetimes have timezone info for comparison
        deadline = self.rsvp_deadline
        if deadline:
            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)
            return deadline > datetime.now(timezone.utc) and self.is_active
        return False

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

# Regular Routes
@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'OK',
        'message': 'API da Festa de Aniversário está funcionando',
        'version': '1.0.0',
        'email_configured': bool(os.getenv('MAIL_USERNAME')),
        'database_type': 'PostgreSQL' if 'postgresql' in app.config['SQLALCHEMY_DATABASE_URI'] else 'SQLite'
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
        print(f"📝 New RSVP submission: {data}")
        
        # Validate required fields
        if not all(k in data for k in ['name', 'email', 'attending', 'number_of_guests']):
            return jsonify({'error': 'Campos obrigatórios em falta'}), 400
        
        party = Party.query.filter_by(is_active=True).first()
        if not party:
            return jsonify({'error': 'Festa não encontrada'}), 404
        
        # Check if already exists
        existing = RSVP.query.filter_by(email=data['email'], party_id=party.id).first()
        if existing:
            print(f"⚠️ Duplicate RSVP attempt for email: {data['email']}")
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
        print(f"✅ RSVP saved successfully: {rsvp.name} - {rsvp.confirmation_code}")
        
        # Send notification email with updated guest list
        if data['attending'] == 'yes':
            all_guests = RSVP.query.filter_by(party_id=party.id, attending='yes').order_by(RSVP.submitted_at.desc()).all()
            guest_list = [guest.to_dict() for guest in all_guests]
            print(f"📧 Sending notification email for new guest: {data['name']}")
            send_notification_email(data['name'], guest_list)
        
        return jsonify({
            'message': 'Presença confirmada com sucesso',
            'confirmation_code': rsvp.confirmation_code
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error submitting RSVP: {e}")
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
    print(f"📊 Retrieved {len(guests)} total guests from database")
    
    guest_data = [guest.to_dict() for guest in guests]
    return jsonify(guest_data)

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

@app.route('/api/test-email', methods=['GET'])
def test_email():
    """Test email configuration"""
    try:
        notification_email = os.getenv('NOTIFICATION_EMAIL')
        mail_username = os.getenv('MAIL_USERNAME')
        mail_password = os.getenv('MAIL_PASSWORD')
        
        print(f"🔧 Testing email configuration:")
        print(f"📧 MAIL_USERNAME: {mail_username}")
        print(f"📧 NOTIFICATION_EMAIL: {notification_email}")
        print(f"🔑 MAIL_PASSWORD: {'SET' if mail_password else 'NOT SET'}")
        
        if not notification_email:
            return jsonify({'error': 'NOTIFICATION_EMAIL not configured'}), 400
        
        if not mail_username or not mail_password:
            return jsonify({'error': 'MAIL_USERNAME or MAIL_PASSWORD not configured'}), 400
            
        msg = Message(
            subject="🎉 Test Email from Birthday Party App",
            recipients=[notification_email],
            body="This is a test email from your birthday party app. If you receive this, email is working correctly!",
            sender=mail_username
        )
        
        print(f"📤 Attempting to send test email to: {notification_email}")
        mail.send(msg)
        print(f"✅ Test email sent successfully!")
        
        return jsonify({
            'message': 'Test email sent successfully',
            'sent_to': notification_email,
            'from': mail_username
        }), 200
        
    except Exception as e:
        error_msg = f'Failed to send test email: {str(e)}'
        print(f"❌ {error_msg}")
        return jsonify({'error': error_msg}), 500

# Individual guest management
@app.route('/api/guest/<confirmation_code>', methods=['PUT'])
def update_guest(confirmation_code):
    """Update a specific guest's information"""
    try:
        guest = RSVP.query.filter_by(confirmation_code=confirmation_code).first()
        if not guest:
            return jsonify({'error': 'Guest not found'}), 404
        
        data = request.get_json()
        old_name = guest.name
        
        # Update allowed fields
        if 'name' in data:
            guest.name = data['name']
        if 'phone' in data:
            guest.phone = data['phone']
        
        db.session.commit()
        
        print(f"✅ Guest updated: {old_name} → {guest.name}")
        return jsonify({
            'message': f'Guest updated successfully',
            'old_name': old_name,
            'new_name': guest.name,
            'confirmation_code': confirmation_code
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error updating guest: {e}")
        return jsonify({'error': f'Failed to update guest: {str(e)}'}), 500

@app.route('/api/guest/<confirmation_code>', methods=['DELETE'])
def delete_guest(confirmation_code):
    """Delete a specific guest by confirmation code"""
    try:
        guest = RSVP.query.filter_by(confirmation_code=confirmation_code).first()
        if not guest:
            return jsonify({'error': 'Guest not found'}), 404
        
        guest_name = guest.name
        db.session.delete(guest)
        db.session.commit()
        
        print(f"✅ Guest deleted: {guest_name} - {confirmation_code}")
        return jsonify({
            'message': f'Guest {guest_name} removed successfully',
            'deleted_guest': guest_name,
            'confirmation_code': confirmation_code
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error deleting guest: {e}")
        return jsonify({'error': f'Failed to delete guest: {str(e)}'}), 500

# DEBUG ENDPOINTS - New additions for troubleshooting
@app.route('/api/debug/all-guests', methods=['GET'])
def get_all_guests_debug():
    """Debug endpoint to see ALL guests regardless of attending status"""
    try:
        party = Party.query.filter_by(is_active=True).first()
        if not party:
            return jsonify({'error': 'Festa não encontrada'}), 404
        
        all_guests = RSVP.query.filter_by(party_id=party.id).order_by(RSVP.submitted_at.desc()).all()
        
        # Group guests by attending status
        guests_by_status = {
            'yes': [],
            'no': [],
            'maybe': []
        }
        
        for guest in all_guests:
            status = guest.attending if guest.attending in ['yes', 'no', 'maybe'] else 'unknown'
            if status not in guests_by_status:
                guests_by_status[status] = []
            guests_by_status[status].append(guest.to_dict())
        
        print(f"🔍 Debug: Total guests in database: {len(all_guests)}")
        print(f"🔍 Debug: Guests by status: {[(k, len(v)) for k, v in guests_by_status.items()]}")
        
        return jsonify({
            'total_guests': len(all_guests),
            'guests_by_status': guests_by_status,
            'summary': {
                'attending_yes': len(guests_by_status['yes']),
                'attending_no': len(guests_by_status['no']),
                'attending_maybe': len(guests_by_status['maybe'])
            },
            'raw_guest_list': [guest.to_dict() for guest in all_guests]
        })
        
    except Exception as e:
        print(f"❌ Debug error: {e}")
        return jsonify({'error': f'Debug error: {str(e)}'}), 500

@app.route('/api/debug/database-info', methods=['GET'])
def get_database_info():
    """Debug endpoint to check database status"""
    try:
        # Check if tables exist using Flask-SQLAlchemy
        tables = db.engine.table_names() if hasattr(db.engine, 'table_names') else ['parties', 'rsvps']
        
        # Count records in each table
        party_count = Party.query.count()
        rsvp_count = RSVP.query.count()
        
        # Get active party info
        active_party = Party.query.filter_by(is_active=True).first()
        
        # Database URL (hide sensitive info)
        db_url = app.config['SQLALCHEMY_DATABASE_URI']
        if '@' in db_url:
            db_url_safe = db_url.split('@')[0].split('://')[0] + '://***@' + db_url.split('@')[1]
        else:
            db_url_safe = db_url
        
        print(f"🔍 Database info - Tables: {tables}, Parties: {party_count}, RSVPs: {rsvp_count}")
        
        return jsonify({
            'database_url': db_url_safe,
            'database_type': 'PostgreSQL' if 'postgresql' in db_url else 'SQLite',
            'tables': tables,
            'record_counts': {
                'parties': party_count,
                'rsvps': rsvp_count
            },
            'active_party': active_party.to_dict() if active_party else None,
            'environment': {
                'DATABASE_URL_SET': bool(os.getenv('DATABASE_URL')),
                'MAIL_USERNAME_SET': bool(os.getenv('MAIL_USERNAME')),
                'NOTIFICATION_EMAIL_SET': bool(os.getenv('NOTIFICATION_EMAIL'))
            }
        })
        
    except Exception as e:
        print(f"❌ Database debug error: {e}")
        return jsonify({'error': f'Database debug error: {str(e)}'}), 500

@app.route('/api/debug/test-insert', methods=['POST'])
def test_insert_guest():
    """Debug endpoint to test inserting a guest directly"""
    try:
        party = Party.query.filter_by(is_active=True).first()
        if not party:
            return jsonify({'error': 'Festa não encontrada'}), 404
        
        # Create a test guest
        test_guest = RSVP(
            party_id=party.id,
            name="Test Guest Debug",
            email=f"test-debug-{datetime.now().timestamp()}@example.com",
            phone="123456789",
            attending="yes",
            number_of_guests=1,
            message="Debug test guest"
        )
        
        db.session.add(test_guest)
        db.session.commit()
        
        print(f"✅ Debug: Test guest inserted successfully: {test_guest.confirmation_code}")
        
        # Verify it was saved
        saved_guest = RSVP.query.filter_by(confirmation_code=test_guest.confirmation_code).first()
        
        return jsonify({
            'message': 'Test guest inserted successfully',
            'guest': saved_guest.to_dict() if saved_guest else None,
            'confirmation_code': test_guest.confirmation_code
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Debug insert error: {e}")
        return jsonify({'error': f'Debug insert error: {str(e)}'}), 500

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
    try:
        db.create_all()
        if not Party.query.first():
            default_party = Party()
            db.session.add(default_party)
            db.session.commit()
            print("✅ Festa padrão criada!")
        else:
            print("✅ Database initialized, existing party found")
    except Exception as e:
        print(f"❌ Database initialization error: {e}")

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"🚀 Iniciando servidor Flask na porta {port}")
    print(f"📧 Email configurado: {bool(os.getenv('MAIL_USERNAME'))}")
    print(f"🗄️ Database: {'PostgreSQL' if 'postgresql' in app.config['SQLALCHEMY_DATABASE_URI'] else 'SQLite'}")
    app.run(host='0.0.0.0', port=port, debug=True)