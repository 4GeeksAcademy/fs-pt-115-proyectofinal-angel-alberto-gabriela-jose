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

# Allow CORS requests to this API
CORS(api)
bcrypt = Bcrypt()


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():
    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }
    return jsonify(response_body), 200

# Ruta de registro, con nombre, email y password.


@api.route('api/register', methods=['POST'])
def register_user():
    data = request.get_json()
    nombre = data.get('nombre')
    email = data.get('email')
    password = data.get('password')
    invitation_link = data.get('invitation_link')

    if not all([nombre, email, password]):
        raise APIException(
            "Nombre, email y contraseña son requeridos", status_code=400)

    user_exists = User.query.filter_by(email=email).first()
    if user_exists:
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
        nombre=nombre,
        email=email,
        password_hash=hashed_password,
        role='miembro',
        casa_id=hogar.id if hogar else None
    )
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"msg": "Usuario creado exitosamente"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al guardar el usuario", "error": str(e)}), 500

# Ruta del login, pues para hacer el login


@api.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        raise APIException(
            "Email y contraseña son requeridos", status_code=400)

    user = User.query.filter_by(email=email).first()
    if not user:
        raise APIException("Usuario no encontrado", status_code=404)

    if not bcrypt.check_password_hash(user.password_hash, password):
        raise APIException("Contraseña incorrecta", status_code=401)

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "msg": "Login exitoso",
        "token": access_token,
        "user": user.serialize()
    }), 200

 # Ruta del logout, salta mensaje usuario desconectado.


@api.route('/logout', methods=["POST"])
@jwt_required()
def logout():
    user_id = get_jwt_identity()
    return jsonify({"msg": "Usuario desconectado"}), 200

# Ruta de borrar.


@api.route('/delete', methods=["DELETE"])
@jwt_required()
def delete():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({"msg": "Usuario no encontrado"}), 404

        db.session.delete(user)
        db.session.commit()

        return jsonify({"msg": "Cuenta eliminada"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al eliminar la cuenta", "error": str(e)}), 500

# -- Rutas para la Gestión del Hogar --


@api.route('/hogar/create', methods=['POST'])
@jwt_required()
def create_hogar():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.casa_id:
        raise APIException(
            "El usuario ya pertenece a un hogar", status_code=400)

    data = request.get_json()
    nombre = data.get('nombre')
    if not nombre:
        raise APIException("El nombre del hogar es requerido", status_code=400)

    new_hogar = Hogar(nombre=nombre, invitation_link=str(uuid.uuid4()))
    try:
        db.session.add(new_hogar)
        db.session.commit()  # commit para obtener el id del nuevo hogar
        user.casa_id = new_hogar.id
        db.session.commit()
        return jsonify({"msg": "Hogar creado exitosamente", "hogar": new_hogar.serialize()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al crear el hogar", "error": str(e)}), 500

 # Link de invitación.


@api.route('/hogar/invitation-link', methods=['GET'])
@jwt_required()
def get_invitation_link():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user.casa_id:
        raise APIException(
            "El usuario no pertenece a un hogar", status_code=400)

    hogar = Hogar.query.get(user.casa_id)
    return jsonify({"invitation_link": hogar.invitation_link}), 200

# -- Rutas para Tareas del Hogar --


@api.route('/tasks', methods=['POST'])
@jwt_required()
def create_task():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user.casa_id:
        raise APIException(
            "El usuario debe pertenecer a un hogar para crear tareas", status_code=400)

    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    puntos = data.get('puntos', 10)
    assigned_to_id = data.get('asignado_a')

    if not title:
        raise APIException(
            "El título de la tarea es requerido", status_code=400)

    new_task = Task(
        title=title,
        description=description,
        puntos=puntos,
        asignado_a=assigned_to_id,
        casa_id=user.casa_id,
        creator_id=user_id
    )
    try:
        db.session.add(new_task)
        db.session.commit()
        return jsonify({"msg": "Tarea creada exitosamente", "task": new_task.serialize()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al crear la tarea", "error": str(e)}), 500

# -- Rutas para la Lista de Compras -- Posiblemente se elimine la parte de compras por ser un metodo duplicado
# ---- DESDE AQUI----


@api.route('/shopping', methods=['POST'])
@jwt_required()
def add_shopping_item():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user.casa_id:
        raise APIException(
            "El usuario debe pertenecer a un hogar", status_code=400)

    data = request.get_json()
    producto = data.get('producto')
    cantidad = data.get('cantidad')

    if not producto:
        raise APIException(
            "El nombre del producto es requerido", status_code=400)

    new_item = ShoppingItem(
        producto=producto,
        cantidad=cantidad,
        casa_id=user.casa_id
    )
    try:
        db.session.add(new_item)
        db.session.commit()
        return jsonify({"msg": "Producto añadido a la lista", "item": new_item.serialize()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": "Error al añadir producto", "error": str(e)}), 500


@api.route('/shopping', methods=['GET'])
@jwt_required()
def get_shopping_list():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user.casa_id:
        raise APIException(
            "El usuario debe pertenecer a un hogar para ver tareas", status_code=400)

    items = ShoppingItem.query.filter_by(casa_id=user.casa_id).all()
    serialized_items = [item.serialize() for item in items]
    return jsonify(serialized_items), 200


@api.route('/shopping/<int:item_id>', methods=['PUT'])
@jwt_required()
def update_shopping_item(item_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    item = ShoppingItem.query.get(item_id)
    if not item or item.casa_id != user.casa_id:
        raise APIException(
            "Producto no encontrado o no pertenece a tu hogar", status_code=404)

    data = request.get_json()
    if 'comprado' in data:
        item.comprado = data['comprado']

    db.session.commit()
    return jsonify({"msg": "Producto actualizado"}), 200


@api.route('/shopping/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_shopping_item(item_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role != 'administrador':
        raise APIException("Permiso denegado", status_code=403)

    item = ShoppingItem.query.get(item_id)
    if not item or item.casa_id != user.casa_id:
        raise APIException(
            "Producto no encontrado o no pertenece a tu hogar", status_code=404)

    db.session.delete(item)
    db.session.commit()
    return jsonify({"msg": "Producto eliminado"}), 200
# Hasta aqui se podria borrar si quitamos lo de shopping Item.

# -- Rutas para la Gamificación y el Dashboard --


@api.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_data():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        raise APIException("Usuario no encontrado", status_code=404)

    return jsonify({
        "user_points": user.puntos
    }), 200
# Ruta de las recompensas.


@api.route('/rewards', methods=['GET'])
@jwt_required()
def get_rewards():
    rewards = Reward.query.all()
    return jsonify([reward.serialize() for reward in rewards]), 200

# Ruta canjeo de recompensas.


@api.route('/rewards/redeem/<int:reward_id>', methods=['POST'])
@jwt_required()
def redeem_reward(reward_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    reward = Reward.query.get(reward_id)
    if not reward:
        raise APIException("Recompensa no encontrada", status_code=404)

    if user.puntos < reward.costo_puntos:
        raise APIException(
            "Puntos insuficientes para canjear esta recompensa", status_code=400)

    user.puntos -= reward.costo_puntos
    reward.canjeado_por = user_id
    db.session.commit()

    return jsonify({"msg": "Recompensa canjeada exitosamente", "new_points": user.puntos}), 200


@api.route("/tasks/<int:casa_id>", methods=["GET"])
@jwt_required()
def get_tasks(casa_id):
    hogar = Hogar.query.get(casa_id)
    if not hogar:
        return jsonify({"msg": "hogar not found"}), 400
    return jsonify([task.serialize() for task in hogar.tasks]), 200

## Para act la tarea y llevar la sumatoria de los pointss##


@api.route("/tasks/<int:task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"msg": "task not found"}), 400

    data = request.get_json()
    task.estado = data.get("estado", task.estado)
    if task.estado == "completada":
        task.completed_at = datetime.utcnow()
        if task.asignado_a:
            user = User.query.get(task.asignado_a)
            if user:
                user.puntos += task.puntos

    db.session.commit()
    return jsonify(task.serialize()), 200

## para eliminar tareas.##


@api.route("/tasks/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"msg": "task not found"}), 400
    db.session.delete(task)
    db.session.commit()
    return jsonify({"msg": "task deleted"}), 200


@api.route("/shopping", methods=["POST"])
@jwt_required()
def add_item():
    data = request.get_json()
    producto = data.get("producto")
    casa_id = data.get("casa_id")

    if not producto or not casa_id:
        return jsonify({"msg": "faltan datos"}), 400

    hogar = Hogar.query.get(casa_id)
    if not hogar:
        return jsonify({"msg": "hogar not found"}), 400

    new_item = ShoppingItem(
        producto=producto,
        cantidad=data.get("cantidad"),
        casa_id=casa_id
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify(new_item.serialize()), 200

## Para recuperar toda la lista de compras del hogar.##


@api.route("/shopping/<int:casa_id>", methods=["GET"])
@jwt_required()
def get_shopping_list(casa_id):
    hogar = Hogar.query.get(casa_id)
    if not hogar:
        return jsonify({"msg": "hogar not found"}), 400
    return jsonify([item.serialize() for item in hogar.shopping_items]), 200

## para marcar producto como comprado!##


@api.route("/shopping/<int:item_id>", methods=["PUT"])
@jwt_required()
def mark_item_as_bought(item_id):
    item = ShoppingItem.query.get(item_id)
    if not item:
        return jsonify({"msg": "item not found"}), 400
    item.comprado = True
    db.session.commit()
    return jsonify(item.serialize()), 200


## Para eliminar productos d la lista##

@api.route("/shopping/<int:item_id>", methods=["DELETE"])
@jwt_required()
def delete_item(item_id):
    item = ShoppingItem.query.get(item_id)
    if not item:
        return jsonify({"msg": "item not found"}), 400
    db.session.delete(item)
    db.session.commit()
    return jsonify({"msg": "item deleted"}), 200

    ## ruta de shopping###


@api.route("/hogar/create", methods=["POST"])
@jwt_required()
def create_hogar():
    data = request.get_json()
    nombre = data.get("nombre")
    if not nombre:
        return jsonify({"msg": "falta nombre"}), 400
    new_hogar = Hogar(nombre=nombre)
    db.session.add(new_hogar)
    db.session.commit()
    return jsonify(new_hogar.serialize()), 200


### para llevar la puntuacion del usuario##
@api.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "user not found"}), 400
    return jsonify({"puntos": user.puntos}), 200
