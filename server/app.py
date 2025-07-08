from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from datetime import datetime, timezone
import secrets
import string
import os
from dotenv import load_dotenv
import threading

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
CORS(app, origins=['http://localhost:5173'])

# Models
class Party(db.Model):
    __tablename__ = 'parties'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), default="Darius' Birthday Party")
    description = db.Column(db.Text, default="Join us for an amazing birthday celebration!")
    date = db.Column(db.DateTime, default=lambda: datetime(2024, 7, 27, 19, 0))
    time = db.Column(db.String(20), default="7:00 PM")
    address = db.Column(db.String(500), default="123 Party Street, Fun City")
    max_guests = db.Column(db.Integer, default=50)
    is_active = db.Column(db.Boolean, default=True)
    rsvp_deadline = db.Column(db.DateTime, default=lambda: datetime(2024, 7, 25, 23, 59))
    contact_email = db.Column(db.String(120), default="party@example.com")
    contact_phone = db.Column(db.String(20), default="+1 (555) 123-4567")
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
            print(f"✅ Email sent successfully!")
        except Exception as e:
            print(f"❌ Failed to send email: {e}")

def send_notification_email(new_guest_name, all_guests):
    """Send notification email with updated guest list"""
    notification_email = os.getenv('NOTIFICATION_EMAIL')
    
    if not notification_email:
        print("⚠️ No notification email configured")
        return
    
    try:
        subject = f"🎉 Darius Birthday: {new_guest_name}"
        
        # Create HTML email content
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; color: white; text-align: center;">
                <h1>🎉 Darius Birthday!</h1>
                <h2>{new_guest_name} just joined the party!</h2>
            </div>
            
            <div style="padding: 20px;">
                <h3 style="color: #667eea;">📝 Updated Guest List ({len(all_guests)} attendees):</h3>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
                    <ul style="list-style: none; padding: 0;">
        """
        
        for i, guest in enumerate(all_guests, 1):
            guest_name = guest.get('name', 'Unknown')
            submitted_time = guest.get('submitted_at', '')
            html_body += f"""
                        <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
                            <span style="font-weight: bold; color: #667eea;">#{i}</span> 
                            🎈 {guest_name}
                            <span style="color: #6c757d; font-size: 0.9em; margin-left: 10px;">
                                ({submitted_time[:10] if submitted_time else 'Unknown date'})
                            </span>
                        </li>
            """
        
        html_body += """
                    </ul>
                </div>
                
                <div style="margin-top: 30px; padding: 15px; background-color: #e8f4f8; border-radius: 8px;">
                    <p style="margin: 0; color: #0c63e4;">
                        <strong>🎊 Party Details:</strong><br>
                        📅 July 27th, 2024 at 5:00 PM<br>
                        📍 123 Party Street, Fun City<br>
                        👥 Total Attendees: """ + str(len(all_guests)) + """
                    </p>
                </div>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 0.9em;">
                <p>This notification was sent automatically when someone RSVPed to Darius' Birthday Party.</p>
            </div>
        </body>
        </html>
        """
        
        # Create plain text version
        text_body = f"""
        🎉 New Party RSVP!
        
        {new_guest_name} just joined the party!
        
        📝 Updated Guest List ({len(all_guests)} attendees):
        """
        
        for i, guest in enumerate(all_guests, 1):
            guest_name = guest.get('name', 'Unknown')
            text_body += f"\n#{i} 🎈 {guest_name}"
        
        text_body += f"""
        
        🎊 Party Details:
        📅 July 27th, 2024 at 7:00 PM
        📍 123 Party Street, Fun City
        👥 Total Attendees: {len(all_guests)}
        
        This notification was sent automatically when someone RSVPed to Darius' Birthday Party.
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
        print(f"❌ Error creating notification email: {e}")

# Routes
@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'OK',
        'message': 'Birthday Party API is running',
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
        return jsonify({'error': 'Party not found'}), 404
    
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
            return jsonify({'error': 'Missing required fields'}), 400
        
        party = Party.query.filter_by(is_active=True).first()
        if not party:
            return jsonify({'error': 'Party not found'}), 404
        
        # Check if already exists
        existing = RSVP.query.filter_by(email=data['email'], party_id=party.id).first()
        if existing:
            return jsonify({
                'error': 'You have already submitted an RSVP',
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
            'message': 'RSVP submitted successfully',
            'confirmation_code': rsvp.confirmation_code
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to submit RSVP: {str(e)}'}), 500

@app.route('/api/rsvp/<confirmation_code>', methods=['GET'])
def get_rsvp(confirmation_code):
    rsvp = RSVP.query.filter_by(confirmation_code=confirmation_code).first()
    if not rsvp:
        return jsonify({'error': 'RSVP not found'}), 404
    return jsonify({
        'rsvp': rsvp.to_dict(),
        'party': rsvp.party.to_dict()
    })

@app.route('/api/guests', methods=['GET'])
def get_guests():
    party = Party.query.filter_by(is_active=True).first()
    if not party:
        return jsonify({'error': 'Party not found'}), 404
    
    guests = RSVP.query.filter_by(party_id=party.id).order_by(RSVP.submitted_at.desc()).all()
    return jsonify([guest.to_dict() for guest in guests])

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Route not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

# Initialize database
with app.app_context():
    db.create_all()
    if not Party.query.first():
        default_party = Party()
        db.session.add(default_party)
        db.session.commit()
        print("✅ Default party created!")

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"🚀 Starting Flask server on port {port}")
    print(f"📧 Email configured: {bool(os.getenv('MAIL_USERNAME'))}")
    app.run(host='0.0.0.0', port=port, debug=True)
