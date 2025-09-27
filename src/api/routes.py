"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Hogar, Task, ShoppingItem, Reward, Goal
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
        raise APIException("Nombre, email y contraseña son requeridos", status_code=400)

    if User.query.filter_by(email=email).first():
        raise APIException("El correo electrónico ya está en uso", status_code=409)

    if invitation_link:
        hogar = Hogar.query.filter_by(invitation_link=invitation_link).first()
        if not hogar:
            raise APIException("Enlace de invitación inválido", status_code=404)
    else:
        hogar = Hogar(nombre="mi hogar", invitation_link=str(uuid.uuid4()))
        db.session.add(hogar)
        db.session.flush()

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(
        nombre=nombre, email=email, password_hash=hashed_password,
        role='miembro', casa_id=hogar.id
    )

    db.session.add(new_user)
    db.session.commit()
    access_token = create_access_token(identity=str(new_user.id))
    return jsonify({"msg": "Usuario creado exitosamente", "access_token": access_token, "user": new_user.serialize()}), 201


@api.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email, password = data.get('email'), data.get('password')
    if not all([email, password]):
        raise APIException("Email y contraseña son requeridos", status_code=400)

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        raise APIException("Credenciales incorrectas", status_code=401)

    access_token = create_access_token(identity=str(user.id))
    return jsonify(token=access_token, user=user.serialize()), 200


# --- Rutas del Hogar ---
@api.route('/hogar', methods=['GET'])
@jwt_required()
def get_user_hogar():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
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


@api.route('/hogar/miembros/<int:id>', methods=['PUT'])
@jwt_required()
def update_miembro_hogar(id):
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)

    miembro_a_actualizar = User.query.get_or_404(id)

    if current_user.casa_id != miembro_a_actualizar.casa_id:
        return jsonify({"msg": "No tienes permiso para modificar a este usuario"}), 403

    data = request.get_json()
    if not data:
        raise APIException("No se recibieron datos para actualizar", status_code=400)

    if 'ingresos' in data:
        miembro_a_actualizar.ingresos = data['ingresos']
    if 'meta' in data:
        miembro_a_actualizar.meta = data['meta']

    db.session.commit()
    return jsonify(miembro_a_actualizar.serialize()), 200


@api.route('/hogar/create', methods=['POST'])
@jwt_required()
def create_hogar():
    user = User.query.get(get_jwt_identity())
    if user.casa_id:
        raise APIException("Ya perteneces a un hogar. Sal del actual para crear uno nuevo.", status_code=400)
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
        raise APIException("Se requiere el enlace de invitación", status_code=400)

    hogar = Hogar.query.filter_by(invitation_link=link).first_or_404(description="Enlace inválido")

    if user.casa_id is not None:
        raise APIException("Ya perteneces a un hogar. Debes salir del actual para unirte a uno nuevo.", status_code=400)

    user.casa_id = hogar.id
    db.session.commit()
    return jsonify(hogar.serialize()), 200


@api.route('/hogar', methods=['PUT'])
@jwt_required()
def update_hogar():
    user = User.query.get(get_jwt_identity())
    if not user.casa_id:
        raise APIException("No perteneces a ningún hogar", status_code=400)

    data = request.get_json()
    nuevo_nombre = data.get("nombre")

    if not nuevo_nombre:
        raise APIException("El nombre del hogar es requerido", status_code=400)

    hogar = Hogar.query.get(user.casa_id)
    hogar.nombre = nuevo_nombre
    db.session.commit()

    return jsonify({"msg": "Nombre del hogar actualizado", "hogar": hogar.serialize()}), 200


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
        raise APIException("Debes pertenecer a un hogar para crear tareas", status_code=400)

    data = request.get_json()
    title = data.get('title')
    if not title:
        raise APIException("El título de la tarea es requerido", status_code=400)

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

    if "asignado_a" in data:
        task.asignado_a = data["asignado_a"]

    if "estado" in data:
        task.estado = data["estado"]

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


# --- Rutas de Recompensas ---
@api.route('/recompensas/hogar', methods=['GET'])
@jwt_required()
def get_recompensas_hogar():
    user = User.query.get(get_jwt_identity())
    if not user.casa_id:
        return jsonify([]), 200
    recompensas = Reward.query.filter_by(casa_id=user.casa_id).all()
    return jsonify([r.serialize() for r in recompensas]), 200


@api.route('/recompensas', methods=['POST'])
@jwt_required()
def create_recompensa():
    user = User.query.get(get_jwt_identity())
    if not user.casa_id:
        return jsonify({"msg": "Debes pertenecer a un hogar para crear recompensas"}), 400

    data = request.get_json()
    titulo = data.get("titulo")
    descripcion = data.get("descripcion")
    costo = data.get("costo")
    emoji = data.get("emoji", "")

    if not titulo or not costo:
        return jsonify({"msg": "Título y costo son obligatorios"}), 400

    nueva_recompensa = Reward(
        titulo=titulo,
        descripcion=descripcion,
        costo_puntos=costo,
        emoji=emoji,
        casa_id=user.casa_id
    )

    db.session.add(nueva_recompensa)
    db.session.commit()

    return jsonify(nueva_recompensa.serialize()), 201


@api.route('/recompensas/<int:reward_id>', methods=['DELETE'])
@jwt_required()
def delete_recompensa(reward_id):
    user = User.query.get(get_jwt_identity())
    reward = Reward.query.get_or_404(reward_id)

    if reward.casa_id != user.casa_id:
        return jsonify({"msg": "No tienes permiso para eliminar esta recompensa"}), 403

    db.session.delete(reward)
    db.session.commit()
    return jsonify({"msg": "Recompensa eliminada"}), 200