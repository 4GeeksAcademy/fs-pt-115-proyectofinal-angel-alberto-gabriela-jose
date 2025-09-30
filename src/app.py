"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
from flask import Flask, request, jsonify, url_for, send_from_directory
from flask_migrate import Migrate
from flask_swagger import swagger
from api.utils import APIException, generate_sitemap
from api.models import db
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands
from api.dashboard_routes import dashboard_bp
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from api.finance_routes import finance_bp
from api.recompensas_routes import recompensas_bp
from api.email_routes import email_bp
from datetime import timedelta
from api.gastos_routes import gastos_bp
from flask_mail import Mail
import cloudinary
import cloudinary.uploader
import cloudinary.api

ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"

# Iniciar la aplicación Flask con la configuración correcta de la carpeta estática
# Esto le dice a Flask que la carpeta 'dist' en la raíz del proyecto contiene los archivos del frontend
static_file_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.realpath(__file__))), 'dist')
app = Flask(__name__, static_folder=static_file_dir, static_url_path='/')
app.url_map.strict_slashes = False

# Habilitar CORS
CORS(app)

# Configuración de la base de datos
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace(
        "postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)
bcrypt = Bcrypt(app)

# Configuración de JSON Web Token
app.config["JWT_SECRET_KEY"] = os.environ.get('JWT_SECRET')
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
jwt = JWTManager(app)

# Configuración de email
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = 587
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')
mail = Mail(app)
api.mail = mail

# Configuración de Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# Setup de Admin y Comandos
setup_admin(app)
setup_commands(app)

# Registrar Blueprints de la API
app.register_blueprint(api, url_prefix='/api')
app.register_blueprint(dashboard_bp, url_prefix='/api')
app.register_blueprint(finance_bp, url_prefix='/api')
app.register_blueprint(recompensas_bp, url_prefix='/api')
app.register_blueprint(email_bp, url_prefix='/api')
app.register_blueprint(gastos_bp, url_prefix='/api')

# Manejo de errores
@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# this only runs if `$ python src/main.py` is executed
if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=True)