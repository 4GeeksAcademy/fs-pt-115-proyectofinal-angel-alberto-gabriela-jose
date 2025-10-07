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

# Allow CORS requests to this API
CORS(api)
bcrypt = Bcrypt()

s = URLSafeTimedSerializer(os.environ.get('JWT_SECRET', 'fallback-secret-key'))


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user or user.role != 'admin':
            return jsonify({"msg": "Acceso denegado: se requieren permisos de administrador"}), 403
        return fn(*args, **kwargs)
    return wrapper

# --- Rutas de Autenticación y Usuarios ---


@api.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    nombre = data.get('nombre')
    email = data.get('email')
    password = data.get('password')
    invitation_code = data.get('invitation_code')

    role_for_new_user = 'miembro'

    if not all([nombre, email, password]):
        return jsonify({"msg": "Nombre, email y contraseña son requeridos"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "El correo electrónico ya está en uso"}), 409

    hogar = None
    if invitation_code:
        hogar = Hogar.query.filter_by(invitation_link=invitation_code).first()

        if not hogar:
            return jsonify({"msg": "Enlace de invitación inválido o caducado"}), 400

        role_for_new_user = 'miembro'
    else:
        hogar_nombre = "Hogar de " + \
            nombre.split()[0] if nombre else "Mi Hogar"
        hogar = Hogar(nombre=hogar_nombre, invitation_link=str(uuid.uuid4()))
        db.session.add(hogar)
        db.session.flush()

        role_for_new_user = 'admin'

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(
        nombre=nombre, email=email, password_hash=hashed_password,
        role=role_for_new_user, casa_id=hogar.id
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        access_token = create_access_token(identity=str(new_user.id))
        return jsonify({"msg": "Usuario creado exitosamente", "access_token": access_token, "user": new_user.serialize()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error interno del servidor al crear usuario"}), 500


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
        'FRONTEND_URL', 'https://miniature-space-fishstick-g469p4g9q5v43w9wj-3000.app.github.dev')
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

# --Rutas Perfil Usuario--


@api.route('/profile', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({"msg": "Usuario no encontrado"}), 404
    if request.method == 'GET':
        return jsonify(user.serialize()), 200
    elif request.method == 'PUT':
        data = request.get_json()
        if 'nombre' in data:
            user.nombre = data['nombre']

        db.session.commit()
        return jsonify({"msg": "Perfil actualizado", "user": user.serialize()}), 200

    elif request.method == 'DELETE':

        return jsonify({"msg": "Usar la ruta /profile/delete para evitar conflictos."}), 405


@api.route('/profile/password', methods=['PUT'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    if not all([old_password, new_password]):
        return jsonify({"msg": "Contraseña actual y nueva son requeridas"}), 400

    if not bcrypt.check_password_hash(user.password_hash, old_password):
        return jsonify({"msg": "Contraseña actual incorrecta"}), 400

    user.password_hash = bcrypt.generate_password_hash(
        new_password).decode('utf-8')
    db.session.commit()

    return jsonify({"msg": "Contraseña actualizada exitosamente"}), 200


@api.route('/profile', methods=['DELETE'])
@jwt_required()
def delete_profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))

    if not user:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    try:
        print(f"🚨 INICIANDO ELIMINACIÓN DE USUARIO: {user.id} - {user.nombre}")

        tasks_as_creator = Task.query.filter_by(creator_id=user.id).all()
        print(f"🗑️ Eliminando {len(tasks_as_creator)} tareas como creador")
        for task in tasks_as_creator:
            db.session.delete(task)

        tasks_as_assigned = Task.query.filter_by(asignado_a=user.id).all()
        print(f"🔄 Desvinculando {len(tasks_as_assigned)} tareas como asignado")
        for task in tasks_as_assigned:
            task.asignado_a = None

        rewards_redeemed = Reward.query.filter_by(canjeado_por=user.id).all()
        print(f"🔄 Desvinculando {len(rewards_redeemed)} recompensas canjeadas")
        for reward in rewards_redeemed:
            reward.canjeado_por = None

        hogar = Hogar.query.get(user.casa_id) if user.casa_id else None

        if hogar and user.role == 'admin':
            otro_miembro = User.query.filter(
                User.casa_id == user.casa_id,
                User.id != user.id
            ).first()

            if otro_miembro:
                otro_miembro.role = 'admin'
                print(f"✅ Transferido rol admin a: {otro_miembro.nombre}")
            else:
                print("🗑️ Eliminando hogar completo (sin más miembros)")
                Task.query.filter_by(casa_id=hogar.id).delete()
                Reward.query.filter_by(casa_id=hogar.id).delete()
                Goal.query.filter_by(casa_id=hogar.id).delete()
                db.session.delete(hogar)

        print("🔄 Anonymizando datos del usuario")
        user.nombre = "Usuario Eliminado"
        user.email = f"deleted_{user.id}@example.com"
        user.password_hash = bcrypt.generate_password_hash(
            str(uuid.uuid4())).decode('utf-8')
        user.role = 'miembro'
        user.casa_id = None
        user.puntos = 0
        user.ingresos = 0
        user.meta = 0

        db.session.commit()
        print("✅ Usuario anonymizado exitosamente")

        return jsonify({"msg": "Cuenta eliminada con éxito"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ ERROR CRÍTICO eliminando usuario: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"msg": f"Error al eliminar la cuenta: {str(e)}"}), 500

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
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user.casa_id:
        return jsonify({"msg": "El usuario no pertenece a un hogar"}), 400
    hogar = Hogar.query.get(user.casa_id)
    return jsonify([miembro.serialize() for miembro in hogar.users]), 200


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


@api.route('/hogar/miembros/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_miembro_hogar(user_id):
    current_user_id_str = get_jwt_identity()
    current_user_id = int(current_user_id_str)

    if current_user_id == user_id:
        return jsonify({"msg": "No te puedes eliminar a ti mismo"}), 400

    user_to_delete = User.query.get(user_id)
    if not user_to_delete:
        return jsonify({"msg": "Usuario no encontrado"}), 404

    current_user = User.query.get(current_user_id)
    if user_to_delete.casa_id != current_user.casa_id:
        return jsonify({"msg": "No tienes permiso para eliminar a este usuario"}), 403

    user_to_delete.casa_id = None
    user_to_delete.role = 'miembro'
    db.session.commit()

    return jsonify({"msg": "Usuario eliminado del hogar"}), 200


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
    db.session.flush()

    user.casa_id = new_hogar.id
    user.role = 'admin'

    db.session.commit()
    return jsonify(new_hogar.serialize()), 200


@api.route('/hogar/join', methods=['POST'])
@jwt_required()
def join_hogar():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    link = request.json.get('invitation_link')
    if not link:
        raise APIException(
            "Se requiere el enlace de invitación", status_code=400)

    hogar = Hogar.query.filter_by(invitation_link=link).first()
    if not hogar:
        raise APIException("Enlace de invitación inválido", status_code=404)

    if user.casa_id is not None:
        raise APIException(
            "Ya perteneces a un hogar. Debes salir del actual para unirte a uno nuevo.", status_code=400)

    user.casa_id = hogar.id
    user.role = 'miembro'
    db.session.commit()
    return jsonify(hogar.serialize()), 200


@api.route('/hogar', methods=['PUT'])
@jwt_required()
@admin_required
def update_hogar():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
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
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user.casa_id:
        return jsonify([]), 200
    tasks = Task.query.filter_by(casa_id=user.casa_id).all()
    return jsonify([task.serialize() for task in tasks]), 200


@api.route('/tasks', methods=['POST'])
@jwt_required()
def create_task():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
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
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.casa_id != task.casa_id:
        return jsonify({"msg": "Acceso denegado"}), 403

    data = request.get_json()
    estado_anterior = task.estado

    if "asignado_a" in data:
        task.asignado_a = data["asignado_a"]

    if "estado" in data:
        task.estado = data["estado"]
        if estado_anterior != "completada" and data["estado"] == "completada" and task.asignado_a:
            usuario_asignado = User.query.get(task.asignado_a)
            if usuario_asignado:
                usuario_asignado.puntos += task.puntos

    db.session.commit()
    return jsonify(task.serialize()), 200


@api.route("/tasks/<int:task_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if user.casa_id != task.casa_id:
        return jsonify({"msg": "Permiso denegado"}), 403

    db.session.delete(task)
    db.session.commit()
    return jsonify({"msg": "Tarea eliminada"}), 200


# --- Rutas de Recompensas ---
@api.route('/recompensas/hogar', methods=['GET'])
@jwt_required()
def get_recompensas_hogar():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user.casa_id:
        return jsonify([]), 200
    recompensas = Reward.query.filter_by(casa_id=user.casa_id).all()
    return jsonify([r.serialize() for r in recompensas]), 200


@api.route('/recompensas', methods=['POST'])
@jwt_required()
def create_recompensa():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
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
        title=titulo,
        description=descripcion,
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
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    reward = Reward.query.get_or_404(reward_id)

    if reward.casa_id != user.casa_id:
        return jsonify({"msg": "No tienes permiso para eliminar esta recompensa"}), 403

    db.session.delete(reward)
    db.session.commit()
    return jsonify({"msg": "Recompensa eliminada"}), 200


@api.route('/recompensas/canjear/<int:reward_id>', methods=['POST'])
@jwt_required()
def redeem_reward(reward_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    recompensa = Reward.query.get_or_404(reward_id)

    if recompensa.casa_id != user.casa_id:
        return jsonify({"msg": "No tienes permiso para canjear esta recompensa"}), 403

    if user.puntos < recompensa.costo_puntos:
        return jsonify({"msg": "No tienes suficientes puntos"}), 400

    user.puntos -= recompensa.costo_puntos
    recompensa.canjeado_por = user.id
    db.session.commit()

    return jsonify({
        "msg": "Recompensa canjeada exitosamente",
        "user": user.serialize(),
        "reward": recompensa.serialize()
    }), 200


# --- Rutas de Objetivos (Goals) ---
@api.route('/goals', methods=['GET'])
@jwt_required()
def get_goals():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user.casa_id:
        return jsonify([]), 200

    goals = Goal.query.filter_by(casa_id=user.casa_id).all()
    return jsonify([goal.serialize() for goal in goals]), 200


@api.route('/goals', methods=['POST'])
@jwt_required()
@admin_required
def create_goal():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()

    if not data.get('title') or not data.get('objetivo'):
        raise APIException("Título y objetivo son requeridos", status_code=400)

    new_goal = Goal(
        title=data.get('title'),
        description=data.get('description', ''),
        objetivo=data.get('objetivo'),
        casa_id=user.casa_id
    )
    db.session.add(new_goal)
    db.session.commit()
    return jsonify(new_goal.serialize()), 201


@api.route('/goals/<int:goal_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_goal(goal_id):
    goal = Goal.query.get_or_404(goal_id)
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if goal.casa_id != user.casa_id:
        return jsonify({"msg": "No tienes permisos para modificar este objetivo"}), 403

    data = request.get_json()
    if 'title' in data:
        goal.title = data['title']
    if 'description' in data:
        goal.description = data['description']
    if 'objetivo' in data:
        goal.objetivo = data['objetivo']
    if 'progreso' in data:
        goal.progreso = data['progreso']

    db.session.commit()
    return jsonify(goal.serialize()), 200


@api.route('/goals/<int:goal_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_goal(goal_id):
    goal = Goal.query.get_or_404(goal_id)
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if goal.casa_id != user.casa_id:
        return jsonify({"msg": "No tienes permiso para eliminar este objetivo"}), 403

    db.session.delete(goal)
    db.session.commit()
    return jsonify({"msg": "Objetivo eliminado"}), 200
