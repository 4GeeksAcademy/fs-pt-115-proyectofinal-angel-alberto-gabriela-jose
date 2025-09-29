"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint, current_app
from api.models import db, User, Hogar, Task, ShoppingItem, Reward, Goal, Unlockable
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import uuid
from datetime import datetime
from functools import wraps
import secrets
from itsdangerous import URLSafeTimedSerializer
from flask_mail import Message
import os

api = Blueprint('api', __name__)

# CORS
CORS(api)
bcrypt = Bcrypt()

s = URLSafeTimedSerializer(os.environ.get('JWT_SECRET', 'fallback-secret-key'))


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user or user.role != 'admin':
            return jsonify({"msg": "no eres dueño de este hogar"}), 400
        return fn(*args, **kwargs)
    return wrapper

# --- Rutas de Autenticación y Usuarios ---


@api.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    nombre = data.get('nombre')
    email = data.get('email')
    password = data.get('password')
    invitation_link = data.get('invitation_link')

    role_for_new_user = 'miembro'

    if not all([nombre, email, password]):
        raise APIException(
            "Nombre, email y contraseña son requeridos", status_code=400)

    if User.query.filter_by(email=email).first():
        raise APIException(
            "El correo electrónico ya está en uso", status_code=409)

    if invitation_link:
        hogar = Hogar.query.filter_by(invitation_link=invitation_link).first()
        if not hogar:
            raise APIException(
                "Enlace de invitación inválido", status_code=404)
        role_for_new_user = 'miembro'

    else:
        hogar = Hogar(nombre="mi hogar", invitation_link=str(uuid.uuid4()))
        db.session.add(hogar)
        db.session.flush()
        role_for_new_user = 'admin'

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(
        nombre=nombre, email=email, password_hash=hashed_password,
        role=role_for_new_user, casa_id=hogar.id
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
        raise APIException(
            "Email y contraseña son requeridos", status_code=400)

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        raise APIException("Credenciales incorrectas", status_code=401)

    access_token = create_access_token(identity=str(user.id))
    return jsonify(token=access_token, user=user.serialize()), 200


# ---Rutas del olvido de Contraseña ---


@api.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        raise APIException("El email es requerido", status_code=400)

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"msg": "Si existe email, se enviará enlace de recuperación"}), 200

    token = s.dumps(email, salt='password-reset-salt')

    frontend_url = os.environ.get(
        'FRONTEND_URL', 'https://miniature-space-fishstick-g469p4g9q5v43w9wj-3000.app.github.dev/')
    reset_url = f"{frontend_url}/reset-password/{token}"

    try:
        msg = Message(
            subject="Recuperación de Contaseña - AURA",
            recipients=[email],
            html=f""" <h2>Recuperación de contraseña</h2>
                      <p>Hemos recibido la solicitud de restablecimiento de contraseña</p>
                      <p>Click en el enlace para crear nueva contraseña:</p>
                      <a href="{reset_url}" style="background-color:#1976d2;
                      color: white;
                      padding: 10px 20px;
                      text-decoration: none; 
                      border-radius: 4px; 
                      display: inline-block;">Restablecer Contraseña</a>
                      <p>Si no has solicitado el cambio, ignora el mensaje</p>
                      <p><strong>El enlace expira en 1 hora</strong></p>
                      """)
        current_app.extensions['mail'].send(msg)

        return jsonify({"msg": "Si el email existe, se ha enviado un enlace de recuperación"}), 200

    except Exception as e:
        print(f"Error enviando email: {e}")
        raise APIException(
            "Error al enviar el email de recuperación", status_code=500)


@api.route('/reset-password/<token>', methods=['POST'])
def reset_password(token):
    data = request.get_json()
    new_password = data.get('new_password')

    if not new_password:
        raise APIException("La nueva contraseña es requerida", status_code=400)

    try:

        email = s.loads(token, salt='password-reset-salt', max_age=3600)
    except:
        raise APIException(
            "El enlace de recuperación es inválido o ha expirado", status_code=400)

    user = User.query.filter_by(email=email).first()
    if not user:
        raise APIException("Usuario no encontrado", status_code=404)

    hashed_password = bcrypt.generate_password_hash(
        new_password).decode('utf-8')
    user.password_hash = hashed_password
    db.session.commit()

    return jsonify({"msg": "Contraseña actualizada exitosamente"}), 200


@api.route('/validate-reset-token/<token>', methods=['GET'])
def validate_reset_token(token):
    try:
        email = s.loads(token, salt='password-reset-salt', max_age=3600)
        user = User.query.filter_by(email=email).first()
        if user:
            return jsonify({"valid": True, "email": email}), 200
        else:
            return jsonify({"valid": False}), 400
    except:
        return jsonify({"valid": False}), 400


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

### para objetivos##


@api.route('/hogar/miembros/<int:id>', methods=['PUT'])
@jwt_required()
def update_miembro_hogar(id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)

    miembro_a_actualizar = User.query.get_or_404(id)

    if current_user.casa_id != miembro_a_actualizar.casa_id:
        return jsonify({"msg": "No tienes permiso para modificar a este usuario"}), 403

    data = request.get_json()
    if not data:
        raise APIException(
            "No se recibieron datos para actualizar", status_code=400)

    if 'ingresos' in data:
        miembro_a_actualizar.ingresos = data['ingresos']
    if 'meta' in data:
        miembro_a_actualizar.meta = data['meta']

    db.session.commit()

    return jsonify(miembro_a_actualizar.serialize()), 200


@api.route('/hogar/create', methods=['POST'])
@jwt_required()
def create_hogar():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if user.casa_id:
        raise APIException(
            "Ya perteneces a un hogar. Sal del actual para crear uno nuevo.", status_code=400)

    nombre = request.json.get('nombre')
    if not nombre:
        raise APIException("El nombre del hogar es requerido", status_code=400)

    new_hogar = Hogar(nombre=nombre, invitation_link=str(uuid.uuid4()))
    db.session.add(new_hogar)

    user.casa = new_hogar
    user.role = 'admin'

    db.session.commit()
    return jsonify(new_hogar.serialize()), 200


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
    user.role = 'miembro'
    db.session.commit()
    return jsonify(hogar.serialize()), 200

# --- actualiza nombre del hogar ---


@api.route('/hogar', methods=['PUT'])
@jwt_required()
@admin_required
def update_hogar():
    user = User.query.get(get_jwt_identity())
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
@admin_required
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
@admin_required
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


# --- Rutas de Objetivos (Goals) ---

@api.route('goals', methods=['Get'])
@jwt_required()
def get_goals():
    user = User.query.get(get_jwt_identity())

    if user.role == 'admin':
        goals = Goal.query.filter_by(casa_id=user.casa.id).all()
    else:
        goals = Goal.query.filter_by(
            casa_id=user.casa_id, user_id=user.id).all()

    return jsonify([goal.serialize() for goal in goals]), 200


@api.route('/goals', methods=['POST'])
@jwt_required()
def create_goal():
    user = User.query.get(get_jwt_identity())
    data = request.get_json()

    if not data.get('titulo'):
        raise APIException("Titulo de objetivo requerido", status_code=400)

    new_goal = Goal(
        titulo=data.get('titulo'),
        descripcion=data.get('descripcion', ''),
        puntos_requeridos=data.get('puntos_requeridos', 0),
        user_id=user.id,
        casa_id=user.casa_id
    )

    db.session.add(new_goal)
    db.session.commit()

    return jsonify(new_goal.serialize()), 201


@api.route('/goals/<int:goal_id>', methods=['PUT'])
@jwt_required()
def update_goal(goal_id):
    current_user = User.query.get(get_jwt_identity())
    goal = Goal.query.get_or_404(goal_id)

    if current_user.role != 'admin' and goal.user_id != current_user.id:
        return jsonify({"msg": "No tienes permisos para modificar el objeto"}), 403

    data = request.get_json()

    if 'titulo' in data:
        goal.titulo = data['titulo']
    if 'descripcion' in data:
        goal.descripcion = data['descripcion']
    if 'puntos_requeridos' in data:
        goal.puntos_requeridos = data['puntos_requeridos']
    if 'completado' in data:
        goal.completado = data['completado']
    if current_user.role == 'admin' and 'user_id' in data:
        goal.user_id = data['user_id']

    db.session.commit()

    return jsonify(goal.serialize()), 200


@api.route('/goals/<int:goal_id>', methods=['DELETE'])
@jwt_required()
def delete_goal(goal_id):
    current_user = User.query.get(get_jwt_identity())
    goal = Goal.query.get_or_404(goal_id)

    if current_user.role != 'admin' and goal.user_id != current_user.id:
        return jsonify({"msg": "No tienes permiso para eliminar el objeto"}), 403

    db.session.delete(goal)
    db.session.commit()

    return jsonify({"msg": "Objetivo eliminado"}), 200
