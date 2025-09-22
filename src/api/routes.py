"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Hogar, Task, ShoppingItem, Reward, Goal, Unlockable
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import uuid
from datetime import datetime

api = Blueprint('api', __name__)

# CORS
CORS(api)
bcrypt = Bcrypt()

# --- Rutas de Autenticación y Usuarios ---


@api.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    nombre = data.get('nombre')
    email = data.get('email')
    password = data.get('password')
    invitation_link = data.get('invitation_link')

    if not all([nombre, email, password]):
        raise APIException(
            "Nombre, email y contraseña son requeridos", status_code=400)

    if User.query.filter_by(email=email).first():
        raise APIException(
            "El correo electrónico ya está en uso", status_code=409)

    hogar = None
    if invitation_link:
        hogar = Hogar.query.filter_by(invitation_link=invitation_link).first()
        if not hogar:
            raise APIException(
                "Enlace de invitación inválido", status_code=404)

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(
        nombre=nombre, email=email, password_hash=hashed_password,
        role='miembro', casa_id=hogar.id if hogar else None
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"msg": "Usuario creado exitosamente"}), 201


@api.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email, password = data.get('email'), data.get('password')
    if not all([email, password]):
        raise APIException(
            "Email y contraseña son requeridos", status_code=400)

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        raise APIException("Credenciales incorrectas", status_code=401)

    access_token = create_access_token(identity=str(user.id))
    return jsonify(token=access_token, user=user.serialize()), 200

# --- Rutas del Hogar ---


@api.route('/hogar', methods=['GET'])
@jwt_required()
def get_user_hogar():
    user = User.query.get(get_jwt_identity())
    if not user.casa_id:
        return jsonify(None), 200
    hogar = Hogar.query.get(user.casa_id)
    return jsonify(hogar.serialize()), 200


@api.route('/hogar/miembros', methods=['GET'])
@jwt_required()
def get_miembros_hogar():
    user = User.query.get(get_jwt_identity())
    if not user.casa_id:
        return jsonify({"msg": "El usuario no pertenece a un hogar"}), 400
    hogar = Hogar.query.get(user.casa_id)
    return jsonify([miembro.serialize() for miembro in hogar.users]), 200


@api.route('/hogar/create', methods=['POST'])
@jwt_required()
def create_hogar():
    user = User.query.get(get_jwt_identity())
    if user.casa_id:
        raise APIException(
            "Ya perteneces a un hogar. Sal del actual para crear uno nuevo.", status_code=400)
    nombre = request.json.get('nombre')
    if not nombre:
        raise APIException("El nombre del hogar es requerido", status_code=400)

    new_hogar = Hogar(nombre=nombre, invitation_link=str(uuid.uuid4()))
    db.session.add(new_hogar)
    db.session.commit()
    user.casa_id = new_hogar.id
    db.session.commit()
    return jsonify(new_hogar.serialize()), 201


@api.route('/hogar/join', methods=['POST'])
@jwt_required()
def join_hogar():
    user = User.query.get(get_jwt_identity())
    link = request.json.get('invitation_link')
    if not link:
        raise APIException(
            "Se requiere el enlace de invitación", status_code=400)

    hogar = Hogar.query.filter_by(invitation_link=link).first_or_404(
        description="Enlace inválido")

    if user.casa_id is not None:
        raise APIException(
            "Ya perteneces a un hogar. Debes salir del actual para unirte a uno nuevo.", status_code=400)

    user.casa_id = hogar.id
    db.session.commit()
    return jsonify(hogar.serialize()), 200

# --- Rutas de Tareas ---


@api.route('/tasks/hogar', methods=['GET'])
@jwt_required()
def get_tasks_by_home():
    user = User.query.get(get_jwt_identity())
    if not user.casa_id:
        return jsonify([]), 200
    tasks = Task.query.filter_by(casa_id=user.casa_id).all()
    return jsonify([task.serialize() for task in tasks]), 200


@api.route('/tasks', methods=['POST'])
@jwt_required()
def create_task():
    user = User.query.get(get_jwt_identity())
    if not user.casa_id:
        raise APIException(
            "Debes pertenecer a un hogar para crear tareas", status_code=400)

    data = request.get_json()
    title = data.get('title')
    if not title:
        raise APIException(
            "El título de la tarea es requerido", status_code=400)

    new_task = Task(title=title, casa_id=user.casa_id, creator_id=user.id)
    db.session.add(new_task)
    db.session.commit()
    return jsonify(new_task.serialize()), 201


@api.route("/tasks/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    user = User.query.get(get_jwt_identity())
    if user.casa_id != task.casa_id:
        return jsonify({"msg": "Acceso denegado"}), 403

    data = request.get_json()

    # reasignación de usuario
    if "asignado_a" in data:
        task.asignado_a = data["asignado_a"]

    # actualiza estado y suma puntos al completar
    if "estado" in data:
        task.estado = data["estado"]
        if task.estado == "completada" and not task.completed_at:
            task.completed_at = datetime.utcnow()
            if task.asignado_a:
                assignee = User.query.get(task.asignado_a)
                if assignee:
                    assignee.puntos += task.puntos

    db.session.commit()
    return jsonify(task.serialize()), 200


@api.route("/tasks/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    user = User.query.get(get_jwt_identity())
    if user.casa_id != task.casa_id:
        return jsonify({"msg": "Permiso denegado"}), 403

    db.session.delete(task)
    db.session.commit()
    return jsonify({"msg": "Tarea eliminada"}), 200

# --- Rutas de Dashboard ---


@api.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    user = User.query.get(get_jwt_identity())
    if not user:
        raise APIException("Usuario no encontrado", status_code=404)
    return jsonify({"user_points": user.puntos}), 200
