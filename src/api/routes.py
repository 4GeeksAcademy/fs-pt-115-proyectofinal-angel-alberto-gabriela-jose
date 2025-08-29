"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from flask_bcrypt import Bcrypt
api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)
bcrypt= Bcrypt()


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200

@api.route('/register',methods=['POST'])
def register_user():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get(password)

    if not all ([name, email, password]):
        raise APIException("Nombre, email y contraseña son requeridos", status_code=400)

    user_exists = User.query.filter_by(email=email).first()
    if user_exists:
        raise APIException("El correo electrónico ya está en uso", status_code=409)
    
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    new_user= User(
    name=name,
    email=email,
    password_hash=hashed_password,
    is_active=True
)
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"msg": "Usuario creado exitosamente"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al guardar el usuario", "error": str(e)}), 500
