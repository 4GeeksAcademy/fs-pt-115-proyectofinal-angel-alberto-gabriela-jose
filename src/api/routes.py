"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Hogar, Task, ShoppingItem
from api.utils import generate_sitemap, APIException
from datetime import datetime
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)
bcrypt = Bcrypt()
##

## rutasTareass##
## para crear una nueva tarea.##


@api.route('/task', methods=["POST"])
@jwt_required()
def create_task():
    data = request.get_json()
    title = data.get("title")
    description = data.get("description")
    fecha_limite = data.get("fecha_limite")
    casa_id = data.get("casa_id")
    asignado_a = data.get("asignado_a")
    puntos = data.get("puntos", 10)

    if not title or not casa_id:
        return jsonify({"msg": "faltan datos requeridos"}), 400
    hogar = Hogar.query.get(casa_id)
    if not hogar:
        return jsonify({"msg": "hogar not found"}), 400

    new_task = Task(
        title=title,
        description=description,
        fecha_limite=datetime.fromisoformat(
            fecha_limite) if fecha_limite else None,
        puntos=puntos,
        casa_id=casa_id,
        asignado_a=asignado_a,
        creator_id=get_jwt_identity()
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify(new_task.serialize()), 200

## para listar todas las tareas de un hogar##


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

    ## Ruta de lista de compras##
## Para añadir productos a la lista de compras.##

    ### rutas lista de comprass###


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


### rutas del hogar y pointss##
## para crear un hogar###
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
